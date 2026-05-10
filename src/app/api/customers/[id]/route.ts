import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: { appointments: true },
    })
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 })
    return NextResponse.json(customer)
  } catch (error) {
    console.error('Get customer error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const { name, email, phone, address } = await request.json()
    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 })

    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
      },
    })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update customer error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    const { id } = await params

    const customer = await prisma.customer.findUnique({ where: { id } })
    if (!customer) return NextResponse.json({ message: 'Customer not found' }, { status: 404 })

    await prisma.customer.delete({ where: { id } })
    return NextResponse.json({ message: 'Customer deleted' })
  } catch (error) {
    console.error('Delete customer error:', error)
    return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
  }
}
