---
kind: external_dependency
name: Vercel（部署平台与内置分析）
slug: vercel
category: external_dependency
category_hints:
    - vendor_identity
    - client_constraint
scope:
    - '**'
---

项目通过 vercel deploy 脚本与 vercel.json 配置部署到 Vercel。
- vercel.json 定义了一个 cron：每天 03:00 调用 /api/indexnow 推送 IndexNow 索引。
- 默认启用 @vercel/analytics 与 @vercel/speed-insights（由 site.config.ts 中的 isVercelAnalyticsEnabled / isVercelSpeedInsightsEnabled 控制）。
- 生产构建运行于 Vercel Edge Functions，需考虑 Notion API 429 限流与函数超时（staticPageGenerationTimeout=300）。