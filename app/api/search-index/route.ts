import { getSearchIndex } from '@/lib/get-search-index'

export const revalidate = 300

export async function GET() {
  try {
    const index = await getSearchIndex()

    return Response.json(index, {
      headers: {
        'Cache-Control':
          'public, s-maxage=300, max-age=300, stale-while-revalidate=3600'
      }
    })
  } catch (err: any) {
    console.error('search-index error', err?.message)
    return Response.json({ items: [], tags: [] }, { status: 500 })
  }
}
