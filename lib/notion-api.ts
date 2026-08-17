import { NotionAPI } from 'notion-client'

// notion-client uses ofetch under the hood. Passing ofetchOptions lets us
// configure automatic retries for transient errors (503, 429, network
// timeouts) so a single flaky Notion API response doesn't crash the page.
export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_API_TOKEN,
  ofetchOptions: {
    retry: 3,
    retryDelay: 500,
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 30_000
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  }
})
