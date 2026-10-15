import { domain, host, indexNowKey } from '@/lib/config'
import { getSiteMap } from '@/lib/get-site-map'

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

export const dynamic = 'force-dynamic'

export async function GET() {
  return handleIndexNow()
}

export async function POST() {
  return handleIndexNow()
}

async function handleIndexNow() {
  if (!indexNowKey) {
    return Response.json(
      { error: 'IndexNow key is not configured (site.config.ts)' },
      { status: 400 }
    )
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

    const ok = response.status === 200 || response.status === 202

    return Response.json(
      {
        ok,
        submitted: urlList.length,
        indexNowStatus: response.status,
        urls: urlList
      },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (err: any) {
    console.error('[indexnow] submission failed:', err?.message)
    return Response.json(
      { error: err?.message ?? 'unknown error' },
      { status: 500 }
    )
  }
}
