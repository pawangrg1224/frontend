import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

// GET /api/slots?serviceId=&date=YYYY-MM-DD
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const serviceId = searchParams.get('serviceId')
        const date = searchParams.get('date')

        const where: Record<string, unknown> = { isOpen: true }
        if (serviceId) where.serviceId = serviceId
        if (date) {
            const d = new Date(date)
            const start = new Date(d); start.setHours(0, 0, 0, 0)
            const end = new Date(d); end.setHours(23, 59, 59, 999)
            where.slotDate = { gte: start, lte: end }
        }

        const slots = await prisma.appointmentSlot.findMany({
            where,
            include: {
                service: { select: { id: true, name: true, duration: true, price: true } },
                _count: { select: { appointments: { where: { status: { in: ['PENDING', 'CONFIRMED'] } } } } },
            },
            orderBy: { slotDate: 'asc' },
        })

        const result = slots.map(s => ({
            ...s,
            bookedCount: s._count.appointments,
            availableCount: s.slotLimit - s._count.appointments,
            isFull: s._count.appointments >= s.slotLimit,
        }))

        return NextResponse.json({ data: result })
    } catch (error) {
        console.error('Get slots error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}

// POST /api/slots — ADMIN only
export async function POST(request: NextRequest) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }

        const { serviceId, doctorName, slotDate, slotLimit } = await request.json()

        if (!serviceId || !doctorName || !slotDate || !slotLimit) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
        }
        if (slotLimit < 1 || slotLimit > 200) {
            return NextResponse.json({ message: 'Slot limit must be between 1 and 200' }, { status: 400 })
        }

        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service) return NextResponse.json({ message: 'Service not found' }, { status: 404 })

        const slot = await prisma.appointmentSlot.create({
            data: {
                serviceId,
                doctorName,
                slotDate: new Date(slotDate),
                slotLimit: Number(slotLimit),
                isOpen: true,
            },
            include: { service: { select: { id: true, name: true } } },
        })

        return NextResponse.json(slot, { status: 201 })
    } catch (error) {
        console.error('Create slot error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}
