'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Menu, Loader, Stethoscope,
    ChevronDown, ChevronRight,
    Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
    Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield,
    ShieldX,
} from 'lucide-react'
import ProfileMenu from '@/components/ui/ProfileMenu'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
    label: string
    href: string
    icon: React.ElementType
    expandable?: boolean   // true = departments accordion
}

export interface SidebarConfig {
    role: 'admin' | 'doctor' | 'user'
    logoLabel: string
    logoGradient: string   // tailwind gradient classes e.g. 'from-blue-600 to-indigo-600'
    logoIcon: React.ElementType
    topBarBadge?: string   // e.g. 'Admin'
    storageKey: string     // localStorage key for sidebar open state
    nav: NavItem[]
    allowlist: string[]    // prefix-matched; if pathname not in list → redirect to home
    homeHref: string       // where to redirect on allowlist miss
    requireRole?: string   // e.g. 'ADMIN' — show access denied if role doesn't match
}

// ─── Department icon map ──────────────────────────────────────────────────────

const DEPT_ICONS: { keywords: string[]; icon: React.ElementType; color: string }[] = [
    { keywords: ['cardio', 'heart', 'cardiac'], icon: Heart, color: 'text-red-500' },
    { keywords: ['neuro', 'brain', 'nerve'], icon: Brain, color: 'text-purple-500' },
    { keywords: ['ortho', 'bone', 'joint', 'spine'], icon: Bone, color: 'text-orange-500' },
    { keywords: ['eye', 'ophthal', 'vision', 'retina'], icon: Eye, color: 'text-blue-500' },
    { keywords: ['pediatr', 'child', 'baby', 'neonat'], icon: Baby, color: 'text-pink-500' },
    { keywords: ['pulmo', 'lung', 'respir', 'chest'], icon: Wind, color: 'text-cyan-500' },
    { keywords: ['lab', 'pathol', 'test', 'blood'], icon: Microscope, color: 'text-green-500' },
    { keywords: ['pharma', 'drug', 'medic', 'pill'], icon: Pill, color: 'text-teal-500' },
    { keywords: ['ent', 'ear', 'nose', 'throat'], icon: Ear, color: 'text-yellow-500' },
    { keywords: ['dental', 'teeth', 'oral', 'mouth'], icon: Smile, color: 'text-lime-500' },
    { keywords: ['immun', 'vaccine', 'inject'], icon: Syringe, color: 'text-indigo-500' },
    { keywords: ['oncol', 'cancer', 'tumor'], icon: Zap, color: 'text-rose-500' },
    { keywords: ['emerg', 'icu', 'critical', 'trauma'], icon: Activity, color: 'text-red-600' },
    { keywords: ['research', 'clinical', 'trial'], icon: FlaskConical, color: 'text-violet-500' },
    { keywords: ['prevent', 'wellness', 'health'], icon: Shield, color: 'text-emerald-500' },
]

function getDeptIcon(name: string) {
    const lower = name.toLowerCase()
    for (const entry of DEPT_ICONS) {
        if (entry.keywords.some(k => lower.includes(k))) return entry
    }
    return { icon: Stethoscope, color: 'text-gray-500' }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    config: SidebarConfig
    children: React.ReactNode
}

export default function SidebarLayout({ config, children }: Props) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()

    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [deptExpanded, setDeptExpanded] = useState(false)
    const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])

    // Restore sidebar state
    useEffect(() => {
        const stored = localStorage.getItem(config.storageKey)
        if (stored !== null) setSidebarOpen(stored === 'true')
    }, [config.storageKey])

    // Auth + allowlist guard
    useEffect(() => {
        if (status === 'unauthenticated') { router.replace('/auth/login'); return }
        if (status === 'authenticated') {
            // Role check
            if (config.requireRole) {
                const userRole = (session?.user as { role?: string })?.role ?? 'USER'
                if (userRole !== config.requireRole) { router.replace('/dashboard'); return }
            }
            // Allowlist check
            const allowed = config.allowlist.some(a => pathname === a || pathname.startsWith(a + '/'))
            if (!allowed) router.replace(config.homeHref)
        }
    }, [status, session, pathname, router, config])

    // Auto-expand departments when on a services path
    useEffect(() => {
        if (pathname.includes('/services')) setDeptExpanded(true)
    }, [pathname])

    // Load departments for expandable nav
    useEffect(() => {
        if (status !== 'authenticated') return
        fetch('/api/services?limit=100')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.data) setDepartments(data.data) })
            .catch(() => { })
    }, [status])

    // ── Loading ──
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (status === 'unauthenticated') return null

    // ── Access denied ──
    if (config.requireRole) {
        const userRole = (session?.user as { role?: string })?.role ?? 'USER'
        if (userRole !== config.requireRole) {
            return (
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center max-w-md px-6">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldX className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
                        <p className="text-gray-600 mb-8">You don't have permission to access this area.</p>
                        <Link href="/dashboard" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            )
        }
    }

    const userRole = (session?.user as { role?: string })?.role ?? 'USER'
    const LogoIcon = config.logoIcon

    const toggleSidebar = () => {
        const next = !sidebarOpen
        localStorage.setItem(config.storageKey, String(next))
        setSidebarOpen(next)
    }

    // Determine services base path for this role
    const servicesBase = config.nav.find(n => n.expandable)?.href ?? '/dashboard/services'

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* ── Sidebar ── */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>

                {/* Logo */}
                <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                    <Link href={config.homeHref} className="flex items-center gap-2 min-w-0">
                        <div className={`w-8 h-8 bg-gradient-to-br ${config.logoGradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <LogoIcon className="w-4 h-4 text-white" />
                        </div>
                        {sidebarOpen && (
                            <span className={`text-base font-bold bg-gradient-to-r ${config.logoGradient} bg-clip-text text-transparent truncate`}>
                                {config.logoLabel}
                            </span>
                        )}
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                    {config.nav.map(({ label, href, icon: Icon, expandable }) => {
                        if (expandable) {
                            const isDeptActive = pathname.startsWith(servicesBase)
                            return (
                                <div key={href}>
                                    <button
                                        onClick={() => {
                                            if (!sidebarOpen) { router.push(href); return }
                                            setDeptExpanded(v => !v)
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isDeptActive
                                                ? 'bg-blue-50 text-blue-600 font-semibold'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon size={20} className="flex-shrink-0" />
                                        {sidebarOpen && (
                                            <>
                                                <span className="text-sm truncate flex-1 text-left">{label}</span>
                                                {deptExpanded
                                                    ? <ChevronDown size={15} className="flex-shrink-0 opacity-60" />
                                                    : <ChevronRight size={15} className="flex-shrink-0 opacity-60" />}
                                            </>
                                        )}
                                    </button>

                                    {sidebarOpen && deptExpanded && (
                                        <div className="mt-0.5 ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
                                            {departments.length === 0 && (
                                                <p className="px-2 py-1.5 text-xs text-gray-400 italic">No departments yet</p>
                                            )}
                                            {departments.map(dept => {
                                                const { icon: DeptIcon, color } = getDeptIcon(dept.name)
                                                const deptHref = `${servicesBase}/${dept.id}`
                                                const isActive = pathname === deptHref
                                                return (
                                                    <Link
                                                        key={dept.id}
                                                        href={deptHref}
                                                        className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all group ${isActive
                                                                ? 'bg-blue-50 text-blue-600 font-medium'
                                                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                                            }`}
                                                    >
                                                        <DeptIcon size={15} className={`flex-shrink-0 ${isActive ? 'text-blue-500' : color} group-hover:scale-110 transition-transform`} />
                                                        <span className="truncate">{dept.name}</span>
                                                    </Link>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        }

                        const active = href === config.homeHref
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
                        name={session?.user?.name ?? 'User'}
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
                    <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="ml-4 flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Welcome back, <span className="font-semibold text-gray-900">{session?.user?.name}</span>
                        </span>
                        {config.topBarBadge && (
                            <span className="text-xs font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                                {config.topBarBadge}
                            </span>
                        )}
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
