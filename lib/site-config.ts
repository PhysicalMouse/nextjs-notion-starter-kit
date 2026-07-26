import type * as types from './types'

export interface SiteConfig {
  rootNotionPageId: string
  rootNotionSpaceId?: string | null

  name: string
  domain: string
  author: string
  description?: string
  language?: string

  defaultPageIcon?: string | null
  defaultPageCover?: string | null
  defaultPageCoverPosition?: number | null

  isPreviewImageSupportEnabled?: boolean
  isTweetEmbedSupportEnabled?: boolean
  isSearchEnabled?: boolean

  // SEO: search-engine site verification codes (optional)
  googleSiteVerification?: string | null
  bingSiteVerification?: string | null

  // SEO: IndexNow key for instant search-engine indexing (Bing/Yandex) (optional)
  indexNowKey?: string | null

  // analytics (optional)
  googleAnalyticsId?: string | null
  isVercelAnalyticsEnabled?: boolean
  isVercelSpeedInsightsEnabled?: boolean
  // Microsoft Clarity project ID (optional): https://clarity.microsoft.com
  clarityId?: string | null

  includeNotionIdInUrls?: boolean
  pageUrlOverrides?: types.PageUrlOverridesMap | null
  pageUrlAdditions?: types.PageUrlOverridesMap | null

  navigationStyle?: types.NavigationStyle
  navigationLinks?: Array<NavigationLink>

  // ISR revalidation interval in seconds (default: 3600).
  // Lower values = more up-to-date content but more Vercel function invocations.
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
