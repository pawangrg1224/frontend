import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

/**
 * Bulk fix doctor roles - updates all users with doctorProfile to have DOCTOR role
 */
export async function POST() {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        // Find all users who have a doctorProfile but don't have DOCTOR role
        const usersWithDoctorProfile = await prisma.user.findMany({
            where: {
                doctorProfile: {
                    isNot: null
                },
                role: {
                    not: 'DOCTOR'
                }
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true
            }
        })

        if (usersWithDoctorProfile.length === 0) {
            return NextResponse.json({
                message: 'All doctors already have correct role',
                fixed: 0,
                doctors: []
            })
        }

        // Update all of them to DOCTOR role
        await prisma.user.updateMany({
            where: {
                id: {
                    in: usersWithDoctorProfile.map(u => u.id)
                }
            },
            data: {
                role: 'DOCTOR'
            }
        })

        return NextResponse.json({
            message: `Successfully fixed ${usersWithDoctorProfile.length} doctor role(s)`,
            fixed: usersWithDoctorProfile.length,
            doctors: usersWithDoctorProfile
        })
    } catch (err) {
        console.error('Fix roles error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
