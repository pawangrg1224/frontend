import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ message: 'Customer deleted successfully' })
  } catch (err) {
    console.error('Error deleting customer:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
