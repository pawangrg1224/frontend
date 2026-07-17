import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

/**
 * Create missing doctor profiles for users with DOCTOR role but no doctorProfile
 */
export async function POST() {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        // Find all DOCTOR role users without a doctorProfile
        const doctorsWithoutProfile = await prisma.user.findMany({
            where: {
                role: 'DOCTOR',
                doctorProfile: null
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        })

        if (doctorsWithoutProfile.length === 0) {
            return NextResponse.json({
                message: 'All doctors already have profiles',
                created: 0,
                doctors: []
            })
        }

        // Create doctorProfile for each doctor
        const createPromises = doctorsWithoutProfile.map(doctor =>
            prisma.doctorProfile.create({
                data: {
                    userId: doctor.id,
                    specialization: null,
                    profileImage: null,
                    qualifications: [],
                    experience: null,
                    departmentId: null
                }
            })
        )

        await Promise.all(createPromises)

        return NextResponse.json({
            message: `Successfully created ${doctorsWithoutProfile.length} doctor profile(s)`,
            created: doctorsWithoutProfile.length,
            doctors: doctorsWithoutProfile
        })
    } catch (err) {
        console.error('Create profiles error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
