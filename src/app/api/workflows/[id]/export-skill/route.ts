import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'

export const dynamic = 'force-dynamic'

function toSkillName(title: string) {
  return title
    .toLowerCase()
    .replace(/[\s\u4e00-\u9fa5]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'skill'
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const workflow = await prisma.workflow.findUnique({
    where: { id: Number(params.id) },
    include: {
      steps: {
        include: {
          prompt: {
            include: {
              categories: { include: { category: { include: { dimension: true } } } },
              tags: { include: { tag: true } },
            },
          },
        },
        orderBy: { stepOrder: 'asc' },
      },
    },
  })

  if (!workflow) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const zip = new JSZip()
  const usedNames = new Set<string>()

  for (const step of workflow.steps) {
    const p = step.prompt
    let skillName = toSkillName(p.title)
    if (usedNames.has(skillName)) skillName = `${skillName}-${step.stepOrder + 1}`
    usedNames.add(skillName)

    const cats = p.categories.map(c => `${c.category.dimension?.name}/${c.category.name}`).join(', ')
    const tags = p.tags.map(t => t.tag.name).join(', ')

    const skillMd = [
      `---`,
      `name: ${skillName}`,
      `description: ${p.description || p.title}`,
      cats ? `categories: ${cats}` : null,
      tags ? `tags: ${tags}` : null,
      p.author ? `author: ${p.author}` : null,
      `workflow: ${workflow.name}`,
      `step: ${step.stepOrder + 1}`,
      `---`,
      ``,
      p.content,
    ].filter(line => line !== null).join('\n')

    zip.folder(skillName)!.file('SKILL.md', skillMd)
  }

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  const zipName = toSkillName(workflow.name) || 'workflow-skills'

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${zipName}-skills.zip"`,
    },
  })
}
