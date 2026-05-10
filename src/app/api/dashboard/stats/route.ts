import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()

    const [totalAppointments, totalCustomers, totalServices, pendingAppointments] =
      await Promise.all([
        prisma.appointment.count(),
        prisma.customer.count(),
        prisma.service.count(),
        prisma.appointment.count({ where: { status: 'PENDING' } }),
      ])

    return NextResponse.json({
      totalAppointments,
      totalCustomers,
      totalServices,
      pendingAppointments,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
