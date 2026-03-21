import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const departments = [
    '创新中心', '研发中心', '测评中心', '质量部',
    '运营中心', '市场部', '财务部', '综合管理部'
  ]

  for (const name of departments) {
    await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  const parent = await prisma.department.findUnique({ where: { name: '综合管理部' } })
  if (parent) {
    await prisma.department.upsert({
      where: { name: '保密办' },
      update: { parentId: parent.id },
      create: { name: '保密办', parentId: parent.id }
    })
  }

  console.log('部门数据预置完成')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
