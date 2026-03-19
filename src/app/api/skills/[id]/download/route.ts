import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import JSZip from 'jszip'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const skill = await prisma.skill.findUnique({
    where: { id: Number(params.id), isDeleted: false },
    include: { tags: { include: { tag: true } } },
  })
  if (!skill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tagStr = (skill.tags as any[])?.map((t: any) => t.tag.name).join(', ')
  const skillMd = [
    '---',
    `name: ${skill.name}`,
    `description: ${skill.description}`,
    tagStr ? `tags: ${tagStr}` : null,
    skill.author ? `author: ${skill.author}` : null,
    '---',
    '',
    skill.content,
  ].filter(Boolean).join('\n')

  const zip = new JSZip()
  const folder = zip.folder(skill.name)!
  folder.file('SKILL.md', skillMd)

  const refs = skill.references as any[] | null
  if (refs?.length) {
    const refFolder = folder.folder('references')!
    refs.forEach((r: any) => refFolder.file(r.filename, r.content))
  }

  const scripts = skill.scripts as any[] | null
  if (scripts?.length) {
    const scriptFolder = folder.folder('scripts')!
    scripts.forEach((s: any) => scriptFolder.file(s.filename, s.content))
  }

  const assets = skill.assets as any[] | null
  if (assets?.length) {
    const assetFolder = folder.folder('assets')!
    for (const a of assets) {
      const filePath = path.join(process.cwd(), 'public', a.storedPath)
      if (fs.existsSync(filePath)) {
        assetFolder.file(a.filename, fs.readFileSync(filePath))
      }
    }
  }

  await prisma.skill.update({ where: { id: skill.id }, data: { downloadCount: { increment: 1 } } })

  const buffer = await zip.generateAsync({ type: 'nodebuffer' })
  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(skill.name)}.zip`,
    },
  })
}
