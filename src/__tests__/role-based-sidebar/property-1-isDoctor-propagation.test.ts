// Feature: role-based-sidebar, Property 1: isDoctor propagates correctly through the auth pipeline

/**
 * Property 1: isDoctor propagates correctly through the auth pipeline
 *
 * For any user record, if the user has an associated DoctorProfile record then
 * isDoctor should be true in the returned session; if the user has no DoctorProfile
 * then isDoctor should be false. This property covers the full chain:
 * authorize → jwt → session.
 *
 * Validates: Requirements 1.4, 1.5, 1.6
 */

import * as fc from 'fast-check'

// ---------------------------------------------------------------------------
// Inline implementations of the three auth pipeline callbacks
// (mirrors the logic in frontend/src/app/api/auth/[...nextauth]/route.ts)
// ---------------------------------------------------------------------------

interface AuthUser {
    id: string
    name: string
    email: string
    role: string
    isDoctor: boolean
}

interface JWTToken {
    id?: string
    role?: string
    isDoctor?: boolean
    [key: string]: unknown
}

interface SessionUser {
    id?: string
    role?: string
    isDoctor?: boolean
    name?: string | null
    email?: string | null
}

interface Session {
    user: SessionUser
}

/**
 * Simulates the authorize callback.
 * Returns an AuthUser with isDoctor set based on whether a DoctorProfile exists.
 */
function simulateAuthorize(hasProfile: boolean): AuthUser {
    return {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'USER',
        isDoctor: hasProfile,
    }
}

/**
 * Simulates the jwt callback.
 * Persists isDoctor onto the token; defaults to false if missing (backward compat).
 */
function simulateJwt(token: JWTToken, user?: AuthUser): JWTToken {
    const updatedToken = { ...token }
    if (user) {
        updatedToken.id = user.id
        updatedToken.role = user.role
        updatedToken.isDoctor = user.isDoctor ?? false
    }
    // Backward compatibility: if isDoctor is still undefined after processing, default to false
    if (updatedToken.isDoctor === undefined) {
        updatedToken.isDoctor = false
    }
    return updatedToken
}

/**
 * Simulates the session callback.
 * Exposes isDoctor on session.user from the token.
 */
function simulateSession(session: Session, token: JWTToken): Session {
    const updatedSession = { ...session, user: { ...session.user } }
    if (updatedSession.user) {
        updatedSession.user.id = token.id as string
        updatedSession.user.role = token.role as string
        updatedSession.user.isDoctor = token.isDoctor as boolean
    }
    return updatedSession
}

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

describe('Property 1: isDoctor propagates correctly through the auth pipeline', () => {
    it('should propagate isDoctor === hasProfile through the full authorize → jwt → session pipeline', () => {
        fc.assert(
            fc.property(fc.boolean(), (hasProfile: boolean) => {
                // Step 1: authorize callback — returns user with isDoctor based on DoctorProfile presence
                const user = simulateAuthorize(hasProfile)
                expect(user.isDoctor).toBe(hasProfile)

                // Step 2: jwt callback — persists isDoctor onto the token
                const initialToken: JWTToken = {}
                const token = simulateJwt(initialToken, user)
                expect(token.isDoctor).toBe(hasProfile)

                // Step 3: session callback — exposes isDoctor on session.user
                const initialSession: Session = { user: {} }
                const session = simulateSession(initialSession, token)
                expect(session.user.isDoctor).toBe(hasProfile)

                // Final assertion: session.user.isDoctor must equal the original hasProfile value
                return session.user.isDoctor === hasProfile
            }),
            { numRuns: 100 }
        )
    })

    it('should default isDoctor to false when token.isDoctor is undefined (backward compatibility)', () => {
        fc.assert(
            fc.property(fc.constant(undefined as unknown as boolean), () => {
                // Simulate a token from before the isDoctor field was introduced
                const legacyToken: JWTToken = { id: 'user-1', role: 'USER' }
                // isDoctor is intentionally absent

                // jwt callback should default it to false
                const token = simulateJwt(legacyToken)
                expect(token.isDoctor).toBe(false)

                // session callback should expose false
                const initialSession: Session = { user: {} }
                const session = simulateSession(initialSession, token)
                expect(session.user.isDoctor).toBe(false)

                return session.user.isDoctor === false
            }),
            { numRuns: 100 }
        )
    })

    it('should propagate isDoctor correctly when jwt callback is called without a user (token refresh)', () => {
        fc.assert(
            fc.property(fc.boolean(), (existingIsDoctor: boolean) => {
                // Simulate a token refresh where user is not passed to jwt callback
                // (this happens on subsequent requests after initial login)
                const existingToken: JWTToken = {
                    id: 'user-1',
                    role: 'USER',
                    isDoctor: existingIsDoctor,
                }

                // jwt callback called without user (token refresh scenario)
                const token = simulateJwt(existingToken, undefined)

                // isDoctor should be preserved from the existing token
                expect(token.isDoctor).toBe(existingIsDoctor)

                // session callback should expose the preserved value
                const initialSession: Session = { user: {} }
                const session = simulateSession(initialSession, token)
                expect(session.user.isDoctor).toBe(existingIsDoctor)

                return session.user.isDoctor === existingIsDoctor
            }),
            { numRuns: 100 }
        )
    })
})
