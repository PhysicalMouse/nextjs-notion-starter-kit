import type { GetServerSideProps } from 'next'

import type { SiteMap } from '@/lib/types'
import { host } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

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

  const siteMap = await getSiteMap()

  // cache for up to 8 hours
  res.setHeader(
    'Cache-Control',
    'public, max-age=28800, stale-while-revalidate=28800'
  )
  res.setHeader('Content-Type', 'text/xml')
  res.write(createSitemap(siteMap))
  res.end()

  return {
    props: {}
  }
}

const escapeXml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

const formatDate = (value?: string | number | null) => {
  if (!value) return undefined

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return undefined
  }

  return date.toISOString()
}

const getLastModified = (siteMap: SiteMap, pageId: string) => {
  const recordMap = siteMap.pageMap[pageId]
  const blockEntry = recordMap?.block?.[pageId]
  const block = (blockEntry as { value?: any } | undefined)?.value ?? blockEntry
  const blockValue = block as
    | {
        last_edited_time?: string | number | null
        created_time?: string | number | null
      }
    | undefined

  return formatDate(blockValue?.last_edited_time ?? blockValue?.created_time)
}

const getPriority = (pathname: string) => {
  if (!pathname || pathname === '/') return '1.0'

  const depth = pathname.split('/').filter(Boolean).length
  return depth <= 1 ? '0.8' : '0.6'
}

const getChangeFreq = (pathname: string) => {
  if (!pathname || pathname === '/') return 'daily'

  const depth = pathname.split('/').filter(Boolean).length
  return depth <= 1 ? 'weekly' : 'monthly'
}

const createSitemap = (siteMap: SiteMap) => {
  const entries = [
    {
      loc: `${host}/`,
      lastmod: undefined,
      changefreq: 'daily',
      priority: '1.0'
    },
    ...Object.entries(siteMap.canonicalPageMap)
      .filter(([canonicalPagePath]) => Boolean(canonicalPagePath))
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([canonicalPagePath, pageId]) => {
        const loc = `${host}/${canonicalPagePath}`
        const normalizedPath = canonicalPagePath.startsWith('/')
          ? canonicalPagePath
          : `/${canonicalPagePath}`

        return {
          loc,
          lastmod: getLastModified(siteMap, pageId),
          changefreq: getChangeFreq(normalizedPath),
          priority: getPriority(normalizedPath)
        }
      })
  ]

  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${entries
      .map(({ loc, lastmod, changefreq, priority }) => {
        const lastmodNode = lastmod
          ? `\n      <lastmod>${escapeXml(lastmod)}</lastmod>`
          : ''

        return `
      <url>
        <loc>${escapeXml(loc)}</loc>${lastmodNode}
        <changefreq>${escapeXml(changefreq)}</changefreq>
        <priority>${escapeXml(priority)}</priority>
      </url>
        `.trim()
      })
      .join('\n')}
  </urlset>
`
}

export default function noop() {
  return null
}
