import type { NextApiRequest, NextApiResponse } from 'next'

import { domain, host, indexNowKey } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

/**
 * Submits all site URLs to IndexNow so Bing/Yandex index new and updated
 * content instantly instead of waiting for a crawl.
 *
 * Triggered automatically by a Vercel Cron (see vercel.json) and can also be
 * called manually: GET /api/indexnow
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'method not allowed' })
  }

  if (!indexNowKey) {
    return res
      .status(400)
      .json({ error: 'IndexNow key is not configured (site.config.ts)' })
  }

  try {
    const siteMap = await getSiteMap()

    const urlList = [
      `${host}/`,
      ...Object.keys(siteMap.canonicalPageMap)
        .filter(Boolean)
        .map((path) => `${host}/${path}`)
    ]

    const payload = {
      host: domain,
      key: indexNowKey,
      keyLocation: `${host}/${indexNowKey}.txt`,
      urlList
    }

    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(payload)
    })

    // IndexNow returns 200 or 202 on success. It has no response body.
    const ok = response.status === 200 || response.status === 202

    // cache the response briefly so repeated crons don't hammer the endpoint
    res.setHeader('Cache-Control', 'no-store')

    return res.status(ok ? 200 : response.status).json({
      ok,
      submitted: urlList.length,
      indexNowStatus: response.status,
      urls: urlList
    })
  } catch (err: any) {
    console.error('[indexnow] submission failed:', err?.message)
    return res.status(500).json({ error: err?.message ?? 'unknown error' })
  }
}
