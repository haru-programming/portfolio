import { readFile, readdir } from 'node:fs/promises'
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

export type Work = z.infer<typeof workSchema> & { body: string[] }
export type Lab = z.infer<typeof labSchema>
export type About = z.infer<typeof aboutSchema> & { body: string[] }
export type Wash = z.infer<typeof washSchema>

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
      return {
        ...parseOrThrow(workSchema, data, file),
        body: toParagraphs(content),
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
