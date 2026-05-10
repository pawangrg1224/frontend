import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

const reviewSchema = z.object({
    appointmentId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    feedback: z.string().max(1000).optional(),
})

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const serviceId = searchParams.get('serviceId') ?? undefined
    const domainId = searchParams.get('domainId') ?? undefined
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, parseInt(searchParams.get('limit') ?? '10', 10))
    const skip = (page - 1) * limit

    const where = {
        isHidden: false,
        ...(serviceId ? { serviceId } : {}),
        ...(domainId ? { service: { domainId } } : {}),
    }

    const [reviews, total] = await Promise.all([
        prisma.review.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { votes: true } },
                customer: { select: { id: true, name: true } },
                service: { select: { id: true, name: true } },
            },
        }),
        prisma.review.count({ where }),
    ])

    return NextResponse.json({ reviews, total, page, limit })
}

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()

    const body = await request.json()
    const parsed = reviewSchema.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ message: 'Validation error', errors: parsed.error.flatten() }, { status: 400 })
    }

    const { appointmentId, rating, feedback } = parsed.data

    const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        select: { id: true, status: true, customerId: true, serviceId: true },
    })

    if (!appointment) {
        return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }

    if (appointment.status !== 'COMPLETED') {
        return NextResponse.json({ message: 'Appointment must be completed before reviewing' }, { status: 400 })
    }

    const existing = await prisma.review.findUnique({ where: { appointmentId } })
    if (existing) {
        return NextResponse.json({ message: 'Review already exists for this appointment' }, { status: 409 })
    }

    const review = await prisma.review.create({
        data: {
            appointmentId,
            customerId: appointment.customerId,
            serviceId: appointment.serviceId,
            rating,
            feedback,
        },
    })

    return NextResponse.json(review, { status: 201 })
}
