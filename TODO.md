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

### 🔵 P3 长期规划

- [ ] 工作流在线执行（平台内直接调用 AI 逐步运行，区别于导出 Skill）
- [ ] Prompt 模板市场（内置行业通用模板，一键导入）
- [ ] AI 调用用量统计面板（按用户、按时间段，供管理员审计）
- [ ] CORS 策略配置（限制允许访问的域名）
- [ ] Agent 库支持自定义添加/编辑（当前为静态数据）
