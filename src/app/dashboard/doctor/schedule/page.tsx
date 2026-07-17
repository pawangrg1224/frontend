'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calendar, Loader, Clock, Users } from 'lucide-react'
import { toast, Toaster } from 'sonner'

interface DaySchedule {
    date: string
    appointments: {
        id: string
        time: string
        customer: string
        service: string
        status: string
        tokenNumber?: number
    }[]
}

export default function DoctorSchedulePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [schedule, setSchedule] = useState<DaySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedWeek, setSelectedWeek] = useState(0) // 0 = current week

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchSchedule()
        }
    }, [status, selectedWeek])

    const fetchSchedule = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/doctor/appointments')
            if (res.ok) {
                const data = await res.json()
                const appointments = data.data || []

                // Group appointments by date
                const grouped = groupAppointmentsByDate(appointments)
                setSchedule(grouped)
            } else {
                toast.error('Failed to load schedule')
            }
        } catch (error) {
            toast.error('Failed to load schedule')
        } finally {
            setLoading(false)
        }
    }

    const groupAppointmentsByDate = (appointments: any[]) => {
        const groups: { [key: string]: any[] } = {}

        appointments.forEach(apt => {
            const date = new Date(apt.date).toDateString()
            if (!groups[date]) {
                groups[date] = []
            }
            groups[date].push({
                id: apt.id,
                time: new Date(apt.date).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                }),
                customer: apt.customer.name,
                service: apt.service.name,
                status: apt.status,
                tokenNumber: apt.tokenNumber,
            })
        })

        // Convert to array and sort by date
        return Object.entries(groups)
            .map(([date, appointments]) => ({
                date,
                appointments: appointments.sort((a, b) => a.time.localeCompare(b.time)),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Schedule</h1>
                <p className="text-gray-600">View your appointment schedule</p>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl border border-gray-200 p-4">
                <button
                    onClick={() => setSelectedWeek(prev => prev - 1)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                    ← Previous Week
                </button>
                <span className="text-gray-700 font-medium">
                    {selectedWeek === 0 ? 'Current Week' : `${Math.abs(selectedWeek)} week${Math.abs(selectedWeek) > 1 ? 's' : ''} ${selectedWeek > 0 ? 'ahead' : 'ago'}`}
                </span>
                <button
                    onClick={() => setSelectedWeek(prev => prev + 1)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                >
                    Next Week →
                </button>
            </div>

            {/* Schedule */}
            {schedule.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No appointments scheduled</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {schedule.map((day) => (
                        <div
                            key={day.date}
                            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
                        >
                            {/* Date Header */}
                            <div className="bg-gradient-to-r from-blue-600 to-teal-600 px-6 py-4">
                                <div className="flex items-center justify-between text-white">
                                    <div className="flex items-center gap-3">
                                        <Calendar size={20} />
                                        <h2 className="text-lg font-bold">
                                            {new Date(day.date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                month: 'long',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={18} />
                                        <span className="font-semibold">{day.appointments.length} appointments</span>
                                    </div>
                                </div>
                            </div>

                            {/* Appointments List */}
                            <div className="divide-y divide-gray-200">
                                {day.appointments.map((apt) => (
                                    <div
                                        key={apt.id}
                                        className="px-6 py-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 text-gray-600 min-w-[100px]">
                                                    <Clock size={16} />
                                                    <span className="font-medium">{apt.time}</span>
                                                </div>
                                                {apt.tokenNumber && (
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                                                        #{apt.tokenNumber}
                                                    </span>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-900">{apt.customer}</p>
                                                    <p className="text-sm text-gray-600">{apt.service}</p>
                                                </div>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${apt.status === 'CONFIRMED'
                                                        ? 'bg-green-100 text-green-700'
                                                        : apt.status === 'PENDING'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : apt.status === 'COMPLETED'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                {apt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
