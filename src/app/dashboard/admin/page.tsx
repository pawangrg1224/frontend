'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
    Calendar, Clock, Users, Stethoscope, Activity,
    BarChart3, UserCog, Loader,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminStats {
    totalUsers: number
    totalAppointments: number
    pendingAppointments: number
    totalCustomers: number
    totalServices: number
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
    label, value, icon: Icon, bgColor, iconColor, sub,
}: {
    label: string
    value: number
    icon: React.ElementType
    bgColor: string
    iconColor: string
    sub: string
}) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 font-medium text-sm">{label}</p>
                <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
    const { data: session, status } = useSession()

    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalAppointments: 0,
        pendingAppointments: 0,
        totalCustomers: 0,
        totalServices: 0,
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    // Layout handles auth + admin guard — just load stats
    useEffect(() => {
        if (status !== 'authenticated') return

        const load = async () => {
            try {
                const [usersRes, apptRes, custRes, svcRes] = await Promise.all([
                    fetch('/api/admin/users/count'),
                    fetch('/api/admin/appointments/count'),
                    fetch('/api/admin/customers/count'),
                    fetch('/api/admin/services/count'),
                ])
                const [users, appt, cust, svc] = await Promise.all([
                    usersRes.json(), apptRes.json(), custRes.json(), svcRes.json(),
                ])
                setStats({
                    totalUsers: users.count ?? 0,
                    totalAppointments: appt.count ?? 0,
                    pendingAppointments: appt.pending ?? 0,
                    totalCustomers: cust.count ?? 0,
                    totalServices: svc.count ?? 0,
                })
            } catch {
                setError('Failed to load statistics')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [status, session])

    if (status === 'loading' || loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <Activity className="w-7 h-7 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Hospital Administration</h1>
                </div>
                <p className="text-gray-500 ml-10">System overview and hospital management</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 font-medium">{error}</p>
                </div>
            )}

            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <StatCard label="Staff Members" value={stats.totalUsers} icon={UserCog} bgColor="bg-blue-100" iconColor="text-blue-600" sub="Active staff" />
                <StatCard label="Appointments" value={stats.totalAppointments} icon={Calendar} bgColor="bg-green-100" iconColor="text-green-600" sub="Total scheduled" />
                <StatCard label="Pending" value={stats.pendingAppointments} icon={Clock} bgColor="bg-yellow-100" iconColor="text-yellow-600" sub="Awaiting confirmation" />
                <StatCard label="Patients" value={stats.totalCustomers} icon={Users} bgColor="bg-purple-100" iconColor="text-purple-600" sub="Registered patients" />
                <StatCard label="Departments" value={stats.totalServices} icon={Stethoscope} bgColor="bg-indigo-100" iconColor="text-indigo-600" sub="Active departments" />
            </div>

            {/* Quick-action cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    {
                        href: '/dashboard/admin/users',
                        icon: UserCog,
                        color: 'blue',
                        title: 'Staff Management',
                        desc: 'Manage doctors and hospital staff',
                        stat: `${stats.totalUsers} staff members`,
                    },
                    {
                        href: '/dashboard/admin/appointments',
                        icon: Calendar,
                        color: 'green',
                        title: 'Appointments',
                        desc: 'View and manage all appointments',
                        stat: `${stats.totalAppointments} scheduled`,
                    },
                    {
                        href: '/dashboard/admin/customers',
                        icon: Users,
                        color: 'purple',
                        title: 'Patients',
                        desc: 'Manage patient records',
                        stat: `${stats.totalCustomers} patients`,
                    },
                    {
                        href: '/dashboard/admin/services',
                        icon: Stethoscope,
                        color: 'indigo',
                        title: 'Departments',
                        desc: 'Manage hospital departments',
                        stat: `${stats.totalServices} departments`,
                    },
                    {
                        href: '/dashboard/admin/analytics',
                        icon: BarChart3,
                        color: 'teal',
                        title: 'Analytics',
                        desc: 'Reports and performance metrics',
                        stat: 'View reports',
                    },
                    {
                        href: '/dashboard/admin/availability',
                        icon: Activity,
                        color: 'orange',
                        title: 'Doctor Availability',
                        desc: 'Manage doctor schedules',
                        stat: 'Set schedules',
                    },
                ].map(({ href, icon: Icon, color, title, desc, stat }) => (
                    <Link
                        key={href}
                        href={href}
                        className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center group-hover:bg-${color}-200 transition-colors`}>
                                <Icon className={`w-6 h-6 text-${color}-600`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                                <p className="text-sm text-gray-500">{desc}</p>
                            </div>
                        </div>
                        <p className="text-sm font-medium text-gray-700">{stat}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
}
