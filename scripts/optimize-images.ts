/**
 * 案件スクリーンショットを AVIF / WebP に変換する。
 *
 * 静的エクスポートなので Next.js の Image Optimization API が使えない。
 * ビルド前に sharp で作っておく。
 *
 *   assets/shots/<slug>.png   1440×900 の原寸を置く
 *        ↓
 *   public/shots/<slug>-860.avif / -860.webp / -1440.avif / -1440.webp / -1440.jpg
 *
 * 額装の中の表示領域は最大 858×440（CSS px）。原寸 1440 幅は 2x には足りないが、
 * 1x（860）に対しては 1.68 倍あるので srcset の上限として十分に効く。
 *
 *   npm run images
 */
import { mkdir, readdir, writeFile, stat } from 'node:fs/promises'
import { join, parse } from 'node:path'
import sharp from 'sharp'

const SRC_DIR = 'assets/shots'
const OUT_DIR = 'public/shots'

/** 額装の表示幅に合わせた書き出し幅 */
const WIDTHS = [860, 1440] as const

/** 想定する原寸。ずれていたら警告する（切り取られ方が変わるため） */
const EXPECTED = { width: 1440, height: 900 }

const exists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

const kb = (n: number): string => (n / 1024).toFixed(1).padStart(7)

const main = async (): Promise<void> => {
  if (!(await exists(SRC_DIR))) {
    console.log(`${SRC_DIR}/ がありません。スクリーンショットは未設定のまま進みます。`)
    return
  }

  const files = (await readdir(SRC_DIR)).filter((f) =>
    /\.(png|jpe?g)$/i.test(f),
  )
  if (files.length === 0) {
    console.log(`${SRC_DIR}/ に画像がありません。`)
    return
  }

  await mkdir(OUT_DIR, { recursive: true })
  console.log('スクリーンショット変換')

  for (const file of files) {
    const slug = parse(file).name
    const input = join(SRC_DIR, file)
    const image = sharp(input)
    const meta = await image.metadata()

    if (meta.width !== EXPECTED.width || meta.height !== EXPECTED.height) {
      console.log(
        `  ! ${file} は ${meta.width}×${meta.height}。` +
          `${EXPECTED.width}×${EXPECTED.height} を想定しているので切り取られ方が変わります`,
      )
    }

    const sizes: string[] = []
    for (const w of WIDTHS) {
      const resized = sharp(input).resize({ width: w, withoutEnlargement: true })

      const avif = await resized.clone().avif({ quality: 55 }).toBuffer()
      await writeFile(join(OUT_DIR, `${slug}-${w}.avif`), avif)

      const webp = await resized.clone().webp({ quality: 78 }).toBuffer()
      await writeFile(join(OUT_DIR, `${slug}-${w}.webp`), webp)

      sizes.push(`${w}w avif ${kb(avif.byteLength)}KB / webp ${kb(webp.byteLength)}KB`)
    }

    // AVIF も WebP も読めない環境向けの最終手段
    const jpg = await sharp(input)
      .resize({ width: 1440, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    await writeFile(join(OUT_DIR, `${slug}-1440.jpg`), jpg)

    const original = (await stat(input)).size
    console.log(`  ${slug}  原寸 ${kb(original)}KB`)
    for (const s of sizes) console.log(`    ${s}`)
    console.log(`    fallback jpg ${kb(jpg.byteLength)}KB`)
  }
}

await main()
