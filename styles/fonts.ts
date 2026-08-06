import localFont from 'next/font/local'

/**
 * 4書体の配信定義。実ファイルは scripts/subset-fonts.ts が prebuild で生成する
 * （app/fonts/generated/ は .gitignore 済み。ビルド成果物なのでコミットしない）。
 *
 * preload の方針:
 *   next/font はルートレイアウトで呼んだフォントを全ルートで preload する。
 *   LCP 要素は Hero の h1（Jost）— canvas は LCP 候補要素ではないことを
 *   仕様で確認済みなので、WebGL は LCP に影響しない。
 *   よって preload するのは Jost だけにして、残り3書体は swap に任せる。
 */

/** display 見出しとワードマーク。LCP要素が使う唯一の書体。 */
export const jost = localFont({
  src: './generated/jost-subset.woff2',
  // 可変フォントのまま 300-400 に絞ってあるので、1ファイルで両ウェイトを賄う。
  weight: '300 400',
  style: 'normal',
  display: 'swap',
  variable: '--font-display',
  preload: true,
  adjustFontFallback: 'Arial',
  fallback: ['system-ui', 'sans-serif'],
})

/** 本文のラテン文字。 */
export const ebGaramond = localFont({
  src: './generated/eb-garamond-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-body-latin',
  preload: false,
  adjustFontFallback: 'Times New Roman',
  fallback: ['Georgia', 'serif'],
})

/**
 * 本文の和文。
 *
 * unicode-range を明示するのが要。これがあると TOP ページのように
 * 和文が1字も無いページでは、ブラウザがこの woff2 を取得しない。
 * DESIGN.md の「Garamond → Zen Old Mincho の順序を変えない」という規則を
 * CSS レベルで担保することにもなる（ラテン文字がこちらに回らない）。
 */
export const zenOldMincho = localFont({
  src: './generated/zen-old-mincho-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-body-jp',
  preload: false,
  // Arial / Times New Roman の字面は明朝と合わないので自動調整は使わない。
  // CLS を実測して問題があれば、手で metric override した @font-face を足す。
  adjustFontFallback: false,
  fallback: ['Hiragino Mincho ProN', 'Yu Mincho', 'YuMincho', 'serif'],
  declarations: [
    {
      prop: 'unicode-range',
      // CJK部首・かな・漢字 / CJK記号・約物 / 全角形 / かな拡張
      value: 'U+2E80-9FFF, U+3000-303F, U+31F0-31FF, U+FF00-FFEF',
    },
  ],
})

/** ラベル・ボタン・リンク・メタ情報。 */
export const ibmPlexMono = localFont({
  src: './generated/ibm-plex-mono-subset.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  adjustFontFallback: 'Arial',
  fallback: ['ui-monospace', 'monospace'],
})

/** <html> に付けるクラス。4書体すべての CSS 変数を有効にする。 */
export const fontVariables = [
  jost.variable,
  ebGaramond.variable,
  zenOldMincho.variable,
  ibmPlexMono.variable,
].join(' ')
