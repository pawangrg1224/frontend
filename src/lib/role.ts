/**
 * Shared role utility — imported by both dashboard layouts
 * to avoid circular dependencies.
 */

export type LogicalRole = 'admin' | 'doctor' | 'patient'

export function deriveLogicalRole(role: string, isDoctor: boolean): LogicalRole {
    if (role === 'ADMIN') return 'admin'
    if (isDoctor) return 'doctor'
    return 'patient'
}
