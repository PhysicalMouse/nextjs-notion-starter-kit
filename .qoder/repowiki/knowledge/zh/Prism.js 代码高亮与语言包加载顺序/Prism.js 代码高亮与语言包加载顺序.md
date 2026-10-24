---
kind: external_dependency
name: Prism.js 代码高亮与语言包加载顺序
slug: prismjs
category: external_dependency
category_hints:
    - framework_behavior
scope:
    - '**'
source_files:
    - components/NotionCode.tsx
---

### Prism.js
- 角色：为 Notion Code 块提供语法高亮；`NotionCode` 追加了 58 个语言包（json5/php/ruby/lua/kotlin/scala/dart/elixir/elm/erlang/haskell/clojure/fsharp/powershell/batch/ini/toml/nginx/http/protobuf/r/julia/groovy/perl/matlab/zig/vim/apacheconf…）。
- 稳定约束：语言包脚本依赖全局 `Prism`，因此主包必须先于语言包加载——在 `NotionCode.tsx` 顶部显式 `import 'prismjs'`；`prism-json5` 又依赖 `json` 语言，需补 `import 'prismjs/components/prism-json.js'`。