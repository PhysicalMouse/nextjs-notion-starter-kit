import type { GetServerSideProps } from 'next'

import { host } from '@/lib/config'

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.write(JSON.stringify({ error: 'method not allowed' }))
    res.end()

    return {
      props: {}
    }
  }

  // Cache at the CDN for one day while allowing browsers to revalidate.
  res.setHeader(
    'Cache-Control',
    'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400'
  )
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')

  // Google and Bing both support the standard wildcard group and Sitemap rule.
  // Preview deployments stay blocked to prevent duplicate-content indexing.
  if (process.env.VERCEL_ENV === 'production') {
    res.write(`User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${host}/sitemap.xml
`)
  } else {
    res.write(`User-agent: *
Disallow: /
`)
  }

  res.end()

  return {
    props: {}
  }
}

export default function noop() {
  return null
}
