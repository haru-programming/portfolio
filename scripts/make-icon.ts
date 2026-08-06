/**
 * ファビコンを Jost の実際の字形から生成する。
 *
 * ワードマークと同じ書体の輪郭をそのまま SVG パスに落とすので、
 * システムフォントで代用した場合と違って字形がぶれない。
 * 生成物（app/icon.svg）はコミットする。ワードマークは変わらないので
 * 毎ビルド走らせる必要はない。
 *
 *   npx tsx scripts/make-icon.ts
 */
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import * as fontkit from 'fontkit'
import { SRC_DIR } from './fonts.config.ts'

const SIZE = 64
/** 64px 枠に対する字高。favicon は 16px まで縮むので、小さすぎると潰れる */
const CAP_HEIGHT = 34

/** DESIGN.md の canvas / ink / hairline-strong */
const CANVAS = '#FDFBF7'
const INK = '#3A322D'
const HAIRLINE = '#DFD0C2'

interface Bbox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

const main = async (): Promise<void> => {
  const path = join(SRC_DIR, 'Jost[wght].ttf')
  const font = fontkit.openSync(path) as unknown as {
    getVariation: (v: Record<string, number>) => {
      layout: (s: string) => {
        glyphs: { path: { toSVG: () => string }; bbox: Bbox }[]
      }
    }
  }

  // display と同じ weight 300 のインスタンスを取る
  const glyph = font.getVariation({ wght: 300 }).layout('H').glyphs[0]
  if (!glyph) throw new Error('H のグリフが取得できませんでした')

  const { minX, minY, maxX, maxY } = glyph.bbox
  const scale = CAP_HEIGHT / (maxY - minY)

  // フォントの Y 軸は上向き、SVG は下向きなので Y を反転する。
  // ベースラインではなく実際の bbox の中心を枠の中心に合わせる。
  const tx = SIZE / 2 - ((minX + maxX) / 2) * scale
  const ty = SIZE / 2 + ((minY + maxY) / 2) * scale

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}">
  <rect width="${SIZE}" height="${SIZE}" fill="${CANVAS}"/>
  <rect x="0.5" y="0.5" width="${SIZE - 1}" height="${SIZE - 1}" fill="none" stroke="${HAIRLINE}"/>
  <path d="${glyph.path.toSVG()}" fill="${INK}"
    transform="translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})"/>
</svg>
`

  await writeFile('app/icon.svg', svg)
  console.log(
    `app/icon.svg を生成しました（${svg.length} B / bbox ${maxX - minX}×${maxY - minY} units）`,
  )
}

await main()
