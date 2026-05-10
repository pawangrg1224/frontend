'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Calendar, Clock, Users, Stethoscope, ChevronRight, Loader } from 'lucide-react'

interface DoctorStats {
    totalAppointments: number
    pendingAppointments: number
    distinctPatients: number
}

function StatCard({ label, value, icon: Icon, bgColor, iconColor, sub }: {
    label: string; value: number; icon: React.ElementType
    bgColor: string; iconColor: string; sub: string
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

export default function DoctorHomePage() {
    const { data: session } = useSession()
    const [stats, setStats] = useState<DoctorStats>({ totalAppointments: 0, pendingAppointments: 0, distinctPatients: 0 })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/dashboard/doctor-stats')
            .then(r => r.ok ? r.json() : Promise.reject())
            .then(setStats)
            .catch(() => setError('Failed to load statistics'))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="flex items-center justify-center py-20"><Loader className="w-8 h-8 animate-spin text-blue-600" /></div>

    return (
        <div className="p-6">
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <Stethoscope className="w-7 h-7 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Doctor Dashboard</h1>
                </div>
                <p className="text-gray-500 ml-10">Welcome back, Dr. {session?.user?.name}</p>
            </div>

            {error && <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg"><p className="text-amber-700 font-medium">{error}</p></div>}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Appointments" value={stats.totalAppointments} icon={Calendar} bgColor="bg-blue-100" iconColor="text-blue-600" sub="All time" />
                <StatCard label="Pending" value={stats.pendingAppointments} icon={Clock} bgColor="bg-yellow-100" iconColor="text-yellow-600" sub="Awaiting confirmation" />
                <StatCard label="Distinct Patients" value={stats.distinctPatients} icon={Users} bgColor="bg-green-100" iconColor="text-green-600" sub="Unique patients seen" />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
                <div className="space-y-2">
                    {[
                        { label: 'View my appointments', href: '/dashboard/doctor/appointments', icon: Calendar },
                        { label: 'Manage patients', href: '/dashboard/doctor/patients', icon: Users },
                        { label: 'My appointment slots', href: '/dashboard/doctor/slots', icon: Clock },
                    ].map(({ label, href, icon: Icon }) => (
                        <Link key={href} href={href} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                                <Icon size={16} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">{label}</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-400" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
