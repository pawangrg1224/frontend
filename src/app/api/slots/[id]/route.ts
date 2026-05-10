import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse } from '@/lib/session'

// PUT /api/slots/[id] — ADMIN: update slot
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }

        const { id } = await params
        const { doctorName, slotDate, slotLimit, isOpen } = await request.json()

        const slot = await prisma.appointmentSlot.update({
            where: { id },
            data: {
                ...(doctorName !== undefined && { doctorName }),
                ...(slotDate !== undefined && { slotDate: new Date(slotDate) }),
                ...(slotLimit !== undefined && { slotLimit: Number(slotLimit) }),
                ...(isOpen !== undefined && { isOpen }),
            },
        })

        return NextResponse.json(slot)
    } catch (error) {
        console.error('Update slot error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}

// PATCH /api/slots/[id] — ADMIN: partial update slot (alias for PUT)
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    return PUT(request, { params })
}

// DELETE /api/slots/[id] — ADMIN
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getAuthSession()
        if (!session?.user?.email) return unauthorizedResponse()
        if ((session.user as { role?: string }).role !== 'ADMIN') {
            return NextResponse.json({ message: 'Admin access required' }, { status: 403 })
        }

        const { id } = await params
        await prisma.appointmentSlot.delete({ where: { id } })
        return NextResponse.json({ message: 'Slot deleted' })
    } catch (error) {
        console.error('Delete slot error:', error)
        return NextResponse.json({ message: 'An error occurred' }, { status: 500 })
    }
}
