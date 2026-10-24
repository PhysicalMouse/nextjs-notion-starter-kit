---
kind: external_dependency
name: react-notion-x 渲染框架与扩展方式
slug: react-notion-x
category: external_dependency
category_hints:
    - framework_behavior
    - sdk_real_api
scope:
    - '**'
source_files:
    - components/NotionPage.tsx
    - components/NotionCode.tsx
    - components/NotionEmbed.tsx
    - components/NotionCollection.tsx
    - components/NotionCalendar.tsx
    - components/NotionEquation.tsx
    - components/NotionMermaid.tsx
---

### react-notion-x
- 角色：Notion 块到 React 的渲染引擎，本项目基于 v8（`notion-client` / `notion-types` / `notion-utils` 同版本）。
- 稳定用法：通过覆盖 `NotionComponents` 中的 `Embed`、`Code`、`Equation`、`Collection` 来扩展原生不支持的能力（日历视图、mermaid、KaTeX mhchem、link_to_page 降级等），而非直接修改上游源码。
- 关键纠正：`Code` 组件不在根导出中，需从 `react-notion-x/third-party/code` 导入；`notion-utils@8` 不导出 `getSignedFileUrl`，嵌入 URL 应直接使用 `format.display_source` / `properties.source`。
- 数据库视图：仅拦截 `calendar` 视图自行实现，其余透传 `BaseCollection`。