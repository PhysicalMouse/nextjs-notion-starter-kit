import { NotionAPI } from 'notion-client'

const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_API_TOKEN
})

const rootPageId = '264686b24bf08004a950c99ffcdfecc5'

async function main() {
  const rm = await notion.getPage(rootPageId)

  console.log('=== UNOFFICIAL recordMap (root) ===')
  console.log('blocks:', Object.keys(rm.block || {}).length)
  console.log('collections:', Object.keys(rm.collection || {}).length)
  console.log('collection_views:', Object.keys(rm.collection_view || {}).length)
  console.log('collection_query keys:', Object.keys(rm.collection_query || {}).length)

  // Show collection schema
  for (const cid of Object.keys(rm.collection || {})) {
    const col = rm.collection[cid].value
    console.log(`\ncollection ${cid.slice(0,8)}: name=`, col.name?.[0]?.[0])
    console.log('  schema props:', Object.entries(col.schema || {}).map(([k,v]) => `${v.name}(${v.type})`).join(', '))
  }

  // Show collection_query structure
  for (const cid of Object.keys(rm.collection_query || {})) {
    for (const vid of Object.keys(rm.collection_query[cid])) {
      const q = rm.collection_query[cid][vid]
      const keys = Object.keys(q)
      console.log(`\ncollection_query[${cid.slice(0,8)}][${vid.slice(0,8)}] keys:`, keys)
      // find blockIds
      const bids = q.blockIds || q.collection_group_results?.blockIds
      console.log('  row count:', bids?.length)
    }
  }

  // Show a collection_view
  for (const vid of Object.keys(rm.collection_view || {})) {
    const v = rm.collection_view[vid].value
    console.log(`\ncollection_view ${vid.slice(0,8)}: type=${v.type}, name=${v.name}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
