import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession } from '@/lib/session'
import { sendAppointmentEmail, type AppointmentWithRelations } from '@/lib/notifications'

const bookingSchema = z.object({
  slotId: z.string().min(1),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Patient must be signed in
    const session = await getAuthSession()
    if (!session?.user?.email) {
      return NextResponse.json({ message: 'Please sign in to book an appointment' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bookingSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation error', errors: parsed.error.flatten() }, { status: 400 })
    }

    const { slotId, notes } = parsed.data

    // Get the slot with current booking count
    const slot = await prisma.appointmentSlot.findUnique({
      where: { id: slotId },
      include: {
        service: true,
        _count: { select: { appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } },
      },
    })

    if (!slot) return NextResponse.json({ message: 'Slot not found' }, { status: 404 })
    if (!slot.isOpen) return NextResponse.json({ message: 'This slot is closed' }, { status: 409 })
    if (slot._count.appointments >= slot.slotLimit) {
      return NextResponse.json({ message: 'This slot is fully booked', code: 'SLOT_FULL' }, { status: 409 })
    }

    // Get the logged-in user
    const patientUser = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!patientUser) return NextResponse.json({ message: 'User not found' }, { status: 404 })

    // Find or create customer record from user
    let customer = await prisma.customer.findUnique({ where: { email: patientUser.email } })
    if (!customer) {
      customer = await prisma.customer.create({
        data: { name: patientUser.fullName, email: patientUser.email, phone: '' },
      })
    }

    // Find admin to assign as userId
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    if (!admin) return NextResponse.json({ message: 'No admin found' }, { status: 500 })

    // Check patient hasn't already booked this slot
    const existing = await prisma.appointment.findFirst({
      where: {
        slotId,
        patientId: patientUser.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    })
    if (existing) {
      return NextResponse.json({ message: 'You have already booked this slot' }, { status: 409 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: slot.slotDate,
        notes: notes ?? null,
        customerId: customer.id,
        serviceId: slot.serviceId,
        userId: admin.id,
        patientId: patientUser.id,
        slotId: slot.id,
        status: 'PENDING',
        type: 'OFFLINE',
      },
      include: {
        customer: true,
        service: { include: { domain: true } },
        domain: true,
      },
    })

    try {
      await sendAppointmentEmail('CONFIRMATION', appointment as AppointmentWithRelations)
    } catch (emailErr) {
      console.error('Confirmation email failed:', emailErr)
    }

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ message: 'An error occurred while booking' }, { status: 500 })
  }
}
