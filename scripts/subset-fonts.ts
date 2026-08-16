/**
 * ビルド時に各書体を「そのビルドで実際に描画されうる文字」だけに絞り込む。
 *
 * なぜ必要か（計測値）:
 *   Google Fonts は Zen Old Mincho を 122 個の unicode-range スライスに割って配信する。
 *   About ページの和文 231 字はそのうち 27 スライスに散らばるため、
 *   231 字を表示するために 27 リクエスト・433KB を取得することになる。
 *   27 スライスが内包する文字数は 1,560 字 — 6.8 倍を捨てている。
 *
 * ここでは harfbuzz（subset-font が WASM で同梱）で厳密なサブセットを作り、
 * 書体ごとに woff2 を1つだけ出力する。
 *
 *   npm run fonts
 */
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { glob } from 'glob'
import subsetFont from 'subset-font'
import * as fontkit from 'fontkit'
import {
  FONTS,
  SRC_DIR,
  OUT_DIR,
  isJapanese,
  LATIN_BASELINE,
  LATIN_SYMBOLS,
  type FontSource,
} from './fonts.config.ts'

/** 描画されうるテキストを含みうる場所。過剰に拾うのは安全側に倒れるだけ。 */
const SOURCE_GLOBS = [
  'content/**/*.{md,mdx,json}',
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.ts',
  'data/**/*.ts',
]

interface SubsetResult {
  id: string
  family: string
  role: string
  charset: string
  chars: number
  bytes: number
  sourceBytes: number
  missingFromSource: string
}

/**
 * コードからコメントを落とす。
 *
 * これをやらないと、ソースに書いた日本語のコメントがそのまま和文サブセットに
 * 焼き込まれる。実測では 275 字 → 428 字（61KB → 97KB）まで膨らんだ。
 * コメントは1文字も描画されないので、まるごと無駄になる。
 *
 * 正規表現なので "https://" のような文字列の一部を巻き込むことはあるが、
 * それで消えるのはラテン文字だけで、ラテンは LATIN_BASELINE で全域を
 * 焼いてあるので影響しない。取りこぼしがあっても postbuild の
 * verify-subsets.ts がビルドを落として気付かせる。
 */
const stripComments = (code: string): string =>
  code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ')

const isCode = (file: string): boolean => /\.(ts|tsx|js|jsx)$/.test(file)

const collectSourceText = async (): Promise<string> => {
  const files = await glob(SOURCE_GLOBS, {
    ignore: ['**/node_modules/**', `${OUT_DIR}/**`],
  })
  const contents = await Promise.all(
    files.map(async (f) => {
      const raw = await readFile(f, 'utf8')
      return isCode(f) ? stripComments(raw) : raw
    }),
  )
  console.log(`  走査対象 ${files.length} ファイル`)
  return contents.join('\n')
}

/**
 * 実際に元フォントが持っている字だけを残す。
 * subset-font は持っていない字を黙って捨てるので、事前に差分を出して可視化する。
 */
const partitionByCoverage = (
  fontPath: string,
  chars: string,
): { covered: string; missing: string } => {
  const font = fontkit.openSync(fontPath)
  const covered: string[] = []
  const missing: string[] = []

  for (const ch of chars) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) continue
    // 制御文字は cmap を引くまでもない
    if (cp < 0x20) continue
    if ('hasGlyphForCodePoint' in font && font.hasGlyphForCodePoint(cp)) {
      covered.push(ch)
    } else {
      missing.push(ch)
    }
  }
  return { covered: covered.join(''), missing: missing.join('') }
}

const buildSubset = async (
  font: FontSource,
  chars: string,
): Promise<SubsetResult> => {
  const srcPath = join(SRC_DIR, font.file)
  const source = await readFile(srcPath)

  const { covered, missing } = partitionByCoverage(srcPath, chars)

  const subset = await subsetFont(source, covered, {
    targetFormat: 'woff2',
    /**
     * GSUB の閉包を取らない。既定では「指定した字から置換で到達しうるグリフ」を
     * すべて残すため、EB Garamond ではスモールキャップス・オールドスタイル数字・
     * スワッシュ体などが芋づるで入り、113字の指定に対して 817 グリフが残っていた。
     * 切ると 130 グリフ・47.8KB → 13.3KB になる。
     *
     * カーニングは GPOS 側なので影響を受けないことを実測で確認済み
     * （AV=-140 / To=-105 / Wa=-100 が有効無効で完全に一致）。
     * 落ちるのは合字と、和文の縦書き用字形。どちらも DESIGN.md では使わない。
     */
    noLayoutClosure: true,
    ...(font.variationAxes ? { variationAxes: font.variationAxes } : {}),
  })

  const outPath = join(OUT_DIR, `${font.id}-subset.woff2`)
  await writeFile(outPath, subset)

  return {
    id: font.id,
    family: font.family,
    role: font.role,
    charset: font.charset,
    chars: [...covered].length,
    bytes: subset.byteLength,
    sourceBytes: source.byteLength,
    missingFromSource: missing,
  }
}

const kb = (bytes: number): string => (bytes / 1024).toFixed(1).padStart(7)

const main = async (): Promise<void> => {
  console.log('フォントサブセット生成')

  const text = await collectSourceText()

  const japanese = new Set<string>()
  const latin = new Set<string>()

  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp === undefined || cp < 0x20) continue
    if (isJapanese(cp)) japanese.add(ch)
    else latin.add(ch)
  }

  for (const ch of LATIN_BASELINE + LATIN_SYMBOLS) latin.add(ch)

  const latinChars = [...latin].sort().join('')
  const japaneseChars = [...japanese].sort().join('')

  console.log(`  ラテン ${[...latin].length} 字 / 和文 ${[...japanese].length} 字\n`)

  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR, { recursive: true })

  const results: SubsetResult[] = []

  for (const font of FONTS) {
    const chars = font.charset === 'japanese' ? japaneseChars : latinChars

    if (chars.length === 0) {
      console.log(`skip   ${font.family}（対象文字が0字）`)
      continue
    }

    const result = await buildSubset(font, chars)
    results.push(result)

    const ratio = ((1 - result.bytes / result.sourceBytes) * 100).toFixed(1)
    console.log(
      `${kb(result.sourceBytes)} KB → ${kb(result.bytes)} KB  (-${ratio}%)  ` +
        `${result.family}  ${result.chars}字`,
    )
    if (result.missingFromSource) {
      console.log(
        `         ! 元フォントに無い字を除外: ${result.missingFromSource}`,
      )
    }
  }

  const total = results.reduce((sum, r) => sum + r.bytes, 0)
  const jp = results.find((r) => r.charset === 'japanese')

  const manifest = {
    generatedAt: new Date().toISOString(),
    fonts: results,
    totals: { bytes: total, requests: results.length },
    /**
     * 比較対象。Google Fonts の CSS を実際に取得し、モックアップの和文 231 字が
     * 122 スライスのどれに当たるかを解いたうえで、各 woff2 を実際にダウンロードして
     * 測った値。README とサイト上の数値の根拠になる。
     */
    baseline: {
      source: 'Google Fonts（unicode-range スライス方式）',
      japanese: {
        family: 'Zen Old Mincho',
        measuredChars: 231,
        totalSlices: 122,
        slicesFetched: 27,
        bytes: 443668,
        // 27 スライスが内包する文字数は 1,560。231 字のために 1,329 字を捨てている。
        charsDownloaded: 1560,
      },
      latin: {
        // それぞれの latin スライス（U+0000-00FF を含む @font-face）の実測値。
        // Jost 26,588 + EB Garamond 23,848。
        // ラベルを Jost に統合して IBM Plex Mono（10,052）が不要になったので、
        // 比較対象からも外してある。
        bytes: 26588 + 23848,
        requests: 2,
      },
    },
    comparison: jp
      ? {
          japanese: {
            bytes: jp.bytes,
            savedBytes: 443668 - jp.bytes,
            requests: 1,
            savedRequests: 26,
            timesSmaller: Number((443668 / jp.bytes).toFixed(1)),
          },
          overall: {
            baselineBytes: 443668 + 50436,
            baselineRequests: 29,
            bytes: total,
            requests: results.length,
            timesSmaller: Number(((443668 + 50436) / total).toFixed(1)),
          },
        }
      : null,
  }

  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  console.log(`\n合計 ${kb(total)} KB / ${results.length} ファイル`)
  if (manifest.comparison) {
    const { japanese, overall } = manifest.comparison
    console.log(
      `  和文  433.3 KB / 27リクエスト → ${(japanese.bytes / 1024).toFixed(1)} KB / 1リクエスト` +
        `（${japanese.timesSmaller}分の1）`,
    )
    console.log(
      `  全体  ${(overall.baselineBytes / 1024).toFixed(1)} KB / ${overall.baselineRequests}リクエスト → ` +
        `${(overall.bytes / 1024).toFixed(1)} KB / ${overall.requests}リクエスト` +
        `（${overall.timesSmaller}分の1）`,
    )
  }
}

await main()
