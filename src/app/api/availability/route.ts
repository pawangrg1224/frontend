import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { getAvailableSlots, generateSlotsFromPattern } from '@/lib/availability'
import { AppointmentType } from '@prisma/client'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const dateStr = searchParams.get('date')
    const durationStr = searchParams.get('serviceDuration')
    const type = searchParams.get('type') as AppointmentType | null

    if (!userId || !dateStr || !durationStr || !type) {
        return NextResponse.json({ message: 'Missing required params: userId, date, serviceDuration, type' }, { status: 400 })
    }

    const date = new Date(dateStr)
    const serviceDuration = parseInt(durationStr, 10)

    if (isNaN(date.getTime()) || isNaN(serviceDuration)) {
        return NextResponse.json({ message: 'Invalid date or serviceDuration' }, { status: 400 })
    }

    const slots = await getAvailableSlots(userId, date, serviceDuration, type)
    return NextResponse.json({ slots })
}

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const body = await request.json()
    const { type, ...fields } = body

    if (type === 'slot') {
        const slot = await prisma.availability.create({
            data: {
                userId: fields.userId,
                startTime: new Date(fields.startTime),
                endTime: new Date(fields.endTime),
                isAvailable: fields.isAvailable ?? true,
                bufferMinutes: fields.bufferMinutes ?? 0,
                patternId: fields.patternId ?? null,
            },
        })
        return NextResponse.json(slot, { status: 201 })
    }

    if (type === 'pattern') {
        const pattern = await prisma.availabilityPattern.create({
            data: {
                userId: fields.userId,
                dayOfWeek: fields.dayOfWeek,
                startTime: fields.startTime,
                endTime: fields.endTime,
                effectiveFrom: new Date(fields.effectiveFrom),
                effectiveTo: fields.effectiveTo ? new Date(fields.effectiveTo) : null,
                bufferMinutes: fields.bufferMinutes ?? 0,
            },
        })
        const slots = await generateSlotsFromPattern(pattern)
        return NextResponse.json({ pattern, slots }, { status: 201 })
    }

    return NextResponse.json({ message: "type must be 'slot' or 'pattern'" }, { status: 400 })
}
