---
kind: external_dependency
name: KaTeX + mhchem（数学公式与化学公式）
slug: katex-mhchem
category: external_dependency
category_hints:
    - sdk_real_api
scope:
    - '**'
---

- mhchem 的正确导入说明符是 katex/contrib/mhchem（不带 .mjs 后缀，经 katex package exports 映射到 dist/contrib/mhchem.mjs）。
- 仓库自带 lib/katex-mhchem.d.ts 提供类型声明，避免 TS 报错。