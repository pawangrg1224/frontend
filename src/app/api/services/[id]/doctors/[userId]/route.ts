import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

/**
 * GET /api/services/[id]/doctors/[userId]
 *
 * Returns a specific doctor's profile and their open appointment slots
 * for the given service.
 *
 * [userId] can be either:
 *   - A real User id (cuid)
 *   - A "legacy:DoctorName" synthetic id for doctors without a User record
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string; userId: string } }
) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()

        const { id: serviceId, userId } = params

        // Verify the service exists
        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 })
        }

        let doctorName: string
        let doctorInfo: {
            id: string
            fullName: string
            email: string | null
            specialization: string | null
        }

        if (userId.startsWith('legacy:')) {
            // Legacy doctor — no User record
            doctorName = userId.slice('legacy:'.length)
            doctorInfo = {
                id: userId,
                fullName: doctorName,
                email: null,
                specialization: null,
            }
        } else {
            // Real User record
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    doctorProfile: { select: { specialization: true } },
                },
            })

            if (!user) {
                return NextResponse.json({ message: 'Doctor not found' }, { status: 404 })
            }

            doctorName = user.fullName
            doctorInfo = {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                specialization: user.doctorProfile?.specialization ?? null,
            }
        }

        // Fetch upcoming open slots for this doctor + service
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const slots = await prisma.appointmentSlot.findMany({
            where: {
                serviceId,
                doctorName,
                isOpen: true,
                slotDate: { gte: now },
            },
            include: {
                _count: {
                    select: {
                        appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } },
                    },
                },
            },
            orderBy: { slotDate: 'asc' },
        })

        const slotData = slots.map(s => ({
            id: s.id,
            slotDate: s.slotDate.toISOString(),
            slotLimit: s.slotLimit,
            bookedCount: s._count.appointments,
            remainingCapacity: s.slotLimit - s._count.appointments,
            isFull: s._count.appointments >= s.slotLimit,
        }))

        return NextResponse.json({
            doctor: doctorInfo,
            service: {
                id: service.id,
                name: service.name,
                duration: service.duration,
                price: service.price,
                description: service.description,
            },
            slots: slotData,
        })
    } catch (error) {
        console.error('Get doctor slots error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}
