'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Calendar,
    Users,
    Clock,
    CheckCircle,
    TrendingUp,
    Loader,
    ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'

interface Stats {
    totalAppointments: number
    todayAppointments: number
    pendingAppointments: number
    completedAppointments: number
}

interface Appointment {
    id: string
    date: string
    status: string
    tokenNumber?: number
    customer: { name: string; phone?: string }
    service: { name: string }
}

export default function DoctorDashboard() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [stats, setStats] = useState<Stats>({
        totalAppointments: 0,
        todayAppointments: 0,
        pendingAppointments: 0,
        completedAppointments: 0,
    })
    const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchDashboardData()
        }
    }, [status])

    const fetchDashboardData = async () => {
        try {
            const [statsRes, appointmentsRes] = await Promise.all([
                fetch('/api/doctor/stats'),
                fetch('/api/doctor/appointments?filter=today'),
            ])

            if (statsRes.ok) {
                const statsData = await statsRes.json()
                setStats(statsData)
            }

            if (appointmentsRes.ok) {
                const appointmentsData = await appointmentsRes.json()
                setTodayAppointments(appointmentsData.data || [])
            }
        } catch (error) {
            toast.error('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const statCards = [
        {
            title: 'Total Appointments',
            value: stats.totalAppointments,
            icon: Calendar,
            color: 'bg-blue-500',
            bgColor: 'bg-blue-50',
        },
        {
            title: 'Today\'s Appointments',
            value: stats.todayAppointments,
            icon: Clock,
            color: 'bg-purple-500',
            bgColor: 'bg-purple-50',
        },
        {
            title: 'Pending',
            value: stats.pendingAppointments,
            icon: Users,
            color: 'bg-orange-500',
            bgColor: 'bg-orange-50',
        },
        {
            title: 'Completed',
            value: stats.completedAppointments,
            icon: CheckCircle,
            color: 'bg-green-500',
            bgColor: 'bg-green-50',
        },
    ]

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, Dr. {session?.user?.name || 'Doctor'}
                </h1>
                <p className="text-gray-600">Here's your appointment overview for today</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div
                            key={stat.title}
                            className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                                    <Icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                                </div>
                                <TrendingUp className="w-5 h-5 text-green-500" />
                            </div>
                            <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
                            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Today's Appointments */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Today's Appointments</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''} scheduled
                        </p>
                    </div>
                    <Link
                        href="/dashboard/doctor/appointments"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                        View All
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {todayAppointments.length === 0 ? (
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No appointments scheduled for today</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {todayAppointments.slice(0, 5).map((apt) => (
                            <div key={apt.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {apt.tokenNumber && (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                                    #{apt.tokenNumber}
                                                </span>
                                            )}
                                            <h3 className="font-semibold text-gray-900">{apt.customer.name}</h3>
                                        </div>
                                        <p className="text-sm text-gray-600">{apt.service.name}</p>
                                        {apt.customer.phone && (
                                            <p className="text-sm text-gray-500 mt-1">{apt.customer.phone}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-gray-900">
                                            {new Date(apt.date).toLocaleTimeString('en-US', {
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                            })}
                                        </p>
                                        <span
                                            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'CONFIRMED'
                                                    ? 'bg-green-100 text-green-700'
                                                    : apt.status === 'PENDING'
                                                        ? 'bg-yellow-100 text-yellow-700'
                                                        : 'bg-gray-100 text-gray-700'
                                                }`}
                                        >
                                            {apt.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Link
                    href="/dashboard/doctor/appointments"
                    className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow"
                >
                    <Calendar className="w-8 h-8 mb-3" />
                    <h3 className="text-lg font-bold mb-2">View All Appointments</h3>
                    <p className="text-blue-100 text-sm">Manage your appointment schedule</p>
                </Link>

                <Link
                    href="/dashboard/doctor/profile"
                    className="bg-gradient-to-r from-teal-600 to-teal-700 rounded-2xl p-6 text-white hover:shadow-lg transition-shadow"
                >
                    <Users className="w-8 h-8 mb-3" />
                    <h3 className="text-lg font-bold mb-2">Update Profile</h3>
                    <p className="text-teal-100 text-sm">Manage your professional information</p>
                </Link>
            </div>
        </div>
    )
}
