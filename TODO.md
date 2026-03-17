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

---

## 待开发

### 🔴 P0 安全修复（优先，上线前必须完成）

#### 账户系统
- [x] Prisma 新增 `User` 表（id / email / passwordHash / role / createdAt）
- [x] `POST /api/auth/register` 注册接口（bcrypt 加密密码，可选限制公司邮箱域名）
- [x] `POST /api/auth/login` 登录接口（返回 JWT，存 httpOnly cookie）
- [x] `POST /api/auth/logout` 退出接口（清除 cookie）
- [x] `GET /api/auth/me` 获取当前用户信息
- [x] `middleware.ts` 全局拦截未登录请求，重定向到 `/login`

#### API Key 安全
- [x] 删除 `admin/page.tsx` 中 localStorage 存储 API Key 的逻辑
- [x] 删除前端从 localStorage 读取并通过 `x-ai-api-key` Header 传递 Key 的逻辑
- [x] AI 路由（generate-prompt / optimize-prompt / test）改为只读服务端环境变量 `AI_API_KEY`

#### 输入校验
- [x] 所有 POST/PUT 路由加字段校验（title 长度、content 大小限制）
- [x] AI 路由加请求体大小限制，防止超大描述消耗 token

#### 速率限制
- [x] AI 路由（`/api/ai/*`）加速率限制，防止接口被滥用烧光 API 余额
  - 基于 IP，每分钟最多 10 次

---

### 🟡 P1 数据权限（账户系统完成后）

- [x] Prompt 表加 `userId` 外键，关联创建者
- [x] Workflow 表加 `userId` 外键
- [x] API 路由校验数据归属：编辑/删除只允许本人或 admin
- [x] Prompt 可见性：`public`（团队可读）/ `private`（仅本人）
- [x] 前端 Prompt 列表区分"我的"和"全部"

---

### 🟡 P1 前端账户 UI

- [x] 登录页 `/login`（邮箱 + 密码）
- [x] 注册页 `/register`
- [x] 顶部导航栏加用户头像 + 退出登录
- [x] 未登录时全站跳转 `/login`
- [x] 分类管理页面（`/admin`）仅 admin 角色可访问

---

### 🟢 P2 功能迭代

#### 新增 agent库
- [x] Agent 库页面（147+ agents，12 个分类，可搜索/过滤/复制 System Prompt）

#### Prompt 功能
- [x] 变量类型系统：`{{变量名}}` 支持类型声明（文本 / 枚举 / 数字），枚举渲染为下拉
- [x] 全局快捷搜索（⌘K / Ctrl+K），支持模糊匹配 + 直接复制
- [x] 批量导入（JSON / CSV 格式）
- [x] 收藏夹：收藏他人公开 Prompt（含 DB 表 + API + 页面）

#### 数据看板
- [x] 按分类 / 标签的 copyCount 使用趋势图
- [ ] 个人使用统计（我创建了多少、被使用多少次）

#### 工作流
- [x] 步骤间变量传递（上一步输出作为下一步输入 `{{step1.output}}`）

---

### 🔵 P3 长期规划

- [ ] 工作流在线执行（平台内直接调用 AI 逐步运行，区别于导出 Skill）
- [ ] Prompt 模板市场（内置行业通用模板，一键导入）
- [ ] AI 调用用量统计面板（按用户、按时间段，供管理员审计）
- [ ] CORS 策略配置（限制允许访问的域名）
