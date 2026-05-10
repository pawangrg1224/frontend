import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const total = await prisma.appointment.count()
    const pending = await prisma.appointment.count({ where: { status: 'PENDING' } })
    return Response.json({ count: total, pending })
  } catch (err) {
    console.error('Error counting appointments:', err)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
