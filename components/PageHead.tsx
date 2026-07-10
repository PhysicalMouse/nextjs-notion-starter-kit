import Head from 'next/head'

import type * as types from '@/lib/types'
import * as config from '@/lib/config'
import { getSocialImageUrl } from '@/lib/get-social-image-url'

export function PageHead({
  site,
  title,
  description,
  pageId,
  image,
  url,
  isBlogPost,
  publishedTime,
  modifiedTime,
  author
}: types.PageProps & {
  title?: string
  description?: string
  image?: string
  url?: string
  isBlogPost?: boolean
  publishedTime?: string | number | null
  modifiedTime?: string | number | null
  author?: string
}) {
  const rssFeedUrl = `${config.host}/feed`

  const siteName = site?.name ?? config.name
  const pageTitle = title ?? siteName
  const pageDescription = description ?? site?.description ?? config.description
  const socialImageUrl = getSocialImageUrl(pageId) || image
  const pageAuthor = author || config.author
  const pageType = isBlogPost ? 'article' : 'website'
  const pageLanguage = config.language || 'en'

  const toIsoDate = (value?: string | number | null) => {
    if (!value) return undefined

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return undefined

    return date.toISOString()
  }

  const publishedAt = toIsoDate(publishedTime)
  const modifiedAt = toIsoDate(modifiedTime ?? publishedTime)

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: config.host,
    description: pageDescription,
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: config.host
    }
  }

  const blogPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': url ? `${url}#BlogPosting` : undefined,
    mainEntityOfPage: url,
    headline: pageTitle,
    name: pageTitle,
    description: pageDescription,
    author: {
      '@type': 'Person',
      name: pageAuthor
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: config.host
    },
    image: socialImageUrl,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    inLanguage: pageLanguage
  }

  const structuredData = [
    websiteSchema,
    ...(isBlogPost ? [blogPostingSchema] : [])
  ]

  return (
    <Head>
      <meta charSet='utf-8' />
      <meta httpEquiv='Content-Type' content='text/html; charset=utf-8' />
      <meta
        name='viewport'
        content='width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover'
      />

      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='black' />

      <meta
        name='theme-color'
        media='(prefers-color-scheme: light)'
        content='#fefffe'
        key='theme-color-light'
      />
      <meta
        name='theme-color'
        media='(prefers-color-scheme: dark)'
        content='#2d3439'
        key='theme-color-dark'
      />

      <meta
        name='robots'
        content='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      />
      <meta
        name='googlebot'
        content='index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
      />
      <meta name='bingbot' content='index,follow' />

      {config.googleSiteVerification && (
        <meta
          name='google-site-verification'
          content={config.googleSiteVerification}
        />
      )}
      {config.bingSiteVerification && (
        <meta name='msvalidate.01' content={config.bingSiteVerification} />
      )}

      <meta name='author' content={pageAuthor} />
      <meta property='og:type' content={pageType} />
      <meta property='og:locale' content={pageLanguage} />

      {site && (
        <>
          <meta property='og:site_name' content={site.name} />
          <meta property='twitter:domain' content={site.domain} />
        </>
      )}

      {publishedAt && (
        <meta property='article:published_time' content={publishedAt} />
      )}
      {modifiedAt && (
        <meta property='article:modified_time' content={modifiedAt} />
      )}
      {pageAuthor && <meta property='article:author' content={pageAuthor} />}

      {config.twitter && (
        <meta name='twitter:creator' content={`@${config.twitter}`} />
      )}

      {pageDescription && (
        <>
          <meta name='description' content={pageDescription} />
          <meta property='og:description' content={pageDescription} />
          <meta name='twitter:description' content={pageDescription} />
        </>
      )}

      {socialImageUrl ? (
        <>
          <meta name='twitter:card' content='summary_large_image' />
          <meta name='twitter:image' content={socialImageUrl} />
          <meta property='og:image' content={socialImageUrl} />
        </>
      ) : (
        <meta name='twitter:card' content='summary' />
      )}

      {url && (
        <>
          <link rel='canonical' href={url} />
          <meta property='og:url' content={url} />
          <meta property='twitter:url' content={url} />
        </>
      )}

      <link
        rel='alternate'
        type='application/rss+xml'
        href={rssFeedUrl}
        title={site?.name}
      />

      <meta property='og:title' content={pageTitle} />
      <meta name='twitter:title' content={pageTitle} />
      <title>{pageTitle}</title>

      <script type='application/ld+json'>
        {JSON.stringify(structuredData)}
      </script>
    </Head>
  )
}
