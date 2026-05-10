'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Calendar, Clock, Users, Menu, Loader, Stethoscope,
  ChevronDown, ChevronRight,
  Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
  Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield,
  LayoutDashboard,
} from 'lucide-react'
import ProfileMenu from '@/components/ui/ProfileMenu'
import { deriveLogicalRole } from '@/lib/role'

// Re-export so existing page.tsx imports still work
export { deriveLogicalRole }

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: string
  name: string
}

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  expandable?: boolean
}

interface RoleNavConfig {
  items: NavItem[]
  allowlist: string[]
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

function getDeptIcon(name: string): { icon: React.ElementType; color: string } {
  const lower = name.toLowerCase()
  for (const entry of DEPT_ICONS) {
    if (entry.keywords.some(k => lower.includes(k))) return entry
  }
  return { icon: Stethoscope, color: 'text-gray-500' }
}

// ─── Nav config (doctor + patient only) ──────────────────────────────────────

const NAV_CONFIG: Record<'doctor' | 'patient', RoleNavConfig> = {
  doctor: {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
      { label: 'Patients', href: '/dashboard/customers', icon: Users },
      { label: 'My Slots', href: '/dashboard/slots', icon: Clock },
      { label: 'Departments', href: '/dashboard/services', icon: Stethoscope, expandable: true },
    ],
    allowlist: [
      '/dashboard',
      '/dashboard/appointments',
      '/dashboard/customers',
      '/dashboard/slots',
      '/dashboard/services',
      '/dashboard/settings',
    ],
  },
  patient: {
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'My Appointments', href: '/dashboard/my-appointments', icon: Calendar },
      { label: 'Open Slots', href: '/dashboard/open-slots', icon: Clock },
      { label: 'Departments', href: '/dashboard/services', icon: Stethoscope, expandable: true },
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

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [deptExpanded, setDeptExpanded] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])

  // Restore sidebar state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar_open')
    if (stored !== null) setSidebarOpen(stored === 'true')
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
      return
    }
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role ?? 'USER'
      const isDoctorFlag = (session?.user as { isDoctor?: boolean })?.isDoctor ?? false
      const logical = deriveLogicalRole(role, isDoctorFlag)

      // Admins belong in /dashboard/admin — redirect them out
      if (logical === 'admin') {
        router.replace('/dashboard/admin')
        return
      }

      // Check allowlist for doctor/patient
      const allowlist = NAV_CONFIG[logical as 'doctor' | 'patient'].allowlist
      const allowed = allowlist.some(a => pathname === a || pathname.startsWith(a + '/'))
      if (!allowed) {
        router.replace('/dashboard')
      }
    }
  }, [status, session, pathname, router])

  useEffect(() => {
    if (pathname.startsWith('/dashboard/services')) setDeptExpanded(true)
  }, [pathname])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/services?limit=100')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.data) setDepartments(data.data) })
      .catch(() => { })
  }, [status])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  const userRole = (session?.user as { role?: string })?.role ?? 'USER'
  const isDoctor = (session?.user as { isDoctor?: boolean })?.isDoctor ?? false
  const logicalRole = deriveLogicalRole(userRole, isDoctor)

  // While admin redirect is in flight, render nothing
  if (logicalRole === 'admin') return null

  const navConfig = NAV_CONFIG[logicalRole as 'doctor' | 'patient']
  const isDeptActive = pathname.startsWith('/dashboard/services')

  const toggleSidebar = () => {
    const next = !sidebarOpen
    localStorage.setItem('sidebar_open', String(next))
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
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent truncate">
                MediBook
              </span>
            )}
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navConfig.items.map(({ label, href, icon: Icon, expandable }) => {
            if (expandable) {
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
                        const isActive = pathname === `/dashboard/services/${dept.id}`
                        return (
                          <Link
                            key={dept.id}
                            href={`/dashboard/services/${dept.id}`}
                            className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-all group ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                              }`}
                          >
                            <DeptIcon
                              size={15}
                              className={`flex-shrink-0 ${isActive ? 'text-blue-500' : color} group-hover:scale-110 transition-transform`}
                            />
                            <span className="truncate">{dept.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            const active =
              href === '/dashboard'
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
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="ml-4">
            <span className="text-sm text-gray-500">
              Welcome back,{' '}
              <span className="font-semibold text-gray-900">{session?.user?.name}</span>
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
