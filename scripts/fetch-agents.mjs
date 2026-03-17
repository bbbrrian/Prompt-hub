import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const BASE_URL = 'https://raw.githubusercontent.com/msitarzewski/agency-agents/main'

const AGENT_FILES = [
  // Academic
  { path: 'academic/academic-anthropologist.md', id: 'anthropologist', division: 'academic', divisionZh: '学术' },
  { path: 'academic/academic-geographer.md', id: 'geographer', division: 'academic', divisionZh: '学术' },
  { path: 'academic/academic-historian.md', id: 'historian', division: 'academic', divisionZh: '学术' },
  { path: 'academic/academic-narratologist.md', id: 'narratologist', division: 'academic', divisionZh: '学术' },
  { path: 'academic/academic-psychologist.md', id: 'psychologist', division: 'academic', divisionZh: '学术' },
  // Design
  { path: 'design/design-brand-guardian.md', id: 'brand-guardian', division: 'design', divisionZh: '设计' },
  { path: 'design/design-image-prompt-engineer.md', id: 'image-prompt-engineer', division: 'design', divisionZh: '设计' },
  { path: 'design/design-inclusive-visuals-specialist.md', id: 'inclusive-visuals-specialist', division: 'design', divisionZh: '设计' },
  { path: 'design/design-ui-designer.md', id: 'ui-designer', division: 'design', divisionZh: '设计' },
  { path: 'design/design-ux-architect.md', id: 'ux-architect', division: 'design', divisionZh: '设计' },
  { path: 'design/design-ux-researcher.md', id: 'ux-researcher', division: 'design', divisionZh: '设计' },
  { path: 'design/design-visual-storyteller.md', id: 'visual-storyteller', division: 'design', divisionZh: '设计' },
  { path: 'design/design-whimsy-injector.md', id: 'whimsy-injector', division: 'design', divisionZh: '设计' },
  // Engineering
  { path: 'engineering/engineering-ai-data-remediation-engineer.md', id: 'ai-data-remediation-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-ai-engineer.md', id: 'ai-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-autonomous-optimization-architect.md', id: 'autonomous-optimization-architect', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-backend-architect.md', id: 'backend-architect', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-code-reviewer.md', id: 'code-reviewer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-data-engineer.md', id: 'data-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-database-optimizer.md', id: 'database-optimizer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-devops-automator.md', id: 'devops-automator', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-embedded-firmware-engineer.md', id: 'embedded-firmware-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-feishu-integration-developer.md', id: 'feishu-developer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-frontend-developer.md', id: 'frontend-developer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-git-workflow-master.md', id: 'git-workflow-master', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-incident-response-commander.md', id: 'incident-response-commander', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-mobile-app-builder.md', id: 'mobile-app-builder', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-rapid-prototyper.md', id: 'rapid-prototyper', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-security-engineer.md', id: 'security-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-senior-developer.md', id: 'senior-developer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-software-architect.md', id: 'software-architect', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-solidity-smart-contract-engineer.md', id: 'solidity-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-sre.md', id: 'sre', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-technical-writer.md', id: 'technical-writer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-threat-detection-engineer.md', id: 'threat-detection-engineer', division: 'engineering', divisionZh: '工程' },
  { path: 'engineering/engineering-wechat-mini-program-developer.md', id: 'wechat-miniprogram-developer', division: 'engineering', divisionZh: '工程' },
  // Game Development
  { path: 'game-development/blender/blender-addon-engineer.md', id: 'blender-addon-engineer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/game-audio-engineer.md', id: 'game-audio-engineer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/game-designer.md', id: 'game-designer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/godot/godot-gameplay-scripter.md', id: 'godot-scripter', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/godot/godot-multiplayer-engineer.md', id: 'godot-multiplayer-engineer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/godot/godot-shader-developer.md', id: 'godot-shader-developer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/level-designer.md', id: 'level-designer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/narrative-designer.md', id: 'narrative-designer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/roblox-studio/roblox-avatar-creator.md', id: 'roblox-avatar-creator', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/roblox-studio/roblox-experience-designer.md', id: 'roblox-experience-designer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/roblox-studio/roblox-systems-scripter.md', id: 'roblox-scripter', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/technical-artist.md', id: 'technical-artist', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unity/unity-architect.md', id: 'unity-architect', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unity/unity-editor-tool-developer.md', id: 'unity-editor-tool-developer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unity/unity-multiplayer-engineer.md', id: 'unity-multiplayer-engineer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unity/unity-shader-graph-artist.md', id: 'unity-shader-artist', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unreal-engine/unreal-multiplayer-architect.md', id: 'unreal-multiplayer-architect', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unreal-engine/unreal-systems-engineer.md', id: 'unreal-systems-engineer', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unreal-engine/unreal-technical-artist.md', id: 'unreal-technical-artist', division: 'game-development', divisionZh: '游戏开发' },
  { path: 'game-development/unreal-engine/unreal-world-builder.md', id: 'unreal-world-builder', division: 'game-development', divisionZh: '游戏开发' },
  // Marketing
  { path: 'marketing/marketing-ai-citation-strategist.md', id: 'ai-citation-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-app-store-optimizer.md', id: 'app-store-optimizer', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-baidu-seo-specialist.md', id: 'baidu-seo-specialist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-bilibili-content-strategist.md', id: 'bilibili-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-book-co-author.md', id: 'book-coauthor', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-carousel-growth-engine.md', id: 'carousel-growth-engine', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-china-ecommerce-operator.md', id: 'china-ecommerce-operator', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-content-creator.md', id: 'content-creator', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-cross-border-ecommerce.md', id: 'cross-border-ecommerce', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-douyin-strategist.md', id: 'douyin-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-growth-hacker.md', id: 'growth-hacker', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-instagram-curator.md', id: 'instagram-curator', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-kuaishou-strategist.md', id: 'kuaishou-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-linkedin-content-creator.md', id: 'linkedin-creator', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-livestream-commerce-coach.md', id: 'livestream-coach', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-podcast-strategist.md', id: 'podcast-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-private-domain-operator.md', id: 'private-domain-operator', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-reddit-community-builder.md', id: 'reddit-community-builder', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-seo-specialist.md', id: 'seo-specialist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-short-video-editing-coach.md', id: 'short-video-editing-coach', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-social-media-strategist.md', id: 'social-media-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-tiktok-strategist.md', id: 'tiktok-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-twitter-engager.md', id: 'twitter-engager', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-wechat-official-account.md', id: 'wechat-account-manager', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-weibo-strategist.md', id: 'weibo-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-xiaohongshu-specialist.md', id: 'xiaohongshu-specialist', division: 'marketing', divisionZh: '营销' },
  { path: 'marketing/marketing-zhihu-strategist.md', id: 'zhihu-strategist', division: 'marketing', divisionZh: '营销' },
  // Paid Media
  { path: 'paid-media/paid-media-auditor.md', id: 'paid-media-auditor', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-creative-strategist.md', id: 'paid-media-creative-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-paid-social-strategist.md', id: 'paid-social-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-ppc-strategist.md', id: 'ppc-strategist', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-programmatic-buyer.md', id: 'programmatic-buyer', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-search-query-analyst.md', id: 'search-query-analyst', division: 'marketing', divisionZh: '营销' },
  { path: 'paid-media/paid-media-tracking-specialist.md', id: 'tracking-specialist', division: 'marketing', divisionZh: '营销' },
  // Product
  { path: 'product/product-behavioral-nudge-engine.md', id: 'behavioral-nudge-engine', division: 'product', divisionZh: '产品' },
  { path: 'product/product-feedback-synthesizer.md', id: 'feedback-synthesizer', division: 'product', divisionZh: '产品' },
  { path: 'product/product-manager.md', id: 'product-manager', division: 'product', divisionZh: '产品' },
  { path: 'product/product-sprint-prioritizer.md', id: 'sprint-prioritizer', division: 'product', divisionZh: '产品' },
  { path: 'product/product-trend-researcher.md', id: 'trend-researcher', division: 'product', divisionZh: '产品' },
  // Project Management
  { path: 'project-management/project-management-experiment-tracker.md', id: 'experiment-tracker', division: 'project-management', divisionZh: '项目管理' },
  { path: 'project-management/project-management-jira-workflow-steward.md', id: 'jira-workflow-steward', division: 'project-management', divisionZh: '项目管理' },
  { path: 'project-management/project-management-project-shepherd.md', id: 'project-shepherd', division: 'project-management', divisionZh: '项目管理' },
  { path: 'project-management/project-management-studio-operations.md', id: 'studio-operations', division: 'project-management', divisionZh: '项目管理' },
  { path: 'project-management/project-management-studio-producer.md', id: 'studio-producer', division: 'project-management', divisionZh: '项目管理' },
  { path: 'project-management/project-manager-senior.md', id: 'senior-project-manager', division: 'project-management', divisionZh: '项目管理' },
  // Sales
  { path: 'sales/sales-account-strategist.md', id: 'account-strategist', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-coach.md', id: 'sales-coach', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-deal-strategist.md', id: 'deal-strategist', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-discovery-coach.md', id: 'discovery-coach', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-engineer.md', id: 'sales-engineer', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-outbound-strategist.md', id: 'outbound-strategist', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-pipeline-analyst.md', id: 'pipeline-analyst', division: 'sales', divisionZh: '销售' },
  { path: 'sales/sales-proposal-strategist.md', id: 'proposal-strategist', division: 'sales', divisionZh: '销售' },
  // Spatial Computing
  { path: 'spatial-computing/macos-spatial-metal-engineer.md', id: 'metal-engineer', division: 'spatial-computing', divisionZh: '空间计算' },
  { path: 'spatial-computing/terminal-integration-specialist.md', id: 'terminal-integration-specialist', division: 'spatial-computing', divisionZh: '空间计算' },
  { path: 'spatial-computing/visionos-spatial-engineer.md', id: 'visionos-engineer', division: 'spatial-computing', divisionZh: '空间计算' },
  { path: 'spatial-computing/xr-cockpit-interaction-specialist.md', id: 'xr-cockpit-specialist', division: 'spatial-computing', divisionZh: '空间计算' },
  { path: 'spatial-computing/xr-immersive-developer.md', id: 'webxr-developer', division: 'spatial-computing', divisionZh: '空间计算' },
  { path: 'spatial-computing/xr-interface-architect.md', id: 'xr-interface-architect', division: 'spatial-computing', divisionZh: '空间计算' },
  // Specialized
  { path: 'specialized/accounts-payable-agent.md', id: 'accounts-payable-agent', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/agentic-identity-trust.md', id: 'agentic-identity-trust', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/agents-orchestrator.md', id: 'agents-orchestrator', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/automation-governance-architect.md', id: 'automation-governance-architect', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/blockchain-security-auditor.md', id: 'blockchain-auditor', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/compliance-auditor.md', id: 'compliance-auditor', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/corporate-training-designer.md', id: 'corporate-training-designer', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/data-consolidation-agent.md', id: 'data-consolidation-agent', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/government-digital-presales-consultant.md', id: 'government-digital-presales', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/healthcare-marketing-compliance.md', id: 'healthcare-marketing-compliance', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/identity-graph-operator.md', id: 'identity-graph-operator', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/lsp-index-engineer.md', id: 'lsp-index-engineer', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/recruitment-specialist.md', id: 'recruitment-specialist', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/report-distribution-agent.md', id: 'report-distribution-agent', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/sales-data-extraction-agent.md', id: 'sales-data-extraction-agent', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-cultural-intelligence-strategist.md', id: 'cultural-intelligence-strategist', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-developer-advocate.md', id: 'developer-advocate', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-document-generator.md', id: 'document-generator', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-french-consulting-market.md', id: 'french-consulting-market', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-korean-business-navigator.md', id: 'korean-business-navigator', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-mcp-builder.md', id: 'mcp-builder', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-model-qa.md', id: 'model-qa-specialist', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-salesforce-architect.md', id: 'salesforce-architect', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/specialized-workflow-architect.md', id: 'workflow-architect', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/study-abroad-advisor.md', id: 'study-abroad-advisor', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/supply-chain-strategist.md', id: 'supply-chain-strategist', division: 'specialized', divisionZh: '专业' },
  { path: 'specialized/zk-steward.md', id: 'zk-steward', division: 'specialized', divisionZh: '专业' },
  // Support
  { path: 'support/support-analytics-reporter.md', id: 'analytics-reporter', division: 'support', divisionZh: '支持' },
  { path: 'support/support-executive-summary-generator.md', id: 'executive-summary-generator', division: 'support', divisionZh: '支持' },
  { path: 'support/support-finance-tracker.md', id: 'finance-tracker', division: 'support', divisionZh: '支持' },
  { path: 'support/support-infrastructure-maintainer.md', id: 'infrastructure-maintainer', division: 'support', divisionZh: '支持' },
  { path: 'support/support-legal-compliance-checker.md', id: 'legal-compliance-checker', division: 'support', divisionZh: '支持' },
  { path: 'support/support-support-responder.md', id: 'support-responder', division: 'support', divisionZh: '支持' },
  // Testing
  { path: 'testing/testing-accessibility-auditor.md', id: 'accessibility-auditor', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-api-tester.md', id: 'api-tester', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-evidence-collector.md', id: 'evidence-collector', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-performance-benchmarker.md', id: 'performance-benchmarker', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-reality-checker.md', id: 'reality-checker', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-test-results-analyzer.md', id: 'test-results-analyzer', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-tool-evaluator.md', id: 'tool-evaluator', division: 'testing', divisionZh: '测试' },
  { path: 'testing/testing-workflow-optimizer.md', id: 'workflow-optimizer', division: 'testing', divisionZh: '测试' },
]

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/)
  if (!match) return { name: '', description: '', emoji: '🤖', content }
  const fm = {}
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':')
    if (k && v.length) fm[k.trim()] = v.join(':').trim()
  })
  return {
    name: fm.name || '',
    description: fm.description || '',
    emoji: fm.emoji || '🤖',
    content: content.slice(match[0].length).trim()
  }
}

async function fetchAgent(file) {
  const url = `${BASE_URL}/${file.path}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) {
      console.error(`FAILED ${file.path}: ${resp.status}`)
      return null
    }
    const text = await resp.text()
    const parsed = parseFrontmatter(text)
    return {
      id: file.id,
      name: parsed.name || file.id,
      emoji: parsed.emoji,
      description: parsed.description,
      division: file.division,
      divisionZh: file.divisionZh,
      systemPrompt: parsed.content,
    }
  } catch (e) {
    console.error(`ERROR ${file.path}:`, e.message)
    return null
  }
}

async function main() {
  console.log(`Fetching ${AGENT_FILES.length} agents...`)
  const agents = []

  // Batch fetch with concurrency limit
  const BATCH = 10
  for (let i = 0; i < AGENT_FILES.length; i += BATCH) {
    const batch = AGENT_FILES.slice(i, i + BATCH)
    const results = await Promise.all(batch.map(fetchAgent))
    results.forEach(r => { if (r) agents.push(r) })
    console.log(`Progress: ${Math.min(i + BATCH, AGENT_FILES.length)}/${AGENT_FILES.length}`)
    if (i + BATCH < AGENT_FILES.length) await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\nFetched ${agents.length} agents successfully`)

  const divisionNames = {}
  agents.forEach(a => { divisionNames[a.division] = a.divisionZh })

  const DIVISIONS = [
    { id: 'engineering', nameZh: '工程' },
    { id: 'design', nameZh: '设计' },
    { id: 'marketing', nameZh: '营销' },
    { id: 'sales', nameZh: '销售' },
    { id: 'product', nameZh: '产品' },
    { id: 'project-management', nameZh: '项目管理' },
    { id: 'testing', nameZh: '测试' },
    { id: 'support', nameZh: '支持' },
    { id: 'game-development', nameZh: '游戏开发' },
    { id: 'specialized', nameZh: '专业' },
    { id: 'spatial-computing', nameZh: '空间计算' },
    { id: 'academic', nameZh: '学术' },
  ]

  const output = `// Auto-generated by scripts/fetch-agents.mjs
// Source: https://github.com/msitarzewski/agency-agents

export interface Agent {
  id: string
  name: string
  emoji: string
  description: string
  division: string
  divisionZh: string
  systemPrompt: string
}

export const DIVISIONS = ${JSON.stringify(DIVISIONS, null, 2)}

export const AGENTS: Agent[] = ${JSON.stringify(agents, null, 2)}
`

  const outPath = join(__dirname, '../src/data/agents.ts')
  writeFileSync(outPath, output, 'utf-8')
  console.log(`\nWritten to ${outPath}`)
  console.log(`Total agents: ${agents.length}`)
}

main().catch(console.error)
