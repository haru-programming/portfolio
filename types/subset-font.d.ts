/**
 * subset-font には型定義が同梱されていないので、こちらで使う範囲を宣言する。
 * 実装は node_modules/subset-font/index.js を参照した。
 */
declare module 'subset-font' {
  export interface SubsetFontOptions {
    /** 出力形式。既定は入力と同じ */
    targetFormat?: 'sfnt' | 'woff' | 'woff2' | 'truetype'

    /**
     * 可変フォントの軸の扱い。
     *   数値       → その値にピン留めして静的インスタンス化する
     *   {min, max} → 可変のまま範囲を狭める
     */
    variationAxes?: Record<
      string,
      number | { min: number; max: number; default?: number }
    >

    /**
     * GSUB の閉包を取らない（HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE）。
     *
     * 既定では「指定した字から置換で到達しうるグリフ」をすべて残すため、
     * EB Garamond ではスモールキャップスやスワッシュ体まで芋づるで入り、
     * 113字の指定に対して 817 グリフが残った。切ると 130 グリフになる。
     * カーニングは GPOS 側なので影響を受けない（実測で確認済み）。
     */
    noLayoutClosure?: boolean

    /** 残す name テーブルの nameID */
    preserveNameIds?: number[]
  }

  /**
   * text に含まれる文字だけを残したフォントを返す。
   * 元フォントが持っていない文字は黙って捨てられるので、
   * 事前に cmap を引いて差分を出しておくこと。
   */
  export default function subsetFont(
    font: Buffer | Uint8Array,
    text: string,
    options?: SubsetFontOptions,
  ): Promise<Buffer>
}
