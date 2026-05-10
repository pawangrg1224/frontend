import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import { exportToCsv, type ExportType, type AnalyticsFilters } from '@/lib/analytics'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const type = (searchParams.get('type') ?? 'appointments') as ExportType
    const serviceId = searchParams.get('serviceId') ?? undefined
    const domainId = searchParams.get('domainId') ?? undefined
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    const filters: AnalyticsFilters = {
        serviceId,
        domainId,
        startDate: startDateStr ? new Date(startDateStr) : undefined,
        endDate: endDateStr ? new Date(endDateStr) : undefined,
    }

    const generator = exportToCsv(type, filters)

    const stream = new ReadableStream({
        async pull(controller) {
            const { value, done } = await generator.next()
            if (done) {
                controller.close()
            } else {
                controller.enqueue(new TextEncoder().encode(value))
            }
        },
    })

    return new NextResponse(stream, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=export.csv',
        },
    })
}
