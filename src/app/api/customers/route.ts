import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count(),
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get customers error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    const { name, email, phone, address } = await request.json()

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.customer.findUnique({
      where: { email },
    })

    if (existing) {
      return NextResponse.json(
        { message: 'Customer with this email already exists' },
        { status: 409 }
      )
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, address },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error('Create customer error:', error)
    return NextResponse.json(
      { message: 'An error occurred' },
      { status: 500 }
    )
  }
}
