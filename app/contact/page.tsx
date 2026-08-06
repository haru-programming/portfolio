import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'お問い合わせ。採用・業務委託のご相談を受け付けています。',
}

/**
 * TODO: Cloudflare Pages Functions（functions/api/contact.ts）に
 * Turnstile 検証 + Resend 送信を実装し、このページをフォームに差し替える。
 * フォームはクライアントコンポーネントになるが、このルートにしか無いので
 * TOP と About の JS は増えない。
 */
export default function Contact() {
  return (
    <>
      <Nav />

      <main className={styles.main}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>Contact</p>
          <h1 className={styles.title} lang="en">
            Get in Touch
          </h1>
          <p className={styles.prose}>
            採用・業務委託のご相談を受け付けています。お気軽にご連絡ください。
          </p>
          <a className={styles.buttonPrimary} href="mailto:hello@example.com">
            hello@example.com
          </a>
        </div>
      </main>

      <Footer />
    </>
  )
}
