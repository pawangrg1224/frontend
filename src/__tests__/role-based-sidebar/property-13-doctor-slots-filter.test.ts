// Feature: role-based-sidebar, Property 13: Doctor slots page shows only the authenticated doctor's slots

/**
 * Property 13: Doctor slots page shows only the authenticated doctor's slots
 *
 * For any set of AppointmentSlot records belonging to multiple doctors, the
 * /api/slots/my-slots endpoint should return only those records where doctorName
 * matches the authenticated user's fullName.
 *
 * Validates: Requirements 5.3
 */

import * as fc from 'fast-check'

// ─── Mock @/lib/prisma before importing the route handler ────────────────────

const mockFindMany = jest.fn()
const mockFindUnique = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        appointmentSlot: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
        },
        user: {
            findUnique: (...args: unknown[]) => mockFindUnique(...args),
        },
    },
}))

// ─── Mock @/lib/session ───────────────────────────────────────────────────────

const mockGetAuthSession = jest.fn()
const mockUnauthorizedResponse = jest.fn()

jest.mock('@/lib/session', () => ({
    getAuthSession: () => mockGetAuthSession(),
    unauthorizedResponse: () => mockUnauthorizedResponse(),
}))

// ─── Import the actual route handler ─────────────────────────────────────────

import { GET } from '@/app/api/slots/my-slots/route'
import { NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MockSlot {
    id: string
    doctorName: string
    slotDate: Date
    slotLimit: number
    isOpen: boolean
    serviceId: string
    createdAt: Date
    updatedAt: Date
    service: { name: string }
    _count: { appointments: number }
}

interface DoctorSlot {
    id: string
    departmentName: string
    slotDate: string
    slotLimit: number
    bookingCount: number
    isOpen: boolean
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// Build valid dates from integer timestamps to guarantee no NaN dates during shrinking.
// Range: 2020-01-01 to 2030-12-31 in milliseconds.
const MIN_TS = new Date('2020-01-01T00:00:00.000Z').getTime()
const MAX_TS = new Date('2030-12-31T23:59:59.999Z').getTime()

const validDateArbitrary = fc
    .integer({ min: MIN_TS, max: MAX_TS })
    .map(ts => new Date(ts))

// Generate a doctor name that is a non-empty string (no leading/trailing whitespace)
const doctorNameArbitrary = fc
    .string({ minLength: 1, maxLength: 50 })
    .filter(s => s.trim().length > 0)

const slotArbitrary = (doctorName: string) =>
    fc.record({
        id: fc.uuid(),
        doctorName: fc.constant(doctorName),
        slotDate: validDateArbitrary,
        slotLimit: fc.integer({ min: 1, max: 20 }),
        isOpen: fc.boolean(),
        serviceId: fc.uuid(),
        createdAt: validDateArbitrary,
        updatedAt: validDateArbitrary,
        service: fc.record({ name: fc.string({ minLength: 1, maxLength: 50 }) }),
        _count: fc.record({
            appointments: fc.integer({ min: 0, max: 20 }),
        }),
    })

// ─── Helper: call GET handler and parse JSON ──────────────────────────────────

async function callGetHandler(): Promise<{ status: number; body: unknown }> {
    const response = await GET()
    const body = await response.json()
    return { status: response.status, body }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 13: Doctor slots page shows only the authenticated doctor\'s slots', () => {
    beforeEach(() => {
        mockFindMany.mockReset()
        mockFindUnique.mockReset()
        mockGetAuthSession.mockReset()
        mockUnauthorizedResponse.mockReset()

        // Default: unauthorized response returns a 401 NextResponse
        mockUnauthorizedResponse.mockReturnValue(
            NextResponse.json({ message: 'Unauthorized. Please sign in.' }, { status: 401 })
        )
    })

    // ── Core property: only the authenticated doctor's slots are returned ──────

    it('should return only slots belonging to the authenticated doctor', async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a target doctor name and a second (different) doctor name
                doctorNameArbitrary,
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0), // userId
                fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 0, maxLength: 5 }), // indices for target slots
                fc.array(fc.integer({ min: 0, max: 5 }), { minLength: 0, maxLength: 5 }), // indices for other slots
                async (targetDoctorName, otherDoctorName, userId, targetIndices, otherIndices) => {
                    // Ensure the two doctor names are different
                    if (targetDoctorName === otherDoctorName) return true

                    // Build slot arrays using the indices as counts
                    const targetSlotCount = targetIndices.length
                    const otherSlotCount = otherIndices.length

                    // Generate slots synchronously using fixed data derived from indices
                    const targetSlots: MockSlot[] = Array.from({ length: targetSlotCount }, (_, i) => ({
                        id: `target-slot-${i}`,
                        doctorName: targetDoctorName,
                        slotDate: new Date(MIN_TS + i * 86400000),
                        slotLimit: 5,
                        isOpen: true,
                        serviceId: `service-${i}`,
                        createdAt: new Date(MIN_TS),
                        updatedAt: new Date(MIN_TS),
                        service: { name: `Department ${i}` },
                        _count: { appointments: i % 5 },
                    }))

                    const otherSlots: MockSlot[] = Array.from({ length: otherSlotCount }, (_, i) => ({
                        id: `other-slot-${i}`,
                        doctorName: otherDoctorName,
                        slotDate: new Date(MIN_TS + i * 86400000),
                        slotLimit: 5,
                        isOpen: true,
                        serviceId: `service-other-${i}`,
                        createdAt: new Date(MIN_TS),
                        updatedAt: new Date(MIN_TS),
                        service: { name: `Other Dept ${i}` },
                        _count: { appointments: i % 5 },
                    }))

                    // Session: authenticated doctor
                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })

                    // User lookup returns the target doctor's fullName
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })

                    // Prisma's WHERE filter: only return slots matching doctorName
                    mockFindMany.mockResolvedValueOnce(targetSlots)

                    const { status, body } = await callGetHandler()
                    const result = body as DoctorSlot[]

                    if (status !== 200) return false

                    // Every returned slot must belong to the target doctor
                    const targetIds = new Set(targetSlots.map(s => s.id))
                    const otherIds = new Set(otherSlots.map(s => s.id))

                    const allBelongToTarget = result.every(r => targetIds.has(r.id))
                    const noneFromOther = result.every(r => !otherIds.has(r.id))
                    const countMatches = result.length === targetSlots.length

                    return allBelongToTarget && noneFromOther && countMatches
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should return all slots for the authenticated doctor — no slot is omitted', async () => {
        await fc.assert(
            fc.asyncProperty(
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                fc.integer({ min: 0, max: 15 }),
                async (targetDoctorName, userId, slotCount) => {
                    const targetSlots: MockSlot[] = Array.from({ length: slotCount }, (_, i) => ({
                        id: `slot-${i}`,
                        doctorName: targetDoctorName,
                        slotDate: new Date(MIN_TS + i * 86400000),
                        slotLimit: 10,
                        isOpen: i % 2 === 0,
                        serviceId: `service-${i}`,
                        createdAt: new Date(MIN_TS),
                        updatedAt: new Date(MIN_TS),
                        service: { name: `Dept ${i}` },
                        _count: { appointments: i % 10 },
                    }))

                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })
                    mockFindMany.mockResolvedValueOnce(targetSlots)

                    const { status, body } = await callGetHandler()
                    const result = body as DoctorSlot[]

                    if (status !== 200) return false

                    return result.length === slotCount
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should pass doctorName filter to Prisma findMany', async () => {
        await fc.assert(
            fc.asyncProperty(
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                async (targetDoctorName, userId) => {
                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })
                    mockFindMany.mockResolvedValueOnce([])

                    await callGetHandler()

                    expect(mockFindMany).toHaveBeenCalledWith(
                        expect.objectContaining({
                            where: { doctorName: targetDoctorName },
                        })
                    )
                    return true
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should look up user by the authenticated userId', async () => {
        await fc.assert(
            fc.asyncProperty(
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                async (targetDoctorName, userId) => {
                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })
                    mockFindMany.mockResolvedValueOnce([])

                    await callGetHandler()

                    expect(mockFindUnique).toHaveBeenCalledWith(
                        expect.objectContaining({
                            where: { id: userId },
                        })
                    )
                    return true
                }
            ),
            { numRuns: 100 }
        )
    })

    // ── Auth / Authorization tests ────────────────────────────────────────────

    it('should return 401 when session is null', async () => {
        mockGetAuthSession.mockResolvedValue(null)

        const response = await GET()

        expect(mockUnauthorizedResponse).toHaveBeenCalled()
    })

    it('should return 401 when session has no user id', async () => {
        mockGetAuthSession.mockResolvedValue({ user: {} })

        const response = await GET()

        expect(mockUnauthorizedResponse).toHaveBeenCalled()
    })

    it('should return 403 when isDoctor is false', async () => {
        mockGetAuthSession.mockResolvedValue({
            user: { id: 'user-123', isDoctor: false },
        })

        const { status } = await callGetHandler()

        expect(status).toBe(403)
    })

    it('should return 403 when isDoctor is undefined', async () => {
        mockGetAuthSession.mockResolvedValue({
            user: { id: 'user-123' },
        })

        const { status } = await callGetHandler()

        expect(status).toBe(403)
    })

    // ── Edge cases ────────────────────────────────────────────────────────────

    it('should return empty array when doctor has no slots', async () => {
        await fc.assert(
            fc.asyncProperty(
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                async (targetDoctorName, userId) => {
                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })
                    mockFindMany.mockResolvedValueOnce([])

                    const { status, body } = await callGetHandler()
                    const result = body as DoctorSlot[]

                    return status === 200 && result.length === 0
                }
            ),
            { numRuns: 50 }
        )
    })

    it('should correctly map slot fields in the response', async () => {
        await fc.assert(
            fc.asyncProperty(
                doctorNameArbitrary,
                fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0),
                fc.integer({ min: 1, max: 10 }),
                async (targetDoctorName, userId, slotCount) => {
                    const targetSlots: MockSlot[] = Array.from({ length: slotCount }, (_, i) => ({
                        id: `slot-${i}`,
                        doctorName: targetDoctorName,
                        slotDate: new Date(MIN_TS + i * 86400000),
                        slotLimit: i + 1,
                        isOpen: i % 2 === 0,
                        serviceId: `service-${i}`,
                        createdAt: new Date(MIN_TS),
                        updatedAt: new Date(MIN_TS),
                        service: { name: `Department ${i}` },
                        _count: { appointments: i % (i + 1) },
                    }))

                    mockGetAuthSession.mockResolvedValueOnce({
                        user: { id: userId, isDoctor: true },
                    })
                    mockFindUnique.mockResolvedValueOnce({ fullName: targetDoctorName })
                    mockFindMany.mockResolvedValueOnce(targetSlots)

                    const { status, body } = await callGetHandler()
                    const result = body as DoctorSlot[]

                    if (status !== 200) return false

                    return result.every(r => {
                        const source = targetSlots.find(s => s.id === r.id)!
                        return (
                            r.departmentName === source.service.name &&
                            r.slotDate === source.slotDate.toISOString() &&
                            r.slotLimit === source.slotLimit &&
                            r.bookingCount === source._count.appointments &&
                            r.isOpen === source.isOpen
                        )
                    })
                }
            ),
            { numRuns: 100 }
        )
    })
})
