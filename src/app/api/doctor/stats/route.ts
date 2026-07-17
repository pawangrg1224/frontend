import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { doctorProfile: true },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        // Build where clause based on doctor's department
        let whereClause: any = {}
        if (user.doctorProfile?.departmentId) {
            whereClause.serviceId = user.doctorProfile.departmentId
        } else {
            // If no department assigned, show appointments where this user is assigned
            whereClause.userId = user.id
        }

        // Get all appointments for this doctor's department
        const allAppointments = await prisma.appointment.findMany({
            where: whereClause,
        })

        // Get today's appointments
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const todayAppointments = allAppointments.filter(apt => {
            const aptDate = new Date(apt.date)
            return aptDate >= today && aptDate < tomorrow
        })

        const stats = {
            totalAppointments: allAppointments.length,
            todayAppointments: todayAppointments.length,
            pendingAppointments: allAppointments.filter(apt => apt.status === 'PENDING').length,
            completedAppointments: allAppointments.filter(apt => apt.status === 'COMPLETED').length,
        }

        return NextResponse.json(stats)
    } catch (error) {
        console.error('Error fetching doctor stats:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
