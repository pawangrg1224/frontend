'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    ArrowLeft, Loader, Calendar, Clock, User, Mail, Phone,
    CheckCircle, XCircle, AlertCircle, Users, TrendingUp,
} from 'lucide-react'

interface Customer {
    id: string
    name: string
    email: string
    phone: string
}

interface Patient {
    id: string
    fullName: string
    email: string
}

interface Appointment {
    id: string
    date: string
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
    notes: string | null
    tokenNumber: number | null
    customer: Customer
    patient: Patient | null
    createdAt: string
}

interface Service {
    id: string
    name: string
    duration: number
    price: number
}

interface SlotDetails {
    id: string
    doctorName: string
    slotDate: string
    slotLimit: number
    isOpen: boolean
    service: Service
    appointments: Appointment[]
    bookedCount: number
    pendingCount: number
    availableCount: number
    isFull: boolean
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

function formatTimeRange(dateString: string): string {
    const date = new Date(dateString)
    const startHour = date.getHours()
    const endHour = startHour + 1

    const startAmpm = startHour >= 12 ? 'pm' : 'am'
    const startH12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour

    const endAmpm = endHour >= 12 ? 'pm' : 'am'
    const endH12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour

    if (startAmpm === endAmpm) {
        return `${startH12} to ${endH12}${endAmpm}`
    } else {
        return `${startH12}${startAmpm} to ${endH12}${endAmpm}`
    }
}

function extractProblem(notes?: string | null): string {
    if (!notes) return 'No problem description'
    const problemMatch = notes.match(/Problem:\s*(.+)/i)
    return problemMatch ? problemMatch[1].trim() : notes
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'CONFIRMED':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    <CheckCircle size={12} />
                    Confirmed
                </span>
            )
        case 'PENDING':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    <AlertCircle size={12} />
                    Pending
                </span>
            )
        case 'COMPLETED':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    <CheckCircle size={12} />
                    Completed
                </span>
            )
        case 'CANCELLED':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    <XCircle size={12} />
                    Cancelled
                </span>
            )
        default:
            return (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {status}
                </span>
            )
    }
}

export default function SlotDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { status } = useSession()
    const deptName = params.deptname as string
    const slotId = params.slotid as string

    const [slot, setSlot] = useState<SlotDetails | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated' && slotId) {
            fetchSlotDetails()
        }
    }, [status, slotId])

    const fetchSlotDetails = async () => {
        setIsLoading(true)
        setError('')
        try {
            console.log('Fetching slot details for slotId:', slotId)
            const res = await fetch(`/api/slots/${slotId}`)
            console.log('Response status:', res.status)

            if (!res.ok) {
                const errorData = await res.json()
                console.error('Error response:', errorData)
                throw new Error(errorData.message || 'Failed to fetch slot details')
            }

            const data = await res.json()
            console.log('Slot data received:', data)
            setSlot(data)
        } catch (err) {
            console.error('Fetch error:', err)
            setError(err instanceof Error ? err.message : 'Failed to load slot details')
        } finally {
            setIsLoading(false)
        }
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !slot) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 font-medium">{error || 'Slot not found'}</p>
                </div>
            </div>
        )
    }

    const confirmedAppointments = slot.appointments.filter(
        (a) => a.status === 'CONFIRMED' || a.status === 'COMPLETED'
    )
    const pendingAppointments = slot.appointments.filter((a) => a.status === 'PENDING')

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <button
                    onClick={() => router.push(`/dashboard/admin/slots/${slot.service.id}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to {slot.service.name} Slots</span>
                </button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Slot Details
                        </h1>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-700">
                                <User size={16} className="text-blue-600" />
                                <span className="font-semibold">Dr. {slot.doctorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Calendar size={16} className="text-blue-600" />
                                <span>{formatDate(slot.slotDate)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <Clock size={16} className="text-blue-600" />
                                <span>{formatTimeRange(slot.slotDate)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-3">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-xs font-medium text-green-700">Booked</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900">{slot.bookedCount}</p>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <AlertCircle size={16} className="text-yellow-600" />
                                <span className="text-xs font-medium text-yellow-700">Pending</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900">{slot.pendingCount}</p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp size={16} className="text-blue-600" />
                                <span className="text-xs font-medium text-blue-700">Available</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">
                                {slot.availableCount} / {slot.slotLimit}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Info */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 mb-1">Department</p>
                        <p className="text-lg font-bold text-gray-900">{slot.service.name}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-600 mb-1">Booking Fee</p>
                        <p className="text-lg font-bold text-gray-900">Rs. {slot.service.price}</p>
                    </div>
                </div>
            </div>

            {/* Appointments List */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-blue-600" />
                    Booked Patients ({slot.appointments.length})
                </h2>

                {slot.appointments.length === 0 ? (
                    <div className="text-center py-16">
                        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-semibold text-lg">No bookings yet</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {slot.availableCount} slot{slot.availableCount !== 1 ? 's' : ''} available
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Confirmed/Completed Appointments */}
                        {confirmedAppointments.length > 0 && (
                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-600" />
                                    Confirmed Bookings ({confirmedAppointments.length})
                                </h3>
                                <div className="space-y-3">
                                    {confirmedAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                                                        <User className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg mb-1">
                                                            {appointment.patient?.fullName || appointment.customer.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3">
                                                            <p className="text-sm text-gray-500">
                                                                Booked on {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                })}
                                                            </p>
                                                            {appointment.tokenNumber && (
                                                                <span className="text-sm font-bold text-blue-600">
                                                                    Token: #{appointment.tokenNumber}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                {getStatusBadge(appointment.status)}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Mail size={16} className="text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {appointment.patient?.email || appointment.customer.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Phone size={16} className="text-gray-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                                        <p className="text-sm font-medium text-gray-900">{appointment.customer.phone}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {appointment.notes && (
                                                <div className="pt-4 border-t border-gray-100">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Problem Description</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{extractProblem(appointment.notes)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Appointments */}
                        {pendingAppointments.length > 0 && (
                            <div>
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-yellow-600" />
                                    Pending Requests ({pendingAppointments.length})
                                </h3>
                                <div className="space-y-3">
                                    {pendingAppointments.map((appointment) => (
                                        <div
                                            key={appointment.id}
                                            className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                                                        <User className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 text-lg mb-1">
                                                            {appointment.patient?.fullName || appointment.customer.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            Requested on {new Date(appointment.createdAt).toLocaleDateString('en-US', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>
                                                {getStatusBadge(appointment.status)}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                        <Mail size={16} className="text-yellow-700" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Email</p>
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {appointment.patient?.email || appointment.customer.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                        <Phone size={16} className="text-yellow-700" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                                                        <p className="text-sm font-medium text-gray-900">{appointment.customer.phone}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {appointment.notes && (
                                                <div className="pt-4 border-t border-yellow-200">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2">Problem Description</p>
                                                    <p className="text-sm text-gray-700 leading-relaxed">{extractProblem(appointment.notes)}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
