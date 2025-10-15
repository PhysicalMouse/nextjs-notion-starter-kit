// components/Utterances.tsx
import { useEffect } from 'react'

const Utterances = () => {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://utteranc.es/client.js'
    script.setAttribute('repo', 'PhysicalMouse/VercelBlog-Comment')
    script.setAttribute('issue-term', 'pathname')
    script.setAttribute('label', 'VercelBlog')
    script.setAttribute('theme', 'github-light')
    script.setAttribute('crossorigin', 'anonymous')
    script.async = true

    const commentBox = document.getElementById('comments')
    if (commentBox) commentBox.appendChild(script)
  }, [])

  return <div id="comments" />
}

export default Utterances

