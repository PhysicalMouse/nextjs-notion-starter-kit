---
kind: build_system
name: Next.js + pnpm 构建与 Vercel 部署流水线
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.js
    - vercel.json
    - .github/workflows/build.yml
    - oxlint.config.ts
    - oxfmt.config.ts
    - pnpm-workspace.yaml
---

## 1. 构建系统概览

本项目是一个基于 Next.js Pages Router 的单仓博客模板，构建与发布完全围绕以下工具链展开：

- **包管理器**：pnpm（`packageManager: "pnpm@10.29.3"`），通过 `pnpm-workspace.yaml` 启用工作区模式。
- **运行时/构建器**：Next.js 16 (`next build` / `next dev` / `next start`)，ESM 模块 (`"type": "module"`)。
- **部署平台**：Vercel（`vercel.json` 声明定时任务，`pnpm deploy` 触发 `vercel deploy`）。
- **CI**：GitHub Actions（`.github/workflows/build.yml`），在 push 时运行测试矩阵。
- **代码质量**：oxlint + oxfmt（来自 `@fisch0920/config` 共享配置），TypeScript 类型检查。
- **Git Hooks**：simple-git-hooks + lint-staged，pre-commit 阶段执行 `oxfmt` 与 `oxlint --fix`。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `package.json` | 脚本入口、依赖声明、`engines.node = 24`、`packageManager` 锁定版本、`pnpm.onlyBuiltDependencies` 白名单 |
| `next.config.js` | Next.js 构建期配置：远程图片白名单、AVIF/WebP 输出格式、CSP、`transpilePackages: ['react-tweet']` |
| `vercel.json` | Vercel 部署配置，仅声明 Cron 调度 `/api/indexnow`（每天 03:00 UTC） |
| `.github/workflows/build.yml` | GitHub Actions CI，push 触发，Node 20/22/24 三版本矩阵 |
| `oxlint.config.ts` | 继承 `@fisch0920/config/oxlint`，关闭 `react/immutability` 与 `react/set-state-in-effect` |
| `oxfmt.config.ts` | 继承 `@fisch0920/config/oxfmt`，忽略 `.qoder/.next/.vercel/.cache/.snapshots/build/dist/node_modules/public` 等生成目录 |
| `pnpm-workspace.yaml` | 启用 pnpm workspace（仓库级多包结构基础） |
| `tsconfig.json` | TypeScript 编译选项（由 Next.js 驱动） |

## 3. 构建与测试流程

### 本地开发
- `pnpm dev` → `next dev`
- `pnpm build` → `next build`（静态页面生成超时设为 300s）
- `pnpm start` → `next start`

### 测试命令
`pnpm test` 并行执行三个子任务（`run-p test:*`）：
- `test:lint` → `oxlint`
- `test:format` → `oxfmt --check`
- `test:typecheck` → `tsc`

### CI（GitHub Actions）
- 触发条件：`on: [push]`
- 环境矩阵：Ubuntu + Node 20 / 22 / 24
- 步骤：checkout → pnpm/action-setup → setup-node (带 pnpm 缓存) → `pnpm install --frozen-lockfile --strict-peer-dependencies` → `pnpm test`
- 未包含构建或部署步骤；注释中预留了 Redis 缓存与 `pnpm build` 的占位。

### 依赖管理策略
- 使用 `pnpm up -L` 升级依赖（`deps:upgrade`），但在 CI 中跳过（检测 `$GITHUB_ACTIONS`）。
- 支持将本地源码链接到 `react-notion-x` 的 monorepo 子包（`notion-types` / `notion-utils` / `notion-client` / `react-notion-x`），通过 `deps:link:*` 系列脚本配合 `pnpm link` 实现。
- `overrides.cacheable-request.keyv` 强制降级 keyv 版本以兼容旧依赖树。
- `pnpm.onlyBuiltDependencies` 白名单限制原生构建范围（canvas、core-js、protobufjs），加速安装。

## 4. 部署与产物

- **部署方式**：`pnpm deploy` 调用 `vercel deploy`，无自定义构建命令，Vercel 自动识别 Next.js 项目。
- **Vercel Cron**：`vercel.json` 中定义 `crons[0].path = "/api/indexnow"`，调度频率 `0 3 * * *`（UTC 每日 3 点），用于向 IndexNow 推送站点更新。
- **构建产物**：Next.js 默认输出 `.next/` 目录，被 `oxfmt.config.ts` 的 ignorePatterns 排除。

## 5. 约定与约束

- **Node 版本**：`package.json` 的 `engines.node = 24` 要求本地 Node ≥ 24；CI 额外覆盖 20/22/24 三版本以保证兼容性。
- **pnpm 版本锁定**：`packageManager: "pnpm@10.29.3"` 确保所有开发者与 CI 使用同一 pnpm 版本。
- **锁文件严格性**：CI 使用 `--frozen-lockfile --strict-peer-dependencies`，禁止隐式变更依赖树。
- **预提交钩子**：`simple-git-hooks.pre-commit` 绑定 `npx lint-staged`，对 `*.{ts,tsx}` 文件依次执行 `oxfmt` 和 `oxlint --fix`。
- **Next.js 图片安全**：`next.config.js` 显式允许 Notion CDN、AWS、Unsplash、Twitter 等域名，并放行任意 `https://**` 以兼容 Notion 嵌入的外部图床；同时设置严格的 CSP `default-src 'self'; script-src 'none'; sandbox;`。
- **React 规则放宽**：`oxlint.config.ts` 明确关闭 `react/immutability` 与 `react/set-state-in-effect`，注释说明这是有意为之（NotionPage 中的 `window` 调试对象挂载、以及 `hasMounted`/focus/scroll effect 属于长期存在的模式）。