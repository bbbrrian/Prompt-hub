import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dims = await Promise.all([
    prisma.dimension.upsert({ where: { name: '应用场景' }, update: {}, create: { name: '应用场景', sortOrder: 1 } }),
    prisma.dimension.upsert({ where: { name: '角色类型' }, update: {}, create: { name: '角色类型', sortOrder: 2 } }),
    prisma.dimension.upsert({ where: { name: '输出格式' }, update: {}, create: { name: '输出格式', sortOrder: 3 } }),
  ])

  const cats: Record<string, Awaited<ReturnType<typeof prisma.category.create>>> = {}
  const catData = [
    { name: '代码开发', dimIdx: 0 },
    { name: '文案写作', dimIdx: 0 },
    { name: '数据分析', dimIdx: 0 },
    { name: '产品设计', dimIdx: 0 },
    { name: '翻译', dimIdx: 0 },
    { name: '军事仿真', dimIdx: 0 },
    { name: '程序员', dimIdx: 1 },
    { name: '产品经理', dimIdx: 1 },
    { name: '设计师', dimIdx: 1 },
    { name: '分析师', dimIdx: 1 },
    { name: '写手', dimIdx: 1 },
    { name: '仿真工程师', dimIdx: 1 },
    { name: 'Markdown', dimIdx: 2 },
    { name: 'JSON', dimIdx: 2 },
    { name: '表格', dimIdx: 2 },
    { name: '纯文本', dimIdx: 2 },
  ]
  for (const c of catData) {
    cats[c.name] = await prisma.category.upsert({
      where: { id: 0 },
      update: {},
      create: { name: c.name, dimensionId: dims[c.dimIdx].id, sortOrder: 0 },
    }).catch(() =>
      prisma.category.create({ data: { name: c.name, dimensionId: dims[c.dimIdx].id, sortOrder: 0 } })
    )
  }

  const tagData = [
    { name: 'GPT-4', color: '#00ffff' },
    { name: 'Claude', color: '#bf00ff' },
    { name: '通用', color: '#0080ff' },
    { name: '高级', color: '#ff6b6b' },
    { name: '入门', color: '#51cf66' },
    { name: 'AFSIM', color: '#ff9900' },
    { name: '军事仿真', color: '#cc3333' },
  ]
  const tags: Record<string, Awaited<ReturnType<typeof prisma.tag.create>>> = {}
  for (const t of tagData) {
    tags[t.name] = await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: { name: t.name, color: t.color },
    })
  }

  const prompts = [
    {
      title: '代码审查助手',
      content: '你是一位资深的代码审查专家。请仔细审查以下代码，从以下几个维度给出反馈：\n1. 代码质量和可读性\n2. 潜在的 Bug 和安全漏洞\n3. 性能优化建议\n4. 最佳实践建议\n\n请以表格形式输出，包含：问题位置、严重程度（高/中/低）、问题描述、修改建议。\n\n代码：\n{{code}}',
      description: '对提交的代码进行全面审查，输出结构化的审查报告',
      author: 'DevTeam',
      categories: ['代码开发', '程序员'],
      tags: ['通用', '高级'],
    },
    {
      title: 'API 接口文档生成',
      content: '根据以下代码自动生成 RESTful API 文档，要求：\n- 使用 Markdown 格式\n- 包含请求方法、URL、参数说明、请求体示例、响应示例\n- 标注必填/选填参数\n- 添加错误码说明\n\n代码：\n{{code}}',
      description: '从代码自动生成标准的 API 文档',
      author: 'DevTeam',
      categories: ['代码开发', 'Markdown'],
      tags: ['通用'],
    },
    {
      title: '产品需求文档 (PRD) 撰写',
      content: '你是一位经验丰富的产品经理。请根据以下需求描述，撰写一份完整的 PRD 文档，包含：\n1. 需求背景与目标\n2. 用户故事\n3. 功能需求（分优先级 P0/P1/P2）\n4. 非功能需求\n5. 数据指标\n6. 风险评估\n\n需求描述：\n{{requirement}}',
      description: '根据简要需求生成完整的产品需求文档',
      author: 'ProductTeam',
      categories: ['产品设计', '产品经理'],
      tags: ['通用', '高级'],
    },
    {
      title: '周报生成器',
      content: '请将以下工作内容整理为一份专业的周报：\n\n格式要求：\n## 本周完成\n- 按项目分类列出\n\n## 进行中\n- 当前进度和预计完成时间\n\n## 下周计划\n- 优先级排序\n\n## 风险与问题\n- 需要协助的事项\n\n工作内容：\n{{content}}',
      description: '将零散的工作记录整理为格式化周报',
      author: 'Admin',
      categories: ['文案写作', 'Markdown'],
      tags: ['通用', '入门'],
    },
    {
      title: 'SQL 查询优化',
      content: '你是一位数据库性能调优专家。请分析以下 SQL 查询并给出优化建议：\n\n1. 分析查询执行计划\n2. 找出性能瓶颈\n3. 提供优化后的 SQL\n4. 建议需要创建的索引\n5. 估算优化前后的性能差异\n\nSQL 查询：\n{{sql}}\n\n表结构：\n{{schema}}',
      description: '分析 SQL 查询性能并给出优化方案',
      author: 'DataTeam',
      categories: ['数据分析', '程序员'],
      tags: ['高级'],
    },
    {
      title: '中英互译（技术文档）',
      content: '你是一位专业的技术文档翻译。请将以下内容翻译为{{target_language}}，要求：\n- 保持技术术语的准确性（常用术语保留英文）\n- 语句通顺自然，符合目标语言习惯\n- 代码块和变量名不翻译\n- 保持原文格式（Markdown等）\n\n原文：\n{{text}}',
      description: '高质量技术文档中英互译',
      author: 'DevTeam',
      categories: ['翻译', '纯文本'],
      tags: ['通用'],
    },
    {
      title: 'JSON 数据转换器',
      content: '请将以下数据转换为指定的 JSON 格式：\n\n目标格式说明：\n{{format_description}}\n\n原始数据：\n{{raw_data}}\n\n要求：\n- 输出合法的 JSON\n- 处理缺失字段（使用 null）\n- 数据类型正确\n- 如有数组，保持顺序',
      description: '将任意格式数据转换为指定 JSON 结构',
      author: 'DevTeam',
      categories: ['数据分析', 'JSON'],
      tags: ['通用', '入门'],
    },
    {
      title: 'UI 组件需求描述',
      content: '你是一位 UI/UX 设计师。请根据以下功能需求，输出详细的 UI 组件设计方案：\n\n1. 组件结构（层级关系）\n2. 交互状态（默认/悬停/激活/禁用/加载/错误）\n3. 响应式适配方案\n4. 无障碍（a11y）要求\n5. 动效说明\n\n功能需求：\n{{requirement}}',
      description: '生成详细的 UI 组件设计规范',
      author: 'DesignTeam',
      categories: ['产品设计', '设计师'],
      tags: ['高级'],
    },
    {
      title: 'AFSIM 想定背景设计',
      content: '你是一位军事仿真专家，熟悉 AFSIM（Advanced Framework for Simulation, Integration, and Modeling）仿真框架。\n\n请根据以下作战概念，设计一份完整的想定背景文档，输出内容包括：\n\n1. **想定名称与编号**\n2. **作战背景**：时间、地域、政治军事形势\n3. **参演方定义**：蓝方、红方（名称、类型、作战目的）\n4. **想定地理环境**：作战区域坐标范围（WGS84）、地形特征、气象条件\n5. **仿真时间设置**：开始时间、结束时间、时间步长建议\n6. **AFSIM 配置建议**：推荐使用的 scenario 文件结构骨架\n\n作战概念描述：\n{{concept}}',
      description: '根据作战概念生成 AFSIM 想定背景文档与场景配置骨架',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [{ name: 'concept', label: '作战概念描述', required: true, defaultValue: '' }],
    },
    {
      title: 'AFSIM 兵力编成与平台定义',
      content: '你是一位 AFSIM 仿真工程师。请根据以下兵力编成需求，生成 AFSIM 平台定义配置内容，包括：\n\n1. **平台清单**：列出所有需定义的平台类型（飞机、舰船、地面车辆、导弹等）\n2. **每个平台的关键属性**：\n   - platform_type 名称（符合 AFSIM 命名规范）\n   - 运动模型（AIR_VEHICLE / SURFACE_VESSEL / GROUND_VEHICLE）\n   - 最大速度、巡航速度、最大高度\n   - 初始位置（经纬度）与编队结构\n3. **AFSIM script 片段**：输出可直接用于 .afsim 文件的 platform 定义代码块\n4. **注意事项**：数量限制、命名冲突规避建议\n\n兵力编成描述：\n{{order_of_battle}}\n\n所属想定背景：\n{{scenario_context}}',
      description: '生成 AFSIM 兵力编成的平台定义配置与 script 片段',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'order_of_battle', label: '兵力编成描述', required: true, defaultValue: '' },
        { name: 'scenario_context', label: '所属想定背景', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 传感器与武器系统配置',
      content: '你是一位 AFSIM 传感器与武器建模专家。请根据以下装备需求，生成传感器和武器系统的 AFSIM 配置内容：\n\n**传感器配置**（针对每个传感器输出）：\n- sensor 类型（RADAR / ESM / EO_IR / SONAR 等）\n- 探测距离、扫描扇区、更新频率\n- 目标类型过滤（AIR / SURFACE / SUBSURFACE）\n- AFSIM sensor 定义代码块\n\n**武器系统配置**（针对每个武器输出）：\n- weapon 类型与制导方式\n- 最大射程、最小射程、杀伤概率（Pk）\n- 允许的挂载平台\n- AFSIM weapon 定义代码块\n\n**交战规则（ROE）建议**：自动/手动交战条件设置\n\n装备需求清单：\n{{equipment_list}}\n\n挂载平台清单：\n{{platform_list}}',
      description: '生成 AFSIM 传感器与武器系统的完整配置代码',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'equipment_list', label: '装备需求清单', required: true, defaultValue: '' },
        { name: 'platform_list', label: '挂载平台清单', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 任务脚本与行为规划',
      content: '你是一位 AFSIM 任务规划专家。请根据以下作战任务，生成 AFSIM 任务脚本配置，包括：\n\n1. **任务类型识别**：制空、对地打击、侦察、反舰、防空压制等\n2. **航路点规划**（WaypointRoute）：\n   - 各航路点坐标（经纬高）\n   - 速度与高度约束\n   - 航路点动作（武器投放、传感器开关、编队变换）\n3. **行为树配置建议**：使用 AFSIM Task 模块的行为逻辑\n4. **通信与协同**：组网方式、数据链配置建议（Link 16 / TTNT 等）\n5. **AFSIM script 输出**：完整的 task / route 定义代码块\n\n作战任务描述：\n{{mission}}\n\n参与平台：\n{{platforms}}\n\n想定时间窗口：\n{{time_window}}',
      description: '生成 AFSIM 作战任务的航路规划与行为脚本配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'mission', label: '作战任务描述', required: true, defaultValue: '' },
        { name: 'platforms', label: '参与平台', required: false, defaultValue: '' },
        { name: 'time_window', label: '想定时间窗口', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 仿真结果分析',
      content: '你是一位军事仿真分析专家。请根据以下 AFSIM 仿真输出数据，进行结构化分析，输出包括：\n\n1. **作战效能评估**\n   - 蓝/红方任务完成率\n   - 目标毁伤统计（已摧毁 / 未摧毁 / 损伤）\n   - 己方损耗统计与损耗原因分析\n\n2. **关键事件时间线**：按时间轴列出首次接触、首次交战、关键节点\n\n3. **传感器与武器效能**\n   - 各传感器探测概率统计\n   - 各武器命中率 vs 理论 Pk 对比\n\n4. **战术薄弱点识别**：基于数据指出蓝方或红方的战术漏洞\n\n5. **改进建议**：针对薄弱点提出想定调整或战术优化方向\n\n仿真输出数据（CSV/日志片段）：\n{{sim_output}}\n\n想定背景摘要：\n{{scenario_summary}}',
      description: '对 AFSIM 仿真输出进行结构化效能评估与战术分析',
      author: 'SimTeam',
      categories: ['军事仿真', '数据分析'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'sim_output', label: '仿真输出数据', required: true, defaultValue: '' },
        { name: 'scenario_summary', label: '想定背景摘要', required: false, defaultValue: '' },
      ],
    },
  ]

  const createdPromptIds: Record<string, number> = {}

  for (const p of prompts) {
    const existing = await prisma.prompt.findFirst({ where: { title: p.title, isDeleted: false } })
    if (existing) {
      createdPromptIds[p.title] = existing.id
      continue
    }

    const created = await prisma.prompt.create({
      data: {
        title: p.title,
        content: p.content,
        description: p.description,
        author: p.author,
        variables: (p as any).variables ?? undefined,
        categories: {
          create: p.categories
            .filter(name => cats[name])
            .map(name => ({ categoryId: cats[name].id })),
        },
        tags: {
          create: p.tags
            .filter(name => tags[name])
            .map(name => ({ tagId: tags[name].id })),
        },
      },
    })
    createdPromptIds[p.title] = created.id
  }

  const afsimWorkflowName = 'AFSIM 完整想定开发流程'
  const existingWorkflow = await prisma.workflow.findFirst({ where: { name: afsimWorkflowName } })
  if (!existingWorkflow) {
    const afsimStepTitles = [
      'AFSIM 想定背景设计',
      'AFSIM 兵力编成与平台定义',
      'AFSIM 传感器与武器系统配置',
      'AFSIM 任务脚本与行为规划',
      'AFSIM 仿真结果分析',
    ]
    await prisma.workflow.create({
      data: {
        name: afsimWorkflowName,
        description: '覆盖 AFSIM 想定开发全流程：从背景设计、兵力编成、装备配置、任务规划到仿真结果分析，每步输出可直接用于 .afsim 文件。',
        steps: {
          create: afsimStepTitles
            .map((title, i) => ({ promptId: createdPromptIds[title], stepOrder: i }))
            .filter(s => s.promptId),
        },
      },
    })
  }

  console.log('Seed completed.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
