'use client'

import SidebarLayout from '@/components/dashboard/SidebarLayout'
import { Calendar, Clock, Stethoscope, LayoutDashboard, Settings } from 'lucide-react'
import { Toaster } from 'sonner'

export default function UserLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Toaster position="top-right" richColors />
            <SidebarLayout
                config={{
                    role: 'user',
                    logoLabel: 'MediBook',
                    logoGradient: 'from-blue-600 to-teal-500',
                    logoIcon: Stethoscope,
                    storageKey: 'user_sidebar_open',
                    homeHref: '/dashboard/user',
                    allowlist: [
                        '/dashboard/user',
                        '/dashboard/services',
                        '/dashboard/settings',
                    ],
                    nav: [
                        { label: 'Dashboard', href: '/dashboard/user', icon: LayoutDashboard },
                        { label: 'My Appointments', href: '/dashboard/user/my-appointments', icon: Calendar },
                        { label: 'Open Slots', href: '/dashboard/user/open-slots', icon: Clock },
                        { label: 'Departments', href: '/dashboard/services', icon: Stethoscope, expandable: true },
                        { label: 'Settings', href: '/dashboard/settings', icon: Settings },
                    ],
                }}
            >
                {children}
            </SidebarLayout>
        </>
    )
}
