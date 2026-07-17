'use client'

import { useRef, useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { Settings, LogOut, ShieldAlert, User, ChevronUp } from 'lucide-react'

interface ProfileMenuProps {
    name: string
    email: string
    role: string
    sidebarOpen: boolean
    pathname: string
}

export default function ProfileMenu({ name, email, role, sidebarOpen, pathname }: ProfileMenuProps) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    // Close on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    const initials = name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    return (
        <div ref={ref} className="relative">
            {/* Popup menu — renders above the button */}
            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                        <p className="text-xs text-gray-500 truncate">{email}</p>
                        <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${role === 'ADMIN' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                            {role}
                        </span>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                        {role === 'ADMIN' && (
                            <Link
                                href="/dashboard/admin"
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors ${pathname.startsWith('/dashboard/admin') ? 'bg-orange-50 font-semibold' : ''}`}
                            >
                                <ShieldAlert size={16} />
                                Admin Panel
                            </Link>
                        )}
                        <Link
                            href={role === 'ADMIN' ? '/dashboard/admin/settings' : role === 'DOCTOR' ? '/dashboard/doctor/settings' : '/dashboard/settings'}
                            onClick={() => setOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors ${pathname.includes('/settings') ? 'bg-gray-50 font-semibold' : ''}`}
                        >
                            <Settings size={16} />
                            Settings
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                            <button
                                onClick={() => signOut({ callbackUrl: '/' })}
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
                onClick={() => setOpen(v => !v)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:bg-gray-100 ${open ? 'bg-gray-100' : ''}`}
            >
                {/* Avatar */}
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {initials || <User size={14} />}
                </div>

                {sidebarOpen && (
                    <>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                            <p className="text-xs text-gray-400 truncate">{email}</p>
                        </div>
                        <ChevronUp
                            size={15}
                            className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                        />
                    </>
                )}
            </button>
        </div>
    )
}
