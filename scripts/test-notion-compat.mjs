import { Client } from '@notionhq/client'
import { NotionCompatAPI } from 'notion-compat'

const notion = new NotionCompatAPI(
  new Client({ auth: process.env.NOTION_API_TOKEN })
)

const rootPageId = '264686b24bf08004a950c99ffcdfecc5'
const articlePageId = '398686b24bf08083bce4f736c9807ab7' // 西班牙 eSIM article

function summarize(recordMap, label) {
  const blockIds = Object.keys(recordMap.block || {})
  const collectionIds = Object.keys(recordMap.collection || {})
  const viewIds = Object.keys(recordMap.collection_view || {})
  const queryKeys = Object.keys(recordMap.collection_query || {})

  const blockTypes = {}
  for (const id of blockIds) {
    const t = recordMap.block[id]?.value?.type || 'unknown'
    blockTypes[t] = (blockTypes[t] || 0) + 1
  }

  console.log(`\n===== ${label} =====`)
  console.log('blocks:', blockIds.length)
  console.log('collections:', collectionIds.length)
  console.log('collection_views:', viewIds.length)
  console.log('collection_query keys:', queryKeys.length)
  console.log('block types:', JSON.stringify(blockTypes, null, 0))
  return { blockIds, collectionIds, viewIds, queryKeys }
}

async function main() {
  console.log('[compat] Testing notion-compat getPage()...')

  // Root page (has the gallery/database view)
  try {
    const t0 = Date.now()
    const rootMap = await notion.getPage(rootPageId)
    console.log(`[compat] root getPage took ${Date.now() - t0}ms`)
    const r = summarize(rootMap, 'ROOT PAGE (gallery/collection)')

    // Inspect collection_query contents (this drives the homepage gallery)
    if (r.queryKeys.length) {
      const cq = rootMap.collection_query
      for (const colId of Object.keys(cq)) {
        for (const viewId of Object.keys(cq[colId])) {
          const result = cq[colId][viewId]
          const count =
            result?.blockIds?.length ??
            result?.collection_group_results?.blockIds?.length ??
            0
          console.log(`[compat]   query col=${colId.slice(0,8)} view=${viewId.slice(0,8)} -> ${count} rows`)
        }
      }
    } else {
      console.log('[compat]   ⚠️  NO collection_query — homepage gallery would be EMPTY')
    }
  } catch (err) {
    console.log('[compat] ❌ root getPage failed:', err.message)
  }

  // Article page (regular content blocks)
  try {
    const t0 = Date.now()
    const artMap = await notion.getPage(articlePageId)
    console.log(`\n[compat] article getPage took ${Date.now() - t0}ms`)
    summarize(artMap, 'ARTICLE PAGE (content blocks)')
  } catch (err) {
    console.log('[compat] ❌ article getPage failed:', err.message)
  }
}

main().catch((err) => {
  console.error('[compat] fatal:', err)
  process.exit(1)
})
