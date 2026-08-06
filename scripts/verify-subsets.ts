/**
 * ビルド後の HTML に、サブセットへ焼き込まれていない文字が無いか照合する。
 *
 * サブセット化の弱点はここに尽きる。生成時に見ているのはソースコードなので、
 * 何かの拍子にビルド結果へ別の文字が現れると、本番で豆腐（□）になるまで
 * 誰も気付けない。気付いたときには採用担当がもう見ている。
 *
 * そこで postbuild で out/ の実物を読み、生成済み woff2 の cmap と突き合わせて
 * 1文字でも欠けていればビルドを落とす。
 *
 *   npm run build   （postbuild で自動実行）
 */
import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { glob } from 'glob'
import * as fontkit from 'fontkit'
import { FONTS, OUT_DIR, isJapanese, type Charset } from './fonts.config.ts'

const BUILD_DIR = 'out'

/** script / style / SVG と HTML コメントを落として、実際に描画される文字だけ残す。 */
const visibleText = (html: string): string =>
  html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    // 属性値として出ていた実体参照だけを戻す
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )

const loadCoverage = async (): Promise<Map<Charset, Set<number>>> => {
  const coverage = new Map<Charset, Set<number>>()

  for (const font of FONTS) {
    const path = `${OUT_DIR}/${font.id}-subset.woff2`
    const buf = await readFile(path)
    const parsed = fontkit.create(buf) as unknown as {
      characterSet: number[]
    }

    const set = coverage.get(font.charset) ?? new Set<number>()
    for (const cp of parsed.characterSet) set.add(cp)
    coverage.set(font.charset, set)
  }

  return coverage
}

const main = async (): Promise<void> => {
  const coverage = await loadCoverage()
  const latin = coverage.get('latin') ?? new Set<number>()
  const japanese = coverage.get('japanese') ?? new Set<number>()

  const files = await glob(`${BUILD_DIR}/**/*.html`)
  if (files.length === 0) {
    throw new Error(`${BUILD_DIR}/ に HTML がありません。先にビルドしてください。`)
  }

  /** 欠落した文字 → 出現したファイル */
  const missing = new Map<string, Set<string>>()
  let scanned = 0

  for (const file of files) {
    const text = visibleText(await readFile(file, 'utf8'))

    for (const ch of text) {
      const cp = ch.codePointAt(0)
      if (cp === undefined) continue
      // 制御文字と空白は対象外
      if (cp <= 0x20 || cp === 0x3000) continue
      scanned++

      const covered = isJapanese(cp) ? japanese.has(cp) : latin.has(cp)
      if (!covered) {
        const where = missing.get(ch) ?? new Set<string>()
        where.add(basename(file) === 'index.html' ? file : basename(file))
        missing.set(ch, where)
      }
    }
  }

  console.log(
    `サブセット検証: ${files.length} ページ / のべ ${scanned} 文字を照合`,
  )
  console.log(`  収録 ラテン ${latin.size} 字 / 和文 ${japanese.size} 字`)

  if (missing.size > 0) {
    console.error(
      `\n✗ サブセットに無い文字が ${missing.size} 種類あります。` +
        `このままだと該当箇所が豆腐（□）になります。\n`,
    )
    for (const [ch, where] of missing) {
      const cp = ch.codePointAt(0) ?? 0
      const hex = cp.toString(16).toUpperCase().padStart(4, '0')
      const kind = isJapanese(cp) ? '和文' : 'ラテン'
      console.error(`  "${ch}"  U+${hex}  ${kind}  ← ${[...where].join(', ')}`)
    }
    console.error(
      '\n対処: その文字を含むコンテンツが scripts/fonts.config.ts の\n' +
        'SOURCE_GLOBS の走査対象に入っているか確認し、npm run fonts で作り直す。',
    )
    process.exit(1)
  }

  console.log('✓ 欠落なし')
}

await main()
