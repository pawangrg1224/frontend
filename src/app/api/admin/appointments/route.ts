import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true } },
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { date: 'desc' },
    })
    return NextResponse.json({ data: appointments })
  } catch (err) {
    console.error('Error fetching appointments:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const { customerId, serviceId, userId, date, status, notes } = await request.json()

    if (!customerId || !serviceId || !userId || !date) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        serviceId,
        userId,
        date: new Date(date),
        status: status || 'PENDING',
        notes,
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        service: { select: { id: true, name: true } },
        user: { select: { fullName: true, email: true } },
      },
    })
    return NextResponse.json(appointment, { status: 201 })
  } catch (err) {
    console.error('Error creating appointment:', err)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
