# PhysicalMouse's Blog

基于 [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit) 构建的个人博客，使用 Notion 作为 CMS，部署在 Vercel。

A personal blog built on [nextjs-notion-starter-kit](https://github.com/transitive-bullshit/nextjs-notion-starter-kit), using Notion as the CMS and deployed on Vercel.

- Live: https://blog.cfambor.fun

---

## 快速配置 / Quick Setup

### 1. 克隆并安装 / Clone & Install

```bash
git clone https://github.com/PhysicalMouse/nextjs-notion-starter-kit
cd nextjs-notion-starter-kit
pnpm install
```

### 2. 站点配置 / Site Config

所有站点级配置在 `site.config.ts` 中管理，**不使用环境变量**管理这些配置项。

All site-level configuration is managed in `site.config.ts`. Do **not** use environment variables for these settings.

| 字段 / Field | 说明 / Description |
|---|---|
| `rootNotionPageId` | Notion 根页面 ID（必填）/ Root Notion page ID (required) |
| `name` | 站点名称 / Site name |
| `domain` | 部署域名 / Deployed domain |
| `author` | 作者名 / Author name |
| `description` | SEO 描述 / SEO description |
| `isPreviewImageSupportEnabled` | 开启 LQIP 预览图（需配合 Redis）/ Enable LQIP preview images (requires Redis) |
| `isRedisEnabled` | 开启 Redis 缓存 / Enable Redis caching |
| `googleAnalyticsId` | Google Analytics 4 ID |
| `bingSiteVerification` | Bing 站点验证码 / Bing site verification |
| `googleSiteVerification` | Google 站点验证码 / Google site verification |
| `navigationStyle` | `'default'` 或 `'custom'`（自定义导航链接）|

### 3. 环境变量 / Environment Variables

私钥和凭证**只**通过环境变量管理，在 Vercel Dashboard 或本地 `.env.development.local` 中配置。

Secrets and credentials are managed **only** via environment variables, set in Vercel Dashboard or local `.env.development.local`.

| 变量名 / Variable | 必填 / Required | 说明 / Description |
|---|---|---|
| `NOTION_API_TOKEN` | 是 / Yes | Notion 账号的非官方 `token_v2` cookie 值（用于 `notion-client` 非官方 API）。在浏览器开发者工具的 Cookies 中找到 `token_v2` 字段复制。<br>The unofficial `token_v2` cookie from your Notion account (used by `notion-client`). Find it in browser DevTools → Application → Cookies → `token_v2`. |
| `REDIS_URL` | Redis 启用时必填 / Required if Redis enabled | Redis 连接字符串，格式 `rediss://user:pass@host:port` |

> **注意 / Note:** `REDIS_URL` 属于 Sensitive 类型，Vercel CLI 不会将其拉取到本地环境。请手动添加到 `.env.development.local`（本地开发），或通过 Vercel Dashboard 设置（生产/预览）。
>
> `REDIS_URL` is marked as Sensitive in Vercel and won't be pulled by the CLI. Add it manually to `.env.development.local` for local dev, or set it in the Vercel Dashboard for production/preview.

---

## Redis 缓存 / Redis Caching

Redis 用于持久化预览图（LQIP）缓存，避免每次部署后重新计算。

Redis is used to persist LQIP preview image cache across deployments and instances.

- 开关在 `site.config.ts` 的 `isRedisEnabled` 字段
- 连接地址通过 `REDIS_URL` 环境变量注入
- 本地开发时沙盒网络无法直连外部 Redis，会自动回退到内存缓存，不影响开发

- Toggle via `isRedisEnabled` in `site.config.ts`
- Connection string injected via `REDIS_URL` env var
- Local dev will fall back to in-memory cache if Redis is unreachable — this is expected behavior

---

## 本地开发 / Local Development

```bash
pnpm dev
```

开发服务器运行在 http://localhost:3000。

---

## 注意事项 / Notes

- **Notion 页面需共享给 Integration** — 在 Notion 中将根页面及所有子页面 share 给你的 Integration，否则 API 无法读取内容。
  All Notion pages must be shared with the Integration, otherwise the API cannot read them.

- **官方 Notion API 不兼容** — 本项目渲染层（`react-notion-x`）依赖非官方 Notion API 的 `ExtendedRecordMap` 数据格式，官方 API 无法完整还原首页画廊及文章元数据（Tags/Author/Date），请勿切换。
  The rendering layer relies on the unofficial Notion API. The official API cannot fully render the homepage gallery or article metadata — do not switch.

- **首页数据量较大** — 首页 Gallery 视图会将所有文章的完整数据一次性返回（约 267 kB），这是 `react-notion-x` 架构的固有特性，不影响功能。
  The homepage Gallery view returns all articles' full data at once (~267 kB). This is inherent to the `react-notion-x` architecture and does not affect functionality.

- **分支说明** — `main` 为生产分支，`移动到cloudflare` 为 Cloudflare 迁移实验分支。
  `main` is the production branch. `移动到cloudflare` is an experimental branch for Cloudflare migration.
