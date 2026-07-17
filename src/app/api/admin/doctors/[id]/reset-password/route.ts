import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { hashPassword } from '@/lib/auth'
import { randomUUID } from 'crypto'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        const params = await context.params
        const { id } = params

        // Generate a new temporary password
        const tempPassword = randomUUID().replace(/-/g, '').slice(0, 16)
        const hashedPassword = hashPassword(tempPassword)

        // Update the user's password and ensure role is DOCTOR
        const user = await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                role: 'DOCTOR' // Ensure the role is set to DOCTOR
            },
            select: { id: true, fullName: true, email: true, role: true },
        })

        return NextResponse.json({ ...user, tempPassword })
    } catch (err) {
        console.error('Reset password error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
