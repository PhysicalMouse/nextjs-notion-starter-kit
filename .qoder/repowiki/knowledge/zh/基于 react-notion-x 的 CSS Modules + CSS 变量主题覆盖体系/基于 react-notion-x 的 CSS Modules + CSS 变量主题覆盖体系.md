---
kind: frontend_style
name: 基于 react-notion-x 的 CSS Modules + CSS 变量主题覆盖体系
category: frontend_style
scope:
    - '**'
source_files:
    - styles/global.css
    - styles/notion.css
    - styles/prism-theme.css
    - components/styles.module.css
    - components/SearchModal.module.css
    - package.json
---

## 1. 采用的样式方案

- **CSS Modules**：组件级样式使用 Next.js 内置的 CSS Modules，文件以 `*.module.css` 命名（如 `components/styles.module.css`、`components/SearchModal.module.css`），通过 `import styles from './styles.module.css'` 在 TSX 中引用。
- **全局样式**：位于 `styles/` 目录，由 `_app.tsx` 引入，包括 `global.css`（基础 reset、滚动条、字体变量）和 `notion.css`（对 react-notion-x 输出类名的覆盖）。代码高亮配色来自第三方 `prism-theme.css`。
- **无预处理器**：仓库未安装 Sass/Less/Stylus，所有样式均为原生 CSS。
- **无 CSS-in-JS / Tailwind**：依赖列表中无 tailwindcss、styled-components、emotion 等；样式组织完全基于 CSS Modules + 全局 CSS。
- **设计令牌**：通过 CSS 自定义属性（CSS Variables）实现主题化，集中在 `body` 与 `.notion` 根节点上，例如 `--notion-font`、`--bg-color`、`--fg-color`、`--fg-color-0`、`--fg-color-1`、`--select-color-0`、`--bg-color-1`、`--notion-max-width`、`--notion-header-height`。深色模式通过给 `<body>` 添加 `.dark-mode` 类名切换（参见 `lib/use-dark-mode.ts` 与 `@fisch0920/use-dark-mode` 依赖）。
- **响应式策略**：纯 CSS `@media` 查询，断点集中在 566px、720px、768px、920px、1200px、1300px 附近，用于控制画廊列数、侧边目录展开、移动端隐藏元素等。

## 2. 关键文件

- `styles/global.css` — 全局 reset、字体族变量、滚动条样式、搜索输入框颜色。
- `styles/notion.css` — 针对 `react-notion-x` 输出的 `.notion-*` 类名的站点定制覆盖（画廊网格、封面比例、链接下划线渐变、收藏卡片阴影、暗色模式、文章大纲目录交互、元信息重排等）。
- `styles/prism-theme.css` — PrismJS 代码块配色。
- `components/styles.module.css` — Loading、Footer、PageAside、社交图标等通用组件样式。
- `components/SearchModal.module.css` — 搜索弹窗遮罩、输入框、标签、结果列表样式。
- `package.json` — 声明核心样式相关依赖：`react-notion-x`、`prismjs`、`katex`、`classnames`、`@fisch0920/use-dark-mode`。

## 3. 架构与约定

- **样式分层**：全局基础样式放在 `styles/`，组件局部样式放在对应组件旁的 `*.module.css`，二者职责清晰分离。
- **主题变量集中定义**：`--notion-font` 在 `global.css` 的 `body` 上定义，`--notion-max-width`、`--notion-header-height` 在 `notion.css` 的 `.notion` 上定义；其他颜色/背景变量由 `react-notion-x` 注入到 `.notion` 根节点，站点仅消费这些变量而不重新定义。
- **深色模式**：通过 `react-body-classname` 将 `.dark-mode` 添加到 `<body>`，`notion.css` 中以 `.dark-mode .notion-*` 选择器覆盖浅色模式下的样式（如高亮背景在暗色模式下被禁用）。
- **响应式布局**：不采用移动优先或框架栅格，而是按具体组件编写 `@media (min-width|max-width: ...)` 规则，典型断点为 720px（内容区缩进）、768px（画廊两列）、1200px（封面圆角取消）、1300px+（展开右侧目录）。
- **动画与过渡**：少量动效使用 CSS `@keyframes`（loading spinner、GitHub Corner octocat-wave）与 `transition`（链接下划线渐变、收藏卡片 hover、目录展开），并通过 `prefers-reduced-motion: reduce` 关闭动画以满足可访问性。
- **第三方样式覆盖约定**：所有对 `react-notion-x` 产出的覆盖统一以 `.notion` 作为 BEM 风格前缀，避免污染全局命名空间。

## 4. 约定与约束

- **组件样式必须使用 CSS Modules**：仓库内所有组件样式均位于 `*.module.css` 文件中并通过 ES module import 引用，未发现任何组件使用内联 style 或全局 class 来组织样式。
- **全局样式不得包含组件级样式**：`styles/` 目录仅放置全局 reset、主题变量与第三方库覆盖，组件专属样式一律放在组件旁。
- **主题色值通过 CSS 变量消费**：颜色、背景、边框等视觉值应引用 `var(--fg-color)`、`var(--bg-color)`、`var(--fg-color-0)` 等变量，而非硬编码十六进制色值（除少数品牌色如 Twitter/Mastodon/GitHub 悬停色外）。
- **深色模式适配需遵循 `.dark-mode` 选择器**：对 `.notion-*` 元素的覆盖若涉及颜色差异，应在 `notion.css` 中提供 `.dark-mode` 分支（参考高亮背景、header backdrop-filter 等已有模式）。
- **响应式规则使用原生 `@media`**：仓库未引入任何响应式框架，新增断点时应沿用现有断点集合（566/720/768/920/1200/1300px）以保持视觉一致性。
- **lint 与格式化约束**：`.eslintrc.json` 与 `eslint.config.js` 配合 Prettier（`@fisch0920/config/prettier`）在 pre-commit 钩子中对 `*.{ts,tsx}` 执行格式化和 lint 修复；样式文件本身未被纳入 lint-staged 的自动修复范围，但受 Prettier 默认 CSS 规则约束。