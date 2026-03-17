'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button, Input, Modal, Tree, message, Popconfirm, Empty, Spin } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { Dimension, Category } from '@/store/prompt'

interface EditingItem {
  type: 'dimension' | 'category'
  id?: number
  name: string
  dimensionId?: number
  parentId?: number | null
}

export default function CategoriesPage() {
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<EditingItem | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/categories')
    const data = await res.json()
    setDimensions(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async () => {
    if (!editing || !editing.name.trim()) {
      message.error('名称不能为空')
      return
    }
    setSubmitting(true)
    const isEdit = !!editing.id
    const url = '/api/categories'
    const method = isEdit ? 'PUT' : 'POST'
    const body: any = { type: editing.type, name: editing.name }
    if (isEdit) body.id = editing.id
    if (editing.type === 'category') {
      body.dimensionId = editing.dimensionId
      body.parentId = editing.parentId || null
    }
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    setSubmitting(false)
    setModalOpen(false)
    setEditing(null)
    message.success(isEdit ? '更新成功' : '创建成功')
    fetchData()
  }

  const handleDelete = async (type: 'dimension' | 'category', id: number) => {
    await fetch(`/api/categories?type=${type}&id=${id}`, { method: 'DELETE' })
    message.success('已删除')
    fetchData()
  }

  const openAdd = (type: 'dimension' | 'category', dimensionId?: number, parentId?: number | null) => {
    setEditing({ type, name: '', dimensionId, parentId })
    setModalOpen(true)
  }

  const openEdit = (type: 'dimension' | 'category', item: any) => {
    setEditing({
      type,
      id: item.id,
      name: item.name,
      dimensionId: item.dimensionId,
      parentId: item.parentId,
    })
    setModalOpen(true)
  }

  const buildTreeData = (dim: Dimension) => {
    const roots = dim.categories.filter(c => !c.parentId)
    return roots.map(cat => ({
      key: `cat-${cat.id}`,
      title: (
        <div className="flex items-center justify-between group/item py-0.5">
          <span>{cat.name}</span>
          <span className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 ml-4">
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); openAdd('category', dim.id, cat.id) }} />
            <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit('category', cat) }} />
            <Popconfirm title="确认删除?" onConfirm={() => handleDelete('category', cat.id)}>
              <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </span>
        </div>
      ),
      children: dim.categories
        .filter(c => c.parentId === cat.id)
        .map(sub => ({
          key: `cat-${sub.id}`,
          title: (
            <div className="flex items-center justify-between group/sub py-0.5">
              <span>{sub.name}</span>
              <span className="opacity-0 group-hover/sub:opacity-100 flex items-center gap-1 ml-4">
                <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit('category', sub) }} />
                <Popconfirm title="确认删除?" onConfirm={() => handleDelete('category', sub.id)}>
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                </Popconfirm>
              </span>
            </div>
          ),
        })),
    }))
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spin size="large" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold neon-text">分类管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd('dimension')}>
          新建维度
        </Button>
      </div>

      {dimensions.length === 0 ? (
        <Empty description="暂无维度，请先创建" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map((dim) => (
            <div key={dim.id} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-100">{dim.name}</h3>
                <div className="flex items-center gap-1">
                  <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => openAdd('category', dim.id)}>
                    添加分类
                  </Button>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit('dimension', dim)} />
                  <Popconfirm title="删除维度将同时删除其下所有分类，确认？" onConfirm={() => handleDelete('dimension', dim.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </div>
              </div>

              {dim.categories.length === 0 ? (
                <p className="text-sm text-gray-500">暂无分类</p>
              ) : (
                <Tree
                  treeData={buildTreeData(dim)}
                  defaultExpandAll
                  selectable={false}
                  className="bg-transparent"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing?.id ? `编辑${editing.type === 'dimension' ? '维度' : '分类'}` : `新建${editing?.type === 'dimension' ? '维度' : '分类'}`}
        onCancel={() => { setModalOpen(false); setEditing(null) }}
        onOk={handleSave}
        confirmLoading={submitting}
      >
        <Input
          value={editing?.name || ''}
          onChange={e => setEditing(prev => prev ? { ...prev, name: e.target.value } : null)}
          placeholder="输入名称"
          className="mt-4"
          onPressEnter={handleSave}
        />
      </Modal>
    </div>
  )
}
