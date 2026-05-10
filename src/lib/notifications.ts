import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'
import {
    NotificationType,
    NotificationStatus,
    Appointment,
    Customer,
    Service,
    Domain,
} from '@prisma/client'

export type AppointmentWithRelations = Appointment & {
    customer: Customer
    service: Service
    domain: Domain | null
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        return key in vars ? vars[key] : `{{${key}}}`
    })
}

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
}

function buildTemplateVars(appointment: AppointmentWithRelations): Record<string, string> {
    return {
        customerName: appointment.customer.name,
        customerEmail: appointment.customer.email,
        serviceName: appointment.service.name,
        appointmentDate: appointment.date.toISOString(),
        appointmentType: appointment.type,
        meetingLink: appointment.meetingLink ?? '',
        domainAddress: appointment.domain?.address ?? '',
        domainCompany: appointment.domain?.company ?? '',
        notes: appointment.notes ?? '',
    }
}

async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function sendAppointmentEmail(
    type: NotificationType,
    appointment: AppointmentWithRelations
): Promise<void> {
    const template = await prisma.emailTemplate.findFirst({
        where: { type, isActive: true },
    })

    if (!template) {
        console.warn(`No active email template found for type: ${type}`)
        return
    }

    const vars = buildTemplateVars(appointment)
    const subject = renderTemplate(template.subject, vars)
    const htmlBody = renderTemplate(template.htmlBody, vars)
    const textBody = renderTemplate(template.textBody, vars)

    // Create a pending log entry
    const log = await prisma.notificationLog.create({
        data: {
            appointmentId: appointment.id,
            customerId: appointment.customerId,
            type,
            status: NotificationStatus.PENDING,
            recipientEmail: appointment.customer.email,
            subject,
        },
    })

    const delays = [0, 1000, 2000, 4000]
    let lastError: Error | null = null

    for (let attempt = 0; attempt < 3; attempt++) {
        if (delays[attempt] > 0) {
            await sleep(delays[attempt])
        }

        try {
            const transporter = createTransporter()
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: appointment.customer.email,
                subject,
                html: htmlBody,
                text: textBody,
            })

            await prisma.notificationLog.update({
                where: { id: log.id },
                data: {
                    status: NotificationStatus.SENT,
                    sentAt: new Date(),
                    retryCount: attempt,
                },
            })

            return
        } catch (err) {
            lastError = err as Error
            console.error(`Email send attempt ${attempt + 1} failed:`, err)
        }
    }

    // All retries exhausted
    await prisma.notificationLog.update({
        where: { id: log.id },
        data: {
            status: NotificationStatus.FAILED,
            failedAt: new Date(),
            retryCount: 3,
            errorMessage: lastError?.message ?? 'Unknown error',
        },
    })
}

export async function scheduleReminders(): Promise<void> {
    const now = new Date()

    // 24h reminder window: appointments between now+23h and now+25h
    const window24hStart = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const window24hEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    // 1h reminder window: appointments between now+55min and now+65min
    const window1hStart = new Date(now.getTime() + 55 * 60 * 1000)
    const window1hEnd = new Date(now.getTime() + 65 * 60 * 1000)

    // Find appointments needing 24h reminder
    const appointments24h = await prisma.appointment.findMany({
        where: {
            date: { gte: window24hStart, lte: window24hEnd },
            status: { in: ['PENDING', 'CONFIRMED'] },
            notificationLogs: {
                none: { type: NotificationType.REMINDER_24H },
            },
        },
        include: {
            customer: true,
            service: true,
            domain: true,
        },
    })

    for (const appt of appointments24h) {
        await sendAppointmentEmail(
            NotificationType.REMINDER_24H,
            appt as AppointmentWithRelations
        )
    }

    // Find appointments needing 1h reminder
    const appointments1h = await prisma.appointment.findMany({
        where: {
            date: { gte: window1hStart, lte: window1hEnd },
            status: { in: ['PENDING', 'CONFIRMED'] },
            notificationLogs: {
                none: { type: NotificationType.REMINDER_1H },
            },
        },
        include: {
            customer: true,
            service: true,
            domain: true,
        },
    })

    for (const appt of appointments1h) {
        await sendAppointmentEmail(
            NotificationType.REMINDER_1H,
            appt as AppointmentWithRelations
        )
    }
}

export async function retryFailedNotifications(): Promise<void> {
    const failedLogs = await prisma.notificationLog.findMany({
        where: {
            status: NotificationStatus.FAILED,
            retryCount: { lt: 3 },
        },
        include: {
            appointment: {
                include: {
                    customer: true,
                    service: true,
                    domain: true,
                },
            },
        },
    })

    for (const log of failedLogs) {
        const appointment = log.appointment as AppointmentWithRelations

        const template = await prisma.emailTemplate.findFirst({
            where: { type: log.type, isActive: true },
        })

        if (!template) continue

        const vars = buildTemplateVars(appointment)
        const subject = renderTemplate(template.subject, vars)
        const htmlBody = renderTemplate(template.htmlBody, vars)
        const textBody = renderTemplate(template.textBody, vars)

        try {
            const transporter = createTransporter()
            await transporter.sendMail({
                from: process.env.SMTP_USER,
                to: log.recipientEmail,
                subject,
                html: htmlBody,
                text: textBody,
            })

            await prisma.notificationLog.update({
                where: { id: log.id },
                data: {
                    status: NotificationStatus.SENT,
                    sentAt: new Date(),
                    retryCount: log.retryCount + 1,
                    errorMessage: null,
                },
            })
        } catch (err) {
            await prisma.notificationLog.update({
                where: { id: log.id },
                data: {
                    retryCount: log.retryCount + 1,
                    errorMessage: (err as Error).message,
                    failedAt: new Date(),
                },
            })
        }
    }
}
