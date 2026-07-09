import * as React from 'react'

import * as config from '@/lib/config'

import styles from './styles.module.css'

export function FooterImpl({ comments }: { comments?: React.ReactNode }) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      {comments && <div className={styles.comments}>{comments}</div>}

      <div className={styles.copyright}>
        Copyright {currentYear} {config.author}
      </div>
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
