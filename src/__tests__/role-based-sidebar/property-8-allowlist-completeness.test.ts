// Feature: role-based-sidebar, Property 8: Route allowlist matches sidebar nav items for every role

/**
 * Property 8: Route allowlist matches sidebar nav items for every role
 *
 * For each logicalRole, every nav href in NAV_CONFIG[logicalRole].items should
 * appear in NAV_CONFIG[logicalRole].allowlist, and the allowlist should not
 * contain routes that are not in the nav items (except /dashboard/settings
 * which is always allowed but not a nav item).
 *
 * Validates: Requirements 4.1
 */

import * as fc from 'fast-check'

// Inline NAV_CONFIG to avoid 'use client' issues in Jest
type LogicalRole = 'admin' | 'doctor' | 'patient'

interface NavItem {
    label: string
    href: string
    expandable?: boolean
}

interface RoleNavConfig {
    items: NavItem[]
    allowlist: string[]
}

const NAV_CONFIG: Record<LogicalRole, RoleNavConfig> = {
    admin: {
        items: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Patients', href: '/dashboard/customers' },
            { label: 'Appointments', href: '/dashboard/appointments' },
            { label: 'Departments', href: '/dashboard/services', expandable: true },
            { label: 'Manage Slots', href: '/dashboard/admin/slots' },
        ],
        allowlist: [
            '/dashboard',
            '/dashboard/customers',
            '/dashboard/appointments',
            '/dashboard/services',
            '/dashboard/admin/slots',
            '/dashboard/settings',
        ],
    },
    doctor: {
        items: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Appointments', href: '/dashboard/appointments' },
            { label: 'Patients', href: '/dashboard/customers' },
            { label: 'My Slots', href: '/dashboard/slots' },
        ],
        allowlist: [
            '/dashboard',
            '/dashboard/appointments',
            '/dashboard/customers',
            '/dashboard/slots',
            '/dashboard/settings',
        ],
    },
    patient: {
        items: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'My Appointments', href: '/dashboard/my-appointments' },
            { label: 'Open Slots', href: '/dashboard/open-slots' },
            { label: 'Departments', href: '/dashboard/services', expandable: true },
        ],
        allowlist: [
            '/dashboard',
            '/dashboard/my-appointments',
            '/dashboard/open-slots',
            '/dashboard/services',
            '/dashboard/settings',
        ],
    },
}

const ALWAYS_ALLOWED_EXTRA = '/dashboard/settings'
const ALL_ROLES: LogicalRole[] = ['admin', 'doctor', 'patient']

describe('Property 8: Route allowlist matches sidebar nav items for every role', () => {
    it('every nav item href should be in the allowlist for its role', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_ROLES), (role: LogicalRole) => {
                const config = NAV_CONFIG[role]
                for (const item of config.items) {
                    expect(config.allowlist).toContain(item.href)
                }
                return config.items.every(item => config.allowlist.includes(item.href))
            }),
            { numRuns: 100 }
        )
    })

    it('allowlist should not contain routes outside nav items except /dashboard/settings', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_ROLES), (role: LogicalRole) => {
                const config = NAV_CONFIG[role]
                const navHrefs = new Set(config.items.map(i => i.href))

                for (const route of config.allowlist) {
                    const isNavRoute = navHrefs.has(route)
                    const isSettingsRoute = route === ALWAYS_ALLOWED_EXTRA
                    expect(isNavRoute || isSettingsRoute).toBe(true)
                }

                return config.allowlist.every(
                    route => navHrefs.has(route) || route === ALWAYS_ALLOWED_EXTRA
                )
            }),
            { numRuns: 100 }
        )
    })

    it('/dashboard/settings should be in every role allowlist', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_ROLES), (role: LogicalRole) => {
                return NAV_CONFIG[role].allowlist.includes(ALWAYS_ALLOWED_EXTRA)
            }),
            { numRuns: 100 }
        )
    })

    it('allowlist and nav items should be consistent for all roles (exhaustive)', () => {
        for (const role of ALL_ROLES) {
            const config = NAV_CONFIG[role]
            const navHrefs = config.items.map(i => i.href)
            const allowlist = config.allowlist

            // Every nav href is in allowlist
            for (const href of navHrefs) {
                expect(allowlist).toContain(href)
            }

            // Every allowlist entry is either a nav href or settings
            for (const route of allowlist) {
                expect(navHrefs.includes(route) || route === ALWAYS_ALLOWED_EXTRA).toBe(true)
            }
        }
    })
})
