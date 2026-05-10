import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        customer: true,
        service: { include: { domain: true } },
        domain: true,
        review: true,
      },
    })

    if (!appointment) return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })

    const { customerId, serviceId, date, status, notes } = await request.json()

    // Patients can only cancel their own appointments
    if (user.role !== 'ADMIN') {
      if (appointment.patientId !== user.id) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 })
      }
      if (status && status !== 'CANCELLED') {
        return NextResponse.json({ message: 'You can only cancel your appointment' }, { status: 403 })
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(customerId && { customerId }),
        ...(serviceId && { serviceId }),
        ...(date && { date: new Date(date) }),
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
      },
      include: { customer: true, service: true },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    const appointment = await prisma.appointment.findUnique({ where: { id } })
    if (!appointment) return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })

    await prisma.appointment.delete({ where: { id } })
    return NextResponse.json({ message: 'Appointment deleted' })
  } catch (error) {
    console.error('Delete appointment error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}
