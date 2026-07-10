import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '264686b24bf08004a950c99ffcdfecc5',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: 'PhysicalMouse\'s Blog',
  domain: 'blog.cfambor.fun',
  author: 'Physical Mouse',

  // open graph metadata (optional)
  description: 'PhysicalMouse\'s personal blog covering Blender 3D art, sculpting, creative practice, study notes, and travel stories.'',

  // social usernames (optional)
  twitter: 'transitive_bs',
  github: 'transitive-bullshit',
  linkedin: 'fisch2',
  // mastodon: '#', // optional mastodon profile URL, provides link verification
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon: null,
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // SEO: search-engine site verification codes (optional)
  // Bing Webmaster Tools: https://www.bing.com/webmasters
  bingSiteVerification: '96B332BE8C0729927B4C665A4E31D77A',
  // Google Search Console: https://search.google.com/search-console
  // paste the content value from the "HTML tag" verification method here
  googleSiteVerification: '9gQof63B6fxt92-FiBLg4N0CZ1g0tRFtlCgf80-A54Q',

  // analytics (optional)
  // Google Analytics 4 measurement id, e.g. 'G-XXXXXXXXXX'
  googleAnalyticsId: 'G-CXY89KXMRM',
  // Vercel Web Analytics and Speed Insights (enabled by default)
  isVercelAnalyticsEnabled: true,
  isVercelSpeedInsightsEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  // whether to use the default notion navigation style or a custom one with links to
  // important pages. To use `navigationLinks`, set `navigationStyle` to `custom`.
  navigationStyle: 'default'
  // navigationStyle: 'custom',
  // navigationLinks: [
  //   {
  //     title: 'About',
  //     pageId: 'f1199d37579b41cbabfc0b5174f4256a'
  //   },
  //   {
  //     title: 'Contact',
  //     pageId: '6a29ebcb935a4f0689fe661ab5f3b8d1'
  //   }
  // ]
})
