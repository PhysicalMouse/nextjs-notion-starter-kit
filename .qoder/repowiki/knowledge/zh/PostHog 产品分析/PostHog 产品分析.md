---
kind: external_dependency
name: PostHog 产品分析
slug: posthog
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - site.config.ts
---

### PostHog
- 角色：可选的产品分析 SDK（`posthog-js`），通过环境变量启用，与 Fathom、Clarity、Vercel Analytics 并存。