---
kind: logging_system
name: 基于原生 console 的轻量日志输出
category: logging_system
scope:
    - '**'
source_files:
    - lib/get-site-map.ts
    - lib/get-tweets.ts
    - lib/preview-images.ts
    - lib/resolve-notion-page.ts
    - lib/notion.ts
    - lib/get-social-image-url.ts
    - lib/get-config-value.ts
    - pages/[pageId].tsx
    - pages/index.tsx
    - pages/api/search-notion.ts
    - pages/api/indexnow.ts
    - pages/api/search-index.ts
---

## 概述

本仓库没有引入任何第三方日志框架（如 winston、pino、bunyan、log4js 等），也没有独立的 `lib/logger.ts` 或 `lib/logging/` 模块。所有日志输出均直接使用 Node.js / Vercel 运行时提供的原生 `console.log`、`console.warn`、`console.error`，由 Next.js 在开发时输出到终端，在生产部署到 Vercel 后进入云函数日志。

## 关键文件与分布

- `lib/get-site-map.ts`：使用 `console.log` 打印 Notion API 调用信息，使用 `console.warn` 报告重复 canonical page id。
- `lib/get-social-image-url.ts`：使用 `console.warn` 记录无效 OG 图片 URL。
- `lib/get-tweets.ts`：对 Redis 缓存 get/set 失败及推文获取失败统一用 `console.warn` 输出错误消息。
- `lib/preview-images.ts`：对 LQIP 缓存操作与预览图生成失败使用 `console.warn`，并用 `console.log` 输出缓存命中结果。
- `lib/resolve-notion-page.ts`：对 Redis 缓存 get/set 失败使用 `console.warn`。
- `lib/notion.ts`：对 Notion API 请求失败使用 `console.warn`。
- `lib/get-config-value.ts`：对解析失败的站点配置使用 `console.error`。
- `pages/[pageId].tsx`、`pages/index.tsx`：页面渲染异常通过 `console.error` 输出 domain 与错误对象。
- `pages/api/search-notion.ts`：使用 `console.log` 打印 Lambda 搜索请求与响应（调试用途）。
- `pages/api/indexnow.ts`、`pages/api/search-index.ts`：API 路由错误通过 `console.error` 输出。

## 架构与约定

1. **无中心化 logger**：不存在统一的 logger 初始化、配置或中间件；每个需要输出的模块直接调用 `console.*`。
2. **按语义选择级别**：
   - `console.error`：用于不可恢复的错误（配置解析失败、页面渲染异常、API 提交失败）。
   - `console.warn`：用于可恢复的异常路径（Redis 缓存读写失败、Notion API 降级、无效输入）。
   - `console.log`：用于调试追踪（Notion API 调用、Lambda 请求/响应、LQIP 缓存命中）。
3. **结构化字段有限**：仅在少数位置使用对象字面量作为第二个参数（如 `{ ...result.metadata, url, cacheKey }`、`{ error: err.message }`），但没有统一的字段命名规范（如 `level`、`service`、`traceId`）。
4. **无日志开关**：没有根据环境变量（如 `NODE_ENV`、`DEBUG`）控制日志级别的逻辑，生产环境同样输出这些日志。
5. **无日志聚合/转储**：没有将日志写入文件、发送到外部服务（Sentry、Datadog、CloudWatch）的代码。

## 约束与规则

- 仓库中未发现强制性的 lint 规则禁止裸 `console.*` 调用（`oxlint.config.ts`、`eslint` 配置未体现相关限制）。
- 日志输出是纯副作用，没有任何测试断言覆盖日志行为。
- 由于完全依赖 `console.*`，日志格式与输出目标由运行环境决定（Next.js dev server 控制台 vs Vercel Functions 日志），应用层不对其进行格式化或路由。

综上，该项目的“日志系统”就是裸 `console.*` 调用的集合，没有抽象层、没有结构化 schema、没有级别策略配置文件，属于最小实现。