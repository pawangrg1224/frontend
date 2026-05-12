'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Loader, XCircle, Clock, CheckCircle, CheckCheck, Plus, Stethoscope, User, MapPin } from 'lucide-react'
import { toast } from 'sonner'

interface Appointment {
    id: string
    date: string
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    notes?: string
    tokenNumber?: number | null
    service: { id: string; name: string; price: number }
    slot?: { doctorName: string; slotDate: string; slotLimit: number } | null
    customer: { name: string; email: string; phone: string }
}

const STATUS_CONFIG = {
    PENDING: {
        label: 'Pending',
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        icon: Clock,
        dotColor: 'bg-yellow-500',
    },
    CONFIRMED: {
        label: 'Confirmed',
        color: 'bg-green-50 text-green-700 border-green-200',
        icon: CheckCircle,
        dotColor: 'bg-green-500',
    },
    CANCELLED: {
        label: 'Cancelled',
        color: 'bg-red-50 text-red-700 border-red-200',
        icon: XCircle,
        dotColor: 'bg-red-500',
    },
    COMPLETED: {
        label: 'Completed',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: CheckCheck,
        dotColor: 'bg-blue-500',
    },
}

function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

function formatTime(dateString: string): string {
    const date = new Date(dateString)
    const startHour = date.getHours()
    const endHour = startHour + 1

    const startAmpm = startHour >= 12 ? 'PM' : 'AM'
    const startH12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour

    const endAmpm = endHour >= 12 ? 'PM' : 'AM'
    const endH12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour

    if (startAmpm === endAmpm) {
        return `${startH12}:00 to ${endH12}:00 ${endAmpm}`
    } else {
        return `${startH12}:00 ${startAmpm} to ${endH12}:00 ${endAmpm}`
    }
}

export default function MyAppointmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<string | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (status !== 'authenticated') return
        fetch('/api/appointments?limit=50')
            .then(r => r.json())
            .then(d => setAppointments(d.data || []))
            .catch(() => toast.error('Failed to load appointments'))
            .finally(() => setLoading(false))
    }, [status])

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this appointment?')) return
        setCancelling(id)
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' }),
            })
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a))
                toast.success('Appointment cancelled successfully')
            } else {
                const d = await res.json()
                toast.error(d.message || 'Failed to cancel appointment')
            }
        } catch {
            toast.error('Failed to cancel appointment')
        } finally {
            setCancelling(null)
        }
    }

    if (status === 'loading' || loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )

    const upcoming = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED')
    const past = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED')

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 mb-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">My Appointments</h1>
                        <p className="text-blue-100">Welcome back, {session?.user?.name || 'User'}</p>
                    </div>
                    <Link
                        href="/dashboard/user/open-slots"
                        className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 font-semibold transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        Book Appointment
                    </Link>
                </div>
            </div>

            {appointments.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Calendar className="w-10 h-10 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Appointments Yet</h2>
                    <p className="text-gray-500 mb-6">Book your first appointment to get started</p>
                    <Link
                        href="/dashboard/user/open-slots"
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-semibold transition-colors"
                    >
                        <Plus size={20} />
                        Book Your First Appointment
                    </Link>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming Appointments */}
                    {upcoming.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-900">Upcoming Appointments</h2>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                                    {upcoming.length}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {upcoming.map(apt => {
                                    const statusConfig = STATUS_CONFIG[apt.status]
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <div
                                            key={apt.id}
                                            className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all relative"
                                        >
                                            {/* Token Number - Center Top */}
                                            {apt.tokenNumber && apt.status === 'CONFIRMED' && (
                                                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                                    <div className="bg-blue-600 text-white px-6 py-2 rounded-full shadow-lg">
                                                        <span className="text-sm font-bold">Token #{apt.tokenNumber}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className={`flex items-start justify-between gap-4 ${apt.tokenNumber && apt.status === 'CONFIRMED' ? 'mt-4' : ''}`}>
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Stethoscope className="w-7 h-7 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                                            {apt.service.name}
                                                        </h3>
                                                        {apt.slot && (
                                                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                                                <User size={16} />
                                                                <span className="font-medium">Dr. {apt.slot.doctorName}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} className="text-blue-600" />
                                                                <span>{formatDate(apt.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={16} className="text-blue-600" />
                                                                <span>{formatTime(apt.date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-3">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-sm ${statusConfig.color}`}>
                                                        <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></span>
                                                        {statusConfig.label}
                                                    </span>
                                                    {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                                        <button
                                                            onClick={() => handleCancel(apt.id)}
                                                            disabled={cancelling === apt.id}
                                                            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-semibold disabled:opacity-50 transition-colors"
                                                        >
                                                            {cancelling === apt.id ? (
                                                                <Loader size={16} className="animate-spin" />
                                                            ) : (
                                                                <XCircle size={16} />
                                                            )}
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {apt.notes && (
                                                <div className="mt-4 pt-4 border-t border-gray-100">
                                                    <p className="text-sm text-gray-600 font-medium mb-1">Problem Description:</p>
                                                    <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{apt.notes}</p>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <div className="text-sm text-gray-500">
                                                    Booking Fee: <span className="font-bold text-gray-900">Rs. {apt.service.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Past Appointments */}
                    {past.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-1 h-6 bg-gray-400 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-900">Past Appointments</h2>
                                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                                    {past.length}
                                </span>
                            </div>
                            <div className="grid gap-4">
                                {past.map(apt => {
                                    const statusConfig = STATUS_CONFIG[apt.status]
                                    const StatusIcon = statusConfig.icon

                                    return (
                                        <div
                                            key={apt.id}
                                            className="bg-white border border-gray-100 rounded-2xl p-6 opacity-75"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <Stethoscope className="w-7 h-7 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-700 mb-1">
                                                            {apt.service.name}
                                                        </h3>
                                                        {apt.slot && (
                                                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                                                <User size={16} />
                                                                <span className="font-medium">Dr. {apt.slot.doctorName}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={16} />
                                                                <span>{formatDate(apt.date)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <Clock size={16} />
                                                                <span>{formatTime(apt.date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-semibold text-sm ${statusConfig.color}`}>
                                                    <span className={`w-2 h-2 rounded-full ${statusConfig.dotColor}`}></span>
                                                    {statusConfig.label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
