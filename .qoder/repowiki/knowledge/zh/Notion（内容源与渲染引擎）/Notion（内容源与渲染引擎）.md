---
kind: external_dependency
name: Notion（内容源与渲染引擎）
slug: notion
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

- rootNotionPageId 在 site.config.ts 中硬编码，作为站点根页；可选的 rootNotionSpaceId 用于限制单一 workspace。
- 构建期并发预拉取所有页面，会触发 Notion API 429 限流，需加重试退避（已在实现中补充）。
- 图片资源域名已列入 next.config.images.remotePatterns：www.notion.so、notion.so、s3.us-west-2.amazonaws.com。
- 除 Notion 外无其他 CMS/CDN 依赖。