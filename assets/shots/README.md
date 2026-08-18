# 案件スクリーンショット

ここに原寸を置くと、ビルド時に `scripts/optimize-images.ts` が
AVIF / WebP / JPEG を `public/shots/` へ書き出す。

## 置き方

- ファイル名は各案件の frontmatter の `shot` と一致させる
- サイズは **1440 × 900**（16:10）
- 形式は PNG または JPEG

| 案件 | 置くファイル |
|---|---|
| ARUTEGA | `arutega.png` |
| SANWAGOSEN | `sanwagosen.png` |
| Hinata Books | `hinata-books.png` |
| Niwa Houzing | `niwa-houzing.png` |

額装の表示領域は最大 858 × 440 なので、16:10 の原寸は上下が切り取られる。
`object-position: top` を指定してあるので、サイトの上部（ヘッダーとヒーロー）が残る。
