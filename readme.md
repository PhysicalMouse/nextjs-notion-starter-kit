# PhysicalMouse's Blog

A Notion-driven personal blog built with [Next.js](https://nextjs.org) and [react-notion-x](https://github.com/NotionX/react-notion-x), based on [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit).

Pages are authored in Notion and rendered as a fast, statically generated site with ISR (incremental static regeneration). The blog covers Blender 3D art, sculpting, creative practice, and study notes.

**Live site:** https://blog.physmouse.com

## Tech stack

- **[Next.js](https://nextjs.org) 16** — Pages Router with Turbopack
- **[React](https://react.dev) 19**
- **[react-notion-x](https://github.com/NotionX/react-notion-x) 8** — renders Notion content (with `notion-client` / `notion-types` / `notion-utils`)
- **[TypeScript](https://www.typescriptlang.org) 7**
- **[KaTeX](https://katex.org)** for math, **[Prism](https://prismjs.com)** for code highlighting, **[react-tweet](https://github.com/vercel/react-tweet)** for embedded tweets
- **[oxlint](https://oxc.rs) + [oxfmt](https://oxc.rs)** for linting and formatting
- **[pnpm](https://pnpm.io)** package manager, deployed on **[Vercel](https://vercel.com)**

## Getting started

**Prerequisites:** Node.js 24+ and pnpm 10+.

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 to view the site.

All environment variables are optional (see [`.env.example`](./.env.example)) — the app runs locally without a `.env` file.

## Configuration

All site-level settings live in [`site.config.ts`](./site.config.ts). The `rootNotionPageId` points to the Notion page used as the site root; make sure the Notion pages are shared publicly.

| Key | Description |
| --- | --- |
| `rootNotionPageId` | **Required.** Root Notion page for the site. |
| `name` / `domain` / `author` | Basic site identity. |
| `description` | Open Graph / SEO description. |
| `isPreviewImageSupportEnabled` | Generate LQIP blur-hash preview images (Redis optional for persistence). |
| `googleAnalyticsId` / `clarityId` / `isVercelAnalyticsEnabled` / `isVercelSpeedInsightsEnabled` | Analytics providers. |
| `bingSiteVerification` / `googleSiteVerification` / `indexNowKey` | Search-engine verification & instant indexing. |
| `revalidateSeconds` | ISR revalidation interval (default 3600; set to 86400 here = once per day). |
| `navigationStyle` / `navigationLinks` | Default Notion nav, or custom links. |
| `pageUrlOverrides` | Map Notion page IDs to custom URL paths. |

Optional environment variables (documented in [`.env.example`](./.env.example)): Fathom / PostHog analytics, a Twitter token for faster tweet rendering, and Redis credentials for persisting preview images.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js dev server (Turbopack). |
| `pnpm build` | Production build (`next build`). |
| `pnpm start` | Serve the production build. |
| `pnpm test` | Run all quality checks in parallel (see below). |
| `pnpm deploy` | Deploy to Vercel (`vercel deploy`; add `--prod` for a production release). |
| `pnpm deps:link` / `pnpm deps:unlink` | Link / unlink a local `react-notion-x` checkout. |
| `pnpm deps:upgrade` | Upgrade the `react-notion-x` / `notion-*` packages. |

### Code quality

`pnpm test` runs three checks concurrently (via `npm-run-all2`):

- `test:lint` → [`oxlint`](https://oxc.rs) (type-aware through `oxlint-tsgolint`)
- `test:format` → [`oxfmt`](https://oxc.rs) `--check`
- `test:typecheck` → `tsc`

Config lives in [`oxlint.config.ts`](./oxlint.config.ts) and [`oxfmt.config.ts`](./oxfmt.config.ts) (both extend the shared `@fisch0920/config` presets; `oxfmt` ignores generated/vendored paths such as `.qoder/**`).

To fix issues automatically:

```bash
pnpm exec oxfmt         # format all supported files in place
pnpm exec oxlint --fix  # apply safe lint fixes
```

On commit, `simple-git-hooks` + `lint-staged` run `oxfmt` and `oxlint --fix` on staged `*.ts` / `*.tsx` files.

## Project structure

```
site.config.ts   # site-level configuration (see above)
lib/             # Notion data layer: API client, page resolution, site map,
                 #   preview images, image/URL mapping, search, ACL, config
pages/           # Next.js Pages Router: index, [pageId], feed, sitemap.xml,
                 #   robots.txt, 404, and api/* endpoints
components/      # React UI: NotionPage, page header, SEO head, search modal, footer
styles/          # global.css, notion.css (react-notion-x theme overrides), prism-theme.css
public/          # static assets (favicons, manifest, verification files)
```

## Deployment

The site deploys to [Vercel](https://vercel.com). Node 24 and pnpm 10 are pinned via `package.json` (`engines` + `packageManager`), and [`vercel.json`](./vercel.json) schedules a daily cron that calls `/api/indexnow` to keep search engines updated. During `next build`, every public page is fetched from Notion and statically generated; if Notion rate-limits the build (HTTP 429), the app falls back to a cached site map.

## Credits

- [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit) — the starter kit this blog is based on
- [react-notion-x](https://github.com/NotionX/react-notion-x) — the Notion renderer

## License

See the [license](./license) file.
