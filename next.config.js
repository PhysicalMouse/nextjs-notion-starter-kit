// import path from 'node:path'
// import { fileURLToPath } from 'node:url'

export default {
  staticPageGenerationTimeout: 300,
  images: {
    remotePatterns: [
      // Notion's image CDN / proxy hosts. notion-utils v8 proxies images via
      // app.notion.com (previously www.notion.so).
      { protocol: 'https', hostname: '**.notion.so' },
      { protocol: 'https', hostname: '**.notion.com' },
      { protocol: 'https', hostname: '**.notion-static.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'abs.twimg.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      // Notion pages can embed images from arbitrary external hosts (image
      // beds, link previews, etc.), so allow any https remote to keep those
      // blocks rendering instead of hard-failing the image optimizer.
      { protocol: 'https', hostname: '**' }
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // webpack: (config) => {
  //   // Workaround for ensuring that `react` and `react-dom` resolve correctly
  //   // when using a locally-linked version of `react-notion-x`.
  //   // @see https://github.com/vercel/next.js/issues/50391
  //   const dirname = path.dirname(fileURLToPath(import.meta.url))
  //   config.resolve.alias.react = path.resolve(dirname, 'node_modules/react')
  //   config.resolve.alias['react-dom'] = path.resolve(
  //     dirname,
  //     'node_modules/react-dom'
  //   )
  //   return config
  // },

  // See https://react-tweet.vercel.app/next#troubleshooting
  transpilePackages: ['react-tweet']
}
