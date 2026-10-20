---
kind: dependency_management
name: pnpm 单包依赖管理与锁定策略
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - .github/workflows/build.yml
---

## 1. 使用的系统/方案

仓库使用 **pnpm** 作为唯一的 Node.js 包管理器，采用单包（非 monorepo workspace）模式组织依赖。所有第三方库在根目录的 `package.json` 中声明，并通过 `pnpm-lock.yaml` 锁定精确版本。

- 包管理器：`pnpm@10.29.3`（通过 `packageManager` 字段强制）
- Node 版本：`engines.node = "24"`，CI 矩阵覆盖 20 / 22 / 24
- 构建缓存：GitHub Actions 中使用 `actions/setup-node@v4` 的 `cache: "pnpm"`
- 私有注册表：未发现 `.npmrc`、`NPM_CONFIG_REGISTRY` 或 `registry` 配置，默认使用 npm 官方源

## 2. 关键文件

- `package.json` — 依赖声明、脚本、`overrides`、`pnpm.onlyBuiltDependencies`、`simple-git-hooks` 与 `lint-staged` 钩子
- `pnpm-workspace.yaml` — pnpm workspace 级配置（尽管本仓库是单包，仍启用 `onlyBuiltDependencies`、`minimumReleaseAge` 等）
- `pnpm-lock.yaml` — 精确锁定的依赖树
- `.github/workflows/build.yml` — CI 安装命令 `pnpm install --frozen-lockfile --strict-peer-dependencies`

## 3. 架构与约定

### 依赖分类
- `dependencies`：运行时依赖，包括 Next.js (`next ^16.2.0`)、React (`react/react-dom ^19.2.4`)、Notion 生态 (`notion-client/notion-types/notion-utils/react-notion-x ^7.10.0`)、样式/工具 (katex, prismjs, ky, posthog-js 等)
- `devDependencies`：类型定义、ESLint、Prettier、TypeScript、`npm-run-all2` 等开发工具

### 依赖升级流程
`package.json` 提供专用脚本：
- `deps:upgrade`：调用 `pnpm up -L notion-client notion-types notion-utils react-notion-x`，仅在非 CI 环境执行（`[ -z $GITHUB_ACTIONS ]`），用于集中升级 Notion 相关包
- `deps:link` / `deps:unlink`：配合本地 `../react-notion-x` 源码进行联调（`pnpm link ../react-notion-x/packages/*`），便于在 fork 该上游仓库时调试

### 依赖冲突解决
通过 `overrides` 将 `cacheable-request` 的传递依赖 `keyv` 强制替换为 `@keyvhq/core@~1.6.6`，以解决下游包的 keyv 版本冲突问题。

### 原生模块优化
`pnpm-workspace.yaml` 与 `package.json` 的 `pnpm.onlyBuiltDependencies` 共同限定仅允许 `sharp`、`simple-git-hooks`、`canvas`、`core-js`、`protobufjs` 这些包执行原生构建，其余依赖跳过 build step，加速安装。

### 发布安全策略
`pnpm-workspace.yaml` 设置 `minimumReleaseAge: 1440`（2 天），禁止安装发布不足 2 天的包；同时通过 `minimumReleaseAgeExclude` 排除 `@fisch0920/config`、`react-notion-x`、`notion-client`、`notion-types`、`notion-utils` 五个包，允许其新发布立即被安装——这反映了项目对 Notion 生态包有高频迭代需求。

### 工作区严格性
`packageManagerStrict: false` 关闭 pnpm 的工作区包管理器版本校验，允许不同机器上使用不同版本的 pnpm 运行（但 `packageManager` 字段仍推荐统一为 10.29.3）。

## 4. 约定与约束

- **必须使用 pnpm**：`packageManager: "pnpm@10.29.3"` 由 pnpm 自身强制校验，若使用其他包管理器会报错
- **CI 安装必须冻结锁文件**：`.github/workflows/build.yml` 使用 `pnpm install --frozen-lockfile --strict-peer-dependencies`，任何未提交的锁文件变更都会导致 CI 失败
- **Node 版本约束**：`engines.node = "24"`，CI 矩阵额外兼容 20 与 22
- **仅允许指定原生包构建**：`onlyBuiltDependencies` 白名单机制限制可执行 native build 的包集合
- **新包冷却期**：`minimumReleaseAge: 1440` 分钟（2 天），防止误装刚发布的未稳定包
- **Notion 生态包豁免冷却期**：`react-notion-x`、`notion-client`、`notion-types`、`notion-utils`、`@fisch0920/config` 不受 2 天冷却限制
- **无私有注册表**：仓库内未发现 `.npmrc`、`NPM_CONFIG_REGISTRY` 或 GitHub Packages 配置，依赖全部来自 npm 官方源
- **pre-commit 钩子**：通过 `simple-git-hooks` + `lint-staged` 在提交前对 `*.ts/tsx` 运行 Prettier 与 ESLint 修复
- **依赖升级仅限特定包**：`deps:upgrade` 脚本显式列出 `notion-client notion-types notion-utils react-notion-x`，不执行全局升级，避免引入无关变更