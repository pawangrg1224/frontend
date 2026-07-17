'use client'

import SidebarLayout from '@/components/dashboard/SidebarLayout'
import {
    Calendar, Clock, Users, Stethoscope,
    LayoutDashboard, BarChart3, UserCog, Activity, Bell, Settings, ShieldCheck,
} from 'lucide-react'
import { Toaster } from 'sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Toaster position="bottom-right" richColors />
            <SidebarLayout
                config={{
                    role: 'admin',
                    logoLabel: 'Admin Panel',
                    logoGradient: 'from-blue-600 to-indigo-600',
                    logoIcon: ShieldCheck,
                    topBarBadge: 'Admin',
                    storageKey: 'admin_sidebar_open',
                    homeHref: '/dashboard/admin',
                    requireRole: 'ADMIN',
                    allowlist: ['/dashboard/admin'],
                    nav: [
                        { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
                        { label: 'Appointments', href: '/dashboard/admin/appointments', icon: Calendar },
                        { label: 'Patients', href: '/dashboard/admin/patients', icon: Users },
                        { label: 'Doctors', href: '/dashboard/admin/doctors', icon: UserCog },
                        { label: 'Departments', href: '/dashboard/admin/services', icon: Stethoscope },
                        { label: 'Slots', href: '/dashboard/admin/slots', icon: Clock },
                        { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
                        { label: 'Notifications', href: '/dashboard/admin/notifications', icon: Bell },
                        { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
                    ],
                }}
            >
                {children}
            </SidebarLayout>
        </>
    )
}
