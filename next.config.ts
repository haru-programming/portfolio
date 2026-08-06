import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cloudflare Pages へ out/ をそのまま置く。コールドスタートが無いぶん LCP に有利。
  output: 'export',

  // 静的エクスポートでは Image Optimization API が使えないので、
  // scripts/optimize-images.ts が sharp で AVIF / WebP を事前生成する。
  images: { unoptimized: true },

  reactStrictMode: true,

  // 末尾スラッシュを付けて out/ 以下を index.html のディレクトリ構造に揃える。
  trailingSlash: true,

  typescript: { ignoreBuildErrors: false },
}

export default nextConfig
