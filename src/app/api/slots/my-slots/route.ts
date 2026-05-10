import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET() {
    try {
        const session = await getAuthSession()

        if (!session?.user?.id) {
            return unauthorizedResponse()
        }

        if ((session.user as { isDoctor?: boolean }).isDoctor !== true) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { fullName: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const slots = await prisma.appointmentSlot.findMany({
            where: { doctorName: user.fullName },
            include: {
                service: { select: { name: true } },
                _count: { select: { appointments: true } },
            },
            orderBy: { slotDate: 'asc' },
        })

        const result = slots.map(slot => ({
            id: slot.id,
            departmentName: slot.service.name,
            slotDate: slot.slotDate.toISOString(),
            slotLimit: slot.slotLimit,
            bookingCount: slot._count.appointments,
            isOpen: slot.isOpen,
        }))

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching doctor slots:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
