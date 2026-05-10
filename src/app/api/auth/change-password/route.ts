import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.email) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return new Response(
        JSON.stringify({ message: 'Current and new password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user || !user.password) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(currentPassword, user.password)
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: 'Current password is incorrect' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Hash new password and update
    const hashedPassword = await hashPassword(newPassword)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword },
    })

    return new Response(
      JSON.stringify({ message: 'Password updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error changing password:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
