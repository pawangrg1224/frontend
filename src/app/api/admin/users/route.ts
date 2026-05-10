import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count') === 'true'
    const doctorsOnly = searchParams.get('doctors') === 'true'

    if (countOnly) {
      const count = await prisma.user.count()
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const users = await prisma.user.findMany({
      where: doctorsOnly ? { doctorProfile: { isNot: null } } : undefined,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        doctorProfile: { select: { id: true, specialization: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return new Response(JSON.stringify({ data: users }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching users:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// POST /api/admin/users — create a new user (admin only)
export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  if (!session?.user?.email) return unauthorizedResponse()
  if (session.user.role !== 'ADMIN') return forbiddenResponse()

  try {
    const { fullName, email, password, role } = await request.json()
    if (!fullName || !email || !password) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }
    const { hashPassword } = await import('@/lib/auth')
    const hashed = hashPassword(password)
    const user = await prisma.user.create({
      data: { fullName, email, password: hashed, role: role === 'ADMIN' ? 'ADMIN' : 'USER' },
      select: { id: true, fullName: true, email: true, role: true, createdAt: true, doctorProfile: { select: { id: true, specialization: true } } },
    })
    return new Response(JSON.stringify(user), { status: 201, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    if (err?.code === 'P2002') return new Response(JSON.stringify({ message: 'Email already exists' }), { status: 409, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
