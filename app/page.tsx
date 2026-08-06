import Link from 'next/link'
import GradientCanvas from '@/components/GradientCanvas'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getWorks } from '@/lib/content'
import motion from '@/styles/motion.module.css'
import styles from './page.module.css'

/**
 * TOP。和文が1字も無いページなので、Zen Old Mincho の woff2 は
 * unicode-range に一致する文字が存在せず、ブラウザが取得しない。
 */
export default async function Home() {
  const works = await getWorks()

  return (
    <>
      <Nav />

      <section className={styles.stage}>
        <GradientCanvas />
        <p className={`${styles.eyebrow} ${styles.onGradient}`}>
          Front-end Engineer — Tokyo, Japan
        </p>
        {/* LCP 要素。canvas ではなくこの h1 が計測対象になる */}
        <h1 className={styles.heroTitle} lang="en">
          Haruna
          <br />
          Takeda
        </h1>
        <span className={styles.scroll}>Scroll ↓</span>
      </section>

      <div id="works">
        {works.map((work) => (
          <section
            key={work.order}
            className={`${styles.stage} ${styles.work} ${motion.stageTimeline}`}
            data-wash={work.wash}
          >
            <span className={styles.counter}>
              {String(work.order).padStart(2, '0')} /{' '}
              {String(works.length).padStart(2, '0')}
            </span>
            <p
              className={`${styles.eyebrow} ${styles.onGradient} ${motion.s1}`}
            >
              {work.year} — {work.role}
            </p>
            <h2 className={`${styles.workTitle} ${motion.s2}`} lang="en">
              {work.title}
            </h2>

            {/* 額装。他社サイトの配色がパレットを飲み込まないよう全画面ブリードさせない */}
            <div className={`${styles.frame} ${motion.s3}`}>
              <div className={styles.frameBar}>{work.domain}</div>
              <div className={styles.shot}>
                <span className={styles.shotLabel}>Screenshot — 1440 × 900</span>
              </div>
            </div>

            <p
              className={`${styles.eyebrow} ${styles.onGradient} ${motion.s4}`}
            >
              {work.stack.join(' · ')}
            </p>
            <a
              className={`${styles.textLink} ${motion.s5}`}
              href={work.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              View Project <span className={styles.arrow}>→</span>
            </a>
            {/* work.body（和文の説明）はここでは出さない。
                モックアップの stage は年/役割・タイトル・額装・スタック・リンクだけで、
                TOP に和文を持ち込むと unicode-range による「和文フォントを取得しない」
                性質が崩れる。説明文は将来の案件詳細ページで使う。 */}
          </section>
        ))}
      </div>

      <section
        className={`${styles.stage} ${styles.closing} ${motion.stageTimeline}`}
      >
        <GradientCanvas />
        <p className={`${styles.eyebrow} ${styles.onGradient} ${motion.s1}`}>
          Open to New Opportunities
        </p>
        <h2 className={`${styles.heroTitle} ${motion.s2}`} lang="en">
          Let&rsquo;s Talk
        </h2>
        {/* このページで唯一のアクセント色 */}
        <Link
          className={`${styles.buttonPrimary} ${motion.s3}`}
          href="/contact"
        >
          Contact
        </Link>
        <Link className={`${styles.textLink} ${motion.s4}`} href="/about">
          Read About Me <span className={styles.arrow}>→</span>
        </Link>
      </section>

      <Footer />
    </>
  )
}
