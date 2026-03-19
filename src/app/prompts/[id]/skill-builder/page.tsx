import SkillBuilder from '@/components/ui/SkillBuilder'

export const dynamic = 'force-dynamic'

async function getPrompt(id: string) {
  const { prisma } = await import('@/lib/prisma')
  const prompt = await prisma.prompt.findUnique({
    where: { id: Number(id), isDeleted: false },
    include: {
      categories: { include: { category: { include: { dimension: true } } } },
      tags: { include: { tag: true } },
    },
  })
  return prompt
}

export default async function SkillBuilderPage({ params, searchParams }: { params: { id: string }; searchParams: { skillId?: string } }) {
  const prompt = await getPrompt(params.id)

  if (!prompt) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Prompt 不存在</p>
      </div>
    )
  }

  const serialized = JSON.parse(JSON.stringify(prompt))
  const skillId = searchParams.skillId ? Number(searchParams.skillId) : null

  return <SkillBuilder prompt={serialized} skillId={skillId} />
}
