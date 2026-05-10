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
      const count = await prisma.customer.count()
      return new Response(JSON.stringify({ count }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return new Response(JSON.stringify({ data: customers }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Error fetching customers:', err)
    return new Response(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
