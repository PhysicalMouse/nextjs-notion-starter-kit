---
kind: external_dependency
name: Mermaid（流程图/时序图代码块渲染）
slug: mermaid
category: external_dependency
category_hints:
    - sdk_real_api
scope:
    - '**'
---

- 运行时依赖 prismjs 主包（需显式 import 'prismjs'），否则语言包脚本报 Prism is not defined。
- 新增 58 个 Prism 语言包（json5/php/ruby/lua/kotlin/scala/dart/elixir/elm/erlang/haskell/clojure/fsharp/powershell/batch/ini/toml/nginx/http/protobuf/r/julia/groovy/perl/matlab/zig/vim/apacheconf…），其中 json5 扩展需要额外 import 'prismjs/components/prism-json.js'。