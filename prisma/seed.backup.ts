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
    { name: '测评中心', color: '#6633cc' },
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
    {
      title: 'AFSIM 多域联合作战场景设计',
      content: '你是一位AFSIM多域作战仿真专家（AFSIM v3.x）。请根据以下参数设计空海陆天网电多域协同作战场景。\n\n**输入参数：**\n- 作战区域：{{area_of_operations}}\n- 参演域：{{domains}}（从 空/海/陆/天/网/电 中选择）\n- 蓝方兵力概要：{{blue_forces}}\n- 红方兵力概要：{{red_forces}}\n- 协同机制：{{coordination_mechanism}}\n\n**输出要求：**\n1. 场景概述：多域作战目标、各域任务分工\n2. 跨域协同逻辑：各域间信息流转关系、火力协同触发条件\n3. 时间同步设计：各域行动的时序依赖关系\n4. AFSIM scenario 配置骨架：含各域 force/side 定义、comm_network 定义\n5. 跨域数据链配置：Link-16/TTNT/SADL 等数据链分配方案\n\n**约束：**\n- 每个域至少包含2个platform_type\n- 必须定义至少1条跨域kill chain\n- 通信延迟需按域设置差异化参数',
      description: '设计AFSIM空海陆天网电多域联合作战场景与跨域协同配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'area_of_operations', label: '作战区域', required: true, defaultValue: '' },
        { name: 'domains', label: '参演域', required: true, defaultValue: '空/海/陆' },
        { name: 'blue_forces', label: '蓝方兵力概要', required: true, defaultValue: '' },
        { name: 'red_forces', label: '红方兵力概要', required: true, defaultValue: '' },
        { name: 'coordination_mechanism', label: '协同机制', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 电磁频谱作战场景设计',
      content: '你是一位AFSIM电子战仿真专家（AFSIM v3.x）。请根据以下参数设计电磁频谱作战场景。\n\n**输入参数：**\n- 电磁环境描述：{{em_environment}}\n- 蓝方电子战装备：{{blue_ew_assets}}\n- 红方电子战装备：{{red_ew_assets}}\n- 频谱管理策略：{{spectrum_policy}}\n\n**输出要求：**\n1. ESM（电子支援）配置：侦察频段范围、信号识别库参数\n2. ECM（电子攻击）配置：干扰样式（噪声/欺骗/DRFM）、干扰功率、作用距离\n3. ECCM（电子防护）配置：频率捷变、副瓣消隐、烧穿距离计算\n4. 电磁频谱冲突矩阵：己方设备间的频率兼容性\n5. AFSIM配置片段：jammer/esm_sensor/ecm_technique定义\n\n**约束：**\n- 所有频率参数须在合理军用频段范围内\n- 干扰有效距离须与雷达方程一致\n- 须考虑友方电磁兼容（Fratricide）问题',
      description: '设计AFSIM电子战场景含ESM/ECM/ECCM配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'em_environment', label: '电磁环境描述', required: true, defaultValue: '' },
        { name: 'blue_ew_assets', label: '蓝方电子战装备', required: true, defaultValue: '' },
        { name: 'red_ew_assets', label: '红方电子战装备', required: true, defaultValue: '' },
        { name: 'spectrum_policy', label: '频谱管理策略', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM A2/AD反介入区域拒止场景设计',
      content: '你是一位AFSIM反介入/区域拒止仿真专家（AFSIM v3.x）。请设计多层A2/AD防御网络与突防场景。\n\n**输入参数：**\n- 防御纵深范围：{{defense_depth}}\n- 防御层次配置：{{defense_layers}}（远程/中程/近程各层装备）\n- 突防方兵力：{{penetration_forces}}\n- 突防策略：{{penetration_strategy}}\n\n**输出要求：**\n1. 多层防御网络拓扑：各层覆盖范围、重叠区域、火力密度\n2. 防御方传感器网络：搜索雷达/火控雷达/预警系统层次配置\n3. 防御方武器配置：远程防空导弹/中程防空/近防CIWS层次\n4. 突防路径分析：利用地形/电子战/低空渗透的最优突防走廊\n5. AFSIM配置：defense_zone定义、threat_ring配置、engagement_zone分层\n\n**约束：**\n- 防御层次至少3层，覆盖范围递减\n- 各层之间须有重叠覆盖区\n- 突防方须配置电子战支援手段',
      description: '设计AFSIM多层A2/AD防御网络与突防场景',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'defense_depth', label: '防御纵深范围', required: true, defaultValue: '' },
        { name: 'defense_layers', label: '防御层次配置', required: true, defaultValue: '' },
        { name: 'penetration_forces', label: '突防方兵力', required: true, defaultValue: '' },
        { name: 'penetration_strategy', label: '突防策略', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 城市作战场景设计',
      content: '你是一位AFSIM城市作战仿真专家（AFSIM v3.x）。请设计城市地形下的作战仿真场景。\n\n**输入参数：**\n- 城市区域描述：{{urban_area}}\n- 建筑密度与高度分布：{{building_profile}}\n- 蓝方城市作战兵力：{{blue_urban_forces}}\n- 红方城市防御部署：{{red_urban_forces}}\n\n**输出要求：**\n1. 城市地形对传感器的影响建模：雷达多径效应、视线遮挡、GPS信号衰减\n2. 通信约束配置：城市峡谷效应、中继节点需求、通信覆盖盲区\n3. 武器使用限制：附带毁伤约束ROE、最小安全距离\n4. 城市机动路径规划：主要/备用突击路线、清扫区域划分\n5. AFSIM配置：terrain_mask设置、LOS遮挡配置、urban_propagation模型\n\n**约束：**\n- 传感器探测距离须根据城市环境降级处理\n- 通信距离受建筑遮挡影响需设置衰减因子\n- 武器使用须受ROE限制（禁区/限制区）',
      description: '设计AFSIM城市作战场景含地形对传感器与通信影响',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'urban_area', label: '城市区域描述', required: true, defaultValue: '' },
        { name: 'building_profile', label: '建筑密度与高度分布', required: true, defaultValue: '' },
        { name: 'blue_urban_forces', label: '蓝方城市作战兵力', required: true, defaultValue: '' },
        { name: 'red_urban_forces', label: '红方城市防御部署', required: true, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 海上封锁与反潜场景设计',
      content: '你是一位AFSIM海上作战仿真专家（AFSIM v3.x）。请设计海上封锁与反潜作战场景。\n\n**输入参数：**\n- 封锁海域范围：{{blockade_area}}\n- 反潜搜索兵力：{{asw_forces}}（水面舰、反潜机、声呐浮标等）\n- 潜艇威胁描述：{{submarine_threat}}\n- 海洋环境条件：{{ocean_environment}}\n\n**输出要求：**\n1. 反潜搜索方案：搜索模式（扇形/平行/螺旋）、搜索间距、覆盖率计算\n2. 声呐配置：主动/被动声呐参数、声学传播环境（声速剖面、海底类型）\n3. 鱼雷交战配置：鱼雷搜索模式、线导/声自导切换逻辑\n4. 反潜协同：P-3C/直升机/水面舰协同搜索战术\n5. AFSIM配置：sonar_sensor定义、acoustic_environment设置、torpedo weapon定义\n\n**约束：**\n- 声呐探测距离须考虑声学传播条件\n- 潜艇噪声水平须与航速关联\n- 须设置convergence zone效应',
      description: '设计AFSIM海上封锁与反潜搜索/交战场景',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'blockade_area', label: '封锁海域范围', required: true, defaultValue: '' },
        { name: 'asw_forces', label: '反潜搜索兵力', required: true, defaultValue: '' },
        { name: 'submarine_threat', label: '潜艇威胁描述', required: true, defaultValue: '' },
        { name: 'ocean_environment', label: '海洋环境条件', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 有人战斗机建模',
      content: '你是一位AFSIM平台建模专家（AFSIM v3.x）。请根据以下参数生成完整的有人战斗机platform定义。\n\n**输入参数：**\n- 机型名称：{{aircraft_name}}\n- 性能参数：{{performance}}（最大速度/巡航速度/作战半径/升限/最大过载）\n- 传感器套件：{{sensors}}（雷达型号/RWR/IRST/数据链）\n- 武器挂载：{{weapons}}（各挂点武器类型与数量）\n- RCS特征：{{rcs_profile}}\n\n**输出要求：**\n1. platform_type定义：含motion_type AIR_VEHICLE全部参数\n2. 飞行性能包线：speed_envelope/altitude_envelope/turn_rate配置\n3. 传感器挂载：sensor列表与探测参数\n4. 武器站位配置：weapon_station定义与弹药数量\n5. 燃油模型：fuel_capacity/burn_rate/bingo_fuel配置\n6. 完整AFSIM platform_type代码块\n\n**约束：**\n- 性能参数须在该机型公开数据合理范围内\n- RCS值须按正面/侧面/后方分别设置\n- 须配置pilot_model或human_factors参数',
      description: '生成AFSIM有人战斗机完整platform定义含飞行包线与武器挂载',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'aircraft_name', label: '机型名称', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'sensors', label: '传感器套件', required: true, defaultValue: '' },
        { name: 'weapons', label: '武器挂载', required: true, defaultValue: '' },
        { name: 'rcs_profile', label: 'RCS特征', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 无人机(UAV)建模',
      content: '你是一位AFSIM无人机建模专家（AFSIM v3.x）。请根据以下参数生成无人机platform定义，含自主能力与控制链路。\n\n**输入参数：**\n- UAV型号：{{uav_type}}\n- 飞行性能：{{flight_performance}}（续航时间/巡航速度/升限/有效载荷）\n- 自主等级：{{autonomy_level}}（人在回路/人在监督/完全自主）\n- 载荷配置：{{payload}}（ISR传感器/武器/中继通信）\n- 蜂群参数：{{swarm_params}}（数量/间距/协同规则，如适用）\n\n**输出要求：**\n1. platform_type定义：motion_type AIR_VEHICLE参数配置\n2. 控制链路建模：GCS-UAV通信链路参数（频率/带宽/延迟/加密）\n3. 自主行为配置：autonomy_processor参数、失联后行为（RTB/继续任务/盘旋等待）\n4. 蜂群配置（如适用）：swarm_controller定义、间距保持、任务分配逻辑\n5. 载荷配置：sensor/weapon挂载定义\n6. 完整AFSIM代码块\n\n**约束：**\n- 控制链路须设置最大通信距离与链路余量\n- 自主行为须匹配所选自主等级\n- 蜂群数量须考虑通信带宽限制',
      description: '生成AFSIM无人机platform定义含自主能力/控制链路/蜂群配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'uav_type', label: 'UAV型号', required: true, defaultValue: '' },
        { name: 'flight_performance', label: '飞行性能', required: true, defaultValue: '' },
        { name: 'autonomy_level', label: '自主等级', required: true, defaultValue: '人在监督' },
        { name: 'payload', label: '载荷配置', required: true, defaultValue: '' },
        { name: 'swarm_params', label: '蜂群参数', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 水面舰艇建模',
      content: '你是一位AFSIM海军平台建模专家（AFSIM v3.x）。请根据以下参数生成水面舰艇platform定义。\n\n**输入参数：**\n- 舰型名称：{{ship_name}}\n- 舰体参数：{{hull_params}}（排水量/长度/最大航速/巡航航速）\n- 传感器配置：{{sensors}}（搜索雷达/火控雷达/声呐/ESM）\n- 武器系统：{{weapons}}（防空导弹/反舰导弹/近防炮/鱼雷/舰炮）\n- 电子战系统：{{ew_systems}}\n\n**输出要求：**\n1. platform_type定义：motion_type SURFACE_VESSEL全部参数\n2. 舰体特征：radar_cross_section/ir_signature/acoustic_signature配置\n3. 作战系统层次：搜索→跟踪→火控→交战的传感器-射手链\n4. 防空层次：远程（区域防空）/中程（点防空）/近程（CIWS）配置\n5. 损管模型：hit_points/vulnerability_zones配置\n6. 完整AFSIM platform_type代码块\n\n**约束：**\n- 武器数量须符合该舰型VLS单元数\n- 雷达参数须区分搜索雷达与火控雷达\n- 须配置舰艇电力分配模型（雷达/武器/推进）',
      description: '生成AFSIM水面舰艇platform定义含作战系统与防空层次',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'ship_name', label: '舰型名称', required: true, defaultValue: '' },
        { name: 'hull_params', label: '舰体参数', required: true, defaultValue: '' },
        { name: 'sensors', label: '传感器配置', required: true, defaultValue: '' },
        { name: 'weapons', label: '武器系统', required: true, defaultValue: '' },
        { name: 'ew_systems', label: '电子战系统', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 潜艇建模',
      content: '你是一位AFSIM水下平台建模专家（AFSIM v3.x）。请根据以下参数生成潜艇platform定义。\n\n**输入参数：**\n- 潜艇型号：{{submarine_type}}\n- 性能参数：{{performance}}（水下最大航速/水下巡航航速/最大潜深/续航力）\n- 声呐系统：{{sonar_systems}}（艇艏声呐/舷侧阵/拖曳阵）\n- 武器配置：{{weapons}}（鱼雷管数/鱼雷型号/导弹型号）\n- 噪声特征：{{noise_profile}}（各航速下辐射噪声级）\n\n**输出要求：**\n1. platform_type定义：motion_type SUBSURFACE_VESSEL参数\n2. 噪声模型：speed_noise_curve（航速-噪声对应表）、深度对噪声影响\n3. 声呐配置：主动/被动模式切换逻辑、探测距离与环境关系\n4. 通信约束：水下通信深度限制、上浮通信暴露风险建模\n5. 武器配置：torpedo_tube定义、reload_time\n6. 完整AFSIM platform_type代码块\n\n**约束：**\n- 噪声级须随航速非线性增加\n- 主动声呐使用须暴露自身位置\n- 通信须受潜深限制（ELF/VLF/上浮）',
      description: '生成AFSIM潜艇platform定义含噪声特征/声呐/通信约束',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'submarine_type', label: '潜艇型号', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'sonar_systems', label: '声呐系统', required: true, defaultValue: '' },
        { name: 'weapons', label: '武器配置', required: true, defaultValue: '' },
        { name: 'noise_profile', label: '噪声特征', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 地面防空系统建模',
      content: '你是一位AFSIM防空系统建模专家（AFSIM v3.x）。请根据以下参数生成地面防空系统配置。\n\n**输入参数：**\n- 防空系统名称：{{sam_system_name}}\n- 搜索雷达参数：{{search_radar}}（探测距离/扫描方式/更新周期）\n- 火控雷达参数：{{tracking_radar}}（跟踪距离/精度/同时跟踪目标数）\n- 防空导弹参数：{{missile_params}}（最大射程/最小射程/最大高度/SSKP）\n- 部署方式：{{deployment}}（阵地坐标/机动性/展开时间）\n\n**输出要求：**\n1. 搜索雷达sensor定义：detection_range/scan_pattern/update_rate\n2. 火控雷达sensor定义：track_capacity/handover逻辑\n3. 防空导弹weapon定义：fly_out_model/guidance_mode/pk_curve\n4. 交战流程：搜索→跟踪→火控解算→发射→制导→评估\n5. 多目标交战能力：同时制导通道数/射击纪律\n6. 完整AFSIM platform_type代码块（含TEL发射车）\n\n**约束：**\n- 搜索雷达与火控雷达须分别定义\n- 导弹飞行包线须设置高低界\n- 射击纪律须定义shoot-look-shoot或ripple fire',
      description: '生成AFSIM地面防空系统含搜索/火控雷达与防空导弹配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'sam_system_name', label: '防空系统名称', required: true, defaultValue: '' },
        { name: 'search_radar', label: '搜索雷达参数', required: true, defaultValue: '' },
        { name: 'tracking_radar', label: '火控雷达参数', required: true, defaultValue: '' },
        { name: 'missile_params', label: '防空导弹参数', required: true, defaultValue: '' },
        { name: 'deployment', label: '部署方式', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 弹道导弹建模',
      content: '你是一位AFSIM弹道导弹建模专家（AFSIM v3.x）。请根据以下参数生成弹道导弹platform/weapon定义。\n\n**输入参数：**\n- 导弹型号：{{missile_type}}\n- 弹道参数：{{trajectory}}（射程/弹道顶点高度/飞行时间/再入速度）\n- 制导方式：{{guidance}}（惯性/星光/末端制导）\n- 弹头配置：{{warhead}}（单弹头/MIRV/常规/核）\n- 突防措施：{{penetration_aids}}（诱饵/机动弹头/隐身外形）\n\n**输出要求：**\n1. 弹道飞行模型：boost/midcourse/terminal三段弹道参数\n2. 制导精度：CEP配置、末端修正能力\n3. 突防措施建模：decoy释放时序、末段机动参数\n4. 可被拦截窗口：各飞行阶段的可拦截性参数\n5. 发射平台配置：TEL车辆/发射井platform定义\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 弹道参数须符合基本弹道力学\n- 再入速度须与射程匹配\n- MIRV须定义各子弹头分导参数',
      description: '生成AFSIM弹道导弹建模含弹道参数/制导/突防措施',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'missile_type', label: '导弹型号', required: true, defaultValue: '' },
        { name: 'trajectory', label: '弹道参数', required: true, defaultValue: '' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'warhead', label: '弹头配置', required: true, defaultValue: '' },
        { name: 'penetration_aids', label: '突防措施', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 卫星平台建模',
      content: '你是一位AFSIM天基平台建模专家（AFSIM v3.x）。请根据以下参数生成卫星platform定义。\n\n**输入参数：**\n- 卫星名称：{{satellite_name}}\n- 轨道参数：{{orbit_params}}（轨道类型LEO/MEO/GEO/高度/倾角/RAAN）\n- 载荷配置：{{payload}}（光学/SAR/SIGINT/通信中继）\n- 脆弱性参数：{{vulnerability}}（抗干扰能力/机动能力）\n\n**输出要求：**\n1. 轨道定义：orbital_elements或TLE格式配置\n2. 载荷sensor定义：覆盖带宽/分辨率/重访周期\n3. 通信链路：星地链路/星间链路参数\n4. 脆弱性建模：ASAT威胁响应、干扰降级模式\n5. 星座配置（如适用）：constellation_pattern定义\n6. 完整AFSIM platform_type代码块\n\n**约束：**\n- 轨道参数须自洽（高度与周期匹配）\n- 载荷覆盖范围须与轨道高度一致\n- 须配置过境时间窗口计算',
      description: '生成AFSIM卫星platform定义含轨道参数/载荷/脆弱性',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'satellite_name', label: '卫星名称', required: true, defaultValue: '' },
        { name: 'orbit_params', label: '轨道参数', required: true, defaultValue: '' },
        { name: 'payload', label: '载荷配置', required: true, defaultValue: '' },
        { name: 'vulnerability', label: '脆弱性参数', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM AESA雷达建模',
      content: '你是一位AFSIM雷达建模专家（AFSIM v3.x）。请根据以下参数生成AESA相控阵雷达sensor定义。\n\n**输入参数：**\n- 雷达名称：{{radar_name}}\n- 天线参数：{{antenna_params}}（阵元数/孔径/工作频段）\n- 工作模式：{{operating_modes}}（搜索/跟踪/TWS/SAR/地面MTI等）\n- 性能参数：{{performance}}（探测距离vs目标RCS/扫描范围/更新周期）\n- ECCM能力：{{eccm_capabilities}}\n\n**输出要求：**\n1. sensor_type RADAR定义：detection_range/scan_volume/update_rate\n2. 多模式配置：各工作模式的参数切换定义\n3. 波束调度：time_sharing逻辑、搜索与跟踪资源分配\n4. 检测概率模型：Pd vs range vs RCS曲线\n5. ECCM配置：frequency_agility/sidelobe_blanking/burnthrough参数\n6. 完整AFSIM sensor_type代码块\n\n**约束：**\n- 探测距离须遵循雷达方程（R^4律）\n- 各模式须共享天线时间资源\n- 同时跟踪目标数受处理能力限制',
      description: '生成AFSIM AESA相控阵雷达多工作模式sensor定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'radar_name', label: '雷达名称', required: true, defaultValue: '' },
        { name: 'antenna_params', label: '天线参数', required: true, defaultValue: '' },
        { name: 'operating_modes', label: '工作模式', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'eccm_capabilities', label: 'ECCM能力', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM IRST红外建模',
      content: '你是一位AFSIM红外传感器建模专家（AFSIM v3.x）。请根据以下参数生成IRST系统sensor定义。\n\n**输入参数：**\n- IRST系统名称：{{irst_name}}\n- 波段配置：{{spectral_bands}}（SWIR/MWIR/LWIR）\n- 探测性能：{{detection_performance}}（探测距离vs目标IR特征/视场/扫描方式）\n- 跟踪能力：{{tracking_capability}}（同时跟踪数/精度/更新率）\n\n**输出要求：**\n1. sensor_type EO_IR定义：detection_range/field_of_view/scan_pattern\n2. 红外探测模型：目标IR辐射强度vs背景对比度\n3. 大气衰减配置：各波段在不同气象条件下的衰减系数\n4. 目标识别能力：detection/recognition/identification各距离\n5. 与雷达融合：IR+Radar多传感器融合配置建议\n6. 完整AFSIM sensor_type代码块\n\n**约束：**\n- 探测距离须考虑目标红外辐射强度差异\n- 须配置天气/时间对探测性能的影响因子\n- 被动传感器不暴露自身位置',
      description: '生成AFSIM IRST红外搜索与跟踪系统sensor定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'irst_name', label: 'IRST系统名称', required: true, defaultValue: '' },
        { name: 'spectral_bands', label: '波段配置', required: true, defaultValue: '' },
        { name: 'detection_performance', label: '探测性能', required: true, defaultValue: '' },
        { name: 'tracking_capability', label: '跟踪能力', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM ESM/RWR电子侦察建模',
      content: '你是一位AFSIM电子侦察建模专家（AFSIM v3.x）。请根据以下参数生成ESM/RWR系统sensor定义。\n\n**输入参数：**\n- 系统名称：{{esm_name}}\n- 频率覆盖范围：{{frequency_range}}\n- 测向精度：{{df_accuracy}}（RMS角度误差）\n- 信号识别库：{{emitter_library}}（可识别的雷达型号列表）\n- 灵敏度：{{sensitivity}}（最小可检测信号功率）\n\n**输出要求：**\n1. sensor_type ESM定义：frequency_range/sensitivity/df_accuracy\n2. 信号截获模型：截获概率vs距离/目标发射功率\n3. 辐射源识别：emitter_id库配置、识别置信度参数\n4. 威胁告警逻辑：RWR告警等级分类（搜索/跟踪/制导锁定）\n5. 与ECM联动：检测到威胁后自动触发干扰的接口配置\n6. 完整AFSIM sensor_type代码块\n\n**约束：**\n- ESM为被动传感器，不暴露自身\n- 截获概率须考虑目标信号特征（脉冲/连续波/频率捷变）\n- 测向精度须区分宽带粗测与窄带精测',
      description: '生成AFSIM ESM/RWR电子支援与雷达告警sensor定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'esm_name', label: '系统名称', required: true, defaultValue: '' },
        { name: 'frequency_range', label: '频率覆盖范围', required: true, defaultValue: '' },
        { name: 'df_accuracy', label: '测向精度', required: true, defaultValue: '' },
        { name: 'emitter_library', label: '信号识别库', required: false, defaultValue: '' },
        { name: 'sensitivity', label: '灵敏度', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 声呐系统建模',
      content: '你是一位AFSIM声呐建模专家（AFSIM v3.x）。请根据以下参数生成声呐系统sensor定义。\n\n**输入参数：**\n- 声呐系统名称：{{sonar_name}}\n- 声呐类型：{{sonar_type}}（舰壳声呐/拖曳阵/声呐浮标/鱼雷声呐）\n- 工作模式：{{operating_modes}}（主动/被动/主被动交替）\n- 性能参数：{{performance}}（探测距离/频率/波束宽度）\n- 声学环境：{{acoustic_environment}}（声速剖面/海底类型/海况）\n\n**输出要求：**\n1. sensor_type SONAR定义：detection_range/frequency/beam_width\n2. 声学传播模型：propagation_model选择（ray_tracing/normal_mode）\n3. 主动声呐配置：ping_interval/pulse_length/source_level\n4. 被动声呐配置：listening_bandwidth/integration_time/detection_threshold\n5. 环境影响：thermocline_depth/bottom_bounce/convergence_zone配置\n6. 完整AFSIM sensor_type代码块\n\n**约束：**\n- 探测距离须随声学环境变化（深海/浅海差异大）\n- 主动声呐使用暴露自身位置\n- 拖曳阵受航速限制（高速时噪声增大）',
      description: '生成AFSIM主被动声呐系统含声学传播环境sensor定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'sonar_name', label: '声呐系统名称', required: true, defaultValue: '' },
        { name: 'sonar_type', label: '声呐类型', required: true, defaultValue: '' },
        { name: 'operating_modes', label: '工作模式', required: true, defaultValue: '主动/被动' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'acoustic_environment', label: '声学环境', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 空对空导弹建模',
      content: '你是一位AFSIM空空导弹建模专家（AFSIM v3.x）。请根据以下参数生成空对空导弹weapon定义。\n\n**输入参数：**\n- 导弹名称：{{missile_name}}\n- 导弹类型：{{missile_class}}（BVR超视距/WVR格斗）\n- 制导方式：{{guidance}}（主动雷达/半主动雷达/红外/复合制导）\n- 性能参数：{{performance}}（最大射程/不可逃逸区/最大速度/最大过载）\n- ECCM能力：{{eccm}}（抗干扰/IRCCM）\n\n**输出要求：**\n1. weapon_type定义：fly_out_model参数配置\n2. 飞行包线：launch_envelope（高度/速度/离轴角限制）\n3. 制导段配置：midcourse_guidance（惯导+数据链修正）→terminal_guidance（主动/IR寻的）\n4. 杀伤概率模型：pk vs range/aspect_angle/target_maneuver曲线\n5. 抗干扰配置：ECCM/IRCCM参数\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 不可逃逸区须小于最大射程\n- Pk须随距离/目标机动性递减\n- BVR导弹须配置中段修正数据链',
      description: '生成AFSIM BVR/WVR空空导弹weapon定义含制导与杀伤概率',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'missile_name', label: '导弹名称', required: true, defaultValue: '' },
        { name: 'missile_class', label: '导弹类型', required: true, defaultValue: 'BVR' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'eccm', label: 'ECCM能力', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 空对地精确弹药建模',
      content: '你是一位AFSIM对地弹药建模专家（AFSIM v3.x）。请根据以下参数生成空对地精确制导弹药weapon定义。\n\n**输入参数：**\n- 弹药名称：{{munition_name}}\n- 制导方式：{{guidance}}（激光制导/GPS-INS/激光+GPS复合/电视制导）\n- 性能参数：{{performance}}（投放高度范围/投放速度范围/滑翔距离/CEP）\n- 战斗部：{{warhead}}（重量/类型/毁伤半径）\n- 目标类型：{{target_type}}（点目标/面目标/机动目标）\n\n**输出要求：**\n1. weapon_type定义：delivery_model参数\n2. 投放包线：release_envelope（高度/速度/距离限制）\n3. 制导精度：CEP vs投放条件、末端修正能力\n4. 毁伤评估：warhead_effects配置、目标易损性匹配\n5. 气象影响：云层/风速对制导精度的降级\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 激光制导须配置目标指示源（自身/僚机/地面FAC）\n- GPS制导须考虑GPS干扰场景降级\n- CEP须与制导方式匹配',
      description: '生成AFSIM激光/GPS精确制导弹药weapon定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'munition_name', label: '弹药名称', required: true, defaultValue: '' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'warhead', label: '战斗部', required: true, defaultValue: '' },
        { name: 'target_type', label: '目标类型', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 反舰导弹建模',
      content: '你是一位AFSIM反舰导弹建模专家（AFSIM v3.x）。请根据以下参数生成反舰导弹weapon定义。\n\n**输入参数：**\n- 导弹名称：{{missile_name}}\n- 飞行剖面：{{flight_profile}}（高空巡航+末段掠海/全程掠海/弹道式）\n- 制导方式：{{guidance}}（中段惯导+数据链/末段主动雷达/IR/复合）\n- 性能参数：{{performance}}（射程/巡航速度/末段速度/最大机动过载）\n- 突防措施：{{penetration}}（末段机动/多弹协同/隐身外形/诱饵）\n\n**输出要求：**\n1. weapon_type定义：fly_out_model多段飞行剖面\n2. 末段突防配置：sea_skimming高度/weave机动/pop-up攻击参数\n3. 多弹协同：salvo_size/time_on_target/attack_geometry（扇形/十字交叉）\n4. 抗近防能力：末段速度/机动vs CIWS交战窗口分析\n5. 目标选择逻辑：aim_point选择（水线/上层建筑/雷达天线）\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 掠海高度须合理（5-15m）\n- 末段速度提升须考虑射程折减\n- 多弹协同须配置弹间通信',
      description: '生成AFSIM反舰导弹weapon定义含末段突防与多弹协同',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'missile_name', label: '导弹名称', required: true, defaultValue: '' },
        { name: 'flight_profile', label: '飞行剖面', required: true, defaultValue: '' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'penetration', label: '突防措施', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 防空导弹建模',
      content: '你是一位AFSIM防空导弹建模专家（AFSIM v3.x）。请根据以下参数生成防空导弹weapon定义。\n\n**输入参数：**\n- 导弹名称：{{missile_name}}\n- 防空层次：{{defense_tier}}（远程区域防空/中程/近程点防空）\n- 制导方式：{{guidance}}（半主动/主动/TVM/指令制导）\n- 性能参数：{{performance}}（射程/射高/速度/最大机动过载）\n- 交战包线：{{engagement_envelope}}\n\n**输出要求：**\n1. weapon_type定义：fly_out_model参数\n2. 交战包线配置：engagement_zone（最大/最小射程、高低界）\n3. SSKP模型：Pk vs目标类型/距离/高度/速度/RCS/机动曲线\n4. 制导律配置：midcourse/terminal制导参数\n5. 多目标交战：同时制导数/最小发射间隔/再装填时间\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 交战包线须设置死区（最小射程/最小高度）\n- SSKP须随目标机动能力下降\n- 须考虑ECM对制导的降级影响',
      description: '生成AFSIM防空导弹weapon定义含交战包线与SSKP模型',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'missile_name', label: '导弹名称', required: true, defaultValue: '' },
        { name: 'defense_tier', label: '防空层次', required: true, defaultValue: '' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'engagement_envelope', label: '交战包线', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 鱼雷建模',
      content: '你是一位AFSIM鱼雷建模专家（AFSIM v3.x）。请根据以下参数生成鱼雷weapon定义。\n\n**输入参数：**\n- 鱼雷名称：{{torpedo_name}}\n- 鱼雷类型：{{torpedo_type}}（重型/轻型）\n- 性能参数：{{performance}}（最大航速/射程/作战深度）\n- 制导方式：{{guidance}}（线导+声自导/声自导/尾流自导）\n- 搜索策略：{{search_pattern}}（螺旋/蛇行/扇面）\n\n**输出要求：**\n1. weapon_type定义：underwater fly_out_model参数\n2. 搜索模式配置：search_pattern/acquisition_range/search_sector\n3. 线导阶段：wire_guided参数（线导距离/数据率/断线后行为）\n4. 声自导阶段：acoustic_homing参数（主动/被动寻的距离/灵敏度）\n5. 反对抗能力：counter-countermeasure逻辑（识别诱饵/reattack）\n6. 完整AFSIM weapon_type代码块\n\n**约束：**\n- 航速与射程须反比关系（高速短程/低速远程）\n- 线导断线后须有自主搜索逻辑\n- 须配置enable/arm距离（安全距离）',
      description: '生成AFSIM鱼雷weapon定义含搜索策略/线导/声自导',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'torpedo_name', label: '鱼雷名称', required: true, defaultValue: '' },
        { name: 'torpedo_type', label: '鱼雷类型', required: true, defaultValue: '重型' },
        { name: 'performance', label: '性能参数', required: true, defaultValue: '' },
        { name: 'guidance', label: '制导方式', required: true, defaultValue: '' },
        { name: 'search_pattern', label: '搜索策略', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 电子战武器建模',
      content: '你是一位AFSIM电子战建模专家（AFSIM v3.x）。请根据以下参数生成电子战武器（干扰机/DRFM）定义。\n\n**输入参数：**\n- 系统名称：{{ew_system_name}}\n- 干扰类型：{{jamming_type}}（噪声干扰/欺骗干扰/DRFM）\n- 频率覆盖：{{frequency_coverage}}\n- 干扰功率：{{jamming_power}}（ERP/峰值功率）\n- 作用范围：{{effective_range}}\n\n**输出要求：**\n1. jammer定义：jamming_technique/power/frequency_range\n2. 噪声干扰配置：barrage/spot/sweep jamming参数\n3. DRFM欺骗配置：range_gate_pull_off/velocity_gate_pull_off/角度欺骗参数\n4. 干扰效能模型：J/S比计算、burn_through距离\n5. 自卫/护航模式：self_protection vs stand_off_jamming配置\n6. 完整AFSIM weapon/jammer代码块\n\n**约束：**\n- 干扰功率须与平台电力供应匹配\n- DRFM延迟须在纳秒级\n- 须考虑干扰对己方传感器的影响',
      description: '生成AFSIM电子战干扰机/DRFM weapon定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'ew_system_name', label: '系统名称', required: true, defaultValue: '' },
        { name: 'jamming_type', label: '干扰类型', required: true, defaultValue: '' },
        { name: 'frequency_coverage', label: '频率覆盖', required: true, defaultValue: '' },
        { name: 'jamming_power', label: '干扰功率', required: true, defaultValue: '' },
        { name: 'effective_range', label: '作用范围', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 空战机动处理器',
      content: '你是一位AFSIM空战处理器建模专家（AFSIM v3.x）。请根据以下参数生成空战机动处理器（processor）定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 适用平台：{{platform_type}}\n- 交战规则：{{roe}}（武器释放条件/最大交战距离/脱离条件）\n- 战术偏好：{{tactical_preferences}}（BVR优先/WVR优先/防御优先）\n\n**输出要求：**\n1. processor状态机定义：巡逻→截击→BVR交战→WVR交战→防御规避→返航\n2. 巡逻状态：patrol_route/CAP_station/loiter参数\n3. 截击决策：threat_assessment逻辑、intercept_geometry（前半球/后半球/正切）\n4. BVR交战：launch_zone计算、shoot-look-shoot/ripple逻辑、crank/notch机动\n5. WVR交战：merge_tactics/gun_solution/defensive_break参数\n6. 防御规避：missile_defeat(notch/chaff/flare/beam)、disengage_criteria\n7. 完整AFSIM processor代码块\n\n**约束：**\n- 状态转换须有明确触发条件\n- 弹药耗尽须自动进入返航\n- 燃油低于bingo须优先返航\n- 须配置wingman协同逻辑',
      description: '生成AFSIM空战状态机处理器含巡逻/截击/BVR/WVR/防御/返航',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'platform_type', label: '适用平台', required: true, defaultValue: '' },
        { name: 'roe', label: '交战规则', required: true, defaultValue: '' },
        { name: 'tactical_preferences', label: '战术偏好', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 对地攻击处理器',
      content: '你是一位AFSIM对地攻击处理器建模专家（AFSIM v3.x）。请根据以下参数生成对地攻击任务处理器定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 适用平台：{{platform_type}}\n- 攻击目标类型：{{target_types}}（固定目标/机动目标/防空节点）\n- 弹药配置：{{munitions}}（精确制导弹药类型与数量）\n- 威胁环境：{{threat_environment}}\n\n**输出要求：**\n1. processor状态机：进入→待命→IP（初始点）→攻击航线→武器投放→BDA→脱离\n2. 进入阶段：ingress_route/terrain_following/threat_avoidance配置\n3. IP决策：IP选择逻辑（距离/方位/地形掩护）\n4. 攻击航线：attack_heading/dive_angle/release_altitude/pull_off参数\n5. 武器投放：target_assignment/weapon_selection/TLAR(可接受投放区)计算\n6. BDA与再攻击：damage_assessment逻辑、re-attack判据\n7. 完整AFSIM processor代码块\n\n**约束：**\n- 须配置SEAD/DEAD支援联动接口\n- 弹药用尽或无法识别目标须中止攻击\n- 须配置abort_criteria（天气/威胁/目标变更）',
      description: '生成AFSIM对地攻击状态机处理器含进入/待命/攻击/BDA/脱离',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'platform_type', label: '适用平台', required: true, defaultValue: '' },
        { name: 'target_types', label: '攻击目标类型', required: true, defaultValue: '' },
        { name: 'munitions', label: '弹药配置', required: true, defaultValue: '' },
        { name: 'threat_environment', label: '威胁环境', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 防空拦截处理器',
      content: '你是一位AFSIM防空处理器建模专家（AFSIM v3.x）。请根据以下参数生成防空拦截任务处理器定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 适用平台：{{platform_type}}（防空导弹系统/舰艇防空/机载截击）\n- 威胁类型：{{threat_types}}（战斗机/巡航导弹/弹道导弹/无人机）\n- 防空层次：{{defense_tier}}（远程/中程/近程）\n- 协同体系：{{coordination}}（作战体系内的角色）\n\n**输出要求：**\n1. 威胁评估逻辑：threat_ranking算法（距离/速度/航向/目标类型权重）\n2. 火力分配：weapon_target_assignment逻辑（集中/分散/优先级）\n3. 射击纪律：shoot-look-shoot vs shoot-shoot-look策略\n4. 交战排序：engagement_priority/sector_responsibility划分\n5. SOSa(System of Systems)协同：上级指挥分配/自主交战切换逻辑\n6. 完整AFSIM processor代码块\n\n**约束：**\n- 须配置friendly_fire防误伤逻辑\n- 弹药分配须考虑剩余弹量\n- 多层防空须配置交战区边界避免重复交战',
      description: '生成AFSIM防空拦截处理器含威胁评估/火力分配/SOSa协同',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'platform_type', label: '适用平台', required: true, defaultValue: '' },
        { name: 'threat_types', label: '威胁类型', required: true, defaultValue: '' },
        { name: 'defense_tier', label: '防空层次', required: true, defaultValue: '' },
        { name: 'coordination', label: '协同体系', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 电子战处理器',
      content: '你是一位AFSIM电子战处理器建模专家（AFSIM v3.x）。请根据以下参数生成电子战EA/EP处理器定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 适用平台：{{platform_type}}\n- EA（电子攻击）能力：{{ea_capabilities}}（干扰类型/功率/频段）\n- EP（电子防护）能力：{{ep_capabilities}}（抗干扰措施）\n- 作战模式：{{operating_mode}}（自卫/护航/压制）\n\n**输出要求：**\n1. EA处理逻辑：威胁识别→干扰样式选择→功率分配→效果评估\n2. 干扰优先级：threat_priority_queue配置（按威胁等级/距离排序）\n3. 干扰资源管理：jammer_resource_allocation（多目标时功率分时/分频）\n4. EP处理逻辑：干扰检测→类型识别→对抗措施激活→性能恢复评估\n5. EA/EP协同：己方EA不干扰己方传感器的deconfliction逻辑\n6. 完整AFSIM processor代码块\n\n**约束：**\n- 干扰功率不得超过平台电力上限\n- 须配置blanking窗口避免自身雷达受影响\n- EP措施须与具体干扰类型匹配',
      description: '生成AFSIM电子战EA/EP攻防处理器定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'platform_type', label: '适用平台', required: true, defaultValue: '' },
        { name: 'ea_capabilities', label: 'EA能力', required: true, defaultValue: '' },
        { name: 'ep_capabilities', label: 'EP能力', required: true, defaultValue: '' },
        { name: 'operating_mode', label: '作战模式', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM ISR任务处理器',
      content: '你是一位AFSIM ISR处理器建模专家（AFSIM v3.x）。请根据以下参数生成ISR（情报/监视/侦察）任务处理器定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 适用平台：{{platform_type}}（侦察机/无人机/卫星）\n- 传感器载荷：{{sensor_payload}}（光电/SAR/SIGINT/MASINT）\n- 情报需求：{{intel_requirements}}（目标类型/搜索区域/优先级）\n- 上报体系：{{reporting_chain}}\n\n**输出要求：**\n1. 搜索规划：search_pattern配置（区域搜索/定点监视/航线侦察）\n2. 目标检测：detection→classification→identification(DCI)流程配置\n3. 目标分类逻辑：classification_confidence阈值与判据\n4. 情报上报：report_format/report_interval/priority_report触发条件\n5. 传感器调度：多传感器协同使用逻辑（先宽后窄/交叉验证）\n6. 完整AFSIM processor代码块\n\n**约束：**\n- DCI各阶段须设置置信度阈值\n- 高优先级目标须立即上报\n- 须配置sensor_dwell_time与coverage_rate平衡',
      description: '生成AFSIM ISR侦察搜索/目标分类/情报上报处理器定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'platform_type', label: '适用平台', required: true, defaultValue: '' },
        { name: 'sensor_payload', label: '传感器载荷', required: true, defaultValue: '' },
        { name: 'intel_requirements', label: '情报需求', required: true, defaultValue: '' },
        { name: 'reporting_chain', label: '上报体系', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 编队管理处理器',
      content: '你是一位AFSIM编队管理建模专家（AFSIM v3.x）。请根据以下参数生成编队管理处理器定义。\n\n**输入参数：**\n- 处理器名称：{{processor_name}}\n- 编队类型：{{formation_type}}（空中编队/水面编队/混合编队）\n- 编队组成：{{formation_members}}（长机+僚机/旗舰+护卫舰等）\n- 队形定义：{{formation_pattern}}（楔形/一字/菱形/纵队等）\n- 协同规则：{{coordination_rules}}\n\n**输出要求：**\n1. 队形保持：formation_geometry定义（相对位置/间距/高度差）\n2. 队形变换：formation_change触发条件与转换过程\n3. 长机-僚机协同：leader-wingman通信与指令传递逻辑\n4. 脱队处理：separation_detection/rejoin_procedure配置\n5. 编队战术：编队整体机动（转弯/变速/变高）的协调逻辑\n6. 完整AFSIM processor代码块\n\n**约束：**\n- 僚机间距须保持最小安全距离\n- 队形变换过程中须防止碰撞\n- 长机损失须有备份长机接替逻辑',
      description: '生成AFSIM编队队形保持/协同/脱队管理处理器定义',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'processor_name', label: '处理器名称', required: true, defaultValue: '' },
        { name: 'formation_type', label: '编队类型', required: true, defaultValue: '' },
        { name: 'formation_members', label: '编队组成', required: true, defaultValue: '' },
        { name: 'formation_pattern', label: '队形定义', required: true, defaultValue: '' },
        { name: 'coordination_rules', label: '协同规则', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 战术数据链建模',
      content: '你是一位AFSIM通信与数据链建模专家（AFSIM v3.x）。请根据以下参数生成战术数据链配置。\n\n**输入参数：**\n- 数据链类型：{{datalink_type}}（Link-16/MADL/TTNT/CDL/SADL）\n- 网络拓扑：{{network_topology}}（参与节点/网络结构）\n- 性能需求：{{performance_requirements}}（数据率/延迟/抗干扰等级）\n- 消息类型：{{message_types}}（需传输的战术信息类型）\n\n**输出要求：**\n1. comm_network定义：network_type/data_rate/latency/max_range\n2. 时隙分配：TDMA时隙结构配置（Link-16 NPG/JU分配）\n3. 消息格式：J-series消息映射（J2.2/J3.2/J7.2等）\n4. 抗干扰配置：frequency_hopping/spread_spectrum/LPI参数\n5. 网络退化：link_degradation模式（部分节点丢失后的网络重构）\n6. 完整AFSIM comm_network代码块\n\n**约束：**\n- 数据率须与链路类型匹配（Link-16约238kbps）\n- 时隙分配须避免冲突\n- 须配置LOS(视距)约束',
      description: '生成AFSIM战术数据链Link-16/MADL等通信网络配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'datalink_type', label: '数据链类型', required: true, defaultValue: 'Link-16' },
        { name: 'network_topology', label: '网络拓扑', required: true, defaultValue: '' },
        { name: 'performance_requirements', label: '性能需求', required: true, defaultValue: '' },
        { name: 'message_types', label: '消息类型', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 地形与气象环境建模',
      content: '你是一位AFSIM环境建模专家（AFSIM v3.x）。请根据以下参数生成地形与气象环境配置。\n\n**输入参数：**\n- 作战区域：{{area_of_operations}}（中心坐标/范围）\n- 地形类型：{{terrain_type}}（平原/山地/沿海/岛屿/城市）\n- 气象条件：{{weather_conditions}}（能见度/云底高/风速风向/降水）\n- 特殊环境：{{special_conditions}}（沙暴/雾/雷暴/极地等）\n\n**输出要求：**\n1. 地形配置：terrain_database引用/DTED精度等级/terrain_mask设置\n2. 视线计算：LOS_model配置（地形遮挡/地球曲率）\n3. 气象分层：atmosphere_model（温度/压力/湿度剖面）\n4. 气象对传感器影响：visibility_degradation/radar_clutter/IR_attenuation配置\n5. 气象对武器影响：wind_effect_on_delivery/ceiling_constraint配置\n6. 完整AFSIM environment配置代码块\n\n**约束：**\n- 地形分辨率须与仿真精度匹配\n- 气象条件须全局一致（或按区域分区）\n- 须配置时变气象（如适用）',
      description: '生成AFSIM地形/气象/环境影响配置',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'area_of_operations', label: '作战区域', required: true, defaultValue: '' },
        { name: 'terrain_type', label: '地形类型', required: true, defaultValue: '' },
        { name: 'weather_conditions', label: '气象条件', required: true, defaultValue: '' },
        { name: 'special_conditions', label: '特殊环境', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 作战效能评估配置',
      content: '你是一位AFSIM效能评估建模专家（AFSIM v3.x）。请根据以下参数配置作战效能评估指标体系。\n\n**输入参数：**\n- 评估场景：{{scenario_name}}\n- 评估对象：{{evaluation_subject}}（蓝方/红方/特定兵力群）\n- 任务目标：{{mission_objectives}}\n- 关注指标维度：{{metric_dimensions}}（毁伤效果/生存能力/态势感知/协同效率）\n\n**输出要求：**\n1. MOE（作战效能指标）定义：mission_success_rate/area_denial_effectiveness等\n2. MOP（作战性能指标）定义：detection_rate/engagement_rate/hit_rate等\n3. MOF（兵力效能指标）定义：sortie_rate/weapon_expenditure/loss_ratio等\n4. 数据采集配置：logger/collector定义（采集频率/采集变量/输出格式）\n5. 指标计算公式：各MOE/MOP/MOF的计算逻辑与权重\n6. 完整AFSIM output/measure配置代码块\n\n**约束：**\n- 指标须可从仿真输出数据直接计算\n- MOE须与任务目标直接关联\n- 须配置baseline对比基准',
      description: '配置AFSIM MOE/MOP/MOF作战效能评估指标体系',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'scenario_name', label: '评估场景', required: true, defaultValue: '' },
        { name: 'evaluation_subject', label: '评估对象', required: true, defaultValue: '' },
        { name: 'mission_objectives', label: '任务目标', required: true, defaultValue: '' },
        { name: 'metric_dimensions', label: '关注指标维度', required: false, defaultValue: '' },
      ],
    },
    {
      title: 'AFSIM 蒙特卡洛批量仿真配置',
      content: '你是一位AFSIM蒙特卡洛仿真专家（AFSIM v3.x）。请根据以下参数配置批量仿真实验。\n\n**输入参数：**\n- 基础想定：{{base_scenario}}\n- 随机变量：{{random_variables}}（需要随机化的参数及其分布）\n- 实验目的：{{experiment_objective}}\n- 计算资源：{{compute_resources}}（可用核数/内存/时间限制）\n\n**输出要求：**\n1. 随机变量定义：variable_name/distribution_type(uniform/normal/triangular)/range\n2. 实验设计：DOE方法选择（全因子/拉丁超立方/Sobol序列）\n3. 运行配置：num_replications/random_seed_strategy/parallel_runs\n4. 输出变量收集：output_variables定义（每次运行需记录的指标）\n5. 统计分析配置：confidence_interval/convergence_criteria/sensitivity_analysis\n6. 完整AFSIM monte_carlo/experiment配置代码块\n\n**约束：**\n- 样本量须满足统计显著性要求\n- 须配置收敛判据（何时停止增加样本）\n- 随机种子须可复现\n- 须考虑计算资源与样本量的平衡',
      description: '配置AFSIM蒙特卡洛批量仿真含随机变量/实验设计/统计分析',
      author: 'SimTeam',
      categories: ['军事仿真', '仿真工程师'],
      tags: ['AFSIM', '军事仿真', '高级'],
      variables: [
        { name: 'base_scenario', label: '基础想定', required: true, defaultValue: '' },
        { name: 'random_variables', label: '随机变量', required: true, defaultValue: '' },
        { name: 'experiment_objective', label: '实验目的', required: true, defaultValue: '' },
        { name: 'compute_resources', label: '计算资源', required: false, defaultValue: '' },
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

  const newWorkflows = [
    {
      name: 'AFSIM 空战场景全流程',
      description: '从战斗机平台建模到雷达传感器、空空导弹武器、空战机动处理器的完整空战仿真配置流程。',
      steps: [
        'AFSIM 有人战斗机建模',
        'AFSIM AESA雷达建模',
        'AFSIM 空对空导弹建模',
        'AFSIM 空战机动处理器',
      ],
    },
    {
      name: 'AFSIM 防空体系全流程',
      description: '从地面防空系统建模到防空导弹武器配置、防空拦截处理器的完整防空体系仿真配置流程。',
      steps: [
        'AFSIM 地面防空系统建模',
        'AFSIM 防空导弹建模',
        'AFSIM 防空拦截处理器',
      ],
    },
    {
      name: 'AFSIM 反潜作战全流程',
      description: '从潜艇平台建模到声呐传感器、鱼雷武器、反潜场景设计的完整反潜作战仿真配置流程。',
      steps: [
        'AFSIM 潜艇建模',
        'AFSIM 声呐系统建模',
        'AFSIM 鱼雷建模',
        'AFSIM 海上封锁与反潜场景设计',
      ],
    },
  ]

  for (const wf of newWorkflows) {
    const existing = await prisma.workflow.findFirst({ where: { name: wf.name } })
    if (!existing) {
      await prisma.workflow.create({
        data: {
          name: wf.name,
          description: wf.description,
          steps: {
            create: wf.steps
              .map((title, i) => ({ promptId: createdPromptIds[title], stepOrder: i }))
              .filter(s => s.promptId),
          },
        },
      })
    }
  }

  const skillName = 'software-test-case-generator'
  const existingSkill = await prisma.skill.findFirst({ where: { name: skillName, isDeleted: false } })
  if (!existingSkill) {
    const skill = await prisma.skill.create({
      data: {
        name: skillName,
        description: '根据软件需求规格说明文档生成符合GJB438C标准的软件测试用例，输出标准Excel文件。当用户说"帮我写测试用例""根据需求生成用例""生成测试用例表""统计用例执行情况"，或提供了需求规格说明文档、需求章节内容时，主动触发此Skill。',
        content: `# 软件测试用例生成 Skill

你是一位资深软件测试工程师，依据需求规格说明文档编写符合GJB438C标准的测试用例。

## 使用说明

**需求文档来源（优先级从高到低）：**
1. 用户在对话中提供的文档路径或粘贴的内容 → 以此为准
2. \`references/需求规格说明.md\` → 仅作为示例备用

**人员信息：** 若用户未提供，在开始前询问一次：设计人员、监督人员、设计日期、监督日期。若用户跳过则填占位符 \`[设计人员]\` \`[监督人员]\` \`[日期]\`。

---

## 第1步：提取章节目录

读取需求文档"3 需求"章节，以表格形式输出所有功能章节：

| 序号 | 章节目录 | 是否需要分析 | 是否分析完成 |
|------|----------|------------|------------|

章节目录格式：\`N个▷ + 章节编号 + 章节名称\`，▷数量 = 层级深度（如 3.2 为1个▷，3.2.1.2 为3个▷）。

"是否需要分析""是否分析完成"两列**留空**，由用户手动填写后再进入下一步。

---

## 第2步：生成测试用例 Excel

根据用户指定的章节，生成测试用例，通过脚本输出为 Excel 文件。

### 输出列（严格按此顺序，列名与脚本完全一致）

| 列名 | 说明 |
|------|------|
| 用例名称 | 格式见下 |
| 用例标识 | 格式见下 |
| 测试追踪 | 需求章节编号+名称 |
| 测试追踪（技术协议） | 取需求功能描述表"可追溯性"字段的值 |
| 用例说明 | 一句话描述本用例验证的具体测试点 |
| 输入及操作说明 | 结合需求的"输入/处理过程/输出/页面导航"，描述4步完整操作流程 |
| 测试数据 | 具体的输入值 |
| 期望测试结果 | 正向：功能正常完成的具体描述；异常：具体错误提示文本 |
| 前置条件 | 系统正常运行，用户已登录 |
| 测试类型 | 见下方类型列表 |
| 设计人员 | 用户提供或"[设计人员]" |
| 设计日期 | 用户提供或"[日期]" |
| 执行人员 | 用户提供或"[执行人员]" |
| 监督人员 | 用户提供或"[监督人员]" |
| 监督日期 | 用户提供或"[日期]" |
| 执行日期 | 留空 |
| 测试结果 | 留空 |

### 用例标识格式：A-B-C
- A：功能所属模块的拼音首字母缩写
- B：GNxx，xx从01起，切换模块时重新计数
- C：xxx，从001起，切换模块时重新从001计数

### 测试类型覆盖要求

必须包含：功能、异常、边界

按需包含：接口、性能、安全性、安装性、恢复性、兼容性、可靠性、强度、人机交互性、余量

规则：
- 1条用例只验证1个测试点
- 边界用例必须拆为两条（最大长度+超长）
- 所有有输入约束的字段都必须生成边界和超长异常用例

### 脚本输出流程

生成用例后调用：python scripts/export_testcases.py testcases.json 测试用例.xlsx

---

## 第3步：统计测试执行情况

调用：python scripts/stat_testcases.py 测试用例.xlsx 统计结果.xlsx`,
        author: 'Brian',
        version: 1,
        downloadCount: 0,
        references: [{ name: '需求规格说明.md', description: '示例需求文档（智能计算仿真验证平台节选）' }],
        scripts: [{ name: 'export_testcases.py', description: 'JSON→Excel转换脚本' }, { name: 'stat_testcases.py', description: '执行情况统计脚本' }],
        assets: [],
        tags: {
          create: [{ tagId: tags['测评中心'].id }],
        },
      },
    })
  }

  console.log('Seed completed.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
