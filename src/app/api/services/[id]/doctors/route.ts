import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

/**
 * GET /api/services/[id]/doctors
 *
 * Returns all doctors (Users with DoctorProfile) who have at least one
 * AppointmentSlot for this service, along with their availability status.
 *
 * A doctor is "available" if they have at least one open, non-full slot
 * with a slotDate >= today for this service.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()

        const serviceId = params.id

        // Verify the service exists
        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 })
        }

        // Find all distinct doctorNames that have slots for this service
        const slotDoctors = await prisma.appointmentSlot.findMany({
            where: { serviceId },
            select: { doctorName: true },
            distinct: ['doctorName'],
        })

        const doctorNames = slotDoctors.map(s => s.doctorName)

        if (doctorNames.length === 0) {
            return NextResponse.json({ data: [] })
        }

        // Find User records with DoctorProfile whose fullName is in doctorNames
        const users = await prisma.user.findMany({
            where: {
                fullName: { in: doctorNames },
                doctorProfile: { isNot: null },
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                doctorProfile: {
                    select: { specialization: true },
                },
            },
        })

        // For each doctor, check if they have upcoming open slots with capacity
        const now = new Date()
        now.setHours(0, 0, 0, 0)

        const availabilityChecks = await Promise.all(
            users.map(async (u) => {
                const upcomingSlot = await prisma.appointmentSlot.findFirst({
                    where: {
                        serviceId,
                        doctorName: u.fullName,
                        isOpen: true,
                        slotDate: { gte: now },
                    },
                    include: {
                        _count: { select: { appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } },
                    },
                })

                const isAvailable =
                    upcomingSlot !== null &&
                    upcomingSlot._count.appointments < upcomingSlot.slotLimit

                return {
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    specialization: u.doctorProfile?.specialization ?? null,
                    isAvailable,
                }
            })
        )

        // Also include doctors who have slots but no User record (legacy doctorName-only entries)
        const matchedNames = new Set(users.map(u => u.fullName))
        const unmatchedNames = doctorNames.filter(n => !matchedNames.has(n))

        const legacyDoctors = await Promise.all(
            unmatchedNames.map(async (name) => {
                const upcomingSlot = await prisma.appointmentSlot.findFirst({
                    where: {
                        serviceId,
                        doctorName: name,
                        isOpen: true,
                        slotDate: { gte: now },
                    },
                    include: {
                        _count: { select: { appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } },
                    },
                })

                const isAvailable =
                    upcomingSlot !== null &&
                    upcomingSlot._count.appointments < upcomingSlot.slotLimit

                return {
                    id: `legacy:${name}`, // synthetic id for legacy entries
                    fullName: name,
                    email: null,
                    specialization: null,
                    isAvailable,
                }
            })
        )

        return NextResponse.json({ data: [...availabilityChecks, ...legacyDoctors] })
    } catch (error) {
        console.error('Get service doctors error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}
