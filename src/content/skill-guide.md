# Agent Skill 完整指南：从入门到精通

> 涵盖：SKILL.md 结构 · 元数据设计 · AI 触发机制 · scripts / references / assets · 多智能体协作 · 生产部署

---

## 第一章：什么是 Agent Skill？（入门篇）

### 1.1 Agent 与传统程序的本质区别

传统程序遵循固定逻辑——给定输入，输出是确定的。而 Agent（智能体）具备感知、规划、执行与反馈的完整闭环，能在不确定环境中自主完成复杂任务。

| 维度 | 传统程序 | AI Agent |
|------|----------|----------|
| 执行方式 | 固定指令序列 | 动态规划与决策 |
| 对环境的适应 | 需手动修改代码 | 自主感知并调整策略 |
| 错误处理 | 预设异常分支 | 自主重试与路径切换 |
| 工具使用 | 硬编码 API 调用 | 按需选择工具 |
| 目标导向 | 过程导向（How） | 结果导向（What） |

### 1.2 Skill 的定义

Skill（技能）是 Agent 能力的最小可复用单元。一个 Skill 封装了特定领域的知识与操作能力，例如：

- **网页搜索 Skill**：给定查询词，返回摘要结果
- **代码执行 Skill**：接收 Python 代码，返回运行结果
- **邮件发送 Skill**：填写收件人与正文，完成发送
- **数据库查询 Skill**：接收 SQL，返回结构化数据

> 📌 **核心思想**
>
> Skill 不只是一个工具调用（Tool Call）。完整的 Skill 包含元数据、执行逻辑、辅助脚本和参考资料，是一个有组织的能力包（Capability Package）。AI 通过阅读元数据决定何时使用它，通过 SKILL.md 了解如何使用它。

### 1.3 为什么需要 Skill？

没有 Skill 的 Agent 就像一个聪明但手无缚鸡之力的人——它能思考，却无法与外界交互。Skill 解决了以下核心问题：

- **能力扩展**：让 LLM 突破知识截止日期，访问实时信息
- **动作执行**：让 Agent 不只是「说」，还能「做」
- **专业深度**：将领域专业知识封装为可调用的能力单元
- **安全边界**：通过 Skill 接口控制 Agent 的权限范围

### 1.4 Agent Skill 的生态全景

| 框架 | Skill 的称呼 | 协议标准 |
|------|------------|---------|
| LangChain | Tool / Toolkit | 自定义 |
| AutoGPT | Plugin | 自定义 |
| Claude (Anthropic) | Tool Use / Skill | JSON Schema + MCP |
| OpenAI | Function Calling | JSON Schema |
| MCP 协议 | Tool | Model Context Protocol |
| Semantic Kernel | Plugin / Skill | OpenAI 兼容 |

---

## 第二章：Skill 的基础架构（初级篇）

### 2.1 一个 Skill 的解剖

无论使用哪种框架，一个完整的 Skill 定义包含以下核心要素：

```json
{
  "name": "search_web",
  "description": "搜索互联网获取实时信息，适用于需要当前数据的查询",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "搜索关键词，建议简洁精准，3-6 个词效果最佳"
      },
      "max_results": {
        "type": "integer",
        "description": "返回结果数量，默认 5，最大 20",
        "default": 5
      }
    },
    "required": ["query"]
  }
}
```

### 2.2 Skill 的五要素

| 要素 | 说明 | 常见错误 |
|------|------|---------|
| 命名（Name） | 动词 + 名词格式，清晰描述功能 | 过于抽象如 `process_data` |
| 描述（Description） | 说明何时使用、适用场景、限制条件 | 只写「处理数据」缺少上下文 |
| 输入规范（Input Schema） | 精确的参数类型、格式和约束 | 参数过多或类型不明确 |
| 输出规范（Output Schema） | 明确返回值结构，便于解析 | 返回非结构化字符串 |
| 错误处理（Error Handling） | 明确的失败模式和错误码 | 吞掉异常导致 Agent 困惑 |

### 2.3 Skill 的执行流程

1. 用户发送消息给 Agent（LLM）
2. LLM 分析需求，决定是否以及调用哪个 Skill
3. LLM 生成 Skill 调用请求（含参数）
4. 应用层执行真正的 Skill 函数并获取结果
5. 将结果回传给 LLM，LLM 生成最终自然语言回复

> 📌 **关键理解**
>
> LLM 本身不执行 Skill！它只是「决定调用什么」并「解析结果」。真正的执行发生在你的应用代码中。这种设计使 Skill 可以访问任何系统，无论是数据库、API 还是操作系统。

---

## 第三章：创建你的第一个 Skill——文件结构精讲（核心篇）

这一章是本文档最重要的部分。我们将详细剖析一个真实 Skill 的每个文件、每个字段的作用，以及 AI 是如何读取和触发它的。

### 3.1 Skill 的完整目录结构

一个完整的 Skill 是一个文件夹，包含以下结构：

```
my-skill/
├── SKILL.md          ← 核心文件（必须）：AI 阅读的主指令
├── LICENSE.txt       ← 授权说明（可选）
├── scripts/          ← 可执行脚本（可选）：确定性/重复性任务
│   ├── process.py
│   └── validate.py
├── references/       ← 参考文档（可选）：按需加载的详细知识
│   ├── api-guide.md
│   └── error-codes.md
└── assets/           ← 静态资源（可选）：模板、图标、字体等
    ├── template.xlsx
    └── logo.png
```

> 📌 **渐进式披露（Progressive Disclosure）**
>
> Claude 采用「按需加载」策略读取 Skill：
> - **元数据**（name + description）始终在上下文中，约占 100 字
> - **SKILL.md 正文**在 Skill 触发时加载（建议 500 行以内）
> - **scripts / references / assets** 只在需要时才读取，没有大小限制
>
> 这意味着你可以把非常详细的参考内容放在 `references/` 里，而不用担心占用 AI 的上下文窗口。

### 3.2 SKILL.md 逐行解析

SKILL.md 分为两个部分：YAML 前置元数据（Frontmatter）和 Markdown 正文指令。

#### 3.2.1 YAML Frontmatter（元数据区）

文件最顶部，由两行 `---` 包围的区域就是 YAML Frontmatter，这是 AI 最先读取的内容：

```yaml
---
name: weather-reporter
description: 获取指定城市的实时天气和未来7天预报。当用户询问任何
             城市的天气、温度、降雨概率、穿衣建议时，使用此 Skill。
             即使用户没有明确说「查天气」，只要涉及出行、穿搭、户
             外活动等需要气象信息的场景也应触发此 Skill。
license: MIT
---
```

**字段详解：name（名称）**

`name` 是 Skill 的唯一标识符。规则如下：
- 使用小写字母和连字符，如 `weather-reporter`、`pdf-analyzer`
- 清晰描述功能，通常是「动作-对象」格式
- 全局唯一，不能与其他已安装的 Skill 重名
- 不影响 AI 的触发决策，主要用于管理和引用

| ❌ 不好的 name | ✅ 好的 name |
|--------------|------------|
| `tool1` | `weather-reporter` |
| `my-skill` | `pdf-form-filler` |
| `process` | `sql-query-runner` |
| `helper` | `email-drafter` |
| `data` | `code-reviewer` |

**字段详解：description（描述）——最关键的字段**

`description` 是决定 AI 是否触发该 Skill 的核心字段，也是整个 SKILL.md 中最值得花时间打磨的部分。

> ⚠️ **重要机制说明**
>
> Claude 在收到用户消息后，会扫描所有已安装 Skill 的 `name + description`，判断是否需要查阅某个 Skill。描述写得不清晰，Skill 就不会被触发——就算你的 Skill 功能再强大也是摆设。**description 的质量 = Skill 的可发现性。**

一个高质量的 description 必须包含以下信息：
1. Skill 能做什么（功能概述）
2. 什么情况下应该触发（使用场景，越具体越好）
3. 关键词覆盖（用户可能用到的各种表达方式）
4. 不适用场景（可选，避免误触发）

```yaml
# ❌ 糟糕的 description（过于简单，AI 不知道何时使用）
description: 处理 PDF 文件

# ⚠️ 一般的 description（有功能说明，缺少触发场景）
description: 读取、合并、拆分 PDF 文件，提取文字和表格

# ✅ 优秀的 description（功能 + 场景 + 关键词 + 提示主动触发）
description: >
  处理 PDF 文件的完整工具集。包括：读取并提取文字/表格内容、
  合并多个 PDF、拆分 PDF 为单页、旋转页面、添加水印、填写 PDF
  表单字段、对扫描版 PDF 进行 OCR 识别使其可搜索、加密/解密
  PDF。当用户提到 .pdf 文件、要求处理文档、填写表单、提取内容、
  合并文件时，必须使用此 Skill。即使用户没有说「PDF」，只要涉及
  文件格式转换或文档处理，也应考虑触发此 Skill。
```

**description 写作的反直觉技巧：「主动」而非「被动」**

研究发现，Claude 有低触发（undertrigger）的倾向——即本该使用 Skill 却没用。解决方法是在 description 中明确指示何时「必须」使用：

```yaml
# 被动写法（容易漏触发）：
description: 创建 Excel 表格和图表

# 主动写法（明确触发条件）：
description: >
  创建、读取、编辑 Excel(.xlsx)、CSV 表格文件，生成图表。
  当用户要求处理表格数据、生成报表、制作 Excel 文件、清洗数据、
  添加公式时，必须使用此 Skill。即使用户只说「帮我做个表格」或
  「整理一下这些数据」，也应主动触发此 Skill 而非自行生成文本。
```

#### 3.2.2 SKILL.md 正文（指令区）

Frontmatter 之后的 Markdown 内容就是给 AI 的操作指令。正文的质量直接决定 AI 执行任务的效果。

**一个实际的 SKILL.md 完整示例（天气查询 Skill）：**

```markdown
---
name: weather-reporter
description: 获取城市实时天气和预报。当用户问任何关于天气、温度、
             降雨、出行建议等问题时触发。即使用户只说「明天要出门」
             或「该穿什么」也应主动使用此 Skill 提供气象建议。
---

# 天气查询 Skill

本 Skill 通过 Open-Meteo API（免费，无需 Key）获取实时天气数据。

## 快速开始

城市名称需先转换为经纬度坐标，再查询天气。
执行步骤：
1. 调用 Geocoding API 将城市名转为坐标
2. 用坐标调用 Weather API 获取数据
3. 解析并以友好格式呈现给用户

## 输出格式

ALWAYS 使用以下格式输出（不要只罗列数字）：
- 先给出一句自然语言摘要（如「今天北京晴，气温 18-26°C，适合出行」）
- 再提供详细数据表格
- 最后根据天气给出穿衣/出行建议

## 错误处理

- 城市不存在：提示用户检查拼写，并给出几个近似城市供选择
- API 超时：最多重试 2 次，仍失败则告知用户稍后再试

详细的 API 响应字段说明见 references/api-fields.md
```

#### 3.2.3 正文的黄金写作原则

| 原则 | 说明 | 示例 |
|------|------|------|
| 解释「为什么」 | 不只说「做什么」，说清楚原因，让 AI 举一反三 | 「城市需转坐标，因为天气 API 只接受经纬度」 |
| 使用祈使句 | 直接给出指令，减少歧义 | 「先调用 Geocoding API，再查询天气」 |
| 明确输出格式 | 用 ALWAYS/模板/示例固定关键输出 | 「ALWAYS 先输出摘要，再输出表格」 |
| 指向参考文件 | 超过 300 行的详细内容放 references/ | 「详细字段说明见 references/api-fields.md」 |
| 保持在 500 行内 | 超出后拆分到 references/ 并添加目录 | 「高级用法见 references/advanced.md」 |

### 3.3 scripts/ 目录——封装确定性逻辑

`scripts/` 目录存放可执行的脚本文件，通常是 Python 或 Shell 脚本。当一个操作需要精确执行、重复使用，或者用自然语言描述容易出错时，就应该把它封装成脚本。

> 💡 **什么时候需要 scripts/？**
>
> 当你发现多个测试用例的 AI 都在「独立地写相同的辅助代码」——比如每次都写一个 `parse_response.py`——这就是强烈信号：把这段代码写一次，放进 `scripts/`，让每次调用都直接用现成的，既快又准确。

**典型使用场景：**
- 文件格式转换（PDF ↔ DOCX、Excel 解析）
- 数据验证（检查输出是否符合 Schema）
- 打包/解包复杂文件（ZIP 操作、DOCX XML 编辑）
- 批量处理（循环处理大量文件）
- 依赖外部工具的操作（调用 LibreOffice、ffmpeg 等）

**编写好脚本的要点：**
- 脚本要有清晰的 `--help` 说明，AI 需要理解如何调用
- 输出要结构化：成功时打印结果，失败时打印错误原因并以非零状态退出
- 脚本应该是幂等的：多次运行结果相同，不产生副作用
- 在 SKILL.md 中给出完整的调用示例，包含所有必要参数

### 3.4 references/ 目录——存放详细知识

`references/` 存放大量的参考文档，只在需要时被加载到上下文中。这是解决「SKILL.md 内容太多会占满上下文」问题的核心机制。

| 文件类型 | 内容 | 何时加载 |
|---------|------|---------|
| api-guide.md | 完整的 API 参数说明、响应字段解释 | 需要调用该 API 时 |
| error-codes.md | 所有错误码及解决方案 | 遇到错误需要诊断时 |
| advanced.md | 高级功能、边缘情况处理 | 用户需要非常规操作时 |
| examples.md | 丰富的输入输出示例 | 需要参考案例时 |

**在 SKILL.md 中引用 references/ 的方式：**

```markdown
## 高级选项
如果用户需要以下功能，请先阅读 references/advanced.md：
- 批量处理多个文件
- 自定义输出格式

## 错误排查
遇到 API 返回错误码时，查阅 references/error-codes.md 获取解决方案。
```

> 如果某个 references/ 文件超过 300 行，在文件开头添加目录，帮助 AI 快速定位。

### 3.5 assets/ 目录——静态资源

`assets/` 存放 Skill 在生成输出时需要用到的静态文件，例如模板、图标、字体等。

**典型内容：**
- 文档模板：`report-template.docx`、`invoice-template.xlsx`
- 图像资源：`logo.png`、`placeholder-avatar.png`
- 字体文件：`custom-font.ttf`（生成 PDF 时嵌入）
- 配置文件：`default-config.json`（Skill 的默认参数）

### 3.6 AI 如何决定触发哪个 Skill？

**触发流程：**

1. 用户发送消息
2. Claude 扫描所有已安装 Skill 的 `name + description`（始终在上下文中）
3. Claude 判断：这个任务是否超出我自身能力？是否有匹配的 Skill？
4. 如果匹配，Claude 读取对应的 SKILL.md 正文（触发加载）
5. Claude 按照 SKILL.md 的指令执行任务

> ⚠️ **关键认知：Claude 只对复杂任务触发 Skill**
>
> 简单的单步任务（「给我一段 Python 代码」）通常不会触发 Skill，因为 Claude 可以直接完成。复杂的多步骤、需要专业知识或外部工具的任务才会稳定触发。

**触发优化技巧：**

| 问题 | 原因 | 解决方案 |
|------|------|---------|
| Skill 从不被触发 | description 太模糊或太简短 | 扩展 description，加入具体触发场景 |
| Skill 被错误触发 | description 关键词与其他任务重叠 | 在 description 中加入「不适用场景」说明 |
| 触发后执行效果差 | SKILL.md 正文指令不够清晰 | 增加示例、明确输出格式、解释「为什么」 |
| 偶尔触发偶尔不触发 | description 缺少触发指示词 | 添加「必须使用此 Skill」「应主动触发」等 |

---

## 第四章：核心 Skill 类型详解（中级篇）

### 4.1 信息检索类 Skill

| Skill 类型 | 典型实现 | 适用场景 |
|-----------|---------|---------|
| Web 搜索 | Bing/Google Search API | 实时新闻、价格查询 |
| 向量检索（RAG） | Pinecone / Weaviate | 企业知识库、文档问答 |
| SQL 查询 | PostgreSQL / MySQL | 结构化业务数据 |
| API 调用 | REST / GraphQL | 第三方服务集成 |
| 文件读取 | 本地 FS / S3 / GDrive | 文档处理、报告生成 |

### 4.2 动作执行类 Skill

- **代码执行（Code Interpreter）**：运行 Python/JS，处理数据、生成图表
- **浏览器操控（Browser Use）**：点击、填表、截图，实现 RPA 自动化
- **邮件/日历操作**：发送邮件、创建会议，无缝集成日常工作流
- **文件生成**：创建 Excel、PDF、Word 文档
- **系统命令**：执行 Shell 命令，管理服务器资源

> ⚠️ **安全警告**
>
> 动作执行类 Skill 具有副作用，必须实现权限校验和审计日志。建议在沙箱环境中执行，并对高危操作（删除、支付、发送）引入人工确认（Human-in-the-Loop）机制。

### 4.3 Skill 的正交设计原则

- **单一职责**：一个 Skill 解决一类问题，避免多功能 Skill
- **只读优先**：查询与写入分离，无副作用的 Skill 优先
- **幂等性**：重复调用同一 Skill 结果相同（对读取 Skill）
- **最小权限**：Skill 只申请完成任务所需的最小权限
- **明确边界**：Skill 的适用范围在 description 中清晰说明

---

## 第五章：高级 Skill 模式（高级篇）

### 5.1 Skill 组合与工具链

**示例：「生成竞品分析报告」的工具链**

```
search_web → extract_data → analyze_data → create_chart → write_report
（搜索竞品） （提取数据）   （数据分析）   （生成图表）   （输出报告）
```

### 5.2 ReAct 模式：Reasoning + Acting

```python
def react_loop(task, tools, max_steps=10):
    history = []
    for step in range(max_steps):
        thought = llm.think(task, history, tools)
        if thought.is_done:
            return thought.final_answer
        tool_name, tool_input = thought.action
        observation = execute_skill(tool_name, tool_input)
        history.append({
            'thought': thought.reasoning,
            'action': f'{tool_name}({tool_input})',
            'observation': observation
        })
    raise Exception('超过最大步骤数')
```

### 5.3 并行 Skill 调用

```python
async def execute_parallel_skills(tool_calls):
    tasks = [asyncio.create_task(execute_skill_async(c['name'], c['input']))
             for c in tool_calls]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    return results

# 串行 3 个各需 1s 的 Skill = 3s
# 并行 3 个各需 1s 的 Skill = ~1s（提升 3x）
```

### 5.4 错误恢复与重试策略

| 错误类型 | 恢复策略 | 示例 |
|---------|---------|------|
| 网络超时 | 指数退避重试（3 次） | 搜索 API 超时 |
| 参数错误 | 让 LLM 修正参数后重试 | 日期格式不正确 |
| 权限不足 | 降级到备用 Skill | 无权访问数据库 |
| 结果为空 | 换用不同搜索词或 Skill | 搜索无结果 |

---

## 第六章：MCP 协议——Skill 的统一标准（进阶篇）

### 6.1 什么是 MCP？

MCP（Model Context Protocol）是 Anthropic 发布的开放协议，旨在标准化 LLM 应用与外部工具/数据源的连接方式。MCP 就像 AI 世界的「USB 接口」——一次实现，到处可用。

> 💡 **MCP 的核心价值**
>
> 在 MCP 之前：每个框架都有自己的接口，供应商需要为 LangChain、AutoGPT、Claude 分别开发。有了 MCP：实现一个 MCP Server，所有支持 MCP 的客户端都能直接使用。

### 6.2 MCP Server 开发示例

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP('my-skill-server')

@mcp.tool()
def search_database(query: str, table: str = 'products') -> dict:
    """搜索内部数据库，支持产品、订单、用户等表"""
    conn = get_db_connection()
    results = conn.execute(
        f'SELECT * FROM {table} WHERE content LIKE ?',
        [f'%{query}%']
    ).fetchall()
    return {'results': results, 'count': len(results)}

@mcp.resource('config://app-settings')
def get_settings() -> str:
    """暴露应用配置作为只读资源"""
    return open('settings.json').read()

if __name__ == '__main__':
    mcp.run(transport='stdio')
```

### 6.3 MCP 的三类能力

| 能力类型 | 描述 | 典型用例 |
|---------|------|---------|
| Tools（工具） | 可被 LLM 调用的函数，有副作用 | 发送邮件、写入数据库 |
| Resources（资源） | 只读数据访问，无副作用 | 读取配置、查询文档 |
| Prompts（提示词） | 预定义的提示词模板 | 生成报告、代码审查模板 |

---

## 第七章：多智能体系统中的 Skill 共享（专家篇）

### 7.1 多 Agent 架构模式

| 架构模式 | 特点 | 适用场景 |
|---------|------|---------|
| 主从式（Orchestrator） | 一个主 Agent 协调多个子 Agent | 任务分解与并行执行 |
| 点对点（P2P） | Agent 直接相互调用 | 松耦合协作 |
| 市场式（Marketplace） | Agent 动态发现和雇佣其他 Agent | 动态任务分配 |
| 流水线（Pipeline） | Agent 按序传递任务 | 有明确流程的工作流 |

### 7.2 Skill 注册与发现

```python
class SkillRegistry:
    def __init__(self):
        self.skills = {}
        self.embeddings = {}

    def register(self, skill_def, handler_fn):
        self.skills[skill_def['name']] = {
            'definition': skill_def,
            'handler': handler_fn,
            'usage_count': 0,
        }
        self.embeddings[skill_def['name']] = embed(skill_def['description'])

    def discover(self, task_description, top_k=5):
        task_vec = embed(task_description)
        scores = {name: cosine_similarity(task_vec, vec)
                  for name, vec in self.embeddings.items()}
        return sorted(scores, key=scores.get, reverse=True)[:top_k]
```

### 7.3 Skill 的评估指标

| 评估维度 | 关键指标 | 优化手段 |
|---------|---------|---------|
| 准确性 | 调用成功率、结果正确率 | 增加参数校验、改进描述 |
| 效率 | 平均延迟、P95 延迟 | 缓存、并发优化 |
| 选择率 | Agent 选择该 Skill 的频率 | 优化 description 清晰度 |
| 错误率 | 参数错误、超时、异常比率 | 完善错误处理和重试 |
| 成本 | Token 消耗、API 费用 | 合并 Skill、减少往返 |

---

## 第八章：生产部署最佳实践（精通篇）

### 8.1 安全设计检查清单

- ✅ 输入验证（防止 Prompt Injection）
- ✅ 输出过滤（防止敏感信息泄露）
- ✅ 权限最小化（每个 Skill 只有最小必要权限）
- ✅ 审计日志（记录所有 Skill 调用及参数）
- ✅ 速率限制（防止滥用和 DDoS）
- ✅ 沙箱执行（代码执行类 Skill 必须隔离）

### 8.2 性能优化技巧

| 优化技术 | 适用场景 | 预期收益 |
|---------|---------|---------|
| 结果缓存（Redis） | 频繁重复查询（天气、汇率） | 延迟降低 90%+ |
| 批量调用 | 批量处理同类请求 | 吞吐量提升 3-5x |
| 连接池 | 数据库/API 连接复用 | 资源利用率提升 |
| 异步执行 | I/O 密集型 Skill | 并发提升 10x+ |

### 8.3 企业级 Skill 平台建设路线图

| 阶段 | 目标 | 关键产出 |
|------|------|---------|
| 第 1-2 周 | 验证核心 Skill 可行性 | 3-5 个核心 Skill，PoC |
| 第 3-4 周 | 构建基础设施 | 注册中心、监控、日志 |
| 第 5-8 周 | 扩展 Skill 生态 | 20+ Skill，覆盖核心场景 |
| 第 9-12 周 | 生产化与安全加固 | 完整测试、安全审计 |
| 持续 | 迭代优化 | 数据驱动的 Skill 改进 |

---

## 附录：速查手册

### SKILL.md 写作速查

| 部分 | 字段/内容 | 关键要点 |
|------|---------|---------|
| Frontmatter | `name` | 小写+连字符，动作-对象格式，全局唯一 |
| Frontmatter | `description` | 功能+场景+关键词+触发提示，**最关键字段** |
| 正文 | 功能说明 | 解释「为什么」，而非只说「做什么」 |
| 正文 | 操作步骤 | 用祈使句，给出具体命令和代码 |
| 正文 | 输出格式 | 用 ALWAYS + 模板固定关键输出格式 |
| 正文 | references 引用 | 明确说明何时阅读哪个参考文件 |
| scripts/ | 脚本文件 | 有 --help，有结构化输出，幂等，SKILL.md 给调用示例 |
| references/ | 参考文档 | 超 300 行加目录，SKILL.md 明确引用时机 |
| assets/ | 静态资源 | 模板/图标/字体，SKILL.md 说明用途和位置 |

### 常见问题速查

| 问题 | 解答 |
|------|------|
| Skill 从不被触发 | 扩展 description，加入具体触发场景，添加「必须使用此 Skill」等主动提示 |
| description 应该多长？ | 建议 50-150 字，覆盖主要使用场景和关键词，不要只有一句话 |
| SKILL.md 超过 500 行怎么办？ | 将详细内容移入 references/ 文件，在 SKILL.md 中添加清晰的跳转指引 |
| 什么内容放 scripts/ vs 正文？ | 确定性/重复性/容易出错的操作放 scripts/，灵活的指导方针放正文 |
| AI 读取 references/ 需要手动触发吗？ | 不需要，AI 会根据 SKILL.md 中的指引自行判断何时读取哪个文件 |
| 如何测试 description 的触发效果？ | 创建测试集，包含应触发和不应触发的用例，逐一验证 |

### 学习路径推荐

1. 阅读 [Anthropic Tool Use 官方文档](https://docs.anthropic.com)
2. 按本文第三章步骤创建你的第一个 Skill
3. 学习 [MCP 协议规范](https://modelcontextprotocol.io)
4. 研究 LangChain、AutoGPT 等框架的 Tool 实现
5. 参与开源 MCP Server 开发，积累实战经验
