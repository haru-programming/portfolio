import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'
import GradientCanvas from '@/components/GradientCanvas'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getAbout } from '@/lib/content'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'About',
  description:
    '経歴・担当範囲・できること。PDF の職務経歴書の代わりになるページ。',
}

/**
 * 本文中の *強調* を <em> にする。
 *
 * DESIGN.md の em は「斜体にせず ink に色を上げる」という指定で、
 * 一般的なマークダウンの強調とは意味が違う。扱う記法がこれ1種類なので
 * マークダウンエンジンは入れていない。
 */
const renderEmphasis = (text: string): React.ReactNode =>
  text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      <em key={i}>{part.slice(1, -1)}</em>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  )

export default async function About() {
  const about = await getAbout()

  return (
    <>
      <Nav />

      <section className={styles.stage}>
        <GradientCanvas />
        <p className={styles.eyebrowOnGradient}>{about.eyebrow}</p>
        <h1 className={styles.heroTitle} lang="en">
          Haruna
          <br />
          Takeda
        </h1>
      </section>

      {/* Profile */}
      <div className={styles.band}>
        <div className={`${styles.inner} ${styles.profile}`}>
          <div>
            <div className={styles.frame}>
              <div className={styles.frameBar}>portrait</div>
              <div className={styles.portrait}>
                <span className={styles.portraitLabel}>
                  {about.portraitAlt} — 3 : 4
                </span>
              </div>
            </div>
            <p className={styles.caption}>{about.role}</p>
          </div>
          <div>
            {about.body.map((paragraph, i) => (
              <p key={i} className={styles.prose}>
                {renderEmphasis(paragraph)}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Career */}
      <div className={styles.band}>
        <div className={styles.inner}>
          <div className={styles.bandHead}>
            <h2 className={styles.sectionTitle} lang="en">
              Career
            </h2>
            <span className={styles.meta}>2019 — Present</span>
          </div>

          {about.career.map((job) => (
            <div key={job.company} className={styles.job}>
              <div className={styles.period}>{job.period}</div>
              <div>
                <h3 className={styles.company} lang="en">
                  {job.company}
                </h3>
                <p className={styles.role}>{job.role}</p>
                <ul className={styles.responsibilities}>
                  {job.responsibilities.map((item) => (
                    <li key={item} className={styles.responsibility}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Capabilities */}
      <div className={`${styles.band} ${styles.wash}`} data-wash="lemon">
        <div className={styles.inner}>
          <div className={styles.bandHead}>
            <h2 className={styles.sectionTitle} lang="en">
              Capabilities
            </h2>
          </div>
          <dl>
            {about.capabilities.map((capability) => (
              <div
                key={capability.term}
                className={styles.capability}
              >
                <dt className={styles.term}>{capability.term}</dt>
                <dd className={styles.detail}>{capability.detail}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className={`${styles.stage} ${styles.closing}`}>
        <GradientCanvas />
        <p className={styles.eyebrowOnGradient}>Open to New Opportunities</p>
        <h2 className={styles.heroTitle} lang="en">
          Let&rsquo;s Talk
        </h2>
        <Link className={styles.buttonPrimary} href="/contact">
          Contact
        </Link>
        <Link className={styles.textLink} href="/">
          Back to Works <span className={styles.arrow}>→</span>
        </Link>
      </section>

      <Footer />
    </>
  )
}
