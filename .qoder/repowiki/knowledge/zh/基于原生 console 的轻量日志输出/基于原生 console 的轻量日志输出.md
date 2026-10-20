---
kind: logging_system
name: 基于原生 console 的轻量日志输出
category: logging_system
scope:
    - '**'
source_files:
    - lib/get-site-map.ts
    - lib/notion.ts
    - lib/preview-images.ts
    - lib/resolve-notion-page.ts
    - lib/get-tweets.ts
    - lib/get-social-image-url.ts
    - lib/get-config-value.ts
    - pages/[pageId].tsx
    - pages/index.tsx
    - pages/api/search-notion.ts
    - pages/api/search-index.ts
    - pages/api/indexnow.ts
---

## 概述

本仓库未引入任何第三方日志框架（如 winston、pino、bunyan、log4js 等），也没有独立的 `lib/logger.ts`、`log/` 或 `logging/` 目录。整个 Next.js + Notion 博客站点在运行时统一使用 Node.js 原生的 `console.log` / `console.warn` / `console.error` 进行日志输出，由运行环境（Vercel、Node）直接打印到标准输出。

## 关键文件与分布

日志调用散落在数据层与页面路由中：

- `lib/get-site-map.ts` — 构建站点地图时 `console.log` 输出当前处理的 pageId，`console.warn` 记录重复 canonical id。
- `lib/notion.ts` — Notion API 调用失败时 `console.warn` 输出错误上下文。
- `lib/preview-images.ts`、`lib/resolve-notion-page.ts`、`lib/get-tweets.ts` — Redis 缓存 get/set 失败时统一用 `console.warn('cache error ...' | 'redis error ...', err.message)` 输出。
- `lib/get-social-image-url.ts`、`lib/get-config-value.ts` — 配置解析失败或 URL 无效时用 `console.warn` / `console.error` 输出。
- `pages/[pageId].tsx`、`pages/index.tsx` — 页面渲染异常时 `console.error('page error', domain, err)`。
- `pages/api/*.ts` — API 路由内部用 `console.log` 记录请求参数与结果（如 `search-notion.ts` 的 `<<< lambda search-notion` / `>>> lambda search-notion`），用 `console.error` 记录失败原因。

## 架构与约定

1. **无集中式 logger**：没有统一的初始化入口、logger 实例或中间件；每个模块自行调用 `console.*`。
2. **无结构化字段**：日志消息以字符串拼接为主，偶尔附带对象字面量（如 `{ url, cacheKey }`、`{ message }`），但没有统一的字段命名规范（如 `level`、`service`、`traceId`）。
3. **无日志级别策略**：仅依赖 `console.log` / `console.warn` / `console.error` 三个语义级别，没有可配置的 level 开关（如 DEBUG/INFO/WARN/ERROR）。
4. **无 sink 抽象**：日志直接写入 stdout/stderr，没有文件、远程收集器、采样或过滤逻辑。
5. **调试型日志**：部分 `console.log` 用于开发期调试（如 `get-site-map.ts` 中的 `notion getPage`、`search-notion.ts` 的请求/响应回显），在生产环境中仍会输出。

## 约束与规则

- 仓库中没有定义任何日志相关的 ESLint/Prettier 规则来强制或禁止 `console.*` 的使用。
- 没有 `.env` 变量控制日志级别或输出目标。
- 由于是静态生成的 Next.js 站点并部署在 Vercel 上，日志最终由 Vercel Functions 控制台消费，不存在自定义 sink 的配置点。

总结：该项目的“日志系统”就是裸用的 Node.js `console` API，属于最轻量的实现方式，适合个人博客类项目，但不具备企业级日志的结构化、分级、采集与可观测性能力。