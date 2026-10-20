---
kind: external_dependency
name: react-tweet（Twitter/X 推文嵌入）
slug: react-tweet
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
---

Notion Embed 中遇到 tweet 类型时复用 components.Tweet 组件渲染，而非普通 iframe。
- next.config.js 中 transpilePackages 包含 react-tweet，以解决其 ESM/CJS 兼容问题。
- 图片域名 abs.twimg.com、pbs.twimg.com 已列入 next.config.images.remotePatterns。