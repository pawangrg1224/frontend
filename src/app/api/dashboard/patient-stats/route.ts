import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session?.user?.id) return unauthorizedResponse()

        const patientId = session.user.id
        const now = new Date()

        const [upcomingAppointments, pastAppointments] = await Promise.all([
            prisma.appointment.count({
                where: {
                    patientId,
                    date: { gte: now },
                    status: { not: 'CANCELLED' },
                },
            }),
            prisma.appointment.count({
                where: {
                    patientId,
                    status: 'COMPLETED',
                },
            }),
        ])

        return NextResponse.json({ upcomingAppointments, pastAppointments })
    } catch (error) {
        console.error('Error fetching patient stats:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
