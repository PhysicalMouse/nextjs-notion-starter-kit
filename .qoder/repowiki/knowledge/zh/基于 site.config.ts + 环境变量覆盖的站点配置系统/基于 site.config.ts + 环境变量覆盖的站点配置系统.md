---
kind: configuration_system
name: 基于 site.config.ts + 环境变量覆盖的站点配置系统
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
    - vercel.json
---

## 1. 采用的方案

该仓库使用一个轻量级的自定义配置层，核心思路是：**TypeScript 配置文件 + 运行时环境变量覆盖**。没有引入第三方配置库（如 dotenv、config-loader），而是通过 `lib/get-config-value.ts` 提供统一的读取 API。

- 站点级配置定义在根目录 `site.config.ts`，由 `lib/site-config.ts` 中的 `SiteConfig` 接口约束类型。
- 运行时通过 `lib/config.ts` 将配置解构为模块级常量导出，供页面与组件消费。
- 环境变量用于覆盖或注入敏感/部署相关值（如 `NEXT_PUBLIC_*`、`VERCEL_URL`）。

## 2. 关键文件

| 文件 | 职责 |
|---|---|
| `site.config.ts` | 站点用户配置入口，声明 `rootNotionPageId`、`name`、`domain`、SEO 校验码、分析 ID、导航等字段 |
| `lib/site-config.ts` | 定义 `SiteConfig` 接口与 `NavigationLink` 类型，并提供 `siteConfig()` 工厂函数（当前仅透传） |
| `lib/get-config-value.ts` | 配置加载核心：合并 `site.config.ts` 与 `NEXT_PUBLIC_SITE_CONFIG` JSON 覆盖，暴露 `getSiteConfig` / `getRequiredSiteConfig` / `getEnv` |
| `lib/config.ts` | 将配置解析为具名导出常量（如 `rootNotionPageId`、`host`、`apiBaseUrl`、`googleAnalyticsId` 等），并做校验与 URL 映射清洗 |
| `.env.example` | 列出可选的环境变量模板（Fathom、PostHog、Twitter、Redis） |
| `next.config.js` | Next.js 构建期配置（图片 remotePatterns、CSP、transpilePackages），不含运行时配置 |
| `vercel.json` | Vercel 部署配置，声明定时任务 cron 调用 `/api/indexnow` |

## 3. 架构与约定

### 3.1 配置来源优先级

`lib/get-config-value.ts` 中按以下顺序合并配置：

1. 从 `../site.config` 导入原始 `rawSiteConfig`；若为空则直接抛错 `Config error: invalid site.config.ts`。
2. 尝试从 `process.env.NEXT_PUBLIC_SITE_CONFIG` 解析 JSON 作为 `siteConfigOverrides`，捕获解析失败并输出 `Invalid config "NEXT_PUBLIC_SITE_CONFIG" failed to parse`。
3. 最终 `siteConfig = { ...rawSiteConfig, ...siteConfigOverrides }`，即 **环境变量覆盖优先于 `site.config.ts`**。

### 3.2 三类读取 API

- `getSiteConfig(key, defaultValue?)` — 返回配置项，不存在时回退到默认值。
- `getRequiredSiteConfig(key)` — 不存在时抛出 `Config error: missing required site config value "${key}"`。
- `getEnv(key, defaultValue?, env?)` — 读取环境变量，在服务端缺失且无默认值时抛错 `Config error: missing required env variable "${key}"`；在前端返回 `null`。

### 3.3 配置项分层

`lib/config.ts` 将配置分为若干逻辑组：

- **必需 Notion 配置**：`rootNotionPageId` 通过 `parsePageId(..., { uuid: false })` 解析，空值抛 `Config error invalid "rootNotionPageId"`；`rootNotionSpaceId` 允许为 null。
- **站点基本信息**：`name`、`author`、`domain`、`description`、`language`（默认 `'en'`）。
- **Notion 展示默认值**：`defaultPageIcon`、`defaultPageCover`、`defaultPageCoverPosition`（默认 `0.5`）。
- **功能开关**：`isPreviewImageSupportEnabled`（默认 `false`）、`includeNotionIdInUrls`（开发环境默认 `true`）、`isSearchEnabled`（默认 `true`）、`navigationStyle`（默认 `'default'`）、`revalidateSeconds`（默认 `3600`）。
- **SEO 与索引**：`googleSiteVerification`、`bingSiteVerification`、`indexNowKey` —— 三者均支持 `site.config.ts` 与对应环境变量（`GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION`、`INDEXNOW_KEY`）双源覆盖。
- **分析集成**：`googleAnalyticsId`（同时支持 `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`）、`clarityId`、`isVercelAnalyticsEnabled`、`isVercelSpeedInsightsEnabled`、`fathomId`/`fathomConfig`、`posthogId`/`posthogConfig`。
- **URL 映射**：`pageUrlOverrides` 与 `pageUrlAdditions` 经 `cleanPageUrlMap` 校验（要求 URI 以 `/` 开头、值为有效 Notion UUID），并生成反向映射 `inversePageUrlOverrides`。
- **运行时 URL**：`port`（来自 `PORT`，默认 `3000`）、`host`（开发用 `http://localhost:${port}`，生产用 `https://${domain}`）、`apiHost`（开发同 host，生产取 `VERCEL_URL` 或 `domain`）、`apiBaseUrl = '/api'`。

### 3.4 环境变量命名约定

- 前端可访问变量统一以 `NEXT_PUBLIC_` 前缀（如 `NEXT_PUBLIC_FATHOM_ID`、`NEXT_PUBLIC_POSTHOG_ID`、`NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`、`NEXT_PUBLIC_SITE_CONFIG`）。
- 服务端专用变量无前缀（如 `PORT`、`VERCEL_URL`、`REDIS_HOST`、`REDIS_PASSWORD`、`REDIS_USER`、`REDIS_NAMESPACE`、`TWITTER_ACCESS_TOKEN`）。
- SEO 校验码使用平台标准变量名：`GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION`、`INDEXNOW_KEY`。

### 3.5 类型安全

所有站点配置字段在 `lib/site-config.ts` 的 `SiteConfig` 接口中声明，`site.config.ts` 传入的对象受 TypeScript 类型检查约束。`lib/config.ts` 对每个导出的配置常量都做了显式类型标注（如 `string`、`boolean`、`number`、`string | null`），并在解析阶段进行运行时校验（如 Notion Page ID 格式、URI 必须以 `/` 开头）。

## 4. 约定与约束

- **`site.config.ts` 必须存在且非空**：`lib/get-config-value.ts` 启动时检查 `!rawSiteConfig` 并抛错。
- **`rootNotionPageId` 是必填项**：`lib/config.ts` 对其执行 `parsePageId(..., { uuid: false })`，结果为空则抛 `Config error invalid "rootNotionPageId"`。
- **`name`、`author`、`domain` 是必填项**：通过 `getRequiredSiteConfig` 读取，缺失时抛 `Config error: missing required site config value "..."`。
- **`pageUrlOverrides` / `pageUrlAdditions` 的值必须是有效的 Notion UUID**：`cleanPageUrlMap` 中 `parsePageId(pageId, { uuid: false })` 失败会抛 `Invalid ${label} page id "..."`。
- **`pageUrlOverrides` / `pageUrlAdditions` 的 key 必须是相对路径且以 `/` 开头**：否则抛 `Invalid ${label} value for page "...": value "..." should be a relative URI that starts with "/"`。
- **服务端的必需环境变量不可省略**：`getEnv` 在服务端缺失且无默认值时抛 `Config error: missing required env variable "..."`。
- **`NEXT_PUBLIC_SITE_CONFIG` 必须是合法 JSON**：解析失败抛 `Invalid config "NEXT_PUBLIC_SITE_CONFIG" failed to parse`。
- **SEO 校验码与 IndexNow key 支持双源覆盖**：优先取 `site.config.ts`，再 fallback 到同名环境变量（`GOOGLE_SITE_VERIFICATION`、`BING_SITE_VERIFICATION`、`INDEXNOW_KEY`）。
- **Next.js 构建期配置集中在 `next.config.js`**：只包含 `staticPageGenerationTimeout`、`images.remotePatterns`、`images.contentSecurityPolicy`、`transpilePackages`，不包含运行时业务配置。
- **Vercel 部署配置集中在 `vercel.json`**：仅声明 `crons` 定时任务（每天 03:00 触发 `/api/indexnow`），不承载应用配置。

## 5. 总结

该配置系统的核心特征是：**单一 TypeScript 配置文件 (`site.config.ts`) 作为事实来源，配合 `NEXT_PUBLIC_SITE_CONFIG` 环境变量实现部署期覆盖，并通过 `lib/get-config-value.ts` 提供的三个统一 API 完成取值与校验。** 所有站点级开关、SEO 信息、分析 ID、ISR 重验证间隔、导航样式等均走此通道，保证了类型安全与一致的错误处理语义。