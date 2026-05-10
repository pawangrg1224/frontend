import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function getMessages(
    appointmentId: string,
    after?: string,
    limit = 50
) {
    return prisma.message.findMany({
        where: {
            appointmentId,
            isArchived: false,
            ...(after ? { id: { gt: after } } : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: limit,
        include: {
            sender: {
                select: { id: true, fullName: true, role: true },
            },
        },
    })
}

export async function sendMessage(
    appointmentId: string,
    senderId: string,
    senderRole: Role,
    content: string
) {
    if (content.length > 2000) {
        const err = new Error('Message content exceeds 2000 characters')
            ; (err as Error & { code: string }).code = 'MESSAGE_TOO_LONG'
        throw err
    }

    if (senderRole === Role.USER) {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: { userId: true },
        })

        if (!appointment) {
            const err = new Error('Appointment not found')
                ; (err as Error & { code: string }).code = 'APPOINTMENT_NOT_FOUND'
            throw err
        }

        if (appointment.userId !== senderId) {
            const err = new Error('You do not have permission to message this appointment')
                ; (err as Error & { code: string }).code = 'FORBIDDEN'
            throw err
        }
    }

    return prisma.message.create({
        data: {
            appointmentId,
            senderId,
            content,
        },
        include: {
            sender: {
                select: { id: true, fullName: true, role: true },
            },
        },
    })
}

export async function markMessagesRead(
    appointmentId: string,
    userId: string
): Promise<void> {
    await prisma.message.updateMany({
        where: {
            appointmentId,
            senderId: { not: userId },
            isRead: false,
        },
        data: {
            isRead: true,
            readAt: new Date(),
        },
    })
}
