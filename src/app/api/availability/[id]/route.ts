import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { AppointmentStatus } from '@prisma/client'

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { id } = await params

    // Check if it's a pattern
    const pattern = await prisma.availabilityPattern.findUnique({ where: { id } })

    if (pattern) {
        const now = new Date()
        // Delete future unbooked slots belonging to this pattern
        const futureSlots = await prisma.availability.findMany({
            where: { patternId: id, startTime: { gt: now } },
        })

        for (const slot of futureSlots) {
            const hasAppointment = await prisma.appointment.findFirst({
                where: {
                    userId: slot.userId,
                    status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                    date: { gte: slot.startTime, lt: slot.endTime },
                },
            })
            if (!hasAppointment) {
                await prisma.availability.delete({ where: { id: slot.id } })
            }
        }

        await prisma.availabilityPattern.delete({ where: { id } })
        return NextResponse.json({ message: 'Pattern and future unbooked slots deleted' })
    }

    // Check if it's a slot
    const slot = await prisma.availability.findUnique({ where: { id } })
    if (!slot) {
        return NextResponse.json({ message: 'Availability not found' }, { status: 404 })
    }

    const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
            userId: slot.userId,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
            date: { gte: slot.startTime, lt: slot.endTime },
        },
    })

    if (conflictingAppointment) {
        return NextResponse.json(
            { message: 'Cannot delete slot: a confirmed appointment overlaps this time' },
            { status: 409 }
        )
    }

    await prisma.availability.delete({ where: { id } })
    return NextResponse.json({ message: 'Availability slot deleted' })
}
