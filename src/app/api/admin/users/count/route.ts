import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const count = await prisma.user.count()
    return Response.json({ count })
  } catch (err) {
    console.error('Error counting users:', err)
    return Response.json({ message: 'Internal server error' }, { status: 500 })
  }
}
