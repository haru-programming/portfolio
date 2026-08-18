# ポートフォリオサイト — 実装引き継ぎ

## 目的

Web エンジニア（フロントエンド）の転職用ポートフォリオ。想定読者は採用担当と
現場のエンジニア／デザイナー。「実装力があること」と「デザインの意図を保てること」
の両方が伝わることがゴール。

PDF の職務経歴書は用意しない方針。**About ページが職務経歴書の役割を兼ねる**ため、
About は装飾ページではなく実用ページとして扱う。

## 現在の状態

**実装済み・公開済み。** 以下はすでに動いている。

| | |
|---|---|
| リポジトリ | https://github.com/haru-programming/portfolio （public） |
| 本番 | https://portfolio-harutasuumo.pages.dev |
| ホスティング | Cloudflare Pages（GitHub 連携。push で自動デプロイ） |

Cloudflare Pages のビルド設定は Framework preset **None** ／ Build command
`npm run build` ／ Output directory `out`。Next.js のプリセットを選ぶと
`npx next build` になり、`prebuild`（画像とフォントの生成）と `postbuild`
（欠落文字の検証）が飛ばされてビルドが落ちる。

Lighthouse は `/` と `/about` とも Accessibility / Best Practices / SEO が 100、
Performance 99〜100、LCP 0.4〜0.9s、CLS 0。

## 確定した技術構成

| 項目 | 決定 |
|---|---|
| フレームワーク | Next.js 16（App Router）+ TypeScript strict |
| 出力 | `output: 'export'`（完全静的） |
| スタイル | CSS Modules + `styles/tokens.css`。Tailwind は使わない |
| コンテンツ | `content/**/*.mdx` の frontmatter を Zod で検証 |
| クライアント JS | `components/GradientCanvas.tsx` の 1 つだけ |

`DESIGN.md` が**デザインの唯一の正**。色・タイポ・コンポーネント・Do/Don't が
トークン化されている。見た目の判断は必ずそこを参照し、**実装を変えたら
`DESIGN.md` も直す**（食い違うと次に読む人が判断できなくなる）。

## 実装で踏んだ落とし穴

同じ穴を掘り直さないための記録。どれも実際に起きた。

### フォント

- **`next/font` の `fallback` に総称ファミリを入れてはいけない。**
  `fallback: ['Georgia', 'serif']` は CSS 変数にそのまま展開されるので、
  `--font-body-stack` が `..., Georgia, serif, zenOldMincho, ...` となる。
  総称は必ずマッチするため和文が `serif` で止まり、**サイト全体の和文が
  Hiragino Mincho ProN（OS の書体）で描かれていた**。総称は
  `--font-body-stack` の末尾に一度だけ置く。
- **和文が LCP 経路に無いか毎回確認する。** TOP は和文ゼロなので
  `unicode-range` により明朝を取得しない。和文を TOP に足すとこの性質が壊れる。
- サブセットは `noLayoutClosure: true`。GSUB の閉包を切らないと EB Garamond が
  113 字の指定に対して 817 グリフ残る。カーニングは GPOS 側なので影響しない。
- **コードのコメントも走査対象に入る。** 日本語コメントがそのまま和文サブセットに
  焼かれて 275→428 字に膨らんだ。`stripComments` で落としている。

### レイアウト

- **ステージは 100vh 固定 + `overflow: hidden`。あふれると黙って切れる。**
  額装の高さを増やすときは必ず短い縦幅（横向きスマホの 390〜430px）で実測する。
  高さのメディアクエリは幅のものより**後**に書く。先に書くと
  844x390 のような端末で `max-width: 900px` に負ける。
- **sticky は「配置済み要素」なので、DOM 順が後の非配置要素より上に描かれる。**
  Lab セクションに `z-index: 1` が無いと、固定中のステージの裏に回って
  まるごと見えなくなる。
- **`grid-row: 1 / -1` は `grid-template-rows` が無いと効かない。**
  `-1` が明示グリッドの終端（=1行目）に解決される。`1 / span 2` と書く。
- `composes` は単純なクラスセレクタにしか使えない。`.a b { composes: ... }` は不可。
- グリッド項目には `min-width: 0` と `overflow-wrap: break-word` の両方が要る。
  前者だけだと折り返せない長い語がボックスから溢れる。

### 配信

- **Cloudflare Pages の `_headers` は同名ヘッダを上書きせず連結する。**
  `/*` に `Cache-Control` を書くと静的アセットで
  `max-age=0, ..., immutable` となり、先勝ちの `max-age=0` が効いて
  `immutable` が無効になる。`Cache-Control` は重複しないパスにだけ書く。

### 検証のときの注意

- **デプロイ待ちは「中身」で判定する。** ハッシュ比較や存在チェックは
  何度も誤判定した。ミニファイアが `grid-column`+`grid-row` を `grid-area` に
  畳むなど、ソースの文字列は出力に無いことがある。
- **本番の計測前に `document.fonts.ready` を待つ。** 待たないと基準値を測った
  あとに Web フォントが差し替わって再レイアウトし、全項目が誤って落ちる。
- 文字の衝突判定は要素のボックスではなく `Range` で**実描画範囲**を測る。
  グリッド項目のボックスはトラック幅いっぱいに伸びるので判定にならない。
- **headless の `document.visibilityState` は `hidden` のまま。** そのため
  `requestAnimationFrame` が回らず、オープニング演出のあるサイトは永久に
  終わらない（案件スクショを撮るとき真っ白になった）。CDP の
  `Emulation.setFocusEmulationEnabled` と `Page.setWebLifecycleState` で直る。
  `--virtual-time-budget` は仮想時間を飛ばすので演出を壊す。併用しない。
- ローカルの `npm start`（python の簡易サーバー）は**無圧縮**。
  モバイルの Lighthouse 値は当てにならない。実測は本番で。

## 検証コマンド

```bash
npm run build          # prebuild で画像とフォント生成 → ビルド → postbuild で欠落文字検証
npm start              # out/ をローカル配信（http://localhost:4399）
npm run typecheck
```

`postbuild` の `verify-subsets.ts` は、ビルド結果の HTML に
サブセット未収録の文字があるとビルドを落とす。豆腐を本番で出さないため。

| スクリプト | 役割 |
|---|---|
| `scripts/fonts.config.ts` | 3 書体の素性。書体を足すときの変更点はここだけ |
| `scripts/subset-fonts.ts` | サブセット生成（prebuild） |
| `scripts/verify-subsets.ts` | 欠落文字の検出（postbuild） |
| `scripts/optimize-images.ts` | スクショの AVIF/WebP 生成（prebuild） |
| `scripts/make-icon.ts` | ファビコンを Jost の字形から生成（手動） |

## ページ構成

**TOP（`app/page.tsx`）**

Hero（通常スクロール）→ `#works` の sticky スタック → Footer。
スタックの中で前の案件が `top:0` に貼りついたまま次が下から重なる。
Hero はスタックの**外**なので、Hero → 1件目だけは普通のスクロール。
Lab はスタックの最後に置いてあるが sticky ではなく、最後の案件の上に重なって流れる
（sticky はスタックの最後の要素に固定時間を与えられないため、Lab がその役をかねる）。

**About（`app/about/page.tsx`）** Hero → Profile → Career → Capabilities → Let's Talk

**Contact（`app/contact/page.tsx`）** 現在は `mailto:` の暫定版

## コンテンツの追加

`content/works/*.mdx` の frontmatter。Zod がビルド時に検証する。

```yaml
order: 4                    # 表示順
title: Niwa Houzing         # 英字（Jost の大文字で組むため）
year: 2024
role: Development           # 英字
domain: niwahouzing.com     # 額装のバー左
url: https://niwahouzing.com/
stack: [WordPress, ...]     # 額装のバー右
note: …                     # 額装の下の一筆。60字上限
wash: lemon                 # aqua / peach / pink / lemon
shot: niwa-houzing          # assets/shots/<この名前>.png（1440×900）
```

`note` の 60 字上限は表示側の `max-width: 30em` と対。片方だけ変えると
3 行になってステージからあふれる。

スクリーンショットは `assets/shots/` に 1440×900 で置く（原寸はコミットする。
変換結果の `public/shots/` は .gitignore）。

## 残っていること

1. **Contact フォーム** — Cloudflare Pages Functions + Turnstile + Resend。
   3つとも無料枠で収まることは確認済み（Functions 10万req/日、
   Turnstile siteverify 100万/月、Resend 3,000通/月）。
   MailChannels は 2024年6月に無料提供を終了しているので使わない。
2. **CI の予算チェック** — `size-limit` で JS 予算（実測 173.4KB gz が基準）、
   `@lhci/cli` で LCP/CLS/TBT のしきい値。静的サイトに React を載せた判断を
   説明可能にするための担保。
3. **実コンテンツ** — 実績3件（Atelier Nagi / Kotoha / Hinata Books）と
   Lab 5件がダミー。URL も `example.com`。Niwa Houzing の `note` も未記入。
4. **About の経歴** — ダミーのまま。

## 作業のときの注意

- **案件スクショを全画面ブリードさせない。** 他社サイトの配色がパレットを
  飲み込む。必ず額装する（`DESIGN.md`）。
- `grad-*` と `wash-*` を混同しない。シェーダー内の滲みと 100vh のベタ塗りは別物。
- グラデーションと彩度のある wash の上のテキストは必ず `ink`。`meta` は
  コントラストが足りない（実測で 4.35 だった箇所がある）。
- 見た目を変えたら**必ず複数の画面サイズで実測する**。特に縦が短い端末。
  headless Chrome を CDP で直接叩く方法が確実（ブラウザペインは
  非表示だと描画が止まり、スクリーンショットが壊れる）。
