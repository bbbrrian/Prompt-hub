import { prisma } from '@/lib/prisma'

export function validateTags(tags: unknown): tags is string[] {
  if (!Array.isArray(tags) || tags.length > 20) return false
  return tags.every(t => typeof t === 'string' && t.length > 0 && t.length <= 50)
}

export async function resolveTagIds(tagNames: string[]) {
  const result = []
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    result.push({ tagId: tag.id })
  }
  return result
}
