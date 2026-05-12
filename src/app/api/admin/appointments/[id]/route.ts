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
        customer: { select: { id: true, name: true, email: true, phone: true } },
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
    const body = await request.json()
    const { status } = body

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return NextResponse.json({ message: 'Not found' }, { status: 404 })

    // Prepare update data - only update status for accept/reject
    const updateData: any = { status }

    // If status is being changed to CONFIRMED, assign a token number
    if (status === 'CONFIRMED' && appointment.status !== 'CONFIRMED' && !appointment.tokenNumber) {
      // Get the next token number for this service on this date
      const dateStart = new Date(appointment.date)
      dateStart.setHours(0, 0, 0, 0)
      const dateEnd = new Date(appointment.date)
      dateEnd.setHours(23, 59, 59, 999)

      const maxToken = await prisma.appointment.findFirst({
        where: {
          serviceId: appointment.serviceId,
          date: { gte: dateStart, lte: dateEnd },
          status: { in: ['CONFIRMED', 'COMPLETED'] },
          tokenNumber: { not: null },
        },
        orderBy: { tokenNumber: 'desc' },
        select: { tokenNumber: true },
      })

      updateData.tokenNumber = (maxToken?.tokenNumber || 0) + 1
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true } },
        user: { select: { fullName: true, email: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error('Error updating appointment:', err)
    return NextResponse.json({
      message: 'Internal server error',
      error: err instanceof Error ? err.message : String(err)
    }, { status: 500 })
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
