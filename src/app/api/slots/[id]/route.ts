import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

// GET /api/slots/[id] - Get slot details with appointments
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }

        const { id: slotId } = await params

        const slot = await prisma.appointmentSlot.findUnique({
            where: { id: slotId },
            include: {
                service: {
                    select: {
                        id: true,
                        name: true,
                        duration: true,
                        price: true,
                    },
                },
                appointments: {
                    where: {
                        status: {
                            in: ['PENDING', 'CONFIRMED', 'COMPLETED'],
                        },
                    },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                            },
                        },
                        patient: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
            },
        })

        if (!slot) {
            return NextResponse.json({ message: 'Slot not found' }, { status: 404 })
        }

        // Calculate booking statistics
        const confirmedCount = slot.appointments.filter(
            (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
        ).length
        const pendingCount = slot.appointments.filter((a) => a.status === 'PENDING').length
        const availableCount = slot.slotLimit - confirmedCount

        return NextResponse.json({
            ...slot,
            bookedCount: confirmedCount,
            pendingCount,
            availableCount,
            isFull: confirmedCount >= slot.slotLimit,
        })
    } catch (error) {
        console.error('Get slot details error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}

// DELETE /api/slots/[id] — ADMIN only
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }

        const { id: slotId } = await params

        // Check if slot has any appointments
        const slot = await prisma.appointmentSlot.findUnique({
            where: { id: slotId },
            include: {
                _count: {
                    select: {
                        appointments: {
                            where: {
                                status: { in: ['PENDING', 'CONFIRMED'] },
                            },
                        },
                    },
                },
            },
        })

        if (!slot) {
            return NextResponse.json({ message: 'Slot not found' }, { status: 404 })
        }

        if (slot._count.appointments > 0) {
            return NextResponse.json(
                { message: 'Cannot delete slot with existing appointments' },
                { status: 400 }
            )
        }

        await prisma.appointmentSlot.delete({
            where: { id: slotId },
        })

        return NextResponse.json({ message: 'Slot deleted successfully' })
    } catch (error) {
        console.error('Delete slot error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}
