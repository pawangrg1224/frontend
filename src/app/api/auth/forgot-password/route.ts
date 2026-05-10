import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateResetToken, generateTokenExpiresAt } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    // Validation
    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success for security (don't reveal if user exists)
    if (!user) {
      return NextResponse.json(
        {
          message: 'If a user with this email exists, a password reset link has been sent',
        },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = generateResetToken()
    const resetTokenExpiresAt = generateTokenExpiresAt(24) // 24 hours

    // Save reset token to user
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiresAt,
      },
    })

    // TODO: Send email with reset link
    // For now, just log it (in production, use SendGrid, AWS SES, or similar)
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
    console.log(`Password reset link for ${email}: ${resetLink}`)

    return NextResponse.json(
      {
        message: 'If a user with this email exists, a password reset link has been sent',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
