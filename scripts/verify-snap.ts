/**
 * スクロールスナップの検証。
 *
 * scroll-snap-type: mandatory は「必ずどれかのスナップ点に吸着する」ので、
 * 最後のスナップ点より下にある要素がスナップ点を持たないと、
 * そこへ永久に到達できなくなる。しかもビューポートの高さ次第で
 * 出たり出なかったりするため、手元の画面では気付きにくい。
 *
 * ここでは実際の Chrome で複数の画面サイズを開き、
 *   1. スナップが効くべきページで効いているか
 *   2. 効いてはいけないページで効いていないか（About のバンドは 100vh ではない）
 *   3. 最下部までスクロールしてフッターが全部見えるか
 * を確かめる。
 *
 *   npm start   # 別ターミナルで out/ を配信しておく
 *   npx tsx scripts/verify-snap.ts
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9377
const ORIGIN = process.env['VERIFY_ORIGIN'] ?? 'http://localhost:4399'

/** 縦を短くするほど「下端に届かない」事故が出やすい */
const VIEWPORTS = [
  { label: 'desktop 1350x940', width: 1350, height: 940 },
  { label: 'short   1350x620', width: 1350, height: 620 },
  { label: 'mobile   390x844', width: 390, height: 844 },
]

const CASES = [
  { path: '/', shouldSnap: true },
  { path: '/about/', shouldSnap: false },
  { path: '/contact/', shouldSnap: false },
]

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

const waitForPageTarget = async (): Promise<string> => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = (await res.json()) as {
        type: string
        webSocketDebuggerUrl?: string
      }[]
      const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl
    } catch {
      // 起動待ち
    }
    await sleep(250)
  }
  throw new Error('Chrome のページターゲットに接続できませんでした')
}

interface CdpMessage {
  id: number
  result?: { result?: { value?: unknown }; exceptionDetails?: unknown }
  error?: { message: string }
}

class Cdp {
  #ws: WebSocket
  #id = 0
  #pending = new Map<number, (m: CdpMessage) => void>()

  private constructor(ws: WebSocket) {
    this.#ws = ws
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data)) as CdpMessage
      const resolve = this.#pending.get(msg.id)
      if (resolve) {
        this.#pending.delete(msg.id)
        resolve(msg)
      }
    })
  }

  static async connect(url: string): Promise<Cdp> {
    const ws = new WebSocket(url)
    await new Promise<void>((resolve, reject) => {
      ws.addEventListener('open', () => resolve(), { once: true })
      ws.addEventListener('error', () => reject(new Error('WS 接続失敗')), {
        once: true,
      })
    })
    return new Cdp(ws)
  }

  send(method: string, params: Record<string, unknown> = {}): Promise<CdpMessage> {
    const id = ++this.#id
    return new Promise((resolve) => {
      this.#pending.set(id, resolve)
      this.#ws.send(JSON.stringify({ id, method, params }))
    })
  }

  async evaluate<T>(expression: string): Promise<T> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (res.error) throw new Error(`CDP エラー: ${res.error.message}`)
    if (res.result?.exceptionDetails) {
      throw new Error(
        `ページ内でエラー: ${JSON.stringify(res.result.exceptionDetails)}`,
      )
    }
    const value = res.result?.result?.value
    if (value === undefined) {
      throw new Error(`評価結果が空でした: ${JSON.stringify(res).slice(0, 300)}`)
    }
    return value as T
  }

  close(): void {
    this.#ws.close()
  }
}

const PROBE = `
(async () => {
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const snapType = getComputedStyle(document.documentElement).scrollSnapType;

  const stages = [...document.querySelectorAll('section')];
  const aligned = stages.filter(
    (s) => getComputedStyle(s).scrollSnapAlign.startsWith('start')
  ).length;
  const stopAlways = stages.filter(
    (s) => getComputedStyle(s).scrollSnapStop === 'always'
  ).length;

  // 最下部まで送ってフッターが全部見えるか
  scrollTo(0, document.documentElement.scrollHeight);
  await frame();
  await new Promise((r) => setTimeout(r, 400));
  await frame();

  const footer = document.querySelector('footer');
  const rect = footer.getBoundingClientRect();
  const fullyVisible = rect.top >= -1 && rect.bottom <= innerHeight + 1;

  return {
    snapType,
    stages: stages.length,
    aligned,
    stopAlways,
    footerTop: Math.round(rect.top),
    footerBottom: Math.round(rect.bottom),
    innerHeight,
    footerFullyVisible: fullyVisible,
  };
})()
`

const main = async (): Promise<void> => {
  const profile = await mkdtemp(join(tmpdir(), 'verify-snap-'))
  const chrome: ChildProcess = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--hide-scrollbars',
    ],
    { stdio: 'ignore' },
  )

  let failures = 0
  try {
    const cdp = await Cdp.connect(await waitForPageTarget())
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    for (const vp of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 500,
      })

      for (const { path, shouldSnap } of CASES) {
        await cdp.send('Page.navigate', { url: `${ORIGIN}${path}` })
        await sleep(900)

        const r = await cdp.evaluate<{
          snapType: string
          stages: number
          aligned: number
          stopAlways: number
          footerTop: number
          footerBottom: number
          innerHeight: number
          footerFullyVisible: boolean
        }>(PROBE)

        const problems: string[] = []
        const snapping = r.snapType !== 'none'

        if (shouldSnap && !snapping) {
          problems.push('スナップが効いていない')
        }
        if (!shouldSnap && snapping) {
          problems.push(`スナップが効いてしまっている（${r.snapType}）`)
        }
        if (shouldSnap && r.aligned !== r.stages) {
          problems.push(
            `スナップ点が足りない（${r.aligned}/${r.stages} セクション）`,
          )
        }
        if (shouldSnap && r.stopAlways !== r.stages) {
          problems.push(
            `scroll-snap-stop: always が欠けている（${r.stopAlways}/${r.stages}）`,
          )
        }
        if (!r.footerFullyVisible) {
          problems.push(
            `最下部でフッターが全部見えない（top ${r.footerTop} / bottom ${r.footerBottom} / 画面 ${r.innerHeight}）`,
          )
        }

        const head = `${vp.label.padEnd(18)} ${path.padEnd(11)} snap=${r.snapType.padEnd(12)} 点 ${r.aligned}/${r.stages}`
        if (problems.length === 0) {
          console.log(`  ✓ ${head}`)
        } else {
          failures += problems.length
          console.log(`  ✗ ${head}`)
          for (const p of problems) console.log(`      ${p}`)
        }
      }
    }

    cdp.close()
  } finally {
    chrome.kill()
    await rm(profile, { recursive: true, force: true })
  }

  if (failures > 0) {
    console.error(`\n✗ ${failures} 件の問題があります`)
    process.exit(1)
  }
  console.log('\n✓ スナップの範囲・到達性ともに問題なし')
}

await main()
