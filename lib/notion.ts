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

// Notion "collection" (database) views can be ordered manually by dragging
// rows/cards. That manual order is stored on the view as `page_sort`, but
// Notion's `queryCollection` API does NOT apply it when the view has no
// explicit sort rule — it returns a different default order. As a result the
// site renders collections in a different order than what you see in Notion.
//
// This reorders each view's query results to follow the view's `page_sort`
// so the site matches your Notion ordering.
function applyCollectionPageSort(recordMap: ExtendedRecordMap) {
  const collectionQuery = (recordMap as any).collection_query
  const collectionView = recordMap.collection_view

  if (!collectionQuery || !collectionView) {
    return
  }

  for (const viewMap of Object.values<any>(collectionQuery)) {
    if (!viewMap) continue

    for (const [viewId, result] of Object.entries<any>(viewMap)) {
      const viewEntry = collectionView[viewId] as any
      // handle both the normalized (`.value`) and raw (`.value.value`) shapes
      const viewValue = viewEntry?.value?.value ?? viewEntry?.value
      const pageSort: string[] | undefined = viewValue?.page_sort

      if (!Array.isArray(pageSort) || !pageSort.length) {
        continue
      }

      const groupResults = result?.collection_group_results ?? result
      const blockIds: string[] | undefined = groupResults?.blockIds

      if (!Array.isArray(blockIds) || !blockIds.length) {
        continue
      }

      const sortIndex = new Map(pageSort.map((id, index) => [id, index]))
      const fallback = Number.MAX_SAFE_INTEGER

      // stable sort: ids present in page_sort come first (in that order),
      // any ids not in page_sort keep their original relative order at the end
      groupResults.blockIds = blockIds
        .map((id, index) => ({ id, index }))
        .sort((a, b) => {
          const ai = sortIndex.has(a.id) ? sortIndex.get(a.id)! : fallback
          const bi = sortIndex.has(b.id) ? sortIndex.get(b.id)! : fallback
          return ai - bi || a.index - b.index
        })
        .map((entry) => entry.id)
    }
  }
}

export async function getPage(pageId: string): Promise<ExtendedRecordMap> {
  let recordMap = await notion.getPage(pageId)

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

  // reorder collection results to match the manual ordering set in Notion
  applyCollectionPageSort(recordMap)

  if (isPreviewImageSupportEnabled) {
    const previewImageMap = await getPreviewImageMap(recordMap)
    ;(recordMap as any).preview_images = previewImageMap
  }

  await getTweetsMap(recordMap)

  return recordMap
}

export async function search(params: SearchParams): Promise<SearchResults> {
  return notion.search(params)
}
