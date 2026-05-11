import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const slots = await prisma.appointmentSlot.findMany({
            where: { isOpen: true },
            include: {
                service: { select: { id: true, name: true, price: true } },
                _count: {
                    select: {
                        appointments: {
                            where: {
                                status: { in: ['CONFIRMED', 'COMPLETED'] }
                            }
                        }
                    }
                },
            },
            orderBy: { slotDate: 'asc' },
        })

        const openSlots = slots.map(slot => ({
            id: slot.id,
            departmentName: slot.service.name,
            doctorName: slot.doctorName,
            slotDate: slot.slotDate.toISOString(),
            remainingCapacity: slot.slotLimit - slot._count.appointments,
            slotLimit: slot.slotLimit,
            service: {
                id: slot.service.id,
                name: slot.service.name,
                price: slot.service.price,
            },
        }))

        return NextResponse.json(openSlots)
    } catch (error) {
        console.error('Error fetching open slots:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
