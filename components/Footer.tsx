import styles from './Footer.module.css'

const LINKS = [
  { label: 'GitHub ↗', href: 'https://github.com/' },
  { label: 'X (Twitter) ↗', href: 'https://x.com/' },
  { label: 'hello@example.com', href: 'mailto:hello@example.com' },
] as const

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div>
        {LINKS.map((link) => (
          <a
            key={link.href}
            className={styles.link}
            href={link.href}
            {...(link.href.startsWith('http')
              ? { target: '_blank', rel: 'noreferrer noopener' }
              : {})}
          >
            {link.label}
          </a>
        ))}
      </div>
      <span className={styles.wordmark} lang="en">
        Haruna Takeda
      </span>
    </footer>
  )
}
