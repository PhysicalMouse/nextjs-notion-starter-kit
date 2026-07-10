import { type NextApiRequest, type NextApiResponse } from 'next'

import { getSearchIndex } from '../../lib/get-search-index'

export default async function searchIndex(
  _req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const index = await getSearchIndex()

    res.setHeader(
      'Cache-Control',
      'public, s-maxage=300, max-age=300, stale-while-revalidate=3600'
    )
    res.status(200).json(index)
  } catch (err: any) {
    console.error('search-index error', err?.message)
    res.status(500).json({ items: [], tags: [] })
  }
}
