---
kind: external_dependency
name: Twitter/X 推文嵌入
slug: react-tweet
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - components/NotionEmbed.tsx
---

### react-tweet
- 角色：在 `NotionEmbed` 中复用 `components.Tweet` 渲染 Twitter/X 推文，替代通用 iframe 方案。