/**
 * スクロール駆動アニメーションが「要素を透明のまま残していない」ことを検証する。
 *
 * この演出の典型的な事故がこれに尽きる。animation-fill-mode: backwards は
 * アニメーション開始前に from の状態（opacity 0）を当てるので、
 * ページ末尾など「スクロール量が足りず animation-range に到達できない」場所に
 * 演出をかけると、その要素は永久に見えないまま残る。
 * しかも開発中は上から順に読むので気付きにくい。
 *
 * ここでは実際の Chrome でページを開き、最下部まで送ってから
 * 演出対象の全要素の実効 opacity を読み、1 未満が残っていればビルドを落とす。
 *
 * CDP を Node 標準の WebSocket で直接叩いているので、puppeteer 等の依存は増やさない。
 *
 *   npx tsx scripts/verify-motion.ts
 */
import { spawn, type ChildProcess } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = 9333
const ORIGIN = process.env['VERIFY_ORIGIN'] ?? 'http://localhost:4399'
/**
 * path -> 演出がかかっているべき最小要素数。
 *
 * 0 を許すと、タイムライン名のタイプミスなどで演出がまるごと外れたときに
 * 「透明な要素は無い」で通ってしまう（実際に一度そうなった）。
 * 壊れ方には「見えなくなる」と「黙って何も起きなくなる」の2通りある。
 */
const PAGES: { path: string; minAnimated: number }[] = [
  { path: '/', minAnimated: 20 },
  { path: '/about/', minAnimated: 12 },
  { path: '/contact/', minAnimated: 0 },
]

/** ビューポート。縦を短くするほど「スクロールが足りない」事故が出やすい */
const VIEWPORTS = [
  { label: 'desktop 1350x940', width: 1350, height: 940 },
  { label: 'mobile 390x844', width: 390, height: 844 },
]

interface CdpResult {
  id: number
  result?: { result?: { value?: unknown }; exceptionDetails?: unknown }
  error?: { message: string }
}

const sleep = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms))

/**
 * ページターゲットの WS URL を返す。
 * /json/version が返すのはブラウザ本体のエンドポイントで、
 * そちらには Page / Runtime ドメインが無いので使えない。
 */
const waitForPageTarget = async (): Promise<string> => {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const targets = (await res.json()) as {
        type: string
        webSocketDebuggerUrl?: string
      }[]
      const page = targets.find(
        (t) => t.type === 'page' && t.webSocketDebuggerUrl,
      )
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl

      // ページターゲットが無ければ作る
      const created = await fetch(
        `http://127.0.0.1:${PORT}/json/new?about:blank`,
        { method: 'PUT' },
      )
      const json = (await created.json()) as { webSocketDebuggerUrl?: string }
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl
    } catch {
      // 起動待ち
    }
    await sleep(250)
  }
  throw new Error('Chrome のページターゲットに接続できませんでした')
}

class Cdp {
  #ws: WebSocket
  #id = 0
  #pending = new Map<number, (r: CdpResult) => void>()

  constructor(ws: WebSocket) {
    this.#ws = ws
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(String(ev.data)) as CdpResult
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

  send(method: string, params: Record<string, unknown> = {}): Promise<CdpResult> {
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
    if (res.error) {
      throw new Error(`CDP エラー: ${res.error.message}`)
    }
    if (res.result?.exceptionDetails) {
      throw new Error(
        `ページ内でエラー: ${JSON.stringify(res.result.exceptionDetails)}`,
      )
    }
    const value = res.result?.result?.value
    if (value === undefined) {
      throw new Error(`評価結果が空でした: ${JSON.stringify(res).slice(0, 400)}`)
    }
    return value as T
  }

  close(): void {
    this.#ws.close()
  }
}

/**
 * 最下部までゆっくり送りながら、演出対象の要素の実効 opacity を記録する。
 *
 * 見るのは「その要素が画面中央にいちばん近いときの opacity」。
 * ユーザーがその要素を読んでいる瞬間に見えているか、が検証したい性質だから。
 *
 * 「全スクロール位置での最大 opacity」ではいけない。
 * animation-fill-mode: backwards はレンジを通過したあと基底値（opacity 1）に
 * 戻るので、最大値は必ず 1 になり、どんな壊れ方も検出できなくなる。
 */
const SCAN = `
(async () => {
  const supported = CSS.supports('(animation-timeline: view()) and (animation-range: entry)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 演出がかかっている要素 = アニメーションが紐づいている要素
  const targets = [...document.querySelectorAll('*')].filter(
    (el) => el.getAnimations().length > 0
  );
  // 要素 -> { 中央からの距離, そのときの opacity }
  const nearest = new Map(targets.map((el) => [el, { dist: Infinity, opacity: 1 }]));

  const step = Math.round(innerHeight / 6);
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const maxY = document.documentElement.scrollHeight;

  for (let y = 0; y <= maxY; y += step) {
    scrollTo(0, y);
    await frame();
    const mid = innerHeight / 2;
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      const dist = Math.abs((rect.top + rect.bottom) / 2 - mid);
      const rec = nearest.get(el);
      if (dist < rec.dist) {
        rec.dist = dist;
        rec.opacity = parseFloat(getComputedStyle(el).opacity);
      }
    }
  }

  const stuck = [];
  for (const [el, rec] of nearest) {
    if (rec.opacity < 0.99) {
      stuck.push({
        tag: el.tagName.toLowerCase(),
        cls: el.className.toString().slice(0, 50),
        text: (el.textContent || '').trim().slice(0, 26),
        opacity: +rec.opacity.toFixed(3),
      });
    }
  }
  return { supported, reduced, animated: targets.length, stuck };
})()
`

const main = async (): Promise<void> => {
  const profile = await mkdtemp(join(tmpdir(), 'verify-motion-'))
  const chrome: ChildProcess = spawn(
    CHROME,
    [
      '--headless=new',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
    ],
    { stdio: 'ignore' },
  )

  let failures = 0
  try {
    const wsUrl = await waitForPageTarget()
    const cdp = await Cdp.connect(wsUrl)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    for (const vp of VIEWPORTS) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 500,
      })

      for (const { path, minAnimated } of PAGES) {
        await cdp.send('Page.navigate', { url: `${ORIGIN}${path}` })
        await sleep(900)

        const r = await cdp.evaluate<{
          supported: boolean
          reduced: boolean
          animated: number
          stuck: { tag: string; cls: string; text: string; opacity: number }[]
        }>(SCAN)

        const head = `${vp.label.padEnd(18)} ${path.padEnd(11)} 演出対象 ${String(r.animated).padStart(2)} 要素`

        if (r.animated < minAnimated) {
          failures++
          console.log(`  ✗ ${head}`)
          console.log(
            `      演出が付いていません（${minAnimated} 要素以上あるはず）。` +
              `view-timeline 名の綴りか @supports を確認すること`,
          )
          continue
        }

        if (r.stuck.length === 0) {
          console.log(`  ✓ ${head}`)
        } else {
          failures += r.stuck.length
          console.log(`  ✗ ${head}`)
          for (const s of r.stuck) {
            console.log(
              `      opacity ${s.opacity}  <${s.tag}> "${s.text}"  ${s.cls}`,
            )
          }
        }
      }
    }

    cdp.close()
  } finally {
    chrome.kill()
    await rm(profile, { recursive: true, force: true })
  }

  if (failures > 0) {
    console.error(
      `\n✗ スクロールしきっても不透明にならない要素が ${failures} 件あります。` +
        `\n  animation-range が届いていないか、ページ末尾でスクロール量が足りていません。`,
    )
    process.exit(1)
  }
  console.log('\n✓ 透明のまま残る要素はありません')
}

await main()
