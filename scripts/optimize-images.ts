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

/**
 * 額装の中の表示領域（CSS px）。
 * 幅 min(860px,92vw) の枠から 1px のボーダー2本を引いて 858、
 * 高さは min(44vh, 440px) の上限。
 * object-fit: cover なので、原寸の比率がこれより縦長だと下が切れる。
 */
const DISPLAY = { width: 858, height: 440 }

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

    // 額装に収めたとき、原寸の縦のうちどこまで見えるかを出す。
    // 「1440×900 と違う」とだけ言われても判断できないので、切れる量を数字で示す。
    if (meta.width && meta.height) {
      const displayRatio = DISPLAY.width / DISPLAY.height
      const sourceRatio = meta.width / meta.height
      const visible = Math.min(1, sourceRatio / displayRatio)
      const cropped = Math.round((1 - visible) * 100)
      console.log(
        `  ${file}  ${meta.width}×${meta.height}（比率 ${sourceRatio.toFixed(3)}）` +
          `  額装では上から ${100 - cropped}% が見え、下 ${cropped}% が切れます`,
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
