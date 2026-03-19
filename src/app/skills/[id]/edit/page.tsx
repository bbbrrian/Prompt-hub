import SkillBuilder from '@/components/ui/SkillBuilder'

export default function EditSkillPage({ params }: { params: { id: string } }) {
  return <SkillBuilder skillId={Number(params.id)} />
}
