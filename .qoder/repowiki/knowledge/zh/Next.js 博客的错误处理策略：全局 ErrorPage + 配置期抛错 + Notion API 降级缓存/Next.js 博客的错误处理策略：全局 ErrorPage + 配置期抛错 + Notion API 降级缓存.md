---
kind: error_handling
name: Next.js 博客的错误处理策略：全局 ErrorPage + 配置期抛错 + Notion API 降级缓存
category: error_handling
scope:
    - '**'
source_files:
    - pages/_error.tsx
    - components/ErrorPage.tsx
    - lib/get-config-value.ts
    - lib/config.ts
    - lib/notion-api.ts
    - lib/notion.ts
    - lib/get-tweets.ts
    - lib/get-social-image-url.ts
    - lib/preview-images.ts
---

## 1. 使用的系统与框架

- **Next.js Pages Router** 的内置错误机制：`pages/_error.tsx` 作为全局错误页面，委托给 `components/ErrorPage.tsx`。
- **notion-client** 的 `ofetchOptions.retry` 自动重试（408/429/500/502/503/504），用于屏蔽 Notion API 瞬态故障。
- **Node.js 原生 `try/catch`** 与 `throw new Error(...)`，没有引入第三方错误库（如 `zod`、`ts-error`、自定义 Error 子类）。
- 无中间件层（middleware）、无 panic/recover（JS 环境不适用）、无统一错误码枚举。

## 2. 关键文件

- `pages/_error.tsx` — Next.js 全局错误页入口，仅做 re-export。
- `components/ErrorPage.tsx` — 渲染通用错误 UI，展示 `statusCode` 和 `/error.png`。
- `lib/get-config-value.ts` — 统一的站点配置读取器，集中抛出配置类错误。
- `lib/config.ts` — 站点级配置校验，在模块加载时验证必填字段。
- `lib/notion-api.ts` — 封装 `NotionAPI`，配置自动重试与超时。
- `lib/notion.ts` — Notion 数据获取层，实现内存缓存与 stale-while-revalidate 降级。
- `lib/get-tweets.ts`、`lib/get-social-image-url.ts`、`lib/preview-images.ts` — 外部依赖调用处的 try/catch 容错点。

## 3. 架构与约定

### 3.1 运行时错误 → 全局 ErrorPage

`pages/_error.tsx` 直接 `export { ErrorPage as default } from '@/components/ErrorPage'`，将未捕获的 Next.js 路由错误统一交给 `ErrorPage` 组件渲染。`ErrorPage` 接收 `statusCode` 并显示 "Error Loading Page" 标题及错误图片，不做日志记录或上报。

### 3.2 配置期错误：启动即失败

`lib/get-config-value.ts` 提供三个入口函数：
- `getSiteConfig(key, defaultValue?)` — 返回可选值。
- `getRequiredSiteConfig(key)` — 缺失时 `throw new Error('Config error: missing required site config value "${key}"')`。
- `getEnv(key, defaultValue?, env)` — 服务端缺失必填环境变量时 `throw new Error('Config error: missing required env variable "${key}"')`。

`lib/config.ts` 在模块顶层调用这些函数校验 `rootNotionPageId`、`name`、`author`、`domain` 等必填项；`cleanPageUrlMap` 对 `pageUrlOverrides` / `pageUrlAdditions` 中的 pageId、URI 格式进行校验，任一不合法即 `throw new Error(...)`。这类错误发生在模块加载阶段，导致构建/启动失败，属于“配置即契约”的 fail-fast 策略。

### 3.3 Notion API 错误：重试 + 降级缓存

`lib/notion-api.ts` 通过 `ofetchOptions.retry: 3`、`retryDelay: 500`、`retryStatusCodes: [408, 429, 500, 502, 503, 504]`、`timeout: 30_000` 让底层网络请求自动重试瞬态错误，避免单次 Notion 抖动导致页面崩溃。

`lib/notion.ts` 的 `getPage(pageId)` 实现核心降级逻辑：
1. 优先返回内存缓存（TTL 60s）。
2. 调用 `notion.getPage(pageId)`，若失败则尝试返回 `getStaleCached(pageId)`（过期但可用的旧数据），并通过 `console.warn` 记录原因后返回。
3. 若无缓存可回退，则重新抛出原始错误，交由 Next.js 全局 `_error.tsx` 处理。
4. `fixCollectionQueries` 中每个 collection 查询单独 try/catch，使用 `console.warn` 记录后继续处理其他集合，保证单个集合失败不影响整页渲染。

### 3.4 可选外部依赖的静默容错

`lib/get-tweets.ts`、`lib/get-social-image-url.ts`、`lib/preview-images.ts` 中对 Twitter oEmbed、Social Image 生成、预览图抓取等可选功能使用 try/catch 包裹，失败时仅 `console.error` / `console.warn` 后返回空结果，不阻断主流程。

## 4. 观察到的约定与约束

- **配置校验集中在 `lib/get-config-value.ts` 与 `lib/config.ts`**：所有站点配置与必填环境变量都通过 `getRequiredSiteConfig` / `getEnv` 访问，缺失时以 `Config error:` 前缀的 `Error` 抛出，便于快速定位配置问题。
- **No custom error types**：代码全部使用原生 `Error`，没有定义自定义错误类、错误码常量或错误分类体系。
- **无全局异常处理器**：除了 Next.js 内置的 `_error.tsx`，没有 `unhandledRejection` / `uncaughtException` 监听器，也没有 Sentry、LogRocket 等上报 SDK。
- **外部 I/O 采用 try/catch + console.warn/error 降级**：Notion API 调用、Twitter 抓取、预览图生成等异步操作均被 try/catch 包裹，失败时记录日志并返回降级结果，而非向上抛出。
- **重试策略下沉到 notion-client**：通过 `ofetchOptions` 配置自动重试，而不是在业务层手动 retry 循环。
- **缓存作为最终兜底**：`PAGE_CACHE_TTL_MS = 60_000` 的内存缓存既是性能优化，也是 Notion 不可用时的可用性保障（stale-while-revalidate 模式）。
- **无 panic/recover**：JavaScript 环境中不存在该概念，也未见 `process.on('uncaughtException', ...)` 之类的进程级异常钩子。
- **无中间件错误处理**：项目基于 Pages Router，未使用 App Router 的 middleware，因此不存在中间件链式错误传播。

## 5. 总结

该仓库的错误处理是轻量且分层清晰的：**配置期**通过 `throw new Error` 实现 fail-fast，**运行时**由 Next.js `_error.tsx` 提供统一错误页面，**外部依赖**（Notion/Twitter/预览图）通过 try/catch 降级与日志记录保持站点可用，**网络层**借助 notion-client 的 ofetch 重试屏蔽瞬态故障。整体没有引入第三方错误库或复杂错误类型系统，遵循了最小化依赖、就近容错的工程风格。