import {
  type ExtendedRecordMap,
  type SearchParams,
  type SearchResults
} from 'notion-types'
import { mergeRecordMaps } from 'notion-utils'
import pMap from 'p-map'
import pMemoize from 'p-memoize'

import {
  isPreviewImageSupportEnabled,
  navigationLinks,
  navigationStyle
} from './config'
import { getTweetsMap } from './get-tweets'
import { notion } from './notion-api'
import { getPreviewImageMap } from './preview-images'

// ---------------------------------------------------------------------------
// Server-side in-memory page cache
// ---------------------------------------------------------------------------
// Caches the fully-assembled ExtendedRecordMap for each pageId so that:
//   1. Repeated requests within the TTL window never hit Notion at all.
//   2. If Notion is temporarily down, we can return the last-known-good data
//      (stale-while-revalidate pattern).
// The TTL is intentionally short (60 s) so fresh edits propagate quickly
// while still absorbing sudden traffic spikes or Notion hiccups.

const PAGE_CACHE_TTL_MS = 60_000 // 60 seconds

interface CacheEntry {
  recordMap: ExtendedRecordMap
  expiresAt: number
}

const pageCache = new Map<string, CacheEntry>()

function getCached(pageId: string): ExtendedRecordMap | null {
  const entry = pageCache.get(pageId)
  if (!entry) return null
  if (Date.now() < entry.expiresAt) return entry.recordMap
  // entry is stale but we keep it for potential fallback use
  return null
}

function getStaleCached(pageId: string): ExtendedRecordMap | undefined {
  return pageCache.get(pageId)?.recordMap
}

function setCached(pageId: string, recordMap: ExtendedRecordMap): void {
  pageCache.set(pageId, {
    recordMap,
    expiresAt: Date.now() + PAGE_CACHE_TTL_MS
  })
}

const getNavigationLinkPages = pMemoize(
  async (): Promise<ExtendedRecordMap[]> => {
    const navigationLinkPageIds = (navigationLinks || [])
      .map((link) => link?.pageId)
      .filter(Boolean)

    if (navigationStyle !== 'default' && navigationLinkPageIds.length) {
      return pMap(
        navigationLinkPageIds,
        async (navigationLinkPageId) =>
          notion.getPage(navigationLinkPageId, {
            chunkLimit: 1,
            fetchMissingBlocks: false,
            fetchCollections: false,
            signFileUrls: false
          }),
        {
          concurrency: 4
        }
      )
    }

    return []
  }
)

// The Notion data returned via our API proxy uses a double-nested shape for
// collection views (`collection_view[id].value.value`). notion-client's
// getPage reads the view value one level too shallow (`collection_view[id]
// .value`), so it never sees the view's `query2` (sort + filter). As a result
// the `queryCollection` request is sent WITHOUT the view's sort or filter, and
// the site renders collections in Notion's default order (and includes rows
// the view's filter should have hidden) instead of matching what you see in
// Notion.
//
// This re-runs the collection query for each rendered view using the correctly
// unwrapped view value, so Notion applies the real sort + filter, and then
// merges the corrected results back into the record map.
async function fixCollectionQueries(recordMap: ExtendedRecordMap) {
  const collectionQuery = (recordMap as any).collection_query
  const collectionView = recordMap.collection_view

  if (!collectionQuery || !collectionView) {
    return
  }

  const instances: Array<{ collectionId: string; viewId: string }> = []
  for (const [collectionId, viewMap] of Object.entries<any>(collectionQuery)) {
    if (!viewMap) continue
    for (const viewId of Object.keys(viewMap)) {
      instances.push({ collectionId, viewId })
    }
  }

  await pMap(
    instances,
    async ({ collectionId, viewId }) => {
      const viewEntry = collectionView[viewId] as any
      const spaceId = viewEntry?.spaceId
      // correctly unwrap the view value (handles the double-nested proxy shape)
      const viewValue = viewEntry?.value?.value ?? viewEntry?.value

      // only re-query when the view actually defines a sort and/or filter
      if (!viewValue?.query2?.sort && !viewValue?.query2?.filter) {
        return
      }

      try {
        const collectionData = await notion.getCollectionData(
          collectionId,
          viewId,
          viewValue,
          { spaceId }
        )

        const reducerResults = (collectionData as any).result?.reducerResults
        if (!reducerResults) {
          return
        }

        // merge any newly-fetched blocks/collection info so titles, covers,
        // etc. for the (now correctly ordered/filtered) rows are available
        recordMap.block = {
          ...recordMap.block,
          ...(collectionData as any).recordMap?.block
        }
        recordMap.collection = {
          ...recordMap.collection,
          ...(collectionData as any).recordMap?.collection
        }

        collectionQuery[collectionId][viewId] = reducerResults
      } catch (err: any) {
        console.warn(
          'NotionAPI fixCollectionQueries error',
          { collectionId, viewId },
          err?.message
        )
      }
    },
    { concurrency: 3 }
  )
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  // Return a fresh cached entry immediately if available
  const cached = getCached(pageId)
  if (cached) return cached

  let recordMap: ExtendedRecordMap

  try {
    recordMap = await notion.getPage(pageId)
  } catch (err: any) {
    // If Notion is unreachable, fall back to a potentially stale cached entry
    // so the site keeps serving instead of showing a 500.
    const stale = getStaleCached(pageId)
    if (stale) {
      console.warn(
        `[notion] getPage failed for ${pageId}, serving stale cache:`,
        err?.message
      )
      return stale
    }
    throw err
  }

  if (navigationStyle !== 'default') {
    // ensure that any pages linked to in the custom navigation header have
    // their block info fully resolved in the page record map so we know
    // the page title, slug, etc.
    const navigationLinkRecordMaps = await getNavigationLinkPages()

    if (navigationLinkRecordMaps?.length) {
      recordMap = navigationLinkRecordMaps.reduce(
        (map, navigationLinkRecordMap) =>
          mergeRecordMaps(map, navigationLinkRecordMap),
        recordMap
      )
    }
  }

  // re-run collection queries so Notion's real sort + filter are applied,
  // matching the ordering you see in Notion
  await fixCollectionQueries(recordMap)

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  // Store in cache for subsequent requests and stale fallback
  setCached(pageId, recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
