import * as React from 'react'

import * as config from '@/lib/config'

import styles from './styles.module.css'

export function FooterImpl({ comments }: { comments?: React.ReactNode }) {
  return (
    <footer className={styles.footer}>
      {comments && <div className={styles.comments}>{comments}</div>}
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
