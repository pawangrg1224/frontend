import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: {
        customer: true,
        service: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    })

    const formattedAppointments = appointments.map((apt) => ({
      id: apt.id,
      date: apt.date.toISOString(),
      customerName: apt.customer.name,
      serviceName: apt.service.name,
      status: apt.status,
    }))

    return NextResponse.json(formattedAppointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
