---
kind: dependency_management
name: pnpm 单仓依赖管理（含 Notion 生态本地联调）
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - pnpm-workspace.yaml
    - pnpm-lock.yaml
    - oxlint.config.ts
    - oxfmt.config.ts
---

## 1. 使用的系统

- **包管理器**: pnpm 10.29.3（通过 `packageManager` 字段锁定，见 `package.json`）。
- **工作区**: 根目录存在 `pnpm-workspace.yaml`，但当前仓库仅有一个顶层 package，未定义 workspace packages；该文件主要用于全局 pnpm 行为配置。
- **锁文件**: `pnpm-lock.yaml`（由 pnpm 生成并纳入版本控制）。
- **运行时/构建工具链**: Next.js 16 + React 19 + TypeScript 7，全部通过 npm registry 安装。
- **代码质量工具**: oxlint / oxfmt，统一规则来自共享包 `@fisch0920/config`（在 `oxlint.config.ts`、`oxfmt.config.ts` 中通过 `import baseConfig from '@fisch0920/config/...` 继承）。

## 2. 关键文件

- `package.json`：声明所有 runtime 与 devDependencies、scripts、`overrides`、`engines.node`、`packageManager`、`pnpm.onlyBuiltDependencies`。
- `pnpm-workspace.yaml`：pnpn 工作区级策略（`onlyBuiltDependencies`、`minimumReleaseAge`、`enablePrePostScripts`、`packageManagerStrict`）。
- `pnpm-lock.yaml`：依赖解析的精确快照。
- `oxlint.config.ts` / `oxfmt.config.ts`：从 `@fisch0920/config` 继承 lint/format 规则。
- `.gitignore`：忽略 `node_modules`、`.next`、`.vercel` 等产物（不忽略 `pnpm-lock.yaml`）。

## 3. 架构与约定

### 3.1 依赖声明与版本范围
- 所有第三方库以 `^` 语义化版本范围声明在 `dependencies` 与 `devDependencies` 中，例如 `next: ^16.4.2`、`react: ^19.3.1`、`react-notion-x: ^8.0.8`。
- 通过 `engines.node = "24"` 强制 Node 版本；通过 `packageManager = "pnpm@10.29.3"` 强制 pnpm 版本。

### 3.2 构建依赖白名单
- `package.json` 中 `pnpm.onlyBuiltDependencies` 列出 `canvas`、`core-js`、`protobufjs`。
- `pnpm-workspace.yaml` 中 `onlyBuiltDependencies` 额外包含 `sharp`、`simple-git-hooks`。
- 目的：除这些包外，其他依赖跳过原生编译，加速安装。

### 3.3 发布年龄限制
- `pnpm-workspace.yaml` 设置 `minimumReleaseAge: 1440`（分钟），即新发布的包需等待至少一天才允许安装。
- 通过 `minimumReleaseAgeExclude` 排除 `@fisch0920/config`、`react-notion-x`、`notion-client`、`notion-types`、`notion-utils`——这些核心依赖可立即使用新版本。

### 3.4 依赖冲突解决
- 使用 `overrides.cacheable-request.keyv` 将传递依赖 `keyv` 强制替换为 `@keyvhq/core@~1.6.6`，解决上游依赖树中的版本冲突。

### 3.5 本地联调 Notion 生态
- `package.json` 提供一组 `deps:link:*` 脚本，用于将本仓库与本地源码 `../react-notion-x/packages/*` 建立软链接，从而在不发布的情况下调试 `react-notion-x`、`notion-client`、`notion-types`、`notion-utils`。
- `deps:upgrade` 脚本调用 `pnpm up -L` 升级上述四个包，并在 CI（`$GITHUB_ACTIONS` 非空）时跳过。
- `deps:unlink` 脚本恢复为从 npm registry 安装。

### 3.6 预提交钩子与代码检查
- `simple-git-hooks.pre-commit` 触发 `npx lint-staged`。
- `lint-staged` 对 `*.{ts,tsx}` 执行 `oxfmt` 和 `oxlint --fix`。
- `test` 脚本并行运行 `test:lint`、`test:format`、`test:typecheck`。

## 4. 约定与约束

- **包管理器固定**：`packageManager` 字段锁定 pnpm 10.29.3，CI 或本地安装必须使用该版本。（来源：`package.json`）
- **Node 版本固定**：`engines.node = "24"`，要求 Node 24。（来源：`package.json`）
- **依赖版本范围**：所有依赖使用 `^` 语义化版本范围，而非固定到具体小版本；精确版本由 `pnpm-lock.yaml` 锁定。（来源：`package.json`）
- **构建依赖最小化**：只有 `package.json` 与 `pnpm-workspace.yaml` 中列出的包会进行原生编译，其余跳过。（来源：两处 `onlyBuiltDependencies`）
- **新包冷却期**：默认 1440 分钟冷却期，防止引入刚发布的不稳定包；`react-notion-x` 及其三个子包被显式排除。（来源：`pnpm-workspace.yaml`）
- **CI 下跳过依赖升级**：`deps:upgrade`、`deps:link`、`deps:unlink` 均检测 `$GITHUB_ACTIONS`，在 CI 上直接 echo 跳过。（来源：`package.json` scripts）
- **Notion 生态本地联调路径**：联调假设本地存在 `../react-notion-x` 目录，并通过 `pnpm link ../react-notion-x/packages/<pkg>` 建立软链。（来源：`package.json` `deps:link:*` scripts）
- **lint/format 规则集中化**：oxlint 与 oxfmt 的规则均通过 `@fisch0920/config` 继承，不在本仓库内重复定义。（来源：`oxlint.config.ts`、`oxfmt.config.ts`）
- **生成的/第三方内容不参与格式化**：`oxfmt.config.ts` 的 `ignorePatterns` 明确忽略 `.next/**`、`.vercel/**`、`build/**`、`dist/**`、`node_modules/**`、`public/**`、`pnpm-lock.yaml`、`*.md` 等。（来源：`oxfmt.config.ts`）
- **传递依赖 keyv 冲突修复**：通过 `overrides` 将 `cacheable-request` 的 `keyv` 强制指向 `@keyvhq/core@~1.6.6`。（来源：`package.json`）
