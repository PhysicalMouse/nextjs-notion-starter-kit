import * as React from 'react'

export function FooterImpl() {
  return (
    <footer>
      {/* Footer内容已注释 */}
    </footer>
  )
}

export const Footer = React.memo(FooterImpl)
