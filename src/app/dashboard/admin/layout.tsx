'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
    Calendar, Clock, Users, Menu, Loader, Stethoscope,
    LayoutDashboard, BarChart3, UserCog, Activity,
    Bell, Settings, ShieldX,
} from 'lucide-react'
import ProfileMenu from '@/components/ui/ProfileMenu'

// ─── Nav config ───────────────────────────────────────────────────────────────

interface NavItem {
    label: string
    href: string
    icon: React.ElementType
}

const ADMIN_NAV: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/admin/appointments', icon: Calendar },
    { label: 'Patients', href: '/dashboard/admin/customers', icon: Users },
    { label: 'Staff', href: '/dashboard/admin/users', icon: UserCog },
    { label: 'Departments', href: '/dashboard/admin/services', icon: Stethoscope },
    { label: 'Slots', href: '/dashboard/admin/slots', icon: Clock },
    { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
    { label: 'Availability', href: '/dashboard/admin/availability', icon: Activity },
    { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
    { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
]

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true)

    // Restore sidebar state
    useEffect(() => {
        const stored = localStorage.getItem('admin_sidebar_open')
        if (stored !== null) setSidebarOpen(stored === 'true')
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.replace('/auth/login')
        }
    }, [status, router])

    // ── Loading ──
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (status === 'unauthenticated') return null

    // ── Access denied for non-admins ──
    if ((session?.user as { role?: string })?.role !== 'ADMIN') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center max-w-md px-6">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldX className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                    <p className="text-gray-600 mb-8">
                        This area is restricted to administrators only.
                    </p>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    const userRole = (session?.user as { role?: string })?.role ?? 'USER'

    const toggleSidebar = () => {
        const next = !sidebarOpen
        localStorage.setItem('admin_sidebar_open', String(next))
        setSidebarOpen(next)
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* ── Sidebar ── */}
            <aside
                className={`${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                    <Link href="/dashboard/admin" className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <ShieldX className="w-4 h-4 text-white" />
                        </div>
                        {sidebarOpen && (
                            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                                Admin Panel
                            </span>
                        )}
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                    {ADMIN_NAV.map(({ label, href, icon: Icon }) => {
                        const active =
                            href === '/dashboard/admin'
                                ? pathname === href
                                : pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${active
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {sidebarOpen && <span className="text-sm truncate">{label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Profile */}
                <div className="border-t border-gray-200 px-2 py-3">
                    <ProfileMenu
                        name={session?.user?.name ?? 'Admin'}
                        email={session?.user?.email ?? ''}
                        role={userRole}
                        sidebarOpen={sidebarOpen}
                        pathname={pathname}
                    />
                </div>
            </aside>

            {/* ── Main area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <div className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="ml-4 flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Welcome back,{' '}
                            <span className="font-semibold text-gray-900">{session?.user?.name}</span>
                        </span>
                        <span className="text-xs font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            Admin
                        </span>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
