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

/**
 * display 見出し・ワードマーク・ラベルのすべて。LCP要素が使う書体でもある。
 *
 * 当初はラベルを IBM Plex Mono で組んでいたが、開発ツールや AI 系プロダクトの
 * UI と結びつきが強く、意図しない印象を与えていたため Jost に統合した。
 * 書体は3つになり、配信も1つ減っている。
 */
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
  /**
   * 総称の serif をここに入れてはいけない。
   *
   * next/font は fallback をそのまま CSS 変数に展開するので、
   * --font-body-stack が
   *   ebGaramond, "ebGaramond Fallback", Georgia, serif, zenOldMincho, ...
   * となる。総称ファミリは必ずマッチするため、和文が serif で止まり
   * zenOldMincho に到達しない。実際サイト全体の和文が
   * Hiragino Mincho ProN（macOS のシステム書体）で描かれていた。
   *
   * 総称は --font-body-stack の末尾に一度だけ置く（styles/tokens.css）。
   */
  fallback: ['Georgia'],
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

/** <html> に付けるクラス。3書体すべての CSS 変数を有効にする。 */
export const fontVariables = [
  jost.variable,
  ebGaramond.variable,
  zenOldMincho.variable,
].join(' ')
