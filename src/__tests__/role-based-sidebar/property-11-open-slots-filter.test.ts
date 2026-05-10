// Feature: role-based-sidebar, Property 11: Open slots page shows only slots where isOpen is true

/**
 * Property 11: Open slots page shows only slots where isOpen is true
 *
 * For any set of AppointmentSlot records with mixed isOpen values, the
 * /api/slots/open endpoint should return only those records where isOpen === true,
 * and the Open_Slots_Page should render exactly those records.
 *
 * Validates: Requirements 5.1
 */

import * as fc from 'fast-check'

// ─── Mock @/lib/prisma before importing the route handler ────────────────────

const mockFindMany = jest.fn()

jest.mock('@/lib/prisma', () => ({
    prisma: {
        appointmentSlot: {
            findMany: (...args: unknown[]) => mockFindMany(...args),
        },
    },
}))

// ─── Import the actual route handler ─────────────────────────────────────────

import { GET } from '@/app/api/slots/open/route'

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

interface OpenSlot {
    id: string
    departmentName: string
    doctorName: string
    slotDate: string
    remainingCapacity: number
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// Build valid dates from integer timestamps to guarantee no NaN dates during shrinking.
// Range: 2020-01-01 to 2030-12-31 in milliseconds.
const MIN_TS = new Date('2020-01-01T00:00:00.000Z').getTime()
const MAX_TS = new Date('2030-12-31T23:59:59.999Z').getTime()

const validDateArbitrary = fc
    .integer({ min: MIN_TS, max: MAX_TS })
    .map(ts => new Date(ts))

const slotArbitrary = fc.record({
    id: fc.uuid(),
    doctorName: fc.string({ minLength: 1, maxLength: 50 }),
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

async function callGetHandler(): Promise<OpenSlot[]> {
    const response = await GET()
    const json = await response.json()
    return json as OpenSlot[]
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 11: Open slots page shows only slots where isOpen is true', () => {
    beforeEach(() => {
        mockFindMany.mockReset()
    })

    it('should return only slots where isOpen is true (route handler with mocked Prisma)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(slotArbitrary, { minLength: 0, maxLength: 20 }),
                async (allSlots: MockSlot[]) => {
                    // Prisma's WHERE clause filters to isOpen=true before returning
                    const openSlots = allSlots.filter(s => s.isOpen)
                    mockFindMany.mockResolvedValueOnce(openSlots)

                    const result = await callGetHandler()

                    // Every returned slot must correspond to an isOpen=true source slot
                    const openIds = new Set(openSlots.map(s => s.id))
                    return result.every(r => openIds.has(r.id))
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should not include any closed slots (isOpen=false)', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(slotArbitrary, { minLength: 0, maxLength: 20 }),
                async (allSlots: MockSlot[]) => {
                    const openSlots = allSlots.filter(s => s.isOpen)
                    mockFindMany.mockResolvedValueOnce(openSlots)

                    const result = await callGetHandler()

                    const closedIds = new Set(allSlots.filter(s => !s.isOpen).map(s => s.id))
                    return result.every(r => !closedIds.has(r.id))
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should return all open slots — no open slot is omitted', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(slotArbitrary, { minLength: 0, maxLength: 20 }),
                async (allSlots: MockSlot[]) => {
                    const openSlots = allSlots.filter(s => s.isOpen)
                    mockFindMany.mockResolvedValueOnce(openSlots)

                    const result = await callGetHandler()

                    return result.length === openSlots.length
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should return empty array when all slots are closed', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    slotArbitrary.map(s => ({ ...s, isOpen: false })),
                    { minLength: 1, maxLength: 20 }
                ),
                async (allSlots: MockSlot[]) => {
                    // Prisma returns nothing because WHERE isOpen=true matches nothing
                    mockFindMany.mockResolvedValueOnce([])

                    const result = await callGetHandler()

                    return result.length === 0
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should return all slots when all slots are open', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    slotArbitrary.map(s => ({ ...s, isOpen: true })),
                    { minLength: 1, maxLength: 20 }
                ),
                async (allSlots: MockSlot[]) => {
                    mockFindMany.mockResolvedValueOnce(allSlots)

                    const result = await callGetHandler()

                    return result.length === allSlots.length
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should correctly compute remainingCapacity as slotLimit minus booking count', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    slotArbitrary.map(s => ({ ...s, isOpen: true })),
                    { minLength: 1, maxLength: 20 }
                ),
                async (openSlots: MockSlot[]) => {
                    mockFindMany.mockResolvedValueOnce(openSlots)

                    const result = await callGetHandler()

                    return result.every(r => {
                        const source = openSlots.find(s => s.id === r.id)!
                        return r.remainingCapacity === source.slotLimit - source._count.appointments
                    })
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should call Prisma findMany with where: { isOpen: true }', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(slotArbitrary, { minLength: 0, maxLength: 10 }),
                async (allSlots: MockSlot[]) => {
                    const openSlots = allSlots.filter(s => s.isOpen)
                    mockFindMany.mockResolvedValueOnce(openSlots)

                    await callGetHandler()

                    // Verify the route handler passes the correct where clause to Prisma
                    expect(mockFindMany).toHaveBeenCalledWith(
                        expect.objectContaining({
                            where: { isOpen: true },
                        })
                    )
                    return true
                }
            ),
            { numRuns: 100 }
        )
    })
})
