/**
 * @jest-environment jsdom
 */

// Feature: role-based-sidebar, Property 12: Open slot cards contain all required fields

/**
 * Property 12: Open slot cards contain all required fields
 *
 * For any array of OpenSlot objects, when the OpenSlotsPage renders them,
 * each card must display the department name, doctor name, formatted slot date,
 * and remaining capacity in the correct format.
 *
 * Validates: Requirements 5.2
 */

import * as fc from 'fast-check'
import React from 'react'
import { render, screen, waitFor, act, cleanup } from '@testing-library/react'

// ─── Mock next-auth (OpenSlotsPage is a client component that may pull session) ─
jest.mock('next-auth/react', () => ({
    useSession: () => ({ data: { user: { role: 'USER', isDoctor: false } }, status: 'authenticated' }),
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// ─── Import the component under test ─────────────────────────────────────────
import OpenSlotsPage from '@/app/dashboard/user/open-slots/page'

// ─── Types ────────────────────────────────────────────────────────────────────

interface OpenSlot {
    id: string
    departmentName: string
    doctorName: string
    slotDate: string        // ISO date string
    remainingCapacity: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Mirror the component's formatDate logic */
function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

/** Build a mock fetch that resolves with the given slots */
function mockFetchSuccess(slots: OpenSlot[]): void {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => slots,
    } as Response)
}

/** Build a mock fetch that resolves with a non-ok response */
function mockFetchError(): void {
    global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
    } as unknown as Response)
}

/** Build a mock fetch that rejects (network error) */
function mockFetchReject(): void {
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'))
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

// Use integer-based timestamps to guarantee no NaN dates during shrinking.
// Range: 2020-01-01 to 2030-12-31 in milliseconds.
const MIN_TS = new Date('2020-01-01T00:00:00.000Z').getTime()
const MAX_TS = new Date('2030-12-31T23:59:59.999Z').getTime()

const isoDateArbitrary = fc
    .integer({ min: MIN_TS, max: MAX_TS })
    .map(ts => new Date(ts).toISOString())

const openSlotArbitrary = fc.record({
    id: fc.uuid(),
    departmentName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,28}[A-Za-z0-9]$/).filter(s => s.trim().length > 0),
    doctorName: fc.stringMatching(/^[A-Za-z][A-Za-z0-9 ]{0,28}[A-Za-z0-9]$/).filter(s => s.trim().length > 0),
    slotDate: isoDateArbitrary,
    remainingCapacity: fc.integer({ min: 0, max: 20 }),
})

/** Generate an array of slots with unique IDs */
const uniqueSlotsArbitrary = fc
    .array(openSlotArbitrary, { minLength: 1, maxLength: 3 })
    .map(slots => {
        // Deduplicate by ID — keep first occurrence of each ID
        const seen = new Set<string>()
        return slots.filter(s => {
            if (seen.has(s.id)) return false
            seen.add(s.id)
            return true
        })
    })
    .filter(slots => slots.length >= 1)

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Property 12: Open slot cards contain all required fields', () => {
    afterEach(() => {
        cleanup()
        jest.restoreAllMocks()
    })

    it('each rendered card contains department name, doctor name, formatted date, and capacity', async () => {
        await fc.assert(
            fc.asyncProperty(
                uniqueSlotsArbitrary,
                async (slots: OpenSlot[]) => {
                    mockFetchSuccess(slots)

                    const { unmount } = render(React.createElement(OpenSlotsPage))

                    // Wait for loading to complete — the heading "Open Slots" appears after loading
                    await waitFor(
                        () => {
                            const headings = screen.queryAllByText('Open Slots')
                            expect(headings.length).toBeGreaterThan(0)
                        },
                        { timeout: 2000 }
                    )

                    // Assert each slot's fields appear in the document
                    for (const slot of slots) {
                        // Use a custom normalizer that preserves whitespace for exact matching
                        const noNormalize = { normalizer: (text: string) => text }

                        // Department name
                        const deptElements = screen.queryAllByText(slot.departmentName, noNormalize)
                        expect(deptElements.length).toBeGreaterThan(0)

                        // Doctor name
                        const doctorElements = screen.queryAllByText(slot.doctorName, noNormalize)
                        expect(doctorElements.length).toBeGreaterThan(0)

                        // Formatted date
                        const formattedDate = formatDate(slot.slotDate)
                        const dateElements = screen.queryAllByText(formattedDate, noNormalize)
                        expect(dateElements.length).toBeGreaterThan(0)

                        // Remaining capacity
                        const capacityText =
                            slot.remainingCapacity === 1
                                ? `${slot.remainingCapacity} spot left`
                                : `${slot.remainingCapacity} spots left`
                        const capacityElements = screen.queryAllByText(capacityText, noNormalize)
                        expect(capacityElements.length).toBeGreaterThan(0)
                    }

                    unmount()
                    return true
                }
            ),
            { numRuns: 10 }
        )
    }, 60000)

    it('shows empty-state message when fetch returns an empty array', async () => {
        mockFetchSuccess([])

        await act(async () => {
            render(React.createElement(OpenSlotsPage))
        })

        await waitFor(() => {
            expect(screen.getByText('No open slots available')).toBeTruthy()
        }, { timeout: 3000 })
    })

    it('shows error banner when fetch returns a non-ok response', async () => {
        mockFetchError()

        await act(async () => {
            render(React.createElement(OpenSlotsPage))
        })

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load open slots. Please try again later.')
            ).toBeTruthy()
        }, { timeout: 3000 })
    })

    it('shows error banner when fetch rejects (network error)', async () => {
        mockFetchReject()

        await act(async () => {
            render(React.createElement(OpenSlotsPage))
        })

        await waitFor(() => {
            expect(
                screen.getByText('Failed to load open slots. Please try again later.')
            ).toBeTruthy()
        }, { timeout: 3000 })
    })
})
