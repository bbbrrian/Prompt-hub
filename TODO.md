# Prompt Hub TODO

## 已完成

- [x] 单个 Prompt 导出为 Claude Code Skill（zip 下载）
- [x] Workflow 导出为 Skill 包（zip，含全部步骤的 SKILL.md）
- [x] AFSIM 示例数据（5 个 Prompt + 1 个完整工作流）
- [x] AI 生成 Prompt（流式，`/api/ai/generate-prompt`）
- [x] AI 优化 Prompt（流式，详情页"AI 优化"按钮）
- [x] 批量操作（删除、移动分类、打标签、设置可见性）
- [x] 批量导出 Skill（多选打包下载）
- [x] Skill 安装引导弹窗（含数量限制提醒 ≤16）
- [x] Workflow 只读详情 Drawer
- [x] 数据看板新增趋势折线图（最近 30 天）
- [x] `src/content/skill-guide.md` — Skill 完整指南（8章）
- [x] **Skill Builder**：可视化编辑器，支持 name/description/references/scripts/assets 编辑，AI 辅助生成触发描述，客户端 jszip 打包下载
- [x] **Skill 库**：Skill 持久化存储（PostgreSQL），列表页（`/skills`）支持搜索、编辑、下载、删除、导入
- [x] `src/app/api/skills/route.ts` — GET 列表，POST 创建
- [x] `src/app/api/skills/[id]/route.ts` — GET 详情，PUT 更新，DELETE 软删除
- [x] `src/app/api/skills/[id]/download/route.ts` — ZIP 打包下载
- [x] `src/app/api/skills/upload-asset/route.ts` — asset 文件上传
- [x] `src/app/api/skills/import/route.ts` — 导入 skill zip / .md
- [x] `src/app/api/ai/suggest-skill-description/route.ts` — AI 辅助生成触发描述
- [x] 导航栏追加 `Skill 库`（`/skills`）入口
- [x] 收藏夹（`/favorites`）
- [x] 全局搜索（⌘K / Ctrl+K）
- [x] Docker 一键部署（`docker compose up -d --build`，自动运行迁移）

---

## 待开发

### 🔴 P0 权限系统升级

#### 一、数据库变更（优先级最高）
- [x] 新增 `Department` 表（id, name, parentId 自关联, createdAt）
- [x] `User` 表改造：role 改为枚举 `SUPER_ADMIN/DEPT_ADMIN/USER`，新增 `departmentId` 外键，新增 `disabled` 字段
- [x] 新增 `AuditLog` 表（userId, action, targetType, targetId, detail, createdAt）
- [x] seed 预置部门：创新中心、研发中心、测评中心、质量部、运营中心、市场部、财务部、综合管理部、保密办（子部门）
- [x] 数据迁移：admin→SUPER_ADMIN，user→USER，现有用户 departmentId=null

#### 二、后端权限检查改造（依赖一）
- [x] 新增统一权限函数 `canModify(user, resource)`：超管全权限，其他人只能改自己的
- [x] JWT Payload 扩展：增加 departmentId
- [x] 中间件更新：`/admin/users` `/admin/departments` 仅 SUPER_ADMIN；`/admin/dept-users` `/admin/audit-log` 需 DEPT_ADMIN 及以上；disabled 用户拒绝登录
- [x] 修改所有写操作 API（prompts/skills/agents/workflows 的 PUT/DELETE）加入 canModify 检查
- [x] 所有写操作写入 AuditLog
- [x] 注册 API 增加 departmentId 参数
- [x] `/api/auth/me` 返回 role、departmentId、departmentName

#### 三、新增 API（依赖一）
- [x] `GET/POST/PUT/DELETE /api/admin/departments` — 部门 CRUD（仅 SUPER_ADMIN）
- [x] `GET/PUT /api/admin/users` — 用户列表和修改角色/部门/启禁用（SUPER_ADMIN）
- [x] `GET /api/admin/audit-log` — 审计日志查询（SUPER_ADMIN 全部 / DEPT_ADMIN 本部门）
- [x] `GET /api/departments` — 公开部门列表（注册页面用）

#### 四、前端权限适配（依赖二）
- [x] PromptCard/SkillCard/AgentCard：根据 canModify 动态显示/隐藏编辑删除按钮，无权限时只显示查看和复制
- [x] 新增「复制到我的」功能按钮
- [x] Navbar 管理入口根据角色动态显示
- [x] 注册页面新增部门选择下拉框（必选）

#### 五、管理后台页面（依赖三）
- [x] `/admin/users` — 用户管理：列表、搜索、按部门筛选、改角色、改部门、启禁用
- [x] `/admin/departments` — 部门管理：树形展示、增删改
- [x] `/admin/dept-users` — 本部门用户管理（DEPT_ADMIN 用）
- [x] `/admin/audit-log` — 审计日志：按操作人/操作类型/目标类型/时间范围筛选

#### 权限矩阵

| 操作 | SUPER_ADMIN | DEPT_ADMIN | USER |
|------|:-----------:|:----------:|:----:|
| 查看公开内容 | ✅ | ✅ | ✅ |
| 查看本部门内容 | ✅ 全部门 | ✅ | ✅ |
| 创建内容 | ✅ | ✅ | ✅ |
| 编辑/删除自己的内容 | ✅ | ✅ | ✅ |
| 编辑/删除他人内容 | ✅ | ❌ | ❌ |
| 复制他人内容到自己名下 | ✅ | ✅ | ✅ |
| 管理部门用户 | ✅ 全部 | ✅ 本部门 | ❌ |
| 管理部门结构 | ✅ | ❌ | ❌ |
| 分配角色 | ✅ | ❌ | ❌ |
| 查看审计日志 | ✅ 全部 | ✅ 本部门 | ❌ |

---

### 🔵 P3 长期规划

- [ ] 工作流在线执行（平台内直接调用 AI 逐步运行，区别于导出 Skill）
- [ ] Prompt 模板市场（内置行业通用模板，一键导入）
- [ ] AI 调用用量统计面板（按用户、按时间段，供管理员审计）
- [ ] CORS 策略配置（限制允许访问的域名）
- [ ] Agent 库支持自定义添加/编辑（当前为静态数据）
