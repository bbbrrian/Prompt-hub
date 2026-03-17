'use client'

import { useEffect, useState } from 'react'
import { Pagination, Spin, Empty, message, Button, Upload, Checkbox, Select, Modal, TreeSelect, Alert, Tooltip, Segmented } from 'antd'
import { DownloadOutlined, UploadOutlined, DeleteOutlined, TagOutlined, FolderOutlined, EyeOutlined, FileTextOutlined, FileOutlined } from '@ant-design/icons'
import { usePromptStore } from '@/store/prompt'
import type { PromptItem } from '@/store/prompt'
import PromptCard from '@/components/ui/PromptCard'
import PromptDetail from '@/components/ui/PromptDetail'
import SearchBar from '@/components/ui/SearchBar'
import CategoryFilter from '@/components/ui/CategoryFilter'

export default function PromptsPage() {
  const { items, total, page, pageSize, loading, categoryId, tagId, mine, dimensions, tags, fetchPrompts, fetchDimensions, fetchTags, setPage, setMine } = usePromptStore()
  const [detailItem, setDetailItem] = useState<PromptItem | null>(null)
  const [importing, setImporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [batchAction, setBatchAction] = useState<string | null>(null)
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchCategoryIds, setBatchCategoryIds] = useState<number[]>([])
  const [batchTagIds, setBatchTagIds] = useState<number[]>([])
  const [batchVisibility, setBatchVisibility] = useState<string>('PUBLIC')
  const [batchSkillGuideOpen, setBatchSkillGuideOpen] = useState(false)

  const allSelected = items.length > 0 && items.every(i => selectedIds.includes(i.id))

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(items.map(i => i.id))
  }

  const treeData = dimensions.map((dim) => ({
    title: dim.name,
    value: `dim-${dim.id}`,
    selectable: false,
    children: dim.categories
      .filter((c: any) => !c.parentId)
      .map((cat: any) => ({
        title: cat.name,
        value: cat.id,
        children: dim.categories
          .filter((c: any) => c.parentId === cat.id)
          .map((sub: any) => ({ title: sub.name, value: sub.id })),
      })),
  }))

  const executeBatch = async () => {
    if (!selectedIds.length) return
    setBatchLoading(true)
    let payload: any = { ids: selectedIds, action: batchAction }
    if (batchAction === 'move') payload.categoryIds = batchCategoryIds
    if (batchAction === 'tag') payload.tagIds = batchTagIds
    if (batchAction === 'visibility') payload.visibility = batchVisibility

    const res = await fetch('/api/prompts/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setBatchLoading(false)
    setBatchAction(null)
    setSelectedIds([])
    if (res.ok) {
      message.success('批量操作完成')
      fetchPrompts()
    } else {
      message.error('操作失败')
    }
  }

  useEffect(() => {
    fetchPrompts()
    fetchDimensions()
    fetchTags()
  }, [fetchPrompts, fetchDimensions, fetchTags])

  const handleExport = (format: 'json' | 'markdown') => {
    const params = new URLSearchParams({ format })
    if (categoryId) params.set('categoryId', String(categoryId))
    if (tagId) params.set('tagId', String(tagId))
    window.open(`/api/prompts/export?${params}`, '_blank')
  }

  const handleImport = async (file: File) => {
    setImporting(true)
    try {
      const text = await file.text()
      const isCSV = file.name.endsWith('.csv') || file.type === 'text/csv'
      let res: Response
      if (isCSV) {
        res = await fetch('/api/prompts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'text/csv' },
          body: text,
        })
      } else {
        const data = JSON.parse(text)
        res = await fetch('/api/prompts/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
      }
      const result = await res.json()
      if (res.ok) {
        message.success(`导入完成：新增 ${result.created} 条，跳过 ${result.skipped} 条`)
        fetchPrompts()
      } else {
        message.error(result.error || '导入失败')
      }
    } catch {
      message.error('文件解析失败，请确保是有效的 JSON 或 CSV 格式')
    }
    setImporting(false)
    return false
  }

  const handleBatchExportSkill = async () => {
    const res = await fetch('/api/prompts/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: selectedIds, action: 'export-skill' }),
    })
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'skills.zip'; a.click()
    URL.revokeObjectURL(url)
    setBatchSkillGuideOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold neon-text">Prompt 库</h2>
        <div className="flex items-center gap-2">
          <Upload
            accept=".json,.csv"
            showUploadList={false}
            beforeUpload={handleImport}
          >
            <Tooltip title="导入 JSON/CSV">
              <Button icon={<UploadOutlined />} loading={importing} />
            </Tooltip>
          </Upload>
          <Tooltip title="导出 JSON">
            <Button icon={<FileTextOutlined />} onClick={() => handleExport('json')} />
          </Tooltip>
          <Tooltip title="导出 Markdown">
            <Button icon={<FileOutlined />} onClick={() => handleExport('markdown')} />
          </Tooltip>
          <a href="/prompts/generate" className="neon-button">✨ AI 生成</a>
          <a href="/prompts/new" className="neon-button">+ 新建 Prompt</a>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-56 shrink-0">
          <div className="glass-card p-4 sticky top-24">
            <CategoryFilter />
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <Segmented
              options={['全部', '我的']}
              value={mine ? '我的' : '全部'}
              onChange={(v) => setMine(v === '我的')}
            />
            <div className="flex-1">
              <SearchBar />
            </div>
          </div>

          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-cyan-500/25"
              style={{ background: 'linear-gradient(90deg, rgba(0,255,255,0.08), rgba(0,128,255,0.05))' }}>
              <Checkbox checked={allSelected} onChange={toggleAll} className="shrink-0" />
              <span className="text-sm font-medium text-cyan-300 shrink-0">已选 {selectedIds.length} 项</span>
              <div className="w-px h-4 bg-white/10 shrink-0" />
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setBatchAction('delete')}>删除</Button>
              <Button size="small" icon={<FolderOutlined />} onClick={() => setBatchAction('move')}>移动分类</Button>
              <Button size="small" icon={<TagOutlined />} onClick={() => setBatchAction('tag')}>打标签</Button>
              <Button size="small" icon={<EyeOutlined />} onClick={() => setBatchAction('visibility')}>可见性</Button>
              <Button size="small" icon={<DownloadOutlined />} onClick={() => setBatchSkillGuideOpen(true)}>导出 Skill</Button>
              <Button size="small" type="link" className="ml-auto" onClick={() => setSelectedIds([])}>取消</Button>
            </div>
          ) : items.length > 0 ? (
            <div className="flex items-center gap-2">
              <Checkbox checked={allSelected} onChange={toggleAll}>全选</Checkbox>
            </div>
          ) : null}

          {loading ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : items.length === 0 ? (
            <Empty description="暂无 Prompt" className="py-20" />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => (
                  <div key={item.id} className="relative">
                    <div className="absolute top-2 left-2 z-10">
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                    <PromptCard item={item} onView={setDetailItem} />
                  </div>
                ))}
              </div>

              {total > pageSize && (
                <div className="flex justify-center pt-4">
                  <Pagination
                    current={page}
                    total={total}
                    pageSize={pageSize}
                    onChange={setPage}
                    showTotal={(t) => `共 ${t} 条`}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PromptDetail item={detailItem} open={!!detailItem} onClose={() => setDetailItem(null)} />

      <Modal
        title={
          batchAction === 'delete' ? '确认批量删除' :
          batchAction === 'move' ? '移动到分类' :
          batchAction === 'tag' ? '批量打标签' :
          batchAction === 'visibility' ? '设置可见性' : ''
        }
        open={!!batchAction}
        onCancel={() => setBatchAction(null)}
        onOk={executeBatch}
        confirmLoading={batchLoading}
      >
        {batchAction === 'delete' && <p>确定删除选中的 {selectedIds.length} 个 Prompt？</p>}
        {batchAction === 'move' && (
          <TreeSelect
            treeData={treeData}
            value={batchCategoryIds}
            onChange={setBatchCategoryIds}
            treeCheckable
            placeholder="选择目标分类"
            className="w-full"
          />
        )}
        {batchAction === 'tag' && (
          <Select
            mode="multiple"
            value={batchTagIds}
            onChange={setBatchTagIds}
            placeholder="选择标签"
            className="w-full"
            options={tags.map(t => ({ label: t.name, value: t.id }))}
          />
        )}
        {batchAction === 'visibility' && (
          <Select
            value={batchVisibility}
            onChange={setBatchVisibility}
            className="w-full"
            options={[
              { label: '公开', value: 'PUBLIC' },
              { label: '部门可见', value: 'DEPARTMENT' },
              { label: '私有', value: 'PRIVATE' },
            ]}
          />
        )}
      </Modal>

      <Modal
        open={batchSkillGuideOpen}
        onCancel={() => setBatchSkillGuideOpen(false)}
        title="安装 Skill 指南"
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setBatchSkillGuideOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleBatchExportSkill}>立即下载</Button>
          </div>
        }
        width={520}
      >
        <div className="space-y-4 py-2">
          <ol className="space-y-2 text-sm text-gray-300 list-decimal list-inside">
            <li>解压下载的 zip 文件到任意目录</li>
            <li>确认文件夹内包含 SKILL.md 文件</li>
            <li>将文件夹复制到 ~/.claude/skills/ 目录下</li>
            <li>或在 ~/.claude/settings.json 的 skillsDirectories 中添加路径</li>
            <li>重启 Claude Code 即可使用 /skill-name 调用</li>
          </ol>
          <Alert
            type="warning"
            message="建议单次安装不超过 16 个 Skill，过多会导致模型质量下降"
          />
        </div>
      </Modal>
    </div>
  )
}
