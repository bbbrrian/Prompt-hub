# Prompt Hub

企业级提示词模板管理平台，支持 Prompt 沉淀、分类管理、版本控制、AI 生成优化，以及一键导出为 Claude Code Skill。

## 技术栈

- **前端**：Next.js 14 + React 18 + Ant Design 6 + Tailwind CSS + Zustand
- **后端**：Next.js API Routes
- **数据库**：PostgreSQL + Prisma ORM
- **认证**：JWT（jose）+ httpOnly Cookie + bcryptjs
- **其他**：JSZip（Skill 打包）、Three.js（背景动效）

## 快速启动

> 需要 Node.js 20+ 和 Docker

```bash
# 1. 复制环境变量（默认配置即可本地运行）
cp .env.example .env

# 2. 启动数据库
docker compose up -d db

# 3. 安装依赖（自动执行 prisma generate）
npm install

# 4. 初始化数据库结构 + 种子数据（含 156 个 Agent）
npm run db:push
npm run db:seed

# 5. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

> **生产部署**：`docker compose up -d --build` 一键启动所有服务

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | — |
| `AI_API_KEY` | AI 接口 Key（仅服务端读取，不暴露到前端） | — |
| `AI_BASE_URL` | AI 接口地址（兼容 OpenAI 格式） | https://api.openai.com |
| `AI_MODEL` | 使用的模型 | gpt-4o |
| `JWT_SECRET` | JWT 签名密钥，**生产环境必须设置**，可用 `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 生成 | — |

## 功能

### Prompt 管理
- 新建、编辑、删除 Prompt
- 多维度分类 + 标签系统
- 版本历史 & 一键回滚
- 模板变量（`{{变量名}}`）填写后复制
- 全文搜索
- 批量操作：删除、移动分类、打标签、设置可见性、**批量导出 Skill**

### 工作流
- 多步骤 Prompt 工作流编排
- 只读详情 Drawer（步骤预览，无需进入编辑模式）
- 一键导出整个工作流为 Skill 包

### AI 功能
- `/prompts/generate`：描述需求 → 流式生成结构化 Prompt（支持角色扮演型 / 任务型 / 分析型）
- Prompt 详情页"AI 优化"：对已有 Prompt 内容进行改进，确认后保存为新版本

### Skill 导出
- 单个 Prompt 导出为 Claude Code Skill（zip）
- 工作流导出为多 Skill 包（zip）
- 批量多选 Prompt 打包下载
- 导出后展示**安装引导弹窗**（含步骤说明 + Skill 数量提醒）

> ⚠️ 建议单次安装不超过 16 个 Skill，过多会导致模型质量下降

### Skill 库
- Prompt 详情页"生成 Skill"按钮跳转 Skill Builder
- **Skill Builder**：可视化编辑 skill name、触发描述、prompt 内容、references、scripts、assets
- AI 辅助生成触发条件描述（`suggest-skill-description`）
- 客户端直接打包下载 ZIP（jszip，无需服务端）
- **保存到库**：Skill 持久化存储（PostgreSQL），支持版本管理
- Skill 库列表页（`/skills`）：搜索、编辑、下载、删除、导入
- assets 二进制文件存磁盘（`/public/uploads/skills/{id}/assets/`），数据库存元数据

### 账户系统
- 邮箱 + 密码注册/登录
- JWT 存储于 httpOnly Cookie，防 XSS
- 全站登录保护（middleware 拦截）
- 顶部导航用户头像 + 退出登录
- 角色系统（user / admin）

### 数据看板
- Prompt 总数、使用次数、分类、标签统计
- Top 10 最常用 Prompt
- 标签分布词云
- 按维度分布柱状图
- **最近 30 天新增趋势折线图**

### Agent 库
- 156 个预置 Agent（工程、设计、营销、销售等 12 个分类），数据持久化至 PostgreSQL
- 支持新建、编辑、删除 Agent
- 按分类标签筛选，默认显示工程类
- 点击卡片查看完整 System Prompt

### 收藏夹
- Prompt 一键收藏/取消收藏
- 独立收藏页（`/favorites`）

### 全局搜索
- ⌘K / Ctrl+K 快捷键唤起
- 实时全文搜索 Prompt 标题与内容

### 批量导入
- 支持 JSON / CSV 格式批量导入 Prompt

### 变量系统
- `{{变量名}}` 模板语法，支持变量类型定义
- 详情页变量填写后一键复制

## 目录结构

```
src/
  app/
    api/
      ai/
        generate-prompt/          # AI 生成 Prompt（流式）
        optimize-prompt/          # AI 优化 Prompt（流式）
        suggest-skill-description/ # AI 生成 Skill 触发条件描述
      prompts/             # Prompt CRUD、批量操作、导出、版本
      skills/              # Skill CRUD、下载 ZIP、上传 asset、导入
      workflows/           # 工作流 CRUD、Skill 导出
      stats/               # 数据看板统计
      categories/          # 分类管理
      tags/                # 标签管理
    prompts/               # Prompt 列表、新建、编辑、AI 生成页
      [id]/skill-builder/  # Skill Builder 页面
    skills/                # Skill 库列表页
    workflows/             # 工作流页
    dashboard/             # 数据看板
    admin/                 # 管理配置（AI 参数等）
  components/ui/
    PromptCard.tsx         # Prompt 卡片
    PromptDetail.tsx       # Prompt 详情 Modal（含版本历史、AI 优化、Skill 导出）
    SkillBuilder.tsx       # Skill 可视化编辑器（name/description/references/scripts/assets）
    CategoryFilter.tsx     # 分类过滤器
    SearchBar.tsx          # 搜索栏
  store/
    prompt.ts              # Prompt 全局状态
    workflow.ts            # 工作流全局状态
```

## 迭代记录

### v2.0（2026-03）
- **RBAC 权限系统**：三级角色体系（SUPER_ADMIN / DEPT_ADMIN / USER），部门管理（支持父子关系），用户管理（角色/部门/启禁用），审计日志（全平台操作追踪）
  - 新增 `Department` 表、`AuditLog` 表，`User.role` 改为枚举，新增 `departmentId`、`disabled` 字段
  - 统一权限函数 `canModify`：超管全权限，其他人只能修改自己的内容
  - 中间件精确路由保护：`/admin/users`、`/admin/departments` 仅 SUPER_ADMIN；`/admin/dept-users`、`/admin/audit-log` 需 DEPT_ADMIN 及以上
  - 新增「复制到我的」功能，支持跨用户内容复用
  - 注册页新增部门选择，Navbar 管理入口按角色动态显示
- **安全修复**（14 项）：
  - [CRITICAL] 角色枚举不一致修复：`'admin'` 统一改为 `'SUPER_ADMIN'`，权限检查不再失效
  - [HIGH] `admin/users` 路由改用 cookie + JWT 验证，不再信任可伪造的 `x-user-role` 请求头
  - [HIGH] 移除登录路由中泄露邮箱、token 长度的 `console.log`
  - [MEDIUM] `.dockerignore` 补充 `.env*`、`.git`，防止敏感文件打包进镜像
  - [MEDIUM] Dockerfile 镜像版本锁定为 `node:20.18.3-alpine3.21`，构建可复现
  - [MEDIUM] Docker entrypoint 改为查询 DB 用户数判断是否 seed，不再依赖容器内文件
  - [MEDIUM] ZIP 导入路径遍历修复：skill name 和 asset 文件名净化，防止写出目标目录
  - [MEDIUM] 文件上传添加路径边界检查，防止任意目录创建
  - [MEDIUM] 添加 `Content-Security-Policy` 和 `Strict-Transport-Security` 响应头
  - [MEDIUM] 搜索 API 添加 `visibility=PUBLIC` 过滤，不再返回私有内容
  - [MEDIUM] `.env.example` 补充 `COOKIE_SECURE` 配置说明
  - [MEDIUM] `prisma` 依赖由 `^5.22.0` 改为精确版本，确保生产一致性
  - [MEDIUM] `rbac-migration.sql` `RENAME COLUMN` 改为幂等操作，可重复执行
- **测试**：新增 vitest 测试框架，7 个测试文件覆盖核心安全逻辑

### v1.9（2026-03）
- **全面安全审查**：修复 23 个高危 + 33 个中危问题
  - 认证：JWT role 与数据库一致性校验、middleware 精确路径匹配、安全响应头（X-Frame-Options / X-Content-Type-Options / Referrer-Policy）
  - API：全面输入校验（类型/长度/数量）、try-catch 防止堆栈泄露、stats 改用数据库层聚合 + 内存缓存
  - 前端：layout 改为 Server Component 恢复 SSR/SEO、导航栏改用 next/link、登录注册跳转修复
  - 组件：表单 try-finally 防止按钮卡死、文件上传大小/类型限制、ZIP 文件名 sanitization、YAML frontmatter 转义
  - 构建：Docker 非 root 用户运行、Alpine openssl 修复、entrypoint 种子幂等控制、@types 版本修正
  - 共享：提取 resolveTagIds / validateTags 到 tag-utils.ts

### v1.8（2026-03）
- **Agent 库重构**：156 个预置 Agent 迁移至 PostgreSQL，支持 CRUD，按分类标签筛选（12个分类），默认显示工程类
- **Bug 修复**：
  - 提示词库导出/导入现在遵循选中卡片，而非全局过滤
  - 修复标签删除失效（AntD `mode="tags"` 数字值类型不一致问题）
  - Skill 导入新增 loading 状态、assets 文件正确还原、description 正则修复
- **备份脚本**：`backup.bat` 一键备份源码 + 数据库快照

### v1.7（2026-03）
- **Skill Builder**：可视化编辑器，支持 name/description/references/scripts/assets 编辑，AI 辅助生成触发描述，客户端 jszip 打包下载
- **Skill 库**：Skill 持久化存储（PostgreSQL `skill` 表），列表页（`/skills`）支持搜索、编辑、下载、删除、导入
- **Skill 指南**：Builder 页内置"查看指南" Drawer，渲染 `skill-guide.md`（8 章完整指南，涵盖入门到精通）
- **收藏夹**：Prompt 一键收藏，独立收藏页（`/favorites`）
- **全局搜索**：⌘K / Ctrl+K 唤起，实时全文搜索
- **Docker 部署**：`docker compose up -d --build` 一键启动，自动执行数据库迁移

### v1.6（2026-03）
- **安全加固**：修复 7 个 CRITICAL 级安全漏洞
  - JWT_SECRET 移除硬编码默认值，未配置时服务启动直接报错
  - 未登录用户只能访问 PUBLIC 提示词，杜绝私有数据泄露
  - 导入、批量操作接口添加登录认证，防止匿名写入/删除
  - 版本历史、版本回滚接口添加认证 + 所有权鉴权
  - Cookie 生产环境启用 `secure` 标志，防止 HTTPS 下 token 明文传输
  - 错误响应不再透传内部异常信息

### v1.5（2026-03）
- **数据权限**：Prompt / Workflow 关联创建者（`userId` 外键），编辑/删除仅限本人或 admin
- **可见性过滤**：列表接口自动过滤非本人的 PRIVATE Prompt，`?mine=1` 支持只看自己的
- **前端"我的/全部"切换**：Prompt 列表顶部加 Segmented 快速筛选
- **Admin 路由保护**：`/admin` 及 `/api/admin/*` 非 admin 角色一律拒绝访问（403 / 重定向首页）

### v1.4（2026-03）
- **账户系统**：注册/登录/退出，JWT httpOnly Cookie，全站登录保护
- **API Key 安全**：移除前端 localStorage 存储 Key 的逻辑，AI 路由只读服务端环境变量
- **输入校验**：Prompt POST/PUT 加 title/content 长度校验，AI 路由加请求体大小限制
- **速率限制**：AI 路由基于 IP 每分钟最多 10 次

### v1.3（2026-03）
- **Skill 安装引导**：导出 zip 后展示步骤说明弹窗，包含 Skill 数量限制提醒（≤16）
- **Workflow 详情页**：只读 Drawer 展示步骤内容，无需打开编辑弹窗
- **新增趋势图**：数据看板新增最近 30 天 Prompt 新增折线图（纯 SVG）
- **批量导出 Skill**：勾选多个 Prompt 一键打包下载
- **AI 生成后端**：`POST /api/ai/generate-prompt` 流式接口，兼容 OpenAI 格式

### v1.2
- AI 优化：Prompt 详情页"AI 优化"按钮，流式生成改进版本
- 批量操作：删除、移动分类、打标签、设置可见性

### v1.1
- 单个 Prompt 导出为 Claude Code Skill（zip）
- 工作流导出为 Skill 包
- AFSIM 示例数据（5 个 Prompt + 1 个完整工作流）

### v1.0
- Prompt CRUD、多维度分类、标签、版本历史
- 工作流编排
- 数据看板
