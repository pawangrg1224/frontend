'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
    ChevronLeft, Loader, Calendar, Clock, DollarSign,
    CheckCircle, X, CalendarDays, Users, AlertCircle,
    Stethoscope,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorInfo {
    id: string
    fullName: string
    email: string | null
    specialization: string | null
}

interface ServiceInfo {
    id: string
    name: string
    duration: number
    price: number
    description?: string
}

interface SlotInfo {
    id: string
    slotDate: string
    slotLimit: number
    bookedCount: number
    remainingCapacity: number
    isFull: boolean
}

interface Customer {
    id: string
    name: string
    email: string
}

// ─── Avatar helper ────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-rose-500',
    'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-pink-500',
]

function getAvatarColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('')
}

function formatSlotDate(iso: string): { date: string; weekday: string; time: string } {
    const d = new Date(iso)
    const hour = d.getHours()
    const nextHour = hour + 1

    // Format start time
    const startAmpm = hour >= 12 ? 'pm' : 'am'
    const startH12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour

    // Format end time
    const endAmpm = nextHour >= 12 ? 'pm' : 'am'
    const endH12 = nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour

    // Show range like "8 to 9" or "8pm to 9pm"
    let timeRange: string
    if (startAmpm === endAmpm) {
        // Same period, show AM/PM only once: "8 to 9pm"
        timeRange = `${startH12} to ${endH12}${endAmpm}`
    } else {
        // Different periods, show both: "11am to 12pm"
        timeRange = `${startH12}${startAmpm} to ${endH12}${endAmpm}`
    }

    return {
        date: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        time: timeRange,
    }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DoctorDetailPage() {
    const { id: serviceId, userId } = useParams<{ id: string; userId: string }>()
    const router = useRouter()
    const { data: session, status } = useSession()

    const [doctor, setDoctor] = useState<DoctorInfo | null>(null)
    const [service, setService] = useState<ServiceInfo | null>(null)
    const [slots, setSlots] = useState<SlotInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Booking state
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)
    const [showBooking, setShowBooking] = useState(false)
    const [customers, setCustomers] = useState<Customer[]>([])
    const [customersLoading, setCustomersLoading] = useState(false)
    const [bookForm, setBookForm] = useState({ customerId: '', notes: '' })
    const [bookError, setBookError] = useState('')
    const [bookSuccess, setBookSuccess] = useState(false)
    const [isBooking, setIsBooking] = useState(false)

    const userRole = (session?.user as { role?: string })?.role ?? 'USER'
    const isAdmin = userRole === 'ADMIN'
    const isDoctor = (session?.user as { isDoctor?: boolean })?.isDoctor ?? false
    // Patients book for themselves; admins/doctors select a patient
    const canSelectPatient = isAdmin || isDoctor

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (status !== 'authenticated' || !serviceId || !userId) return

        fetch(`/api/services/${serviceId}/doctors/${userId}`)
            .then(r => r.ok ? r.json() : Promise.reject(r.status))
            .then(data => {
                setDoctor(data.doctor)
                setService(data.service)
                setSlots(data.slots)
            })
            .catch(() => setError('Failed to load doctor information'))
            .finally(() => setLoading(false))
    }, [status, serviceId, userId])

    // Load customers when booking modal opens (admin/doctor only)
    useEffect(() => {
        if (!showBooking || !canSelectPatient) return
        setCustomersLoading(true)
        fetch('/api/customers')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.data) setCustomers(data.data) })
            .catch(() => { })
            .finally(() => setCustomersLoading(false))
    }, [showBooking, canSelectPatient])

    const openBooking = (slot: SlotInfo) => {
        setSelectedSlot(slot)
        setBookForm({ customerId: '', notes: '' })
        setBookError('')
        setBookSuccess(false)
        setShowBooking(true)
    }

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSlot || !service) return

        if (canSelectPatient && !bookForm.customerId) {
            setBookError('Please select a patient')
            return
        }

        setIsBooking(true)
        setBookError('')

        try {
            const body: Record<string, unknown> = {
                serviceId: service.id,
                slotId: selectedSlot.id,
                date: selectedSlot.slotDate,
                notes: bookForm.notes || undefined,
            }

            if (canSelectPatient) {
                body.customerId = bookForm.customerId
            } else {
                // Patient books for themselves — use their own customer record or create one
                // We pass patientId so the API can resolve it
                body.patientSelf = true
            }

            const res = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.message || 'Failed to book appointment')
            }

            setBookSuccess(true)

            // Refresh slots to update capacity
            const refreshed = await fetch(`/api/services/${serviceId}/doctors/${userId}`)
            if (refreshed.ok) {
                const data = await refreshed.json()
                setSlots(data.slots)
            }

            setTimeout(() => {
                setShowBooking(false)
                setBookSuccess(false)
            }, 2500)
        } catch (err) {
            setBookError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsBooking(false)
        }
    }

    // ── Loading / error states ──────────────────────────────────────────────────

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !doctor || !service) {
        return (
            <div className="p-6 text-center">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-gray-600">{error ?? 'Doctor not found.'}</p>
                <Link href={`/dashboard/services/${serviceId}`} className="text-blue-500 text-sm mt-2 inline-block hover:underline">
                    ← Back to department
                </Link>
            </div>
        )
    }

    const initials = getInitials(doctor.fullName)
    const avatarColor = getAvatarColor(doctor.fullName)
    const availableSlots = slots.filter(s => !s.isFull)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-5">
                <Link
                    href={`/dashboard/services/${serviceId}`}
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-4 transition-colors"
                >
                    <ChevronLeft size={16} /> Back to {service.name}
                </Link>

                <div className="flex items-center gap-5 flex-wrap">
                    {/* Avatar */}
                    <div className={`w-20 h-20 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-white text-2xl font-bold">{initials}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">Dr. {doctor.fullName}</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            {doctor.specialization ?? 'General Practitioner'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Stethoscope size={12} /> {service.name}
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={12} /> {service.duration} min
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <DollarSign size={12} /> ${service.price.toFixed(2)}
                            </span>
                            {availableSlots.length > 0 ? (
                                <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                    {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available
                                </span>
                            ) : (
                                <span className="text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">
                                    No slots available
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Slots ── */}
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CalendarDays size={20} className="text-blue-500" />
                    Available Appointment Slots
                </h2>

                {slots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-200">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-7 h-7 text-gray-300" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-600 mb-1">No upcoming slots</h3>
                        <p className="text-gray-400 text-sm text-center max-w-xs">
                            Dr. {doctor.fullName} has no open appointment slots at this time. Check back later.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slots.map(slot => {
                            const { date, weekday, time } = formatSlotDate(slot.slotDate)
                            const capacityPct = slot.slotLimit > 0
                                ? Math.round((slot.bookedCount / slot.slotLimit) * 100)
                                : 100

                            return (
                                <div
                                    key={slot.id}
                                    className={`bg-white rounded-xl border p-5 transition-all ${slot.isFull
                                        ? 'border-gray-200 opacity-60'
                                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                        }`}
                                >
                                    {/* Date & Time */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{weekday}</p>
                                            <p className="text-base font-semibold text-gray-900 mt-0.5">{date}</p>
                                            <p className="text-sm font-medium text-blue-600 mt-1">{time}</p>
                                        </div>
                                        {slot.isFull ? (
                                            <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
                                                Full
                                            </span>
                                        ) : (
                                            <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                                                Open
                                            </span>
                                        )}
                                    </div>

                                    {/* Capacity bar */}
                                    <div className="mb-3">
                                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                            <span className="flex items-center gap-1">
                                                <Users size={11} /> {slot.bookedCount} / {slot.slotLimit} booked
                                            </span>
                                            <span>{slot.remainingCapacity} left</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all ${capacityPct >= 100 ? 'bg-red-400' :
                                                    capacityPct >= 75 ? 'bg-amber-400' : 'bg-green-400'
                                                    }`}
                                                style={{ width: `${Math.min(capacityPct, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Duration + fee */}
                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                                        <span className="flex items-center gap-1"><Clock size={11} /> {service.duration} min</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} /> ${service.price.toFixed(2)}</span>
                                    </div>

                                    {/* Book button */}
                                    <button
                                        disabled={slot.isFull}
                                        onClick={() => openBooking(slot)}
                                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${slot.isFull
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-blue-600 text-white hover:bg-blue-700'
                                            }`}
                                    >
                                        {slot.isFull ? 'Fully Booked' : 'Book This Slot'}
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Booking Modal ── */}
            {showBooking && selectedSlot && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 ${avatarColor} rounded-full flex items-center justify-center`}>
                                    <span className="text-white text-sm font-bold">{initials}</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-sm">Book Appointment</h2>
                                    <p className="text-xs text-gray-400">
                                        Dr. {doctor.fullName} · {formatSlotDate(selectedSlot.slotDate).date}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowBooking(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Success state */}
                        {bookSuccess ? (
                            <div className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="font-semibold text-gray-900">Appointment Booked!</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your appointment with Dr. {doctor.fullName} has been scheduled.
                                </p>
                            </div>
                        ) : (
                            <form onSubmit={handleBook} className="p-6 space-y-4">
                                {/* Slot summary */}
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-blue-800">
                                        <CalendarDays size={15} />
                                        <span className="font-medium">{formatSlotDate(selectedSlot.slotDate).date}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-blue-600">
                                        <span className="flex items-center gap-1"><Clock size={11} /> {service.duration} min</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} /> ${service.price.toFixed(2)}</span>
                                        <span className="flex items-center gap-1"><Users size={11} /> {selectedSlot.remainingCapacity} spots left</span>
                                    </div>
                                </div>

                                {/* Patient selector (admin/doctor only) */}
                                {canSelectPatient && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                            Patient *
                                        </label>
                                        {customersLoading ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                                                <Loader className="w-4 h-4 animate-spin" /> Loading patients…
                                            </div>
                                        ) : (
                                            <select
                                                value={bookForm.customerId}
                                                onChange={e => setBookForm(p => ({ ...p, customerId: e.target.value }))}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm"
                                            >
                                                <option value="">Select patient</option>
                                                {customers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Notes <span className="text-gray-400 font-normal">(optional)</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={bookForm.notes}
                                        onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))}
                                        placeholder="Symptoms, reason for visit, special requests…"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 text-sm resize-none"
                                    />
                                </div>

                                {bookError && (
                                    <p className="text-sm text-red-600 flex items-center gap-1.5">
                                        <AlertCircle size={14} /> {bookError}
                                    </p>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isBooking}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors text-sm"
                                    >
                                        {isBooking ? <Loader className="w-4 h-4 animate-spin" /> : <Calendar size={15} />}
                                        {isBooking ? 'Booking…' : 'Confirm Appointment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowBooking(false)}
                                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
