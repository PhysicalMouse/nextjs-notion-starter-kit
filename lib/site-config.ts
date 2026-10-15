import type * as types from './types'

export interface SiteConfig {
  rootNotionPageId: string
  rootNotionSpaceId?: string | null

  name: string
  domain: string
  author: string
  description?: string
  language?: string

  twitter?: string
  github?: string
  linkedin?: string
  newsletter?: string
  youtube?: string
  zhihu?: string
  mastodon?: string

  defaultPageIcon?: string | null
  defaultPageCover?: string | null
  defaultPageCoverPosition?: number | null

  isPreviewImageSupportEnabled?: boolean
  isTweetEmbedSupportEnabled?: boolean
  isRedisEnabled?: boolean
  isSearchEnabled?: boolean

  // SEO: search-engine site verification codes (optional)
  googleSiteVerification?: string | null
  bingSiteVerification?: string | null
  // IndexNow key for instant search-engine indexing (Bing/Yandex)
  indexNowKey?: string | null

  // analytics (optional)
  googleAnalyticsId?: string | null
  isVercelAnalyticsEnabled?: boolean
  isVercelSpeedInsightsEnabled?: boolean
  // Microsoft Clarity project ID (optional)
  clarityId?: string | null

  includeNotionIdInUrls?: boolean
  pageUrlOverrides?: types.PageUrlOverridesMap | null
  pageUrlAdditions?: types.PageUrlOverridesMap | null

  navigationStyle?: types.NavigationStyle
  navigationLinks?: Array<NavigationLink>

  // ISR revalidation interval in seconds (default: 3600)
  revalidateSeconds?: number
}

export interface NavigationLink {
  title: string
  pageId?: string
  url?: string
}

export const siteConfig = (config: SiteConfig): SiteConfig => {
  return config
}
