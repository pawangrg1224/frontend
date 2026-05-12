import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const countOnly = searchParams.get('count') === 'true'

    if (countOnly) {
      const count = await prisma.service.count()
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return new Response(JSON.stringify({ data: services }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching services:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const userRole = (session.user as { role?: string }).role
  if (userRole !== 'ADMIN') {
    return new Response(JSON.stringify({ message: 'Admin access required' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await request.json()
    const { name, description, price, duration } = body

    if (!name || !price) {
      return new Response(JSON.stringify({ message: 'Name and price are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        duration: duration || 60,
      },
    })

    return new Response(JSON.stringify(service), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error creating service:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
