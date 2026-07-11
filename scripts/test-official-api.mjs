import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_TOKEN })

const rootPageId = '264686b24bf08004a950c99ffcdfecc5'

function formatId(id) {
  // official API wants dashed UUID
  return id.replace(
    /^(.{8})(.{4})(.{4})(.{4})(.{12})$/,
    '$1-$2-$3-$4-$5'
  )
}

async function main() {
  console.log('[test] Testing official Notion API with NOTION_API_TOKEN...\n')

  // 1. Who am I? (validates the token)
  try {
    const me = await notion.users.me({})
    console.log('[test] ✅ Token valid. Bot user:', me.name, '| type:', me.type)
    if (me.bot?.owner) {
      console.log('[test]    owner type:', me.bot.owner.type)
    }
  } catch (err) {
    console.log('[test] ❌ users.me failed:', err.status, err.code, err.message)
    return
  }

  // 2. Can we retrieve the root page?
  try {
    const page = await notion.pages.retrieve({ page_id: formatId(rootPageId) })
    console.log('\n[test] ✅ Retrieved root page. object:', page.object)
    console.log('[test]    properties:', Object.keys(page.properties || {}))
  } catch (err) {
    console.log('\n[test] ❌ pages.retrieve failed:', err.status, err.code, err.message)
    console.log('[test]    -> The page is likely NOT shared with this integration.')
  }

  // 3. Try to retrieve as a database (the root might be a database)
  try {
    const db = await notion.databases.retrieve({ database_id: formatId(rootPageId) })
    console.log('\n[test] ✅ Root is a DATABASE. title:', db.title?.[0]?.plain_text)
    console.log('[test]    properties:', Object.keys(db.properties || {}))
  } catch (err) {
    console.log('\n[test] (root is not a database:', err.code, ')')
  }

  // 4. Search — lists everything shared with the integration
  try {
    const results = await notion.search({ page_size: 10 })
    console.log('\n[test] ✅ Search returned', results.results.length, 'shared objects:')
    for (const r of results.results) {
      const title =
        r.properties?.title?.title?.[0]?.plain_text ||
        r.properties?.Name?.title?.[0]?.plain_text ||
        r.title?.[0]?.plain_text ||
        '(untitled)'
      console.log(`[test]    - ${r.object}: ${title} (${r.id})`)
    }
    if (results.results.length === 0) {
      console.log('[test]    -> NOTHING is shared with this integration yet.')
    }
  } catch (err) {
    console.log('\n[test] ❌ search failed:', err.status, err.code, err.message)
  }
}

main().catch((err) => {
  console.error('[test] fatal:', err)
  process.exit(1)
})
