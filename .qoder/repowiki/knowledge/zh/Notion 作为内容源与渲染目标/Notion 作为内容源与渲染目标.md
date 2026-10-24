---
kind: external_dependency
name: Notion 作为内容源与渲染目标
slug: notion
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
source_files:
    - site.config.ts
    - lib/notion.ts
    - lib/notion-api.ts
    - vercel.json
---

### Notion
- 角色：本项目的唯一内容来源；所有页面在 `next build` 时通过 `notion-client` 拉取并静态生成（ISR，默认 `revalidateSeconds=86400`）。
- 集成点：`rootNotionPageId` 硬编码在 `site.config.ts`；页面解析走 `lib/resolve-notion-page.ts`，API 调用封装在 `lib/notion.ts` / `lib/notion-api.ts`。
- 部署：Vercel 上通过 `vercel.json` 的 cron 每日调用 `/api/indexnow` 通知搜索引擎更新。