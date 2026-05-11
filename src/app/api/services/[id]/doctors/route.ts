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
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const { id } = params

        // Fetch doctors assigned to this department
        const doctors = await prisma.doctorProfile.findMany({
            where: {
                departmentId: id,
                // Only show doctors currently assigned (no end date or end date in future)
                OR: [
                    { departmentEndDate: null },
                    { departmentEndDate: { gte: new Date() } }
                ]
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

        // Fetch available slots for each doctor
        const doctorsWithSlots = await Promise.all(
            doctors.map(async (doctor) => {
                const slots = await prisma.appointmentSlot.findMany({
                    where: {
                        serviceId: id,
                        doctorName: doctor.user.fullName,
                        isOpen: true,
                        slotDate: {
                            gte: new Date() // Only future slots
                        }
                    },
                    orderBy: {
                        slotDate: 'asc'
                    },
                    take: 10 // Limit to next 10 slots
                })

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
                    availableSlots: slots.map(slot => ({
                        id: slot.id,
                        slotDate: slot.slotDate, // Full DateTime with time information
                        slotLimit: slot.slotLimit,
                        isOpen: slot.isOpen,
                    }))
                }
            })
        )

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
