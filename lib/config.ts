/**
 * Site-wide app configuration.
 *
 * This file pulls from the root "site.config.ts" as well as environment variables
 * for optional depenencies.
 */
import { parsePageId } from 'notion-utils'
import { type PostHogConfig } from 'posthog-js'

import {
  getEnv,
  getRequiredSiteConfig,
  getSiteConfig
} from './get-config-value'
import { type NavigationLink } from './site-config'
import {
  type NavigationStyle,
  type PageUrlOverridesInverseMap,
  type PageUrlOverridesMap,
  type Site
} from './types'

export const rootNotionPageId: string = parsePageId(
  getSiteConfig('rootNotionPageId'),
  { uuid: false }
)!

if (!rootNotionPageId) {
  throw new Error('Config error invalid "rootNotionPageId"')
}

// if you want to restrict pages to a single notion workspace (optional)
export const rootNotionSpaceId: string | null =
  parsePageId(getSiteConfig('rootNotionSpaceId'), { uuid: true }) ?? null

export const pageUrlOverrides = cleanPageUrlMap(
  getSiteConfig('pageUrlOverrides', {}) || {},
  { label: 'pageUrlOverrides' }
)

export const pageUrlAdditions = cleanPageUrlMap(
  getSiteConfig('pageUrlAdditions', {}) || {},
  { label: 'pageUrlAdditions' }
)

export const inversePageUrlOverrides = invertPageUrlOverrides(pageUrlOverrides)

export const environment = process.env.NODE_ENV || 'development'
export const isDev = environment === 'development'

// general site config
export const name: string = getRequiredSiteConfig('name')
export const author: string = getRequiredSiteConfig('author')
export const domain: string = getRequiredSiteConfig('domain')
export const description: string = getSiteConfig('description', 'Notion Blog')
export const language: string = getSiteConfig('language', 'en')

// default notion values for site-wide consistency (optional; may be overridden on a per-page basis)
export const defaultPageIcon: string | undefined =
  getSiteConfig('defaultPageIcon')
export const defaultPageCover: string | undefined =
  getSiteConfig('defaultPageCover')
export const defaultPageCoverPosition: number = getSiteConfig(
  'defaultPageCoverPosition',
  0.5
)

// Optional whether or not to enable support for LQIP preview images
export const isPreviewImageSupportEnabled: boolean = getSiteConfig(
  'isPreviewImageSupportEnabled',
  false
)

// Optional whether or not to include the Notion ID in page URLs or just use slugs
export const includeNotionIdInUrls: boolean = getSiteConfig(
  'includeNotionIdInUrls',
  !!isDev
)

export const navigationStyle: NavigationStyle = getSiteConfig(
  'navigationStyle',
  'default'
)

export const navigationLinks: Array<NavigationLink | undefined> = getSiteConfig(
  'navigationLinks',
  null
)

// Optional site search
export const isSearchEnabled: boolean = getSiteConfig('isSearchEnabled', true)

// ISR revalidation interval in seconds. Configured in site.config.ts.
// Default is 3600 (1 hour). Increase to reduce Vercel function invocations.
export const revalidateSeconds: number = getSiteConfig('revalidateSeconds', 3600)

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

export const isServer = typeof window === 'undefined'

export const port = getEnv('PORT', '3000')
export const host = isDev ? `http://localhost:${port}` : `https://${domain}`
export const apiHost = isDev
  ? host
  : `https://${process.env.VERCEL_URL || domain}`

export const apiBaseUrl = `/api`

// Optional search-engine site verification codes.
// Configured in site.config.ts, with optional environment variable overrides.
// Google Search Console: https://search.google.com/search-console
export const googleSiteVerification: string | null =
  getSiteConfig('googleSiteVerification', null) ||
  getEnv('GOOGLE_SITE_VERIFICATION', null)
// Bing Webmaster Tools: https://www.bing.com/webmasters
export const bingSiteVerification: string | null =
  getSiteConfig('bingSiteVerification', null) ||
  getEnv('BING_SITE_VERIFICATION', null)

// IndexNow key for instant indexing (Bing/Yandex). The matching verification
// file must exist at `public/<key>.txt`. https://www.indexnow.org
export const indexNowKey: string | null =
  getSiteConfig('indexNowKey', null) || getEnv('INDEXNOW_KEY', null)

// Optional analytics. Configured in site.config.ts, with env var overrides.
// Google Analytics 4 measurement id (e.g. 'G-XXXXXXXXXX')
export const googleAnalyticsId: string | null =
  getSiteConfig('googleAnalyticsId', null) ||
  getEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID', null)
// Vercel Web Analytics and Speed Insights (enabled by default)
export const isVercelAnalyticsEnabled: boolean = getSiteConfig(
  'isVercelAnalyticsEnabled',
  true
)
export const isVercelSpeedInsightsEnabled: boolean = getSiteConfig(
  'isVercelSpeedInsightsEnabled',
  true
)

export const api = {
  searchNotion: `${apiBaseUrl}/search-notion`,
  searchIndex: `${apiBaseUrl}/search-index`,
  getNotionPageInfo: `${apiBaseUrl}/notion-page-info`,
  getSocialImage: `${apiBaseUrl}/social-image`
}

// ----------------------------------------------------------------------------

export const site: Site = {
  domain,
  name,
  rootNotionPageId,
  rootNotionSpaceId,
  description
}

export const fathomId = isDev ? undefined : process.env.NEXT_PUBLIC_FATHOM_ID
export const fathomConfig = fathomId
  ? {
      excludedDomains: ['localhost', 'localhost:3000']
    }
  : undefined

export const posthogId = process.env.NEXT_PUBLIC_POSTHOG_ID
export const posthogConfig: Partial<PostHogConfig> = {
  api_host: 'https://app.posthog.com'
}

function cleanPageUrlMap(
  pageUrlMap: PageUrlOverridesMap,
  {
    label
  }: {
    label: string
  }
): PageUrlOverridesMap {
  return Object.keys(pageUrlMap).reduce((acc, uri) => {
    const pageId = pageUrlMap[uri]
    const uuid = parsePageId(pageId, { uuid: false })

    if (!uuid) {
      throw new Error(`Invalid ${label} page id "${pageId}"`)
    }

    if (!uri) {
      throw new Error(`Missing ${label} value for page "${pageId}"`)
    }

    if (!uri.startsWith('/')) {
      throw new Error(
        `Invalid ${label} value for page "${pageId}": value "${uri}" should be a relative URI that starts with "/"`
      )
    }

    const path = uri.slice(1)

    return {
      ...acc,
      [path]: uuid
    }
  }, {})
}

function invertPageUrlOverrides(
  pageUrlOverrides: PageUrlOverridesMap
): PageUrlOverridesInverseMap {
  return Object.keys(pageUrlOverrides).reduce((acc, uri) => {
    const pageId = pageUrlOverrides[uri]!

    return {
      ...acc,
      [pageId]: uri
    }
  }, {})
}
