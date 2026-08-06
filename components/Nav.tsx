import Link from 'next/link'
import styles from './Nav.module.css'

/**
 * 固定・透過・56px。背景もボーダーもぼかしも持たず、下にあるステージの上に浮く。
 * 3カラムグリッドで MENU 左 / ワードマーク中央 / CONTACT 右。
 */
export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link className={styles.item} href="/#works">
        Menu
      </Link>
      {/* 英字なのでスクリーンリーダーに英語として読ませる */}
      <Link className={styles.wordmark} href="/" lang="en">
        Haruna Takeda
      </Link>
      <Link className={`${styles.item} ${styles.right}`} href="/contact">
        Contact
      </Link>
    </nav>
  )
}
