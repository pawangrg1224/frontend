import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const appointments = await prisma.appointment.findMany({
      where: { serviceId: id },
      select: { id: true },
    })
    const appointmentIds = appointments.map((a) => a.id)
    if (appointmentIds.length > 0) {
      await prisma.notificationLog.deleteMany({ where: { appointmentId: { in: appointmentIds } } })
      await prisma.message.deleteMany({ where: { appointmentId: { in: appointmentIds } } })
      await prisma.review.deleteMany({ where: { appointmentId: { in: appointmentIds } } })
      await prisma.appointment.deleteMany({ where: { serviceId: id } })
    }
    await prisma.review.deleteMany({ where: { serviceId: id } })
    await prisma.service.delete({ where: { id } })
    return NextResponse.json({ message: 'Service deleted successfully' })
  } catch (err) {
    console.error('Error deleting service:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
