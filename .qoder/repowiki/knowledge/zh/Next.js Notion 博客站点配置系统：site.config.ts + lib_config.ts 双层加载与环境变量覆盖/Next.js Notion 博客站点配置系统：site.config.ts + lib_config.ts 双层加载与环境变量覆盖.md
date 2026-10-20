---
kind: configuration_system
name: Next.js Notion 博客站点配置系统：site.config.ts + lib/config.ts 双层加载与环境变量覆盖
category: configuration_system
scope:
    - '**'
source_files:
    - site.config.ts
    - lib/site-config.ts
    - lib/get-config-value.ts
    - lib/config.ts
    - .env.example
    - next.config.js
---

## 1. 使用的系统与方案

本项目没有引入外部配置框架（如 dotenv、configstore、yup），而是基于 Next.js Pages Router 自行实现了一个轻量级的「源码文件 + 环境变量」双层配置系统，核心由三个文件组成：

- `site.config.ts`：站点级业务配置（Notion page id、域名、SEO、分析 ID、导航等）。
- `lib/site-config.ts`：`SiteConfig` TypeScript 接口定义与一个透传工厂函数 `siteConfig(config)`，用于约束配置字段类型。
- `lib/get-config-value.ts`：运行时配置加载器，负责合并 `site.config.ts` 与 `NEXT_PUBLIC_SITE_CONFIG` 环境变量，并提供 `getSiteConfig` / `getRequiredSiteConfig` / `getEnv` 三个访问器。
- `lib/config.ts`：聚合层，从上述加载器导出所有被模块消费的配置常量（domain、name、api 路由、SEO verification codes、analytics IDs、ISR revalidateSeconds 等）。

此外，`.env.example` 列出可选的环境变量（Fathom、PostHog、Twitter、Redis），`next.config.js` 中硬编码了 Next.js 自身的构建期配置（remotePatterns、transpilePackages、staticPageGenerationTimeout）。不依赖 `.env` 文件本身——项目未使用 `dotenv`，环境变量通过 Vercel/Next.js 注入。

## 2. 关键文件

- `site.config.ts` — 站点业务配置入口，默认导出 `siteConfig({...})`。
- `lib/site-config.ts` — `SiteConfig` 接口与 `NavigationLink` 类型。
- `lib/get-config-value.ts` — 配置合并与取值工具。
- `lib/config.ts` — 对外暴露的聚合配置对象。
- `.env.example` — 可选环境变量清单。
- `next.config.js` — Next.js 构建期配置。

## 3. 架构与约定

### 3.1 两层加载顺序

`lib/get-config-value.ts` 在模块初始化时执行以下逻辑：

1. 同步 import `../site.config`（即 `site.config.ts`）。
2. 如果 `process.env.NEXT_PUBLIC_SITE_CONFIG` 存在，则 `JSON.parse` 为 `SiteConfig` 并作为覆盖层。
3. 最终 `siteConfig = { ...rawSiteConfig, ...siteConfigOverrides }`，后者覆盖前者同名键。
4. 若 `rawSiteConfig` 为空，直接抛错 `Config error: invalid site.config.ts`。

这意味着：**`NEXT_PUBLIC_SITE_CONFIG` 是运行时 JSON 字符串形式的覆盖层，优先级高于 `site.config.ts`**。

### 3.2 三类配置访问器

| 函数 | 行为 | 用途 |
|---|---|---|
| `getSiteConfig(key, defaultValue?)` | 从合并后的 `siteConfig` 取键；不存在则返回 `defaultValue` | 可选配置项 |
| `getRequiredSiteConfig(key)` | 同上，但缺失时抛错 `Config error: missing required site config value "..."` | 必填配置项（如 `name`、`author`、`domain`、`rootNotionPageId`） |
| `getEnv(key, defaultValue?, env=process.env)` | 读取环境变量；服务端缺失且无默认值时抛错 `Config error: missing required env variable "..."`；浏览器端返回 `null` | 环境变量读取 |

### 3.3 配置分层职责

- `site.config.ts`：纯数据，描述站点元信息、Notion 根页面、SEO verification code、分析 ID、ISR revalidateSeconds、导航样式等。注释明确标注哪些是 required / optional。
- `lib/config.ts`：消费层，调用 `getSiteConfig` / `getRequiredSiteConfig` / `getEnv` 把配置转换为具名导出常量，并对部分字段做转换与校验：
  - `rootNotionPageId` 通过 `notion-utils.parsePageId(..., { uuid: false })` 解析，失败抛错 `Config error invalid "rootNotionPageId"`。
  - `pageUrlOverrides` / `pageUrlAdditions` 经 `cleanPageUrlMap` 校验：每个值必须是有效 UUID，key 必须是以 `/` 开头的相对 URI，否则抛错。
  - SEO verification codes（Google/Bing/IndexNow）、analytics IDs 支持「site.config.ts 优先，环境变量回退」模式：例如 `googleSiteVerification` 先读 `getSiteConfig('googleSiteVerification')`，再 fallback 到 `getEnv('GOOGLE_SITE_VERIFICATION')`。
  - 构造 `api` 对象汇总 API 路由基地址：`/api/search-notion`、`/api/search-index`、`/api/notion-page-info`、`/api/social-image`。
  - 根据 `isDev`（`NODE_ENV === 'development'`）决定 `includeNotionIdInUrls` 默认值、Fathom 是否启用等。

### 3.4 环境变量命名约定

- 客户端可见变量以 `NEXT_PUBLIC_` 前缀（如 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`、`NEXT_PUBLIC_FATHOM_ID`、`NEXT_PUBLIC_POSTHOG_ID`）。
- 服务端专用变量无前缀（如 `REDIS_HOST`、`REDIS_PASSWORD`、`TWITTER_ACCESS_TOKEN`、`VERCEL_URL`、`PORT`）。
- `NEXT_PUBLIC_SITE_CONFIG` 是一个特殊的 JSON 字符串覆盖层，可整体替换 `site.config.ts` 中的同名字段。

### 3.5 构建期 vs 运行期

- `next.config.js` 是 Next.js 构建期配置，不涉及应用运行时配置。
- `site.config.ts` 在编译时被打包进产物（因为它是 TS 源文件），并通过 `NEXT_PUBLIC_SITE_CONFIG` 在部署时覆盖。
- `lib/config.ts` 中 `isServer = typeof window === 'undefined'` 用于区分服务端/客户端环境，影响 `getEnv` 的行为与服务端 URL 拼接。

## 4. 约定与约束

### 观察到的约定（descriptive）

- 站点业务配置统一放在根目录 `site.config.ts`，并由 `lib/site-config.ts` 中的 `SiteConfig` 接口约束字段类型。
- 所有对配置的读取都经过 `lib/config.ts` 导出的具名常量，而不是直接 import `site.config.ts`。
- 可选配置使用 `getSiteConfig(key, default)`；必填配置使用 `getRequiredSiteConfig(key)`。
- 环境变量统一通过 `getEnv(key, default)` 读取，避免裸 `process.env.X`。
- SEO verification code 与分析 ID 采用「site.config.ts 优先，环境变量回退」的双源模式。
- `.env.example` 仅作为文档，不包含实际值；项目不依赖 `dotenv` 包。

### 真正被代码强制的规则（enforced）

1. **`site.config.ts` 必须存在且非空**：`lib/get-config-value.ts` 在模块顶层检查 `if (!rawSiteConfig) throw new Error(...)`。
2. **`rootNotionPageId` 是必填且必须是有效 Notion Page ID**：`lib/config.ts` 用 `parsePageId(..., { uuid: false })` 解析后校验，失败抛 `Config error invalid "rootNotionPageId"`。
3. **`name`、`author`、`domain` 是必填**：通过 `getRequiredSiteConfig` 读取，缺失抛 `Config error: missing required site config value "..."`。
4. **`pageUrlOverrides` / `pageUrlAdditions` 的值必须是有效 UUID，key 必须是 `/` 开头的相对路径**：`cleanPageUrlMap` 中对非法值抛错，消息包含具体 label、pageId、uri。
5. **服务端缺失的必需环境变量会抛错**：`getEnv` 在服务端（`isServer` 为真）且无默认值时抛 `Config error: missing required env variable "..."`。
6. **`NEXT_PUBLIC_SITE_CONFIG` 必须是合法 JSON**：`JSON.parse` 失败时捕获并输出 `Invalid config "NEXT_PUBLIC_SITE_CONFIG" failed to parse` 后重新抛出。
7. **SEO verification codes 与分析 ID 可通过环境变量覆盖**：`lib/config.ts` 显式提供 `GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION`、`INDEXNOW_KEY`、`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` 等回退路径。
8. **Next.js 构建期 remotePatterns 白名单固定**：`next.config.js` 中只允许 `notion.so`、`www.notion.so`、`images.unsplash.com`、`abs.twimg.com`、`pbs.twimg.com`、`s3.us-west-2.amazonaws.com` 作为远程图片来源。