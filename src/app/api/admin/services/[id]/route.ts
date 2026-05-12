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

/**
 * PATCH /api/admin/services/[id]
 * Body: { doctorName: string | null }
 * Assigns or removes the doctor from a service.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const { doctorName } = await request.json()
    const updated = await prisma.service.update({
      where: { id },
      data: { doctorName: doctorName ?? null },
      select: { id: true, name: true, doctorName: true },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error updating service doctor:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/admin/services/[id]
 * Body: { name: string, description?: string, price: number, duration?: number }
 * Updates department details.
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const { name, description, price, duration } = await request.json()

    if (!name || !price) {
      return NextResponse.json({ message: 'Name and price are required' }, { status: 400 })
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        duration: duration || 60,
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error updating service:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
