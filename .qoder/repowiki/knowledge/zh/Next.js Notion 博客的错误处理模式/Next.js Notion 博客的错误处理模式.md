---
kind: error_handling
name: Next.js Notion 博客的错误处理模式
category: error_handling
scope:
    - '**'
source_files:
    - pages/_error.tsx
    - components/ErrorPage.tsx
    - pages/404.tsx
    - components/Page404.tsx
    - lib/notion-api.ts
    - lib/get-config-value.ts
    - lib/config.ts
    - lib/resolve-notion-page.ts
    - pages/[pageId].tsx
    - lib/get-site-map.ts
    - lib/get-tweets.ts
    - lib/preview-images.ts
---

## 1. 使用的系统与方案

该仓库是一个基于 Next.js Pages Router 的博客模板，错误处理主要依赖 Next.js 内置机制与 `notion-client` 的自动重试能力，没有引入第三方错误库（如 `zod`、`class-validator`、自定义 Error 类层次）。

- **页面级错误页**：通过 Next.js 约定的 `pages/_error.tsx` 重定向到 `components/ErrorPage.tsx`，统一展示 HTTP 状态码和静态图片。
- **404 页面**：独立的 `pages/404.tsx` 与 `components/Page404.tsx`，用于未找到资源。
- **运行时错误**：在 `getStaticProps` 中捕获异常后 `console.error` 并重新抛出，让 Next.js 走 `_error.tsx` 流程；同时明确注释“不希望发布错误的页面版本”，因此选择 rethrow 而非降级渲染。
- **外部 API 容错**：`lib/notion-api.ts` 使用 `notion-client` 的 `ofetchOptions.retry` 配置，对 408/429/500/502/503/504 等瞬时错误自动重试 3 次（间隔 500ms），超时 30s，避免单次 Notion API 抖动导致整页失败。

## 2. 关键文件

| 文件 | 职责 |
|---|---|
| `pages/_error.tsx` | Next.js 全局错误页入口，委托给 `ErrorPage` 组件 |
| `components/ErrorPage.tsx` | 渲染通用错误 UI，显示 `statusCode` 与 `/error.png` |
| `pages/404.tsx` | 404 页面入口 |
| `components/Page404.tsx` | 404 页面组件 |
| `lib/notion-api.ts` | 封装 `NotionAPI`，集中配置重试策略与 User-Agent |
| `lib/get-config-value.ts` | 站点配置与环境变量读取，缺失时抛 `Error` |
| `lib/config.ts` | 校验 `rootNotionPageId` 等必填配置，非法则抛 `Error` |
| `lib/resolve-notion-page.ts` | 解析 Notion 页面，找不到时返回 `{ error: { message, statusCode } }` |
| `pages/[pageId].tsx` | 动态路由 `getStaticProps` 中 try/catch 并 rethrow |
| `lib/get-site-map.ts` | 站点地图加载失败抛 `Error('Error loading page ...')` |
| `lib/get-tweets.ts` / `lib/preview-images.ts` / `lib/notion.ts` | 各异步 I/O 分支用 `catch (err: any)` 包裹，记录日志后继续或返回空结果 |

## 3. 架构与约定

### 3.1 分层错误形态

代码中存在两种不同的错误表达形式：

1. **同步配置错误**：在模块顶层或纯函数中直接 `throw new Error(...)`，例如：
   - `lib/config.ts` 第 29 行：`throw new Error('Config error invalid "rootNotionPageId"')`
   - `lib/get-config-value.ts` 第 6、47、68 行：分别针对无效 site.config、缺失必填配置项、缺失必填环境变量抛错
   - `lib/get-site-map.ts` 第 68 行：`throw new Error('Error loading page "' + pageId + '"')`

2. **异步 I/O 错误**：对外部服务（Notion API、缓存 DB、Twitter oEmbed）调用使用 `try/catch (err: any)`，通常 `console.warn` / `console.error` 后返回空值或默认值，而不是向上抛出。典型模式见 `resolve-notion-page.ts` 中对 `db.get` / `db.set` 的 catch（第 39-41、62-64 行），以及 `get-tweets.ts`、`preview-images.ts`、`notion.ts` 中的多处 catch。

### 3.2 404 的特殊处理

`resolveNotionPage` 在找不到 Notion 页面时不抛错，而是返回一个包含 `error.message` 与 `statusCode: 404` 的对象（第 68-73 行），由上层 `NotionPage` 组件根据该字段决定是否渲染 404 视图。这是一种“错误作为数据”的模式，区别于其他路径上的异常传播。

### 3.3 Next.js 构建期错误

`pages/[pageId].tsx` 的 `getStaticProps` 捕获 `resolveNotionPage` 抛出的异常后执行 `console.error('page error', domain, rawPageId, err)`，然后 `throw err`——注释明确说明“不希望发布这个页面的错误版本”，所以交给 Next.js 的增量 SSG 失败流程，而不是降级渲染。

### 3.4 外部依赖容错

`lib/notion-api.ts` 将重试逻辑集中在 `NotionAPI` 构造参数中：
```ts
ofetchOptions: {
  retry: 3,
  retryDelay: 500,
  retryStatusCodes: [408, 429, 500, 502, 503, 504],
  timeout: 30_000,
}
```
这意味着所有通过 `notion` 实例发起的请求都共享同一份重试策略，无需在各调用点重复处理瞬时错误。

## 4. 观察到的约定与约束

- **配置校验一律抛 `Error`**：`lib/config.ts`、`lib/get-config-value.ts` 中所有配置缺失/非法场景均使用 `throw new Error(...)`，错误消息以 `Config error:` 或 `Invalid ...` 前缀开头，便于快速定位。
- **异步 I/O 不冒泡**：除 `getStaticProps` 外，各 lib 模块内部对 Notion API、DB、oEmbed 等调用的错误均以 `catch (err: any)` 吞掉并降级（返回空对象、空数组或 null），保证单条内容失败不影响整站。
- **404 走数据通道**：页面不存在通过返回 `{ error: { message, statusCode } }` 表示，而不是抛错，从而区分“业务上可恢复的不存在”和“真正的异常”。
- **全局错误 UI 单一出口**：所有非 404 的页面级错误最终由 `pages/_error.tsx` → `components/ErrorPage.tsx` 渲染，样式统一来自 `components/styles.module.css`。
- **无自定义 Error 子类**：仓库中没有定义继承 `Error` 的自定义类型（如 `NotFoundError`、`NotionApiError`），也没有统一的错误码枚举；错误信息以字符串字面量传递。
- **日志级别区分**：配置/构建期错误用 `console.error`，运行时可恢复错误用 `console.warn`，体现“不可恢复 vs 可降级”的语义差异。

## 5. 结论

该仓库的错误处理是轻量且务实的：依赖 Next.js 内置错误页与 `notion-client` 的重试能力，配合少量 `throw new Error` 做配置校验，以及对异步 I/O 的 try/catch 降级。没有统一的错误类型系统、中间件层或结构化错误码表，属于典型的中小型 Next.js 项目实践。