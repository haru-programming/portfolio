/**
 * 4書体の素性を1箇所に集約する。fetch-fonts / subset-fonts / verify-subsets が
 * すべてここを参照するので、書体を足すときの変更点はこのファイルだけになる。
 *
 * 役割分担は DESIGN.md の「Families」に従う。役割を跨がせないこと。
 */

export type Charset = 'latin' | 'japanese'

export interface FontSource {
  /** 生成物のファイル名と manifest のキーに使う */
  id: string
  /** 人間向けの表示名 */
  family: string
  /** assets/fonts-src/ 内のファイル名 */
  file: string
  /** 取得元（google/fonts の OFL ディレクトリ） */
  url: string
  /** どちらの文字集合を焼き込むか */
  charset: Charset
  /**
   * 可変フォントの軸の扱い。subset-font の API に合わせる。
   *   数値        → その値にピン留めし、静的インスタンスとして書き出す（最小）
   *   {min, max}  → 可変のまま範囲だけ狭める
   */
  variationAxes?: Record<string, number | { min: number; max: number }>
  /** DESIGN.md 上の用途。読む人向けの注記 */
  role: string
}

const RAW = 'https://raw.githubusercontent.com/google/fonts/main/ofl'

export const FONTS: readonly FontSource[] = [
  {
    id: 'jost',
    family: 'Jost',
    file: 'Jost[wght].ttf',
    url: `${RAW}/jost/Jost%5Bwght%5D.ttf`,
    charset: 'latin',
    // DESIGN.md が使うのは 300（display）と 400（wordmark）のみ。
    // 可変のまま 300-400 に狭める。1ファイルで両ウェイトを賄える。
    variationAxes: { wght: { min: 300, max: 400 } },
    role: 'display headings + wordmark（英字大文字のみ）',
  },
  {
    id: 'eb-garamond',
    family: 'EB Garamond',
    file: 'EBGaramond[wght].ttf',
    url: `${RAW}/ebgaramond/EBGaramond%5Bwght%5D.ttf`,
    charset: 'latin',
    // 本文は 400 だけ。単一値にピン留めして静的インスタンス化する。
    variationAxes: { wght: 400 },
    role: '本文のラテン文字',
  },
  {
    id: 'ibm-plex-mono',
    family: 'IBM Plex Mono',
    file: 'IBMPlexMono-Regular.ttf',
    url: `${RAW}/ibmplexmono/IBMPlexMono-Regular.ttf`,
    charset: 'latin',
    role: 'ラベル・ボタン・リンク・メタ情報',
  },
  {
    id: 'zen-old-mincho',
    family: 'Zen Old Mincho',
    file: 'ZenOldMincho-Regular.ttf',
    url: `${RAW}/zenoldmincho/ZenOldMincho-Regular.ttf`,
    charset: 'japanese',
    // ラテン文字は EB Garamond が描くので、明朝側には和文しか焼かない。
    // これが 5.4MB の原本を数十KBまで落とす主因。
    role: '本文の和文のみ',
  },
] as const

export const SRC_DIR = 'assets/fonts-src'
export const OUT_DIR = 'styles/generated'

/**
 * 和文と判定する下限。U+2E80 以上には CJK 部首・かな・漢字・
 * CJK 記号（U+3000-303F）・全角形（U+FF00-FFEF）がすべて含まれる。
 *
 * 逆に言うと — · → ↗ ↓ ’ × といった約物はこれ未満なので自動的にラテン側に回る。
 * DESIGN.md の font-family 順（Garamond → Zen Old Mincho）と一致する。
 */
export const JAPANESE_MIN_CODEPOINT = 0x2e80

export const isJapanese = (codePoint: number): boolean =>
  codePoint >= JAPANESE_MIN_CODEPOINT

/**
 * コンテンツに現れなくても常に入れておく文字。
 * 印刷可能 ASCII 全域を焼いておけば、英字を足すたびにビルドが落ちることはない。
 * 和文は文字数ぶんだけ確実に重くなるので、ここには入れない。
 */
export const LATIN_BASELINE: string = Array.from(
  { length: 0x7e - 0x20 + 1 },
  (_, i) => String.fromCodePoint(0x20 + i),
).join('')

/** モックアップが実際に使っている記号。source に現れなくても保証する。 */
export const LATIN_SYMBOLS = '—–·×→←↑↓↗↘’‘“”…€¥©'
