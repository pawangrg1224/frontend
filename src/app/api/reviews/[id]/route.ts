import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const review = await prisma.review.findUnique({
        where: { id },
        include: {
            _count: { select: { votes: true } },
            customer: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
        },
    })

    if (!review) {
        return NextResponse.json({ message: 'Review not found' }, { status: 404 })
    }

    return NextResponse.json(review)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()

    const { id } = await params
    const body = await request.json()

    // Handle vote action for USER role
    if (body.action === 'vote') {
        const existing = await prisma.reviewVote.findUnique({
            where: { reviewId_userId: { reviewId: id, userId: session.user.id } },
        })

        if (existing) {
            await prisma.reviewVote.delete({ where: { id: existing.id } })
            return NextResponse.json({ voted: false })
        } else {
            await prisma.reviewVote.create({ data: { reviewId: id, userId: session.user.id } })
            return NextResponse.json({ voted: true })
        }
    }

    // Admin-only update
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { isFlagged, isHidden, adminResponse } = body

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
        return NextResponse.json({ message: 'Review not found' }, { status: 404 })
    }

    const updated = await prisma.review.update({
        where: { id },
        data: {
            ...(isFlagged !== undefined ? { isFlagged, flaggedAt: isFlagged ? new Date() : null } : {}),
            ...(isHidden !== undefined ? { isHidden } : {}),
            ...(adminResponse !== undefined ? { adminResponse, adminId: session.user.id } : {}),
        },
    })

    return NextResponse.json(updated)
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { id } = await params

    const review = await prisma.review.findUnique({ where: { id } })
    if (!review) {
        return NextResponse.json({ message: 'Review not found' }, { status: 404 })
    }

    await prisma.review.delete({ where: { id } })
    return NextResponse.json({ message: 'Review deleted' })
}
