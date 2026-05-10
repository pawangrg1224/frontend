import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { getMessages, sendMessage, markMessagesRead } from '@/lib/chat'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ appointmentId: string }> }
) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()

    const { appointmentId } = await params
    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after') ?? undefined
    const limit = 50

    const messages = await getMessages(appointmentId, after, limit + 1)
    const hasMore = messages.length > limit

    return NextResponse.json({ messages: messages.slice(0, limit), hasMore })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ appointmentId: string }> }
) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()

    const { appointmentId } = await params
    const { content } = await request.json()

    if (!content || typeof content !== 'string') {
        return NextResponse.json({ message: 'Content is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    try {
        const message = await sendMessage(appointmentId, session.user.id, session.user.role, content)
        await markMessagesRead(appointmentId, session.user.id)
        return NextResponse.json(message, { status: 201 })
    } catch (err) {
        const error = err as Error & { code?: string }
        if (error.code === 'MESSAGE_TOO_LONG') {
            return NextResponse.json({ message: error.message, code: 'MESSAGE_TOO_LONG' }, { status: 400 })
        }
        if (error.code === 'APPOINTMENT_NOT_FOUND') {
            return NextResponse.json({ message: error.message, code: 'APPOINTMENT_NOT_FOUND' }, { status: 404 })
        }
        if (error.code === 'FORBIDDEN') {
            return forbiddenResponse()
        }
        console.error('Chat POST error:', err)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
