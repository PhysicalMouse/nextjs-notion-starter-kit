---
kind: external_dependency
name: IndexNow 搜索引擎即时索引
slug: indexnow
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
source_files:
    - pages/api/indexnow.ts
    - vercel.json
    - site.config.ts
---

### IndexNow
- 角色：向 Bing/Yandex 推送站点更新，`indexNowKey` 配置在 `site.config.ts`，匹配文件 `public/<key>.txt` 已随仓库提交。
- 集成点：`vercel.json` 的 cron 每日 03:00 调用 `/api/indexnow`。