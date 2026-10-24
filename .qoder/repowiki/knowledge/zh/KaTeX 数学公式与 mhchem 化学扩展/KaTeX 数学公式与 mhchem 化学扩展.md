---
kind: external_dependency
name: KaTeX 数学公式与 mhchem 化学扩展
slug: katex
category: external_dependency
category_hints:
    - sdk_real_api
scope:
    - '**'
source_files:
    - components/NotionEquation.tsx
    - lib/katex-mhchem.d.ts
---

### KaTeX
- 角色：渲染 Notion 的 Equation 块；通过自定义 `NotionEquation` 组件接入。
- 稳定用法：mhchem 扩展的正确说明符是 `katex/contrib/mhchem`（无 `.mjs` 后缀），由 katex 的 `exports` 映射到 `dist/contrib/mhchem.mjs`；项目额外提供 `lib/katex-mhchem.d.ts` 以声明类型。
- 能力：支持 `\ce{}` / `\pu{}` 等化学公式语法。