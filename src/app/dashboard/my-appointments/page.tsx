'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Loader, XCircle, Clock, CheckCircle, CheckCheck, Plus, Stethoscope } from 'lucide-react'

interface Appointment {
    id: string
    date: string
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    notes?: string
    service: { id: string; name: string }
    slot?: { doctorName: string; slotDate: string; slotLimit: number } | null
    customer: { name: string; email: string; phone: string }
}

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100   text-blue-800',
    CANCELLED: 'bg-red-100    text-red-800',
    COMPLETED: 'bg-green-100  text-green-800',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock size={12} />,
    CONFIRMED: <CheckCircle size={12} />,
    CANCELLED: <XCircle size={12} />,
    COMPLETED: <CheckCheck size={12} />,
}

export default function MyAppointmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [cancelling, setCancelling] = useState<string | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (status !== 'authenticated') return
        fetch('/api/appointments?limit=50')
            .then(r => r.json())
            .then(d => setAppointments(d.data || []))
            .finally(() => setLoading(false))
    }, [status])

    const handleCancel = async (id: string) => {
        if (!confirm('Cancel this appointment?')) return
        setCancelling(id)
        try {
            const res = await fetch(`/api/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'CANCELLED' }),
            })
            if (res.ok) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a))
            } else {
                const d = await res.json()
                setError(d.message || 'Failed to cancel')
            }
        } finally { setCancelling(null) }
    }

    if (status === 'loading' || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )

    const active = appointments.filter(a => a.status === 'PENDING' || a.status === 'CONFIRMED')
    const past = appointments.filter(a => a.status === 'COMPLETED' || a.status === 'CANCELLED')

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Welcome, {session?.user?.name}</p>
                </div>
                <Link href="/booking"
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
                    <Plus size={16} /> Book New
                </Link>
            </div>

            <div className="max-w-3xl mx-auto p-6 space-y-6">
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}

                {appointments.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No appointments yet</p>
                        <p className="text-gray-400 text-sm mt-1">Book your first appointment to get started</p>
                        <Link href="/booking"
                            className="mt-4 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
                            <Plus size={16} /> Book Appointment
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Active */}
                        {active.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Upcoming</h2>
                                <div className="space-y-3">
                                    {active.map(apt => (
                                        <div key={apt.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-sm transition-shadow">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Stethoscope className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{apt.service.name}</p>
                                                        {apt.slot && (
                                                            <p className="text-sm text-gray-600 mt-0.5">{apt.slot.doctorName}</p>
                                                        )}
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                                            <Calendar size={11} />
                                                            {new Date(apt.date).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[apt.status]}`}>
                                                        {STATUS_ICONS[apt.status]} {apt.status}
                                                    </span>
                                                    {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                                        <button onClick={() => handleCancel(apt.id)} disabled={cancelling === apt.id}
                                                            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50">
                                                            {cancelling === apt.id ? <Loader size={11} className="animate-spin" /> : <XCircle size={11} />}
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {apt.notes && (
                                                <p className="mt-3 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">{apt.notes}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Past */}
                        {past.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Past</h2>
                                <div className="space-y-3">
                                    {past.map(apt => (
                                        <div key={apt.id} className="bg-white border border-gray-100 rounded-xl p-5 opacity-75">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                                                        <Stethoscope className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-700">{apt.service.name}</p>
                                                        {apt.slot && <p className="text-sm text-gray-500 mt-0.5">{apt.slot.doctorName}</p>}
                                                        <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                                                            <Calendar size={11} />
                                                            {new Date(apt.date).toLocaleDateString(undefined, {
                                                                weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[apt.status]}`}>
                                                    {STATUS_ICONS[apt.status]} {apt.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
