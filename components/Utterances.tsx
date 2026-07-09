import * as React from 'react'

export function Utterances() {
  const containerRef = React.useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // remove any existing script
    container.innerHTML = ''

    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.async = true
    script.setAttribute('repo', 'PhysicalMouse/NotionBlogComment')
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('theme', 'github-light')
    script.crossOrigin = 'anonymous'

    container.appendChild(script)

    return () => {
      if (container) container.innerHTML = ''
    }
  }, [])

  return <div ref={containerRef} />
}

export default Utterances
