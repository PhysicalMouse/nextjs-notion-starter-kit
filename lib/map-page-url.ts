import { type ExtendedRecordMap } from 'notion-types'
import { parsePageId, uuidToId } from 'notion-utils'

import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { type Site } from './types'

// include UUIDs in page URLs during local development but not in production
// (they're nice for debugging and speed up local dev)
const uuid = !!includeNotionIdInUrls

/**
 * Returns the URL path for a given pageId within the recordMap.
 *
 * Sub-pages (parent_table === 'block') are nested under their parent slug,
 * e.g. /blog-post-slug/sub-page-slug. Blog posts and top-level pages keep
 * their existing flat /slug path.
 *
 * @param parentPath - the current page's own slug (used as prefix for children)
 */
export const mapPageUrl =
  (
    site: Site,
    recordMap: ExtendedRecordMap,
    searchParams: URLSearchParams,
    parentPath?: string
  ) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })!

    if (uuidToId(pageUuid) === site.rootNotionPageId) {
      return createUrl('/', searchParams)
    }

    const slug = getCanonicalPageId(pageUuid, recordMap, { uuid })

    // If this page is a sub-page (parent_table === 'block'), nest it under
    // the current page's path so links render as /parent-slug/child-slug.
    const blockRecord = recordMap.block?.[pageUuid]
    const block = (blockRecord as any)?.value ?? blockRecord
    if (block && (block as any).parent_table === 'block' && parentPath) {
      return createUrl(`/${parentPath}/${slug}`, searchParams)
    }

    return createUrl(`/${slug}`, searchParams)
  }

export const getCanonicalPageUrl =
  (site: Site, recordMap: ExtendedRecordMap) =>
  (pageId = '') => {
    const pageUuid = parsePageId(pageId, { uuid: true })!

    if (uuidToId(pageId) === site.rootNotionPageId) {
      return `https://${site.domain}`
    } else {
      return `https://${site.domain}/${getCanonicalPageId(pageUuid, recordMap, {
        uuid
      })}`
    }
  }

function createUrl(path: string, searchParams: URLSearchParams) {
  return [path, searchParams.toString()].filter(Boolean).join('?')
}
