# Portfolio

フロントエンドエンジニアのポートフォリオサイト。

- **技術**: Next.js 16（App Router / 静的エクスポート）, TypeScript strict, CSS Modules
- **ホスティング**: Cloudflare Pages
- **デザイン**: [`DESIGN.md`](./DESIGN.md) が唯一の正

## 日本語フォントの配信

このリポジトリで一番手を入れているのはフォント配信です。方針は計測から決めました。

Google Fonts は Zen Old Mincho を 122 個の `unicode-range` スライスに割って配信します。
About ページの和文 231 字はそのうち **27 スライス**に散らばるため、231 字を表示するために
**27 リクエスト・433KB** を取得することになります。27 スライスが内包する文字数は 1,560 字で、
**6.8 倍**を捨てている計算です。

そこで [`scripts/subset-fonts.ts`](./scripts/subset-fonts.ts) がビルド時に、
そのビルドで実際に描画されうる文字だけを harfbuzz（`subset-font`）で焼き直します。

| | Google Fonts | このリポジトリ |
|---|---|---|
| 和文（Zen Old Mincho） | 433.3 KB / 27 リクエスト | **66.9 KB / 1 リクエスト** |
| 全書体の合計 | 492.3 KB / 30 リクエスト | **97.1 KB / 4 リクエスト** |

Zen Old Mincho の原本は 5,315KB で、そこから 98.7% を落としています。

効いた判断が 3 つあります。

1. **明朝には和文しか焼かない。** ラテン文字は EB Garamond が描くので、
   明朝側の欧文・キリル・ギリシャは全部不要です。

2. **GSUB の閉包を取らない**（`noLayoutClosure`）。既定では「指定した字から置換で
   到達しうるグリフ」まで残るため、EB Garamond は 113 字の指定に対して 817 グリフ・47.8KB に
   なっていました。切ると 130 グリフ・13.3KB です。カーニングは GPOS 側なので影響しないことを
   実測で確認しています（AV=-140 / To=-105 / Wa=-100 が有効無効で一致）。

3. **`@font-face` に `unicode-range` を付ける。** 和文が 1 字も無い TOP ページでは、
   ブラウザが和文 woff2 のリクエスト自体を出しません。
   `DESIGN.md` の「EB Garamond → Zen Old Mincho の順序を変えない」という規則を
   CSS レベルで担保することにもなります。

### 豆腐を出さないための検証

サブセット化の弱点は「ビルド結果に、焼き込んでいない文字が現れても本番で豆腐（□）に
なるまで気付けない」ことに尽きます。[`scripts/verify-subsets.ts`](./scripts/verify-subsets.ts) が
postbuild で `out/**/*.html` の可視テキストを走査し、生成済み woff2 の cmap と突き合わせて、
1 文字でも欠けていればビルドを落とします。

```
✗ サブセットに無い文字が 4 種類あります。このままだと該当箇所が豆腐（□）になります。

  "趣"  U+8DA3  和文  ← out/about/index.html
  "鰻"  U+9C3B  和文  ← out/about/index.html
```

## 計測結果

本番（Cloudflare Pages）に対する Lighthouse（desktop preset）:

| | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | 0.4s | 0 | 0ms |
| `/about` | 100 | 100 | 100 | 100 | 0.6s | 0 | 0ms |

TOP の LCP 要素は Hero の `h1`（Jost）です。背景の WebGL キャンバスは
[LCP の候補要素ではない](https://web.dev/articles/lcp)ため（CSS グラデーションも同様）、
シェーダーの描画は LCP に影響しません。preload しているのは Jost だけです。

TOP ページが取得するフォントは Jost と IBM Plex Mono の 2 ファイル・16.9KB だけです。
和文が 1 字も無いので、`unicode-range` により明朝はリクエストされません。

### キャッシュ

`public/_headers` で `/_next/static/*` に `immutable` を付けています。
Cloudflare Pages の `_headers` は、複数の規則が同じリクエストに当たると同名ヘッダを
**上書きせずカンマで連結する**（後勝ちの仕組みは無い）ため、`/*` に `Cache-Control` を
書くと `max-age=0, must-revalidate, ..., immutable` となって先勝ちの `max-age=0` が効き、
`immutable` が無効化されます。`Cache-Control` は重複しないパスにだけ書いています。

## 開発

```bash
npm install
npm run fonts:fetch   # 元TTF を google/fonts から取得（初回のみ）
npm run dev
```

```bash
npm run build         # prebuild でサブセット生成 → ビルド → postbuild で検証
npm start             # out/ をローカル配信
```

| スクリプト | 役割 |
|---|---|
| `scripts/fonts.config.ts` | 4 書体の素性。書体を足すときの変更点はここだけ |
| `scripts/fetch-fonts.ts` | 元TTF の取得 |
| `scripts/subset-fonts.ts` | サブセット生成（prebuild） |
| `scripts/verify-subsets.ts` | 欠落文字の検出（postbuild） |

## ライセンス

4 書体とも SIL Open Font License。`assets/fonts-src/OFL.txt` を参照。
