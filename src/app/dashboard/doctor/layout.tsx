'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { signOut } from 'next-auth/react'
import {
    LayoutDashboard,
    Calendar,
    User,
    Clock,
    LogOut,
    Menu,
    X,
    Stethoscope,
    Settings,
    ChevronUp
} from 'lucide-react'

const navigation = [
    { label: 'Dashboard', href: '/dashboard/doctor', icon: LayoutDashboard },
    { label: 'My Appointments', href: '/dashboard/doctor/appointments', icon: Calendar },
    { label: 'My Schedule', href: '/dashboard/doctor/schedule', icon: Clock },
    { label: 'Profile', href: '/dashboard/doctor/profile', icon: User },
]

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession()
    const router = useRouter()
    const pathname = usePathname()
    const [sidebarOpen, setSidebarOpen] = useState(true) // Default to open on desktop
    const [profileMenuOpen, setProfileMenuOpen] = useState(false)
    const profileRef = useRef<HTMLDivElement>(null)

    // Restore sidebar state from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('doctor-sidebar-open')
        if (stored !== null) setSidebarOpen(stored === 'true')
    }, [])

    // Close profile menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const handleLogout = async () => {
        signOut({ callbackUrl: '/auth/login' })
    }

    const toggleSidebar = () => {
        const next = !sidebarOpen
        localStorage.setItem('doctor-sidebar-open', String(next))
        setSidebarOpen(next)
    }

    const userName = session?.user?.name || 'Doctor'
    const userEmail = session?.user?.email || ''
    const initials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} shrink-0 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}>
                <div className="flex flex-col h-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-center border-b border-gray-200 px-4">
                        <Link href="/dashboard/doctor" className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Stethoscope className="w-4 h-4 text-white" />
                            </div>
                            {sidebarOpen && (
                                <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent truncate">
                                    Doctor Panel
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
                        {navigation.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard/doctor' && pathname.startsWith(item.href))
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                                        ? 'bg-blue-50 text-blue-600 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <Icon size={20} className="flex-shrink-0" />
                                    {sidebarOpen && <span className="text-sm truncate">{item.label}</span>}
                                </Link>
                            )
                        })}
                    </nav>

                    {/* Profile Menu */}
                    <div ref={profileRef} className="relative border-t border-gray-200 px-2 py-3">
                        {/* Popup menu — renders above the button */}
                        {profileMenuOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                                {/* User info header */}
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                                    <p className="text-xs text-gray-500 truncate">{userEmail}</p>
                                    <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                        DOCTOR
                                    </span>
                                </div>

                                {/* Menu items */}
                                <div className="py-1">
                                    <Link
                                        href="/dashboard/doctor/account"
                                        onClick={() => setProfileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${pathname.includes('/account') ? 'bg-gray-50 font-semibold' : ''}`}
                                    >
                                        <Settings size={16} />
                                        Account Settings
                                    </Link>
                                    <div className="border-t border-gray-100 mt-1 pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Profile trigger button */}
                        <button
                            onClick={() => setProfileMenuOpen(v => !v)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-100 ${profileMenuOpen ? 'bg-gray-100' : ''}`}
                        >
                            {/* Avatar */}
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {initials || <User size={14} />}
                            </div>

                            {sidebarOpen && (
                                <>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                                        <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                                    </div>
                                    <ChevronUp
                                        size={15}
                                        className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${profileMenuOpen ? 'rotate-180' : ''}`}
                                    />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Desktop header - visible on all screens */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 shrink-0">
                    <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="ml-4 flex items-center gap-3">
                        <span className="text-sm text-gray-500">
                            Welcome back, <span className="font-semibold text-gray-900">{userName}</span>
                        </span>
                        <span className="text-xs font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                            Doctor
                        </span>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
