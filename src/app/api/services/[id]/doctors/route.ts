import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

/**
 * GET /api/services/[id]/doctors
 * Fetch all doctors assigned to a specific department/service
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Single optimized query - fetch doctors with their slots in one go
        const doctors = await prisma.doctorProfile.findMany({
            where: {
                departmentId: id,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                    }
                },
                department: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        duration: true,
                        price: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Filter out doctors whose assignment has ended
        const activeDoctors = doctors.filter(doctor => {
            if (!doctor.departmentEndDate) return true
            return new Date(doctor.departmentEndDate) >= new Date()
        })

        // Fetch all slots for this department in one query
        const allSlots = await prisma.appointmentSlot.findMany({
            where: {
                serviceId: id,
                isOpen: true,
                slotDate: {
                    gte: new Date()
                }
            },
            orderBy: {
                slotDate: 'asc'
            },
            take: 100 // Reasonable limit
        })

        // Group slots by doctor name
        const slotsByDoctor = allSlots.reduce((acc, slot) => {
            if (!acc[slot.doctorName]) acc[slot.doctorName] = []
            acc[slot.doctorName].push(slot)
            return acc
        }, {} as Record<string, typeof allSlots>)

        // Map doctors with their slots
        const doctorsWithSlots = activeDoctors.map(doctor => {
            const doctorSlots = slotsByDoctor[doctor.user.fullName] || []

            return {
                id: doctor.id,
                userId: doctor.userId,
                fullName: doctor.user.fullName,
                email: doctor.user.email,
                specialization: doctor.specialization,
                profileImage: doctor.profileImage,
                qualifications: doctor.qualifications,
                experience: doctor.experience,
                departmentStartDate: doctor.departmentStartDate,
                departmentEndDate: doctor.departmentEndDate,
                department: doctor.department,
                availableSlots: doctorSlots.slice(0, 10).map(slot => ({
                    id: slot.id,
                    slotDate: slot.slotDate,
                    slotLimit: slot.slotLimit,
                    isOpen: slot.isOpen,
                }))
            }
        })

        return NextResponse.json({
            success: true,
            data: doctorsWithSlots
        })

    } catch (error) {
        console.error('Error fetching doctors for department:', error)
        return NextResponse.json(
            { message: 'Failed to fetch doctors' },
            { status: 500 }
        )
    }
}
