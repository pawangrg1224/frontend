import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import nodemailer from 'nodemailer'

// ─── POST /api/admin/messages/send ───────────────────────────────────────────
// Send custom message/notification to doctors

function createTransporter() {
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
}

export async function POST(request: NextRequest) {
    const session = await getAuthSession()
    if (!session?.user?.email) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    try {
        const body = await request.json()
        const { doctorIds, subject, message, messageType } = body

        // Validation
        if (!doctorIds || !Array.isArray(doctorIds) || doctorIds.length === 0) {
            return NextResponse.json(
                { message: 'At least one doctor must be selected' },
                { status: 400 }
            )
        }

        if (!subject || !subject.trim()) {
            return NextResponse.json(
                { message: 'Subject is required' },
                { status: 400 }
            )
        }

        if (!message || !message.trim()) {
            return NextResponse.json(
                { message: 'Message is required' },
                { status: 400 }
            )
        }

        // Fetch doctors
        const doctors = await prisma.user.findMany({
            where: {
                id: { in: doctorIds },
                doctorProfile: { isNot: null }
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        })

        if (doctors.length === 0) {
            return NextResponse.json(
                { message: 'No valid doctors found' },
                { status: 404 }
            )
        }

        // Send emails to each doctor
        const results = await Promise.allSettled(
            doctors.map(async (doctor) => {
                // Personalize message by replacing {{name}} with doctor's name
                const personalizedMessage = message.replace(/\{\{name\}\}/g, doctor.fullName)

                // Create email HTML
                const htmlBody = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
                            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                            .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; white-space: pre-wrap; }
                            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                            .badge { display: inline-block; background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="margin: 0; font-size: 24px;">📧 Message from Administration</h1>
                                ${messageType !== 'custom' ? `<span class="badge">${messageType}</span>` : ''}
                            </div>
                            <div class="content">
                                <div class="message">
                                    ${personalizedMessage.replace(/\n/g, '<br>')}
                                </div>
                                <div class="footer">
                                    <p>This is an official message from the Hospital Administration.</p>
                                    <p>© ${new Date().getFullYear()} Hospital Management System. All rights reserved.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `

                const textBody = `
Message from Administration

${personalizedMessage}

---
This is an official message from the Hospital Administration.
© ${new Date().getFullYear()} Hospital Management System. All rights reserved.
                `.trim()

                // Send email
                const transporter = createTransporter()
                return await transporter.sendMail({
                    from: process.env.SMTP_USER,
                    to: doctor.email,
                    subject: subject,
                    html: htmlBody,
                    text: textBody
                })
            })
        )

        // Count successes and failures
        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        return NextResponse.json({
            message: `Messages queued for delivery`,
            sent: successful,
            failed: failed,
            total: doctors.length
        })

    } catch (err) {
        console.error('Send message error:', err)
        return NextResponse.json(
            { message: 'Failed to send messages', error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
