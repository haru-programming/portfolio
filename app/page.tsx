import Link from 'next/link'
import GradientCanvas from '@/components/GradientCanvas'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getLab, getWorks } from '@/lib/content'
import styles from './page.module.css'

/**
 * TOP。和文が1字も無いページなので、Zen Old Mincho の woff2 は
 * unicode-range に一致する文字が存在せず、ブラウザが取得しない。
 */
export default async function Home() {
  const [works, lab] = await Promise.all([getWorks(), getLab()])

  return (
    <>
      <Nav />

      {/* Hero はスタックの外。ここから Atelier Nagi までは普通のスクロールで、
          重なりは Atelier Nagi が画面いっぱいに固定されてから始まる */}
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

      {/* 重なりの本体。ここに並ぶステージはすべて sticky で top:0 に貼りつく。
          前のステージが固定されたまま、次のステージが下から重なって入ってくる。
          DOM の後ろにあるものが上に描かれるので z-index の指定は要らない。 */}
      <div id="works" className={styles.stack}>
        {works.map((work) => (
          <section
            key={work.order}
            className={`${styles.stage} ${styles.work}`}
            data-wash={work.wash}
          >
            <span className={styles.counter}>
              {String(work.order).padStart(2, '0')} /{' '}
              {String(works.length).padStart(2, '0')}
            </span>
            <p
              className={`${styles.eyebrow} ${styles.onGradient}`}
            >
              {work.year} — {work.role}
            </p>
            <h2 className={styles.workTitle} lang="en">
              {work.title}
            </h2>

            {/* 額装。他社サイトの配色がパレットを飲み込まないよう全画面ブリードさせない */}
            <div className={styles.frame}>
              <div className={styles.frameBar}>{work.domain}</div>
              <div className={styles.shot}>
                {work.hasShot ? (
                  <picture>
                    <source
                      type="image/avif"
                      srcSet={`/shots/${work.shot}-860.avif 860w, /shots/${work.shot}-1440.avif 1440w`}
                      sizes="(max-width: 900px) 92vw, 860px"
                    />
                    <source
                      type="image/webp"
                      srcSet={`/shots/${work.shot}-860.webp 860w, /shots/${work.shot}-1440.webp 1440w`}
                      sizes="(max-width: 900px) 92vw, 860px"
                    />
                    <img
                      className={styles.shotImage}
                      src={`/shots/${work.shot}-1440.jpg`}
                      width={1440}
                      height={900}
                      alt={`${work.title} のスクリーンショット`}
                      /* 画面下にあり LCP 要素ではないので遅延で読む */
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                ) : (
                  <span className={styles.shotLabel}>
                    Screenshot — 1440 × 900
                  </span>
                )}
              </div>
            </div>

            <p
              className={`${styles.eyebrow} ${styles.onGradient}`}
            >
              {work.stack.join(' · ')}
            </p>
            <a
              className={styles.textLink}
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

        {/* Lab はスタックの中の最後に置くが sticky にはしない（.stage ではない）。
            これで最後の案件（Suzuri Festival）が固定されたまま、Lab が上に重なって
            流れていく。sticky は包含ブロックの底までしか貼りつけないので、
            スタックの最後の要素は固定される時間を持てない。Lab がその役をかねる。 */}
        <section className={styles.lab}>
          <div className={styles.labInner}>
            <div className={styles.bandHead}>
              <h2 className={styles.sectionTitle} lang="en">
                Lab
              </h2>
              <span className={styles.meta}>
                {String(lab.length).padStart(2, '0')} Experiments
              </span>
            </div>

            <ul>
              {lab.map((entry) => (
                <li key={entry.order}>
                  <a
                    className={styles.row}
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span className={styles.rowIndex}>
                      L{String(entry.order).padStart(2, '0')}
                    </span>
                    <span className={styles.rowTitle} lang="en">
                      {entry.title}
                    </span>
                    <span className={styles.rowMeta}>
                      {entry.stack.join(' · ')} · {entry.year}
                    </span>
                    {/* 行ごと動かすので、矢印だけを動かす .arrow は付けない */}
                    <span className={styles.rowArrow}>→</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <section className={`${styles.stage} ${styles.closing}`}>
        <GradientCanvas />
        <p className={`${styles.eyebrow} ${styles.onGradient}`}>
          Open to New Opportunities
        </p>
        <h2 className={styles.heroTitle} lang="en">
          Let&rsquo;s Talk
        </h2>
        {/* このページで唯一のアクセント色 */}
        <Link className={styles.buttonPrimary} href="/contact">
          Contact
        </Link>
        <Link className={styles.textLink} href="/about">
          Read About Me <span className={styles.arrow}>→</span>
        </Link>
      </section>

      <Footer />
    </>
  )
}
