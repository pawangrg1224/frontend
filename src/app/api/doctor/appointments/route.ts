import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: {
                doctorProfile: {
                    include: {
                        department: true,
                    },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 })
        }

        console.log('Doctor appointments - User:', user.fullName)
        console.log('Doctor appointments - Has profile:', !!user.doctorProfile)
        console.log('Doctor appointments - Department ID:', user.doctorProfile?.departmentId)
        console.log('Doctor appointments - Department Name:', user.doctorProfile?.department?.name)

        const { searchParams } = new URL(request.url)
        const filter = searchParams.get('filter')

        let whereClause: any = {}

        // If user has a doctor profile with a department, filter by that department
        if (user.doctorProfile?.departmentId) {
            whereClause.serviceId = user.doctorProfile.departmentId
            console.log('Doctor appointments - Filtering by serviceId:', user.doctorProfile.departmentId)
        } else {
            // If no department assigned, show appointments where this user is assigned
            whereClause.userId = user.id
            console.log('Doctor appointments - Filtering by userId:', user.id)
        }

        // Filter by today
        if (filter === 'today') {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)

            whereClause.date = {
                gte: today,
                lt: tomorrow,
            }
        }

        console.log('Doctor appointments - Where clause:', JSON.stringify(whereClause))

        const appointments = await prisma.appointment.findMany({
            where: whereClause,
            include: {
                customer: { select: { id: true, name: true, email: true, phone: true } },
                service: { select: { id: true, name: true } },
                slot: { select: { id: true, doctorName: true, slotLimit: true } },
            },
            orderBy: { date: 'asc' },
        })

        return NextResponse.json({ data: appointments })
    } catch (error) {
        console.error('Error fetching doctor appointments:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
