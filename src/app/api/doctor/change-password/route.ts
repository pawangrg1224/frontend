import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'
import { hashPassword, verifyPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    try {
        const { currentPassword, newPassword } = await request.json()

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { message: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { message: 'New password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Get user with current password
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, password: true },
        })

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            )
        }

        // Verify current password
        if (!verifyPassword(currentPassword, user.password)) {
            return NextResponse.json(
                { message: 'Current password is incorrect' },
                { status: 401 }
            )
        }

        // Hash new password
        const hashedNewPassword = hashPassword(newPassword)

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        })

        return NextResponse.json(
            { message: 'Password changed successfully' },
            { status: 200 }
        )
    } catch (error) {
        console.error('Change password error:', error)
        return NextResponse.json(
            { message: 'An error occurred while changing password' },
            { status: 500 }
        )
    }
}
