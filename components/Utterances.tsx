import * as React from 'react'

export function Utterances({ theme = 'github-light' }: { theme?: string }) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  // (re)inject script whenever theme changes so utterances starts with correct theme
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // remove any existing content
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.setAttribute('repo', 'PhysicalMouse/NotionBlogComment')
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('theme', theme)
    script.crossOrigin = 'anonymous'

    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [theme])

  return <div ref={containerRef} />
}

export default Utterances
