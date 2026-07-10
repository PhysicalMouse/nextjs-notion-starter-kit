import { type ExtendedRecordMap } from 'notion-types'
import { getBlockTitle, getBlockValue, getPageProperty } from 'notion-utils'
import pMemoize from 'p-memoize'

import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getSiteMap } from './get-site-map'

const uuid = !!includeNotionIdInUrls

export interface SearchIndexItem {
  pageId: string
  title: string
  url: string
  tags: string[]
  description?: string
  lastUpdated?: number
}

export interface SearchIndex {
  items: SearchIndexItem[]
  tags: string[]
}

function normalizeTags(value: unknown): string[] {
  if (!value) return []

  const raw = Array.isArray(value) ? value : String(value).split(',')

  return raw
    .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
    .filter(Boolean)
}

// Build a lightweight, cacheable index of every public page in the site so we
// can offer instant client-side search + tag filtering without hitting Notion
// on every keystroke.
export const getSearchIndex = pMemoize(getSearchIndexImpl)

async function getSearchIndexImpl(): Promise<SearchIndex> {
  const siteMap = await getSiteMap()
  const items: SearchIndexItem[] = []
  const tagSet = new Set<string>()

  for (const [pageId, recordMap] of Object.entries(
    siteMap.pageMap as Record<string, ExtendedRecordMap | undefined>
  )) {
    if (!recordMap) continue

    const block = getBlockValue(recordMap.block?.[pageId])
    if (!block) continue

    // skip pages explicitly marked as non-public
    const isPublic =
      getPageProperty<boolean | null>('Public', block, recordMap) ?? true
    if (!isPublic) continue

    const title = getBlockTitle(block, recordMap)
    if (!title) continue

    const canonicalPageId = getCanonicalPageId(pageId, recordMap, { uuid })
    if (!canonicalPageId) continue

    const tags = normalizeTags(getPageProperty('Tags', block, recordMap))
    for (const tag of tags) {
      tagSet.add(tag)
    }

    const description =
      getPageProperty<string>('Description', block, recordMap) || undefined

    const lastUpdated =
      typeof block.last_edited_time === 'number'
        ? block.last_edited_time
        : undefined

    items.push({
      pageId,
      title,
      url: `/${canonicalPageId}`,
      tags,
      description,
      lastUpdated
    })
  }

  // most recently edited pages first
  items.sort((a, b) => (b.lastUpdated ?? 0) - (a.lastUpdated ?? 0))

  return {
    items,
    tags: [...tagSet].sort((a, b) => a.localeCompare(b))
  }
}
