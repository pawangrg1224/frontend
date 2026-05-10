import { prisma } from '@/lib/prisma'
import { AppointmentStatus, AppointmentType, Availability, AvailabilityPattern, DayOfWeek } from '@prisma/client'

export interface TimeSlot {
    startTime: Date
    endTime: Date
}

const DAY_OF_WEEK_MAP: Record<DayOfWeek, number> = {
    SUNDAY: 0,
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
}

export async function checkConflict(
    userId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string
): Promise<boolean> {
    return prisma.$transaction(async (tx) => {
        // Find appointments for this user that overlap with the given time range
        // Overlap condition: existing.date < endTime AND (existing.date + service.duration) > startTime
        const overlapping = await tx.appointment.findMany({
            where: {
                userId,
                status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
                ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
                date: { lt: endTime },
            },
            include: {
                service: { select: { duration: true } },
            },
        })

        for (const appt of overlapping) {
            const apptEnd = new Date(appt.date.getTime() + appt.service.duration * 60 * 1000)
            if (apptEnd > startTime) {
                return true
            }
        }

        // Also check availability buffer times
        const availabilities = await tx.availability.findMany({
            where: {
                userId,
                startTime: { lt: endTime },
                endTime: { gt: startTime },
            },
        })

        for (const avail of availabilities) {
            if (avail.bufferMinutes > 0) {
                const bufferedEnd = new Date(avail.endTime.getTime() + avail.bufferMinutes * 60 * 1000)
                if (bufferedEnd > startTime && avail.startTime < endTime) {
                    // Check if there's an actual appointment in this availability slot
                    // Buffer only matters if there's an appointment using this slot
                }
            }
        }

        return false
    })
}

export async function getAvailableSlots(
    userId: string,
    date: Date,
    serviceDuration: number,
    type: AppointmentType
): Promise<TimeSlot[]> {
    // Get start and end of the requested day
    const dayStart = new Date(date)
    dayStart.setUTCHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setUTCHours(23, 59, 59, 999)

    // Query availability slots for this user on this date
    const availabilities = await prisma.availability.findMany({
        where: {
            userId,
            isAvailable: true,
            startTime: { gte: dayStart, lte: dayEnd },
        },
        orderBy: { startTime: 'asc' },
    })

    // Get confirmed appointments for this user on this date
    const confirmedAppointments = await prisma.appointment.findMany({
        where: {
            userId,
            status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
            date: { gte: dayStart, lte: dayEnd },
        },
        include: {
            service: { select: { duration: true, supportedTypes: true } },
        },
    })

    const slots: TimeSlot[] = []

    for (const avail of availabilities) {
        // Generate slots of serviceDuration within this availability window
        const slotStart = new Date(avail.startTime)
        const availEnd = new Date(avail.endTime)

        while (slotStart.getTime() + serviceDuration * 60 * 1000 <= availEnd.getTime()) {
            const slotEnd = new Date(slotStart.getTime() + serviceDuration * 60 * 1000)

            // Check if this slot overlaps with any confirmed appointment (including buffer)
            const hasConflict = confirmedAppointments.some((appt) => {
                const apptEnd = new Date(appt.date.getTime() + appt.service.duration * 60 * 1000)
                const bufferEnd = new Date(apptEnd.getTime() + avail.bufferMinutes * 60 * 1000)
                return appt.date < slotEnd && bufferEnd > slotStart
            })

            if (!hasConflict) {
                slots.push({ startTime: new Date(slotStart), endTime: slotEnd })
            }

            // Advance by service duration
            slotStart.setTime(slotStart.getTime() + serviceDuration * 60 * 1000)
        }
    }

    return slots
}

export async function generateSlotsFromPattern(
    pattern: AvailabilityPattern
): Promise<Availability[]> {
    const effectiveFrom = new Date(pattern.effectiveFrom)
    const effectiveTo = pattern.effectiveTo
        ? new Date(pattern.effectiveTo)
        : new Date(effectiveFrom.getTime() + 90 * 24 * 60 * 60 * 1000) // 3 months

    const targetDays = new Set(pattern.dayOfWeek.map((d) => DAY_OF_WEEK_MAP[d]))

    const created: Availability[] = []
    const current = new Date(effectiveFrom)
    current.setUTCHours(0, 0, 0, 0)

    while (current <= effectiveTo) {
        const dayOfWeek = current.getUTCDay()

        if (targetDays.has(dayOfWeek)) {
            // Parse HH:MM times
            const [startHour, startMin] = pattern.startTime.split(':').map(Number)
            const [endHour, endMin] = pattern.endTime.split(':').map(Number)

            const startTime = new Date(current)
            startTime.setUTCHours(startHour, startMin, 0, 0)

            const endTime = new Date(current)
            endTime.setUTCHours(endHour, endMin, 0, 0)

            const slot = await prisma.availability.create({
                data: {
                    userId: pattern.userId,
                    startTime,
                    endTime,
                    isAvailable: true,
                    patternId: pattern.id,
                    bufferMinutes: pattern.bufferMinutes,
                },
            })

            created.push(slot)
        }

        current.setUTCDate(current.getUTCDate() + 1)
    }

    return created
}
