'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Calendar,
    Loader,
    Clock,
    User,
    Phone,
    Mail,
    FileText,
    CheckCircle,
    XCircle,
    Search,
    X
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

interface Appointment {
    id: string
    date: string
    status: string
    notes?: string
    tokenNumber?: number
    customer: { id: string; name: string; email: string; phone?: string }
    service: { id: string; name: string }
    slot?: { id: string; doctorName: string; slotLimit: number } | null
}

const STATUS_COLORS = {
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-700 border-green-200',
    COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
    CANCELLED: 'bg-red-100 text-red-700 border-red-200',
}

export default function DoctorAppointmentsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('ALL')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchAppointments()
        }
    }, [status])

    const fetchAppointments = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/doctor/appointments')
            if (res.ok) {
                const data = await res.json()
                setAppointments(data.data || [])
            } else {
                toast.error('Failed to load appointments')
            }
        } catch (error) {
            toast.error('Failed to load appointments')
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/appointments/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (res.ok) {
                setAppointments(prev =>
                    prev.map(apt => (apt.id === id ? { ...apt, status: newStatus } : apt))
                )
                toast.success(`Appointment marked as ${newStatus.toLowerCase()}`)
            } else {
                toast.error('Failed to update appointment')
            }
        } catch (error) {
            toast.error('Failed to update appointment')
        }
    }

    // Filter appointments
    const filteredAppointments = appointments.filter(apt => {
        const matchesSearch =
            !searchQuery ||
            apt.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            apt.service.name.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter

        return matchesSearch && matchesStatus
    })

    // Separate today, upcoming, and past appointments
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const todayAppointments = filteredAppointments.filter(apt => {
        const date = new Date(apt.date)
        return date >= todayStart && date < todayEnd
    })

    const upcomingAppointments = filteredAppointments.filter(apt => {
        const date = new Date(apt.date)
        return date >= todayEnd
    })

    const pastAppointments = filteredAppointments.filter(apt => {
        const date = new Date(apt.date)
        return date < todayStart
    })

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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">My Appointments</h1>
                <p className="text-gray-600">Manage and track your patient appointments</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by patient name, phone, or service..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                    >
                        <option value="ALL">All Status</option>
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                </div>
            </div>

            {/* Appointments Sections */}
            <div className="space-y-8">
                {/* Today's Appointments */}
                {todayAppointments.length > 0 && (
                    <AppointmentSection
                        title="Today's Appointments"
                        appointments={todayAppointments}
                        onStatusUpdate={handleStatusUpdate}
                        badge={todayAppointments.length}
                        badgeColor="bg-blue-100 text-blue-700"
                    />
                )}

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                    <AppointmentSection
                        title="Upcoming Appointments"
                        appointments={upcomingAppointments}
                        onStatusUpdate={handleStatusUpdate}
                        badge={upcomingAppointments.length}
                        badgeColor="bg-green-100 text-green-700"
                    />
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                    <AppointmentSection
                        title="Past Appointments"
                        appointments={pastAppointments}
                        onStatusUpdate={handleStatusUpdate}
                        badge={pastAppointments.length}
                        badgeColor="bg-gray-100 text-gray-700"
                    />
                )}

                {filteredAppointments.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 text-lg">No appointments found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

function AppointmentSection({
    title,
    appointments,
    onStatusUpdate,
    badge,
    badgeColor,
}: {
    title: string
    appointments: Appointment[]
    onStatusUpdate: (id: string, status: string) => void
    badge: number
    badgeColor: string
}) {
    return (
        <div>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>
                    {badge}
                </span>
            </div>

            <div className="grid gap-4">
                {appointments.map((apt) => (
                    <div
                        key={apt.id}
                        className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            {/* Left: Patient Info */}
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    {apt.tokenNumber && (
                                        <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-sm font-bold">
                                            Token #{apt.tokenNumber}
                                        </span>
                                    )}
                                    <span
                                        className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[apt.status as keyof typeof STATUS_COLORS] ||
                                            'bg-gray-100 text-gray-700'
                                            }`}
                                    >
                                        {apt.status}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <User size={18} className="text-gray-400" />
                                        <span className="font-semibold text-lg">{apt.customer.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Mail size={16} className="text-gray-400" />
                                        <span className="text-sm">{apt.customer.email}</span>
                                    </div>

                                    {apt.customer.phone && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Phone size={16} className="text-gray-400" />
                                            <span className="text-sm">{apt.customer.phone}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-gray-700 mt-3">
                                        <FileText size={16} className="text-blue-600" />
                                        <span className="font-medium">{apt.service.name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Clock size={16} className="text-gray-400" />
                                        <span className="text-sm">
                                            {new Date(apt.date).toLocaleString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true,
                                            })}
                                        </span>
                                    </div>

                                    {apt.notes && (
                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-700 font-medium mb-1">Notes:</p>
                                            <p className="text-sm text-gray-600">{apt.notes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Actions */}
                            {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                                <div className="flex lg:flex-col gap-2">
                                    {apt.status !== 'COMPLETED' && (
                                        <button
                                            onClick={() => onStatusUpdate(apt.id, 'COMPLETED')}
                                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                        >
                                            <CheckCircle size={16} />
                                            Complete
                                        </button>
                                    )}
                                    {apt.status !== 'CANCELLED' && (
                                        <button
                                            onClick={() => onStatusUpdate(apt.id, 'CANCELLED')}
                                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                        >
                                            <XCircle size={16} />
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
