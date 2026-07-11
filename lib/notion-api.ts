import { Client } from '@notionhq/client'
import { NotionAPI } from 'notion-client'
import { type ExtendedRecordMap } from 'notion-types'
import { NotionCompatAPI } from 'notion-compat'

// ---------------------------------------------------------------------------
// Hybrid Notion data layer (EXPERIMENT: official API)
// ---------------------------------------------------------------------------
// This project renders with react-notion-x, which only understands the
// `ExtendedRecordMap` shape produced by the *unofficial* notion-client.
//
// The official Notion API is far more stable and supported, but its data shape
// is different. `notion-compat` bridges the gap by exposing the same
// `getPage()` interface on top of the official SDK — EXCEPT it has no support
// for database/collection views (child_database blocks are ignored). That
// means the official path renders normal content pages faithfully, but returns
// an EMPTY gallery for the homepage (which is a Notion database view).
//
// Strategy:
//   • getPage        → try official first; auto-fall back to unofficial when
//                      the page contains an unsupported collection/database
//                      view, or when the official request errors.
//   • getCollectionData / search → always unofficial (no official equivalent
//                      in the compat layer).
//
// EXPERIMENT FINDINGS (branch: 实验正式notionAPI):
//   • Article/content pages render their BODY via the official API, but the
//     collection metadata block (Tags / Author / Date / Description) and the
//     page cover image are LOST, because the official API does not return the
//     parent-database schema + row properties that react-notion-x needs.
//   • The homepage gallery (a database view) is entirely unsupported.
//   => The official API alone cannot faithfully render this blog. The
//      unofficial API remains the primary source. The official path is kept
//      here, OFF by default, and can be enabled for comparison by setting
//      NOTION_USE_OFFICIAL_API="true".
// ---------------------------------------------------------------------------

const useOfficialApi = process.env.NOTION_USE_OFFICIAL_API === 'true'

// Unofficial client — full-featured, drives collections + search, and is the
// fallback for pages the official path can't fully render.
const unofficialNotion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_API_TOKEN,
  ofetchOptions: {
    retry: 3, // up to 3 retries
    retryDelay: 500, // 500 ms base delay between retries
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 30_000 // 30 s hard timeout per attempt
  }
})

// Official client via the compat layer. Reuses the same NOTION_API_TOKEN,
// which is an official integration token (prefix `ntn_`).
const officialNotion = useOfficialApi
  ? new NotionCompatAPI(new Client({ auth: process.env.NOTION_API_TOKEN }))
  : null

/**
 * Detects whether a record map contains a collection/database view that the
 * official (compat) path failed to populate. react-notion-x renders galleries
 * from `recordMap.collection` + `collection_query`; notion-compat leaves those
 * empty and emits a bare `child_database` block instead.
 */
function hasUnrenderableCollection(recordMap: ExtendedRecordMap): boolean {
  const collectionCount = Object.keys(recordMap.collection || {}).length
  if (collectionCount > 0) return false

  const blocks = recordMap.block || {}
  for (const id of Object.keys(blocks)) {
    const type = (blocks[id] as any)?.value?.type
    if (
      type === 'child_database' ||
      type === 'collection_view' ||
      type === 'collection_view_page'
    ) {
      return true
    }
  }
  return false
}

/**
 * Drop-in replacement for the unofficial NotionAPI, exposing only the methods
 * this project actually calls. Routes page fetches through the stable official
 * API when possible and transparently falls back to the unofficial API for
 * collection-heavy pages and for search / collection queries.
 */
class HybridNotionAPI {
  async getPage(
    pageId: string,
    ...args: any[]
  ): Promise<ExtendedRecordMap> {
    if (officialNotion) {
      try {
        const recordMap = await officialNotion.getPage(pageId)

        // If the page is a gallery/database view the official path can't
        // render, fall back to the unofficial API for a faithful result.
        if (hasUnrenderableCollection(recordMap)) {
          return unofficialNotion.getPage(pageId, ...args)
        }

        return recordMap
      } catch (err: any) {
        console.warn(
          `[notion] official getPage failed for ${pageId}, using unofficial:`,
          err?.message
        )
        return unofficialNotion.getPage(pageId, ...args)
      }
    }

    return unofficialNotion.getPage(pageId, ...args)
  }

  // Collections + search have no official-compat equivalent, so always use the
  // unofficial client for these.
  getCollectionData(...args: Parameters<NotionAPI['getCollectionData']>) {
    return unofficialNotion.getCollectionData(...args)
  }

  search(...args: Parameters<NotionAPI['search']>) {
    return unofficialNotion.search(...args)
  }
}

export const notion = new HybridNotionAPI()
