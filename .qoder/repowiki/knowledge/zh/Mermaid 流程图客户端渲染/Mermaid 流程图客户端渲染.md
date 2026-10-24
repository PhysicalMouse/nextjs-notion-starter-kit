---
kind: external_dependency
name: Mermaid 流程图客户端渲染
slug: mermaid
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - components/NotionMermaid.tsx
---

### Mermaid
- 行为：暗色主题跟随系统；渲染失败时回退为原始代码块并清理 DOM 残留。