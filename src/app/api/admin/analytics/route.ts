import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession, unauthorizedResponse, forbiddenResponse } from '@/lib/session'
import {
    getAppointmentStats,
    getRevenueStats,
    getTimeSeries,
    getDerivedMetrics,
    type Period,
    type AnalyticsFilters,
} from '@/lib/analytics'

export async function GET(request: NextRequest) {
    const session = await getAuthSession()
    if (!session) return unauthorizedResponse()
    if (session.user.role !== 'ADMIN') return forbiddenResponse()

    const { searchParams } = new URL(request.url)
    const period = (searchParams.get('period') ?? 'month') as Period
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

    const [appointmentStats, revenueStats, timeSeries, derivedMetrics] = await Promise.all([
        getAppointmentStats(period, filters),
        getRevenueStats(period, filters),
        getTimeSeries('appointments'),
        getDerivedMetrics(filters),
    ])

    return NextResponse.json({ appointmentStats, revenueStats, timeSeries, derivedMetrics })
}
