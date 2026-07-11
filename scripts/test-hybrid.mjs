import { Client } from '@notionhq/client'
import { NotionAPI } from 'notion-client'
import { NotionCompatAPI } from 'notion-compat'

// Re-implement the hybrid routing here (mjs can't import the .ts module easily)
const unofficial = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_API_TOKEN
})
const official = new NotionCompatAPI(
  new Client({ auth: process.env.NOTION_API_TOKEN })
)

function hasUnrenderableCollection(rm) {
  if (Object.keys(rm.collection || {}).length > 0) return false
  for (const id of Object.keys(rm.block || {})) {
    const t = rm.block[id]?.value?.type
    if (t === 'child_database' || t === 'collection_view' || t === 'collection_view_page') return true
  }
  return false
}

async function hybridGetPage(pageId) {
  try {
    const rm = await official.getPage(pageId)
    if (hasUnrenderableCollection(rm)) {
      return { source: 'unofficial (collection fallback)', rm: await unofficial.getPage(pageId) }
    }
    return { source: 'official', rm }
  } catch (err) {
    return { source: 'unofficial (error fallback): ' + err.message, rm: await unofficial.getPage(pageId) }
  }
}

async function main() {
  const cases = [
    ['ROOT / homepage (gallery)', '264686b24bf08004a950c99ffcdfecc5'],
    ['ARTICLE (eSIM)', '398686b24bf08083bce4f736c9807ab7'],
    ['ABOUT page', '264686b24bf081bea36cc0c21ebe0cfa']
  ]
  for (const [label, id] of cases) {
    const t0 = Date.now()
    const { source, rm } = await hybridGetPage(id)
    const blocks = Object.keys(rm.block || {}).length
    const cols = Object.keys(rm.collection || {}).length
    const cq = Object.keys(rm.collection_query || {}).length
    console.log(`\n[${label}]`)
    console.log(`  routed to: ${source}`)
    console.log(`  ${Date.now() - t0}ms | blocks=${blocks} collections=${cols} collection_query=${cq}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
