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
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - eslint.config.js
    - .eslintrc.json
    - .editorconfig
---

## 1. 构建系统概览

本项目是一个基于 Next.js Pages Router 的静态站点，构建与发布完全围绕以下工具链：

- **包管理器**: pnpm（`package.json` 中声明 `"packageManager": "pnpm@10.29.3"`，配合根目录 `pnpm-workspace.yaml` 与 `pnpm-lock.yaml`）。
- **运行时要求**: Node.js 24（`engines.node = "24"`），但 CI 矩阵同时覆盖 20/22/24 以验证兼容性。
- **框架构建**: Next.js 原生 `next build` / `next dev` / `next start`。
- **部署平台**: Vercel（通过 `vercel deploy` 脚本与 `vercel.json` 配置）。
- **CI**: GitHub Actions（`.github/workflows/build.yml`），在 push 时触发 lint + prettier 测试。
- **本地钩子**: simple-git-hooks + lint-staged，pre-commit 阶段运行 Prettier 与 ESLint。

仓库没有 Makefile、Dockerfile 或自定义 build.sh；所有构建逻辑集中在 `package.json` scripts 与 Next.js/Vercel 配置中。

## 2. 关键文件

| 文件 | 作用 |
|---|---|
| `package.json` | 定义 `dev`/`build`/`start`/`deploy`/`test` 等脚本、依赖版本、`pnpm.onlyBuiltDependencies`、lint-staged 钩子 |
| `next.config.js` | Next.js 构建期配置：静态页面超时、图片远程域名白名单、AVIF/WebP 输出格式、`react-tweet` transpile |
| `vercel.json` | Vercel cron 调度 `/api/indexnow`（每天 03:00 UTC） |
| `.github/workflows/build.yml` | CI 流水线：checkout → pnpm/action-setup → setup-node → `pnpm install --frozen-lockfile --strict-peer-dependencies` → `pnpm test` |
| `pnpm-workspace.yaml` | pnpm monorepo 工作区声明（尽管当前只有一个 workspace root） |
| `pnpm-lock.yaml` | 锁定依赖树，CI 使用 `--frozen-lockfile` 强制一致性 |
| `eslint.config.js` / `.eslintrc.json` | ESLint 配置（ESLint 9 flat config 与 legacy 并存） |
| `.editorconfig` | 编辑器级缩进/换行约定 |

## 3. 架构与约定

### 3.1 脚本约定
- `pnpm dev` → `next dev`
- `pnpm build` → `next build`（生成静态站点）
- `pnpm start` → `next start`（生产预览）
- `pnpm deploy` → `vercel deploy`（一键推送到 Vercel）
- `pnpm test` → `run-p test:*` 并行执行 `test:lint` 与 `test:prettier`
- `pnpm deps:upgrade` → 非 CI 环境下升级 `notion-client`/`notion-types`/`notion-utils`/`react-notion-x`（通过 `[ -z $GITHUB_ACTIONS ]` 判断）
- `pnpm deps:link[:pkg]` / `deps:unlink` → 将本地 `../react-notion-x/packages/*` 软链到依赖，用于开发 react-notion-x 上游时的联调

### 3.2 依赖管理策略
- 使用 pnpm 的 `onlyBuiltDependencies` 仅允许 `canvas`/`core-js`/`protobufjs` 执行 native build，减少构建体积。
- 通过 `overrides.cacheable-request.keyv` 强制将间接依赖 `keyv` 升级到 `@keyvhq/core@~1.6.6`，解决第三方库版本冲突。
- 开发依赖 `@fisch0920/config` 提供共享的 Prettier 与 ESLint 预设。

### 3.3 Next.js 构建行为
- `staticPageGenerationTimeout: 300`：静态页面生成超时设为 300s，适配 Notion API 慢查询场景。
- `images.remotePatterns` 白名单限定 `notion.so`、`unsplash.com`、`twitter.com`、`s3.us-west-2.amazonaws.com` 等外部图片源。
- 输出 AVIF 与 WebP 两种现代图片格式，并开启 SVG 支持（`dangerouslyAllowSVG: true`）。
- `transpilePackages: ['react-tweet']`：对第三方 ESM-only 包进行转译。

### 3.4 部署与定时任务
- `vercel.json` 中定义 cron：`/api/indexnow` 每日 03:00 UTC 自动调用，用于向搜索引擎提交站点索引。
- 无 Docker 镜像构建步骤；Vercel 平台直接拉取源码并执行 `pnpm build`。

### 3.5 CI 流水线（GitHub Actions）
- 触发条件：`on: [push]`。
- 矩阵策略：Node.js 20、22、24 三版本并行，`fail-fast: true`。
- 安装命令：`pnpm install --frozen-lockfile --strict-peer-dependencies`，严格校验 peer dependency 且锁文件必须匹配。
- 测试命令：`pnpm test`（即 `run-p test:lint test:prettier`）。
- 注释掉的 Redis 缓存环境变量块表明项目预留了 Redis 缓存扩展点，但未启用。

### 3.6 本地提交钩子
- `simple-git-hooks.pre-commit` → `npx lint-staged`
- `lint-staged` 对 `*.{ts,tsx}` 文件依次执行 `prettier --write` 与 `eslint --fix`。

## 4. 约定与约束

- **Node 版本**：`package.json` 的 `engines.node = "24"` 是运行时要求；CI 额外验证 20/22 兼容性。
- **依赖锁定**：CI 使用 `--frozen-lockfile`，任何未同步的 `pnpm-lock.yaml` 变更都会导致 CI 失败。
- **Peer 依赖严格模式**：`--strict-peer-dependencies` 使缺失或不匹配的 peer dependency 成为错误而非警告。
- **构建产物**：`pnpm build` 产出 Next.js 静态站点（`.next/` 由 Next.js 自动生成），无自定义打包脚本。
- **代码质量门禁**：`pnpm test` 同时运行 ESLint 与 Prettier check，任一失败即 CI 失败。
- **预提交检查**：commit 前自动格式化与修复 TS/TSX 文件。
- **Vercel 部署**：`pnpm deploy` 调用 `vercel deploy`，无需额外配置文件即可部署；`vercel.json` 仅用于 cron 调度。
- **无容器化**：仓库内不存在 Dockerfile 或 docker-compose 文件，部署完全依赖 Vercel 平台。
- **无 Makefile**：所有可重复构建流程均通过 pnpm scripts 表达，未见 Makefile 或 shell 构建脚本。