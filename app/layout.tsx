import type { Metadata, Viewport } from 'next'
import { fontVariables } from '@/styles/fonts'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: {
    default: 'Haruna Takeda — Front-end Engineer',
    template: '%s — Haruna Takeda',
  },
  description:
    'デザインの意図を保ったまま実装するフロントエンドエンジニアのポートフォリオ。',
  metadataBase: new URL('https://example.com'),
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // WebGL ステージの上に来るブラウザ UI の色を canvas に揃える
  themeColor: '#FDFBF7',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={fontVariables}>
      <body>{children}</body>
    </html>
  )
}
