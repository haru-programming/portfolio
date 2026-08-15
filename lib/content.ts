import { readFile, readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import matter from 'gray-matter'
import { z } from 'zod'

/**
 * コンテンツの読み込みと検証。
 *
 * frontmatter は Zod で検証してからでないと外に出さない。
 * 静的エクスポートなのでこの検証はビルド時に走り、スキーマに合わない
 * コンテンツを書いた時点でビルドが落ちる（本番で気付くことがない）。
 */

const CONTENT_DIR = 'content'

/** DESIGN.md の wash パレット。ここ以外の色を stage 背景に使わせない。 */
const washSchema = z.enum(['aqua', 'peach', 'pink', 'lemon'])

const workSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int(),
  role: z.string().min(1),
  domain: z.string().min(1),
  url: z.string().url(),
  stack: z.array(z.string().min(1)).min(1),
  wash: washSchema,
  shot: z.string().min(1),
  /**
   * 額装の下に出す一筆。何に気をつけたか、どう工夫したか。
   *
   * 60 字上限。表示側の max-width: 30em（約30字/行）と対になっていて、
   * これを超えると3行になりステージ（100vh 固定・overflow: hidden）から
   * あふれて黙って切れる。片方だけ変えないこと。
   */
  note: z.string().min(1).max(60).optional(),
})

const labSchema = z.object({
  order: z.number().int().positive(),
  title: z.string().min(1),
  year: z.number().int(),
  stack: z.array(z.string().min(1)).min(1),
  url: z.string().url(),
})

const jobSchema = z.object({
  period: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  responsibilities: z.array(z.string().min(1)).min(1),
})

const capabilitySchema = z.object({
  term: z.string().min(1),
  detail: z.string().min(1),
})

const aboutSchema = z.object({
  eyebrow: z.string().min(1),
  name: z.string().min(1),
  role: z.string().min(1),
  portraitAlt: z.string().min(1),
  career: z.array(jobSchema).min(1),
  capabilities: z.array(capabilitySchema).min(1),
})

/** hasShot は assets/shots/ に原寸が置かれているかどうか。ビルド時に解決する */
export type Work = z.infer<typeof workSchema> & {
  body: string[]
  hasShot: boolean
}
export type Lab = z.infer<typeof labSchema>
export type About = z.infer<typeof aboutSchema> & { body: string[] }
export type Wash = z.infer<typeof washSchema>

const fileExists = async (path: string): Promise<boolean> => {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/** 空行区切りを段落配列にする。 */
const toParagraphs = (body: string): string[] =>
  body
    .split(/\n{2,}/)
    .map((p) => p.trim().replace(/\s*\n\s*/g, ''))
    .filter((p) => p.length > 0)

/** 検証に落ちたとき、どのファイルの何が悪いのかまで出す。 */
const parseOrThrow = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  file: string,
): T => {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`コンテンツの検証に失敗しました: ${file}\n${issues}`)
  }
  return result.data
}

export const getAbout = async (): Promise<About> => {
  const file = join(CONTENT_DIR, 'about.mdx')
  const raw = await readFile(file, 'utf8')
  const { data, content } = matter(raw)
  return { ...parseOrThrow(aboutSchema, data, file), body: toParagraphs(content) }
}

export const getWorks = async (): Promise<Work[]> => {
  const dir = join(CONTENT_DIR, 'works')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mdx'))

  const works = await Promise.all(
    files.map(async (name) => {
      const file = join(dir, name)
      const raw = await readFile(file, 'utf8')
      const { data, content } = matter(raw)
      const work = parseOrThrow(workSchema, data, file)
      return {
        ...work,
        body: toParagraphs(content),
        // 変換済みの書き出しが存在するかどうかで判定する。
        // 原寸の有無ではなく public/ 側を見ることで、
        // 画像を置いたのに npm run images を忘れた場合も
        // プレースホルダー表示のままになり、404 の <img> を出さずに済む。
        hasShot: await fileExists(join('public/shots', `${work.shot}-1440.jpg`)),
      }
    }),
  )

  return works.sort((a, b) => a.order - b.order)
}

/** Lab は frontmatter だけ。本文は持たない */
export const getLab = async (): Promise<Lab[]> => {
  const dir = join(CONTENT_DIR, 'lab')
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mdx'))

  const entries = await Promise.all(
    files.map(async (name) => {
      const file = join(dir, name)
      const { data } = matter(await readFile(file, 'utf8'))
      return parseOrThrow(labSchema, data, file)
    }),
  )

  return entries.sort((a, b) => a.order - b.order)
}
