import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
        user: { select: { fullName: true, email: true } },
      },
    })
    if (!appointment) return NextResponse.json({ message: 'Not found' }, { status: 404 })
    return NextResponse.json(appointment)
  } catch (err) {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const { customerId, serviceId, userId, date, status, notes } = await request.json()
    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(customerId && { customerId }),
        ...(serviceId && { serviceId }),
        ...(userId && { userId }),
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        service: { select: { id: true, name: true } },
        user: { select: { fullName: true, email: true } },
      },
    })
    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error updating appointment:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()
  const { id } = await params

  try {
    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ message: 'Appointment deleted' })
  } catch (err) {
    console.error('Error deleting appointment:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
