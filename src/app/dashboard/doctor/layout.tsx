'use client'

import SidebarLayout from '@/components/dashboard/SidebarLayout'
import { Calendar, Clock, Users, Stethoscope, LayoutDashboard, Settings } from 'lucide-react'

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarLayout
            config={{
                role: 'doctor',
                logoLabel: 'MediBook',
                logoGradient: 'from-blue-600 to-teal-500',
                logoIcon: Stethoscope,
                storageKey: 'doctor_sidebar_open',
                homeHref: '/dashboard/doctor',
                allowlist: [
                    '/dashboard/doctor',
                    '/dashboard/services',
                    '/dashboard/settings',
                ],
                nav: [
                    { label: 'Dashboard', href: '/dashboard/doctor', icon: LayoutDashboard },
                    { label: 'Appointments', href: '/dashboard/doctor/appointments', icon: Calendar },
                    { label: 'Patients', href: '/dashboard/doctor/patients', icon: Users },
                    { label: 'My Slots', href: '/dashboard/doctor/slots', icon: Clock },
                    { label: 'Departments', href: '/dashboard/services', icon: Stethoscope, expandable: true },
                    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
                ],
            }}
        >
            {children}
        </SidebarLayout>
    )
}
