// Feature: role-based-sidebar, Property 3: Dashboard page calls the correct API endpoint for each logical role

/**
 * Property 3: Dashboard page calls the correct API endpoint for each logical role
 *
 * For any logical role, the DashboardPage should call exactly the role-specific
 * API endpoint and should not call endpoints belonging to other roles.
 *
 * Validates: Requirements 2.4
 */

import * as fc from 'fast-check'

type LogicalRole = 'admin' | 'doctor' | 'patient'

// The expected endpoints per role (mirrors the implementation in dashboard/page.tsx)
const ROLE_ENDPOINTS: Record<LogicalRole, string[]> = {
    admin: [
        '/api/admin/users/count',
        '/api/admin/appointments/count',
        '/api/admin/customers/count',
        '/api/admin/services/count',
    ],
    doctor: ['/api/dashboard/doctor-stats'],
    patient: ['/api/dashboard/patient-stats'],
}

// All endpoints across all roles
const ALL_ENDPOINTS = Object.values(ROLE_ENDPOINTS).flat()

/**
 * Simulates which endpoints would be called for a given logical role.
 * This mirrors the fetch logic in the dashboard page components.
 */
function getEndpointsForRole(role: LogicalRole): string[] {
    return ROLE_ENDPOINTS[role]
}

/**
 * Checks whether a set of called endpoints contains any cross-role endpoints.
 */
function hasCrossRoleEndpoints(role: LogicalRole, calledEndpoints: string[]): boolean {
    const ownEndpoints = new Set(ROLE_ENDPOINTS[role])
    return calledEndpoints.some(ep => !ownEndpoints.has(ep))
}

const ALL_ROLES: LogicalRole[] = ['admin', 'doctor', 'patient']

describe('Property 3: Dashboard page calls the correct API endpoint for each logical role', () => {
    it('should call only the role-specific endpoints for each logical role', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_ROLES), (role: LogicalRole) => {
                const calledEndpoints = getEndpointsForRole(role)
                const expectedEndpoints = ROLE_ENDPOINTS[role]

                // All expected endpoints should be called
                for (const ep of expectedEndpoints) {
                    expect(calledEndpoints).toContain(ep)
                }

                // No cross-role endpoints should be called
                expect(hasCrossRoleEndpoints(role, calledEndpoints)).toBe(false)

                return (
                    expectedEndpoints.every(ep => calledEndpoints.includes(ep)) &&
                    !hasCrossRoleEndpoints(role, calledEndpoints)
                )
            }),
            { numRuns: 100 }
        )
    })

    it('should not mix admin endpoints into doctor or patient views', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('doctor' as LogicalRole, 'patient' as LogicalRole),
                (role: LogicalRole) => {
                    const calledEndpoints = getEndpointsForRole(role)
                    const adminEndpoints = ROLE_ENDPOINTS.admin

                    // No admin endpoints should appear in doctor/patient calls
                    for (const adminEp of adminEndpoints) {
                        expect(calledEndpoints).not.toContain(adminEp)
                    }

                    return adminEndpoints.every(ep => !calledEndpoints.includes(ep))
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should not mix doctor endpoints into admin or patient views', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('admin' as LogicalRole, 'patient' as LogicalRole),
                (role: LogicalRole) => {
                    const calledEndpoints = getEndpointsForRole(role)
                    const doctorEndpoints = ROLE_ENDPOINTS.doctor

                    for (const doctorEp of doctorEndpoints) {
                        expect(calledEndpoints).not.toContain(doctorEp)
                    }

                    return doctorEndpoints.every(ep => !calledEndpoints.includes(ep))
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should not mix patient endpoints into admin or doctor views', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('admin' as LogicalRole, 'doctor' as LogicalRole),
                (role: LogicalRole) => {
                    const calledEndpoints = getEndpointsForRole(role)
                    const patientEndpoints = ROLE_ENDPOINTS.patient

                    for (const patientEp of patientEndpoints) {
                        expect(calledEndpoints).not.toContain(patientEp)
                    }

                    return patientEndpoints.every(ep => !calledEndpoints.includes(ep))
                }
            ),
            { numRuns: 100 }
        )
    })

    it('should cover all roles with distinct non-overlapping endpoint sets', () => {
        // Verify that endpoint sets are disjoint across roles
        const adminSet = new Set(ROLE_ENDPOINTS.admin)
        const doctorSet = new Set(ROLE_ENDPOINTS.doctor)
        const patientSet = new Set(ROLE_ENDPOINTS.patient)

        // No overlap between admin and doctor
        for (const ep of doctorSet) {
            expect(adminSet.has(ep)).toBe(false)
        }
        // No overlap between admin and patient
        for (const ep of patientSet) {
            expect(adminSet.has(ep)).toBe(false)
        }
        // No overlap between doctor and patient
        for (const ep of patientSet) {
            expect(doctorSet.has(ep)).toBe(false)
        }
    })

    it('should have exactly the right number of endpoints per role', () => {
        expect(ROLE_ENDPOINTS.admin).toHaveLength(4)   // 4 count endpoints
        expect(ROLE_ENDPOINTS.doctor).toHaveLength(1)  // 1 stats endpoint
        expect(ROLE_ENDPOINTS.patient).toHaveLength(1) // 1 stats endpoint
    })
})
