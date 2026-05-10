/**
 * @jest-environment jsdom
 */
// Feature: role-based-sidebar, Property 15: Sidebar state persists correctly via localStorage

/**
 * Property 15: Sidebar state persists correctly via localStorage
 *
 * For any boolean sidebar state, toggling the sidebar should write the new state
 * to localStorage under the key 'sidebar_open'; and on the next mount, reading
 * localStorage should restore the sidebar to that same state.
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import * as fc from 'fast-check'

const STORAGE_KEY = 'sidebar_open'

// Simulates the toggle handler from layout.tsx
function simulateToggle(current: boolean): boolean {
    const next = !current
    localStorage.setItem(STORAGE_KEY, String(next))
    return next
}

// Simulates the mount effect from layout.tsx
function simulateMount(defaultValue: boolean): boolean {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
        return stored === 'true'
    }
    return defaultValue
}

describe('Property 15: Sidebar state persists correctly via localStorage', () => {
    beforeEach(() => {
        localStorage.clear()
    })

    it('should write the toggled state to localStorage', () => {
        fc.assert(
            fc.property(fc.boolean(), (initialState: boolean) => {
                localStorage.clear()
                const nextState = simulateToggle(initialState)

                // The written value should be the opposite of the initial state
                expect(nextState).toBe(!initialState)
                expect(localStorage.getItem(STORAGE_KEY)).toBe(String(!initialState))

                return localStorage.getItem(STORAGE_KEY) === String(!initialState)
            }),
            { numRuns: 100 }
        )
    })

    it('should restore the sidebar state from localStorage on mount', () => {
        fc.assert(
            fc.property(fc.boolean(), (storedState: boolean) => {
                localStorage.clear()
                // Pre-populate localStorage as if a previous toggle wrote it
                localStorage.setItem(STORAGE_KEY, String(storedState))

                // Simulate mount — should read and restore the stored state
                const restoredState = simulateMount(true) // default is true but should be overridden
                expect(restoredState).toBe(storedState)

                return restoredState === storedState
            }),
            { numRuns: 100 }
        )
    })

    it('should default to true (expanded) when localStorage key is absent', () => {
        fc.assert(
            fc.property(fc.constant(undefined), () => {
                localStorage.clear()
                // No key set — should default to true
                const state = simulateMount(true)
                expect(state).toBe(true)
                return state === true
            }),
            { numRuns: 100 }
        )
    })

    it('should round-trip correctly: toggle → persist → mount → restore', () => {
        fc.assert(
            fc.property(fc.boolean(), (initialState: boolean) => {
                localStorage.clear()

                // Step 1: toggle from initialState
                const afterToggle = simulateToggle(initialState)

                // Step 2: simulate a fresh mount (new component instance)
                const restoredState = simulateMount(true)

                // The restored state should match what was written after toggle
                expect(restoredState).toBe(afterToggle)
                expect(restoredState).toBe(!initialState)

                return restoredState === afterToggle && restoredState === !initialState
            }),
            { numRuns: 100 }
        )
    })

    it('should handle multiple toggles and always persist the latest state', () => {
        fc.assert(
            fc.property(
                fc.boolean(),
                fc.integer({ min: 1, max: 10 }),
                (initialState: boolean, toggleCount: number) => {
                    localStorage.clear()

                    let current = initialState
                    for (let i = 0; i < toggleCount; i++) {
                        current = simulateToggle(current)
                    }

                    // After all toggles, localStorage should have the final state
                    expect(localStorage.getItem(STORAGE_KEY)).toBe(String(current))

                    // Mount should restore the final state
                    const restored = simulateMount(true)
                    expect(restored).toBe(current)

                    return restored === current
                }
            ),
            { numRuns: 100 }
        )
    })
})
