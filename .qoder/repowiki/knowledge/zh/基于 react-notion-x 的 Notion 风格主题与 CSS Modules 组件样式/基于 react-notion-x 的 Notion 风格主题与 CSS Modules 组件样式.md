---
kind: frontend_style
name: 基于 react-notion-x 的 Notion 风格主题与 CSS Modules 组件样式
category: frontend_style
scope:
    - '**'
source_files:
    - pages/_app.tsx
    - styles/global.css
    - styles/notion.css
    - styles/prism-theme.css
    - components/SearchModal.module.css
    - components/styles.module.css
---

## 1. 采用的体系

站点以 **Next.js Pages Router** 为入口，视觉层围绕 `react-notion-x` 渲染的 Notion 内容构建。样式方案由三层组成：

- **第三方库样式**（在 `pages/_app.tsx` 中按顺序 import）：
  - `katex/dist/katex.min.css` — 数学公式。
  - `prismjs/themes/prism-coy.css` — Prism 代码高亮基础主题。
  - `react-notion-x/styles.css` — Notion 元素的基础样式。
- **全局样式**（`styles/` 目录）：覆盖、主题变量与响应式布局。
- **组件级样式**（`components/*.module.css`）：使用 CSS Modules 隔离局部样式。

没有引入 Tailwind、Sass/Less、CSS-in-JS 或设计系统库；所有样式均为原生 CSS。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `pages/_app.tsx` | 统一注入上述三类样式表，是样式加载的唯一入口 |
| `styles/global.css` | 全局 reset、字体栈、滚动条、搜索输入等基础样式 |
| `styles/notion.css` | 针对 `.notion*` 类名的 Notion 元素覆盖（794 行，核心主题文件） |
| `styles/prism-theme.css` | 覆盖 Prism Coy 主题，使代码块匹配 notion.site 外观 |
| `components/SearchModal.module.css` | 搜索弹窗的 CSS Modules 样式 |
| `components/styles.module.css` | Loading、Footer、社交图标、GitHub Corner 等通用组件样式 |

## 3. 架构与约定

### 3.1 设计令牌（CSS Custom Properties）
样式通过 CSS 自定义属性实现主题化，而非 Sass 变量或 JS 主题对象。主要 token 包括：

- `--fg-color` / `--fg-color-0` / `--fg-color-1` / `--fg-color-2` / `--fg-color-3` / `--fg-color-4` / `--select-color-0` — 前景色层级。
- `--bg-color` / `--bg-color-1` — 背景色层级。
- `--notion-max-width: 720px`（文章页）/ `--notion-max-width: 900px`（首页）— 内容宽度。
- `--notion-header-height: 54px` — 导航栏高度。
- `--notion-font` — 在 `global.css` 中定义，包含 CJK fallback（PingFang SC、Hiragino Sans GB、Microsoft YaHei），用于匹配 Notion 原版中文排版。

这些 token 由 `react-notion-x` 在运行时注入到 `.notion` 根节点上，站点样式通过覆盖其默认值来定制主题。

### 3.2 明暗模式策略
采用 **class 切换** 而非 prefers-color-scheme：

- 选择器以 `.dark-mode .xxx` 形式覆盖浅色规则（例如 `styles/notion.css` 中的 `.dark-mode .notion-header`、`.dark-mode .notion-simple-table`、`.dark-mode .notion-red_background` 等）。
- 深色模式逻辑位于 `lib/use-dark-mode.ts`（运行时切换 `<body>` 上的 class）。
- 对不支持 `backdrop-filter` 的 Firefox 提供降级：`@-moz-document url-prefix()` 块内设置纯色背景。

### 3.3 响应式策略
全部使用 CSS `@media` 查询，无断点常量集中管理。常见断点：

- `max-width: 600px` — 隐藏桌面端搜索按钮。
- `max-width: 720px` / `920px` — 调整页面左右 padding。
- `min-width: 768px` — 将 gallery grid 从单列切为 2/3 列。
- `min-width: 1300px and min-height: 300px` — 展开右侧目录侧边栏（`.notion-aside-table-of-contents`）。
- `max-width: 1299px or max-height: 299px` — 隐藏目录侧边栏。
- `prefers-reduced-motion: reduce` — 关闭目录展开动画。

### 3.4 组件样式组织
- 全局/跨组件样式放在 `styles/` 下的普通 `.css` 文件。
- 组件私有样式使用 CSS Modules（文件名 `*.module.css`），如 `SearchModal.module.css`、`styles.module.css`，通过 `import styles from './xxx.module.css'` 在 TSX 中使用。
- 组件样式命名采用 BEM 风格的扁平类名（如 `.searchButton`、`.overlay`、`.modal`、`.tagActive`），未使用嵌套或预处理器。

### 3.5 与 react-notion-x 的关系
`styles/notion.css` 顶部注释明确说明目标：**“react-notion-x 的目标是尽可能匹配 Notion，而本站的目标是在少数关键位置添加一些 flair”**。因此该文件大量使用 `!important` 和精确的 `.notion-*` 选择器覆盖第三方库默认行为，包括：

- 图片宽高比修复（`.notion-asset-wrapper-image > div { height: auto !important; }`）。
- 引用块、待办项、表格网格线、书签预览图、收藏卡片封面比例等与 notion.site 对齐。
- 博客元数据（Description → Tags → Author → Date）通过 `nth-child` + `order` 重排。
- 目录侧边栏在宽屏下以可展开的窄条形式出现，hover/focus-within 时展开显示标题。

### 3.6 代码高亮主题
Prism 的 Coy 主题被 `prism-theme.css` 完全覆盖：

- `pre.notion-code` 移除 Coy 主题的条纹渐变和阴影，改用 `var(--bg-color-1)` 背景并圆角 10px。
- 行内代码 `.notion-inline-code` 使用固定色 `#ff4081`（浅/深模式分别用不同背景）。
- 各类 token（comment、string、keyword、function 等）使用 HSLA 语义色，并在 `.dark-mode` 下提供对应变体。

## 4. 观察到的约定与约束

- **样式加载顺序受控于 `_app.tsx`**：先导入第三方库样式，再导入 `global.css` → `notion.css` → `prism-theme.css`，后者具有最高优先级，确保覆盖生效。
- **主题色通过 CSS 自定义属性消费**：组件样式优先引用 `var(--fg-color)` / `var(--bg-color)` 等 token，避免硬编码颜色值。
- **Notion 元素一律以 `.notion` 前缀选择器命中**，避免污染全局 DOM。
- **深色模式通过 `.dark-mode` 祖先类开关**，新增样式需同时提供浅色与深色两套规则。
- **组件样式使用 CSS Modules**，类名不会泄漏到全局命名空间。
- **响应式断点散落在各文件中**，没有统一的断点变量或 mixin。
- **CJK 字体回退链**在 `global.css` 中显式声明，保证中文与英文使用同一套字体栈。
- 仓库未配置任何 CSS lint 或格式化工具（oxlint 仅处理 TS/JS），样式风格依赖开发者自觉遵循上述约定。