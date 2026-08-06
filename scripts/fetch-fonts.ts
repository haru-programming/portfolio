/**
 * 元TTFを google/fonts から取得して assets/fonts-src/ に置く。
 *
 * 取得したTTFはリポジトリにコミットする。ビルド時にネットワークへ出ないので、
 * Cloudflare Pages 側のビルドが GitHub の都合で落ちることがなくなり、
 * 「あのとき配信していたフォント」を後から再現できる。
 *
 *   npm run fonts:fetch
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { FONTS, SRC_DIR } from './fonts.config.ts'

const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const fetchFont = async (url: string): Promise<Buffer> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText} — ${url}`)
  }
  return Buffer.from(await res.arrayBuffer())
}

const main = async (): Promise<void> => {
  await mkdir(SRC_DIR, { recursive: true })

  const force = process.argv.includes('--force')

  for (const font of FONTS) {
    const dest = join(SRC_DIR, font.file)

    if (!force && (await exists(dest))) {
      console.log(`skip   ${font.file}（取得済み。再取得は --force）`)
      continue
    }

    const buf = await fetchFont(font.url)
    await writeFile(dest, buf)
    console.log(`fetch  ${font.file}  ${(buf.byteLength / 1024).toFixed(1)} KB`)
  }

  // ライセンス（4書体とも OFL）。配布物に同梱する義務があるので一緒に置く。
  const licenseDest = join(SRC_DIR, 'OFL.txt')
  if (force || !(await exists(licenseDest))) {
    const ofl = await fetchFont(
      'https://raw.githubusercontent.com/google/fonts/main/ofl/jost/OFL.txt',
    )
    await writeFile(licenseDest, ofl)
    console.log('fetch  OFL.txt')
  }

  console.log('\n完了。次は npm run fonts でサブセット化する。')
}

await main()
