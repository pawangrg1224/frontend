import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { sendAppointmentEmail, type AppointmentWithRelations } from '@/lib/notifications'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') ?? undefined
    const appointmentId = searchParams.get('appointmentId') ?? undefined
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '20', 10))
    const skip = (page - 1) * limit

    const where = {
        ...(customerId ? { customerId } : {}),
        ...(appointmentId ? { appointmentId } : {}),
        ...(startDateStr || endDateStr
            ? {
                createdAt: {
                    ...(startDateStr ? { gte: new Date(startDateStr) } : {}),
                    ...(endDateStr ? { lte: new Date(endDateStr) } : {}),
                },
            }
            : {}),
    }

    const [logs, total] = await Promise.all([
        prisma.notificationLog.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true, email: true } },
                appointment: { select: { id: true, date: true, status: true } },
            },
        }),
        prisma.notificationLog.count({ where }),
    ])

    return NextResponse.json({ logs, total, page, limit })
}

export async function PUT(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { logId } = await request.json()

    if (!logId) {
        return NextResponse.json({ message: 'logId is required' }, { status: 400 })
    }

    const log = await prisma.notificationLog.findUnique({
        where: { id: logId },
        include: {
            appointment: {
                include: { customer: true, service: true, domain: true },
            },
        },
    })

    if (!log) {
        return NextResponse.json({ message: 'Notification log not found' }, { status: 404 })
    }

    await sendAppointmentEmail(log.type, log.appointment as AppointmentWithRelations)

    return NextResponse.json({ message: 'Notification resent' })
}
