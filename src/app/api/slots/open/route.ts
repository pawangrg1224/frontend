import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const slots = await prisma.appointmentSlot.findMany({
            where: { isOpen: true },
            include: {
                service: { select: { name: true } },
                _count: { select: { appointments: true } },
            },
            orderBy: { slotDate: 'asc' },
        })

        const openSlots = slots.map(slot => ({
            id: slot.id,
            departmentName: slot.service.name,
            doctorName: slot.doctorName,
            slotDate: slot.slotDate.toISOString(),
            remainingCapacity: slot.slotLimit - slot._count.appointments,
        }))

        return NextResponse.json(openSlots)
    } catch (error) {
        console.error('Error fetching open slots:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
