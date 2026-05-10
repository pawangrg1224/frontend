import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { sendAppointmentEmail, type AppointmentWithRelations } from '@/lib/notifications'
import { NotificationType } from '@prisma/client'

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { appointmentId, type } = await request.json()

    if (!appointmentId || !type) {
        return NextResponse.json({ message: 'appointmentId and type are required' }, { status: 400 })
    }

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { customer: true, service: true, domain: true },
    })

    if (!appointment) {
        return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    await sendAppointmentEmail(type as NotificationType, appointment as AppointmentWithRelations)

    return NextResponse.json({ message: 'Notification sent' })
}
