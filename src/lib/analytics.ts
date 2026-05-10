import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export type Period = 'day' | 'week' | 'month' | 'year'
export type ExportType = 'appointments' | 'reviews'

export interface AnalyticsFilters {
    serviceId?: string
    domainId?: string
    startDate?: Date
    endDate?: Date
}

export interface AppointmentStats {
    total: number
    byStatus: Record<string, number>
}

export interface RevenueStats {
    total: number
    byService: Array<{ serviceId: string; revenue: number }>
    byDomain: Array<{ domainId: string | null; revenue: number }>
}

export interface TimeSeriesPoint {
    month: string
    count?: number
    revenue?: number
}

export interface DerivedMetrics {
    noShowRate: number
    retentionRate: number
    topServices: Array<{ serviceId: string; count: number }>
}

// Simple in-memory cache with 5-minute TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>()

function getCached<T>(key: string): T | null {
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
        cache.delete(key)
        return null
    }
    return entry.data as T
}

function setCached(key: string, data: unknown): void {
    cache.set(key, { data, expiresAt: Date.now() + 5 * 60 * 1000 })
}

export function getDateRange(period: Period): { start: Date; end: Date } {
    const now = new Date()
    const start = new Date(now)
    const end = new Date(now)

    switch (period) {
        case 'day':
            start.setHours(0, 0, 0, 0)
            end.setHours(23, 59, 59, 999)
            break
        case 'week': {
            const day = now.getDay()
            start.setDate(now.getDate() - day)
            start.setHours(0, 0, 0, 0)
            end.setDate(start.getDate() + 6)
            end.setHours(23, 59, 59, 999)
            break
        }
        case 'month':
            start.setDate(1)
            start.setHours(0, 0, 0, 0)
            end.setMonth(now.getMonth() + 1, 0)
            end.setHours(23, 59, 59, 999)
            break
        case 'year':
            start.setMonth(0, 1)
            start.setHours(0, 0, 0, 0)
            end.setMonth(11, 31)
            end.setHours(23, 59, 59, 999)
            break
    }

    return { start, end }
}

export async function getAppointmentStats(
    period: Period,
    filters: AnalyticsFilters
): Promise<AppointmentStats> {
    const cacheKey = `appt-stats:${period}:${JSON.stringify(filters)}`
    const cached = getCached<AppointmentStats>(cacheKey)
    if (cached) return cached

    const { start, end } = getDateRange(period)
    const dateFilter = {
        gte: filters.startDate ?? start,
        lte: filters.endDate ?? end,
    }

    const where = {
        date: dateFilter,
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.domainId ? { domainId: filters.domainId } : {}),
    }

    const grouped = await prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
    })

    const byStatus: Record<string, number> = {}
    let total = 0

    for (const row of grouped) {
        byStatus[row.status] = row._count.id
        total += row._count.id
    }

    const result: AppointmentStats = { total, byStatus }
    setCached(cacheKey, result)
    return result
}

export async function getRevenueStats(
    period: Period,
    filters: AnalyticsFilters
): Promise<RevenueStats> {
    const cacheKey = `revenue-stats:${period}:${JSON.stringify(filters)}`
    const cached = getCached<RevenueStats>(cacheKey)
    if (cached) return cached

    const { start, end } = getDateRange(period)
    const dateFilter = {
        gte: filters.startDate ?? start,
        lte: filters.endDate ?? end,
    }

    const where = {
        date: dateFilter,
        status: AppointmentStatus.COMPLETED,
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.domainId ? { domainId: filters.domainId } : {}),
    }

    const byServiceRaw = await prisma.appointment.groupBy({
        by: ['serviceId'],
        where,
        _count: { id: true },
    })

    // Get service prices
    const serviceIds = byServiceRaw.map((r) => r.serviceId)
    const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, price: true },
    })
    const priceMap = new Map(services.map((s) => [s.id, s.price]))

    const byService = byServiceRaw.map((row) => ({
        serviceId: row.serviceId,
        revenue: (priceMap.get(row.serviceId) ?? 0) * row._count.id,
    }))

    const total = byService.reduce((sum, s) => sum + s.revenue, 0)

    const byDomainRaw = await prisma.appointment.groupBy({
        by: ['domainId', 'serviceId'],
        where,
        _count: { id: true },
    })

    const domainRevenueMap = new Map<string | null, number>()
    for (const row of byDomainRaw) {
        const price = priceMap.get(row.serviceId) ?? 0
        const revenue = price * row._count.id
        const key = row.domainId
        domainRevenueMap.set(key, (domainRevenueMap.get(key) ?? 0) + revenue)
    }

    const byDomain = Array.from(domainRevenueMap.entries()).map(([domainId, revenue]) => ({
        domainId,
        revenue,
    }))

    const result: RevenueStats = { total, byService, byDomain }
    setCached(cacheKey, result)
    return result
}

export async function getTimeSeries(
    metric: 'appointments' | 'revenue',
    months = 12
): Promise<TimeSeriesPoint[]> {
    const cacheKey = `timeseries:${metric}:${months}`
    const cached = getCached<TimeSeriesPoint[]>(cacheKey)
    if (cached) return cached

    const now = new Date()
    const points: TimeSeriesPoint[] = []

    for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
        const monthLabel = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`

        if (metric === 'appointments') {
            const count = await prisma.appointment.count({
                where: { date: { gte: monthStart, lte: monthEnd } },
            })
            points.push({ month: monthLabel, count })
        } else {
            const appointments = await prisma.appointment.findMany({
                where: {
                    date: { gte: monthStart, lte: monthEnd },
                    status: AppointmentStatus.COMPLETED,
                },
                include: { service: { select: { price: true } } },
            })
            const revenue = appointments.reduce((sum, a) => sum + a.service.price, 0)
            points.push({ month: monthLabel, revenue })
        }
    }

    setCached(cacheKey, points)
    return points
}

export async function getDerivedMetrics(filters: AnalyticsFilters): Promise<DerivedMetrics> {
    const cacheKey = `derived:${JSON.stringify(filters)}`
    const cached = getCached<DerivedMetrics>(cacheKey)
    if (cached) return cached

    const where = {
        ...(filters.startDate || filters.endDate
            ? {
                date: {
                    ...(filters.startDate ? { gte: filters.startDate } : {}),
                    ...(filters.endDate ? { lte: filters.endDate } : {}),
                },
            }
            : {}),
        ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
        ...(filters.domainId ? { domainId: filters.domainId } : {}),
    }

    const total = await prisma.appointment.count({ where })
    const cancelled = await prisma.appointment.count({
        where: { ...where, status: AppointmentStatus.CANCELLED },
    })

    const noShowRate = total > 0 ? cancelled / total : 0

    // Retention: customers with 2+ appointments
    const customerCounts = await prisma.appointment.groupBy({
        by: ['customerId'],
        where,
        _count: { id: true },
    })

    const totalCustomers = customerCounts.length
    const retainedCustomers = customerCounts.filter((c) => c._count.id >= 2).length
    const retentionRate = totalCustomers > 0 ? retainedCustomers / totalCustomers : 0

    // Top 5 services by appointment count
    const serviceGroups = await prisma.appointment.groupBy({
        by: ['serviceId'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
    })

    const topServices = serviceGroups.map((s) => ({
        serviceId: s.serviceId,
        count: s._count.id,
    }))

    const result: DerivedMetrics = { noShowRate, retentionRate, topServices }
    setCached(cacheKey, result)
    return result
}

export async function* exportToCsv(
    type: ExportType,
    filters: AnalyticsFilters
): AsyncGenerator<string> {
    if (type === 'appointments') {
        yield 'id,date,status,type,customerId,serviceId,domainId,createdAt\n'

        const where = {
            ...(filters.startDate || filters.endDate
                ? {
                    date: {
                        ...(filters.startDate ? { gte: filters.startDate } : {}),
                        ...(filters.endDate ? { lte: filters.endDate } : {}),
                    },
                }
                : {}),
            ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
            ...(filters.domainId ? { domainId: filters.domainId } : {}),
        }

        const batchSize = 1000
        let skip = 0

        while (true) {
            const rows = await prisma.appointment.findMany({
                where,
                skip,
                take: batchSize,
                orderBy: { createdAt: 'asc' },
            })

            if (rows.length === 0) break

            for (const row of rows) {
                yield `${row.id},${row.date.toISOString()},${row.status},${row.type},${row.customerId},${row.serviceId},${row.domainId ?? ''},${row.createdAt.toISOString()}\n`
            }

            if (rows.length < batchSize) break
            skip += batchSize
        }
    } else if (type === 'reviews') {
        yield 'id,appointmentId,customerId,serviceId,rating,feedback,isFlagged,createdAt\n'

        const where = {
            ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
            ...(filters.startDate || filters.endDate
                ? {
                    createdAt: {
                        ...(filters.startDate ? { gte: filters.startDate } : {}),
                        ...(filters.endDate ? { lte: filters.endDate } : {}),
                    },
                }
                : {}),
        }

        const batchSize = 1000
        let skip = 0

        while (true) {
            const rows = await prisma.review.findMany({
                where,
                skip,
                take: batchSize,
                orderBy: { createdAt: 'asc' },
            })

            if (rows.length === 0) break

            for (const row of rows) {
                const feedback = row.feedback ? `"${row.feedback.replace(/"/g, '""')}"` : ''
                yield `${row.id},${row.appointmentId},${row.customerId},${row.serviceId},${row.rating},${feedback},${row.isFlagged},${row.createdAt.toISOString()}\n`
            }

            if (rows.length < batchSize) break
            skip += batchSize
        }
    }
}
