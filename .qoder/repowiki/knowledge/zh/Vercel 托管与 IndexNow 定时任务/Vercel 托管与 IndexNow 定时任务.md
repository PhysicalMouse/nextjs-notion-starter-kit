---
kind: external_dependency
name: Vercel 托管与 IndexNow 定时任务
slug: vercel
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
source_files:
    - vercel.json
    - package.json
---

### Vercel
- 角色：生产部署平台；`pnpm deploy` 即 `vercel deploy`。
- 运行环境：Node 24 + pnpm 10（由 `engines` 与 `packageManager` 字段锁定）。