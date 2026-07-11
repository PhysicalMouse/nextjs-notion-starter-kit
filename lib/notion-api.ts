import { NotionAPI } from 'notion-client'

// notion-client uses ofetch under the hood. Passing ofetchOptions lets us
// configure automatic retries for transient errors (503, 429, network
// timeouts) so a single flaky Notion API response doesn't crash the page.
export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken: process.env.NOTION_API_TOKEN,
  ofetchOptions: {
    retry: 3, // up to 3 retries
    retryDelay: 500, // 500 ms base delay between retries
    retryStatusCodes: [408, 429, 500, 502, 503, 504],
    timeout: 30_000 // 30 s hard timeout per attempt
  }
})
