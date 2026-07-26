import { siteConfig } from './lib/site-config'

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '264686b24bf08004a950c99ffcdfecc5',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: null,

  // basic site info (required)
  name: "PhysicalMouse's Blog",
  domain: 'blog.physmouse.com',
  author: 'PhysicalMouse',

  // open graph metadata (optional)
  description: "PhysicalMouse's personal blog covering Blender 3D art, sculpting, creative practice and study notes. 物理鼠鼠的个人博客，内容涵盖 Blender 3D 艺术、雕刻、创作实践以及学习笔记。",

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
  googleSiteVerification: 'Gmy5eIF7Jk9ut5BCVJLZGF6kr7zcFWa-ZxvPM-wChLA',
  // IndexNow key for instant indexing (Bing/Yandex). https://www.indexnow.org
  // the matching verification file lives at public/<key>.txt
  indexNowKey: 'e2d8315e71f04375d6baaa530494bd7c',

  // analytics (optional)
  // Google Analytics 4 measurement id, e.g. 'G-XXXXXXXXXX'
  googleAnalyticsId: 'G-NX2G97BYGR',
  // Microsoft Clarity project ID. https://clarity.microsoft.com
  clarityId: 'xsgpgrdvwf',
  // Vercel Web Analytics and Speed Insights (enabled by default)
  isVercelAnalyticsEnabled: true,
  isVercelSpeedInsightsEnabled: true,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  // ISR revalidation interval in seconds (optional, default: 3600).
  // Pages will be regenerated at most once per interval, reducing Vercel function invocations.
  // Increase for less frequent updates (e.g. 86400 = once per day).
  revalidateSeconds: 86400,

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
