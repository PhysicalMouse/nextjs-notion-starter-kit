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
| `twitter` / `github` / `linkedin` | 社交账号（改成自己的）/ Social accounts (update to your own) |
| `isPreviewImageSupportEnabled` | 开启 LQIP 预览图（需配合 Redis）/ Enable LQIP preview images (requires Redis) |
| `isRedisEnabled` | 开启 Redis 缓存，在此处切换，**不用环境变量控制** / Enable Redis caching — toggle here, not via env var |
| `isVercelAnalyticsEnabled` | 开启 Vercel Web Analytics / Enable Vercel Web Analytics |
| `isVercelSpeedInsightsEnabled` | 开启 Vercel Speed Insights / Enable Vercel Speed Insights |
| `googleAnalyticsId` | Google Analytics 4 ID（`G-XXXXXXXXXX`）|
| `bingSiteVerification` | Bing 站点验证码 / Bing site verification |
| `googleSiteVerification` | Google 站点验证码 / Google site verification |
| `navigationStyle` | `'default'` 或 `'custom'`（启用自定义导航链接）/ `'default'` or `'custom'` |

### 3. 环境变量 / Environment Variables

私钥和凭证**只**通过环境变量管理，在 Vercel Dashboard 或本地 `.env.development.local` 中配置。

Secrets and credentials are managed **only** via environment variables, configured in Vercel Dashboard or local `.env.development.local`.

| 变量名 / Variable | 必填 / Required | 说明 / Description |
|---|---|---|
| `NOTION_API_TOKEN` | 是 / Yes | Notion 账号的非官方私钥，供 `notion-client` 使用。**不是**官方 Integration Token。在浏览器 DevTools → Application → Cookies 中找到 `token_v2` 字段值复制。<br>The unofficial private key for `notion-client`. **Not** the official Integration Token. Copy the `token_v2` cookie value from browser DevTools → Application → Cookies. |
| `REDIS_URL` | `isRedisEnabled: true` 时必填 | Redis 连接字符串，格式 `rediss://user:pass@host:port`（TLS）或 `redis://user:pass@host:port`<br>Redis connection string, e.g. `rediss://user:pass@host:port` |

> **注意 / Note:** `REDIS_URL` 属于 Sensitive 类型，Vercel CLI 不会将其拉取到本地。请手动添加到 `.env.development.local`，或通过 Vercel Dashboard → Settings → Environment Variables 设置。
>
> `REDIS_URL` is Sensitive — Vercel CLI won't pull it locally. Add it manually to `.env.development.local`, or set it in Vercel Dashboard → Settings → Environment Variables.

---

## Redis 缓存 / Redis Caching

Redis 用于持久化预览图（LQIP）缓存，避免每次部署后重新计算，提升首屏加载速度。

Redis is used to persist LQIP preview image cache across deployments and instances, improving initial load performance.

- 开关在 `site.config.ts` 的 `isRedisEnabled` 字段，不通过环境变量控制
- 连接地址通过 `REDIS_URL` 环境变量注入（唯一需要环境变量的 Redis 配置）
- 本地开发时若 Redis 不可达，会自动回退到内存缓存，不影响开发

- Toggle via `isRedisEnabled` in `site.config.ts` — not controlled by env var
- Connection string injected via `REDIS_URL` env var (the only Redis-related env var needed)
- Local dev falls back to in-memory cache if Redis is unreachable — expected behavior

---

## 本地开发 / Local Development

```bash
pnpm dev
```

开发服务器运行在 http://localhost:3000。

---

## 注意事项 / Notes

- **Notion `token_v2` 是非官方私钥** — 本项目使用 `notion-client` 非官方 API，认证方式是 Notion 账号的 `token_v2` cookie，而非官方 Integration Token（`ntn_xxx`）。两者格式和用途完全不同，请勿混淆。
  This project uses the unofficial `notion-client` API, authenticated with the Notion account's `token_v2` cookie — not the official Integration Token (`ntn_xxx`). Do not confuse the two.

- **官方 Notion API 不兼容** — 渲染层（`react-notion-x`）依赖非官方 API 的 `ExtendedRecordMap` 格式，官方 API 无法还原首页画廊及文章 Tags/Author/Date 等元数据，请勿切换。
  The rendering layer depends on the unofficial API's `ExtendedRecordMap` format. The official API cannot render the homepage gallery or article metadata — do not switch.

- **首页数据量较大** — 首页 Gallery 视图会将所有文章完整数据一次性返回（约 267 kB），这是 `react-notion-x` 架构的固有特性，不影响功能。
  The homepage Gallery returns all articles' full data at once (~267 kB). This is inherent to the `react-notion-x` architecture and does not affect functionality.

- **社交链接需自行更新** — `site.config.ts` 中 `twitter`、`github`、`linkedin` 默认为原项目作者信息，部署前记得改成自己的。
  The `twitter`, `github`, `linkedin` fields in `site.config.ts` default to the original author's info — update them before deploying.
