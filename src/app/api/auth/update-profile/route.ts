import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/route'
import { prisma } from '@/lib/prisma'

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
    const { name, email } = body

    // Validate inputs
    if (!name || !email) {
      return new Response(
        JSON.stringify({ message: 'Name and email are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // If email is changing, check for uniqueness
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      })

      if (existingUser) {
        return new Response(JSON.stringify({ message: 'Email already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    // Update user
    await prisma.user.update({
      where: { email: session.user.email },
      data: { name, email },
    })

    return new Response(
      JSON.stringify({ message: 'Profile updated successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Error updating profile:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
