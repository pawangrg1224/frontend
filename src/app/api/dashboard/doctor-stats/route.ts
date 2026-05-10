import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET() {
    try {
        const session = await getAuthSession()
        if (!session?.user?.id) return unauthorizedResponse()

        const userId = session.user.id

        const [totalAppointments, pendingAppointments, distinctPatientRows] = await Promise.all([
            prisma.appointment.count({ where: { userId } }),
            prisma.appointment.count({ where: { userId, status: 'PENDING' } }),
            prisma.appointment.findMany({
                where: { userId },
                select: { customerId: true },
                distinct: ['customerId'],
            }),
        ])

        return NextResponse.json({
            totalAppointments,
            pendingAppointments,
            distinctPatients: distinctPatientRows.length,
        })
    } catch (error) {
        console.error('Error fetching doctor stats:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
