'use client'

import React, { useEffect, useState } from 'react'
import { Calendar, Clock, Loader, User, Building2, Stethoscope, X } from 'lucide-react'
import { toast } from 'sonner'

interface OpenSlot {
    id: string
    departmentName: string
    doctorName: string
    slotDate: string        // ISO date string
    remainingCapacity: number
    slotLimit: number
    service: {
        id: string
        name: string
        price: number
    }
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
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

export default function OpenSlotsPage() {
    const [slots, setSlots] = useState<OpenSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [bookingSlotId, setBookingSlotId] = useState<string | null>(null)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<OpenSlot | null>(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        problem: '',
    })

    useEffect(() => {
        fetch('/api/slots/open')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load open slots')
                return r.json()
            })
            .then((data: OpenSlot[]) => setSlots(data))
            .catch(() => setError('Failed to load open slots. Please try again later.'))
            .finally(() => setLoading(false))
    }, [])

    const openBookingModal = (slot: OpenSlot) => {
        setSelectedSlot(slot)
        setShowBookingModal(true)
        // Reset form
        setFormData({
            name: '',
            email: '',
            phone: '',
            problem: '',
        })
    }

    const closeBookingModal = () => {
        setShowBookingModal(false)
        setSelectedSlot(null)
    }

    const handleBookAppointment = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSlot) return

        // Validate form
        if (!formData.name || !formData.email || !formData.phone || !formData.problem) {
            toast.error('Please fill in all fields')
            return
        }

        setBookingSlotId(selectedSlot.id)
        try {
            const response = await fetch('/api/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedSlot.service.id,
                    date: selectedSlot.slotDate,
                    slotId: selectedSlot.id,
                    patientSelf: true,
                    notes: `Patient: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nProblem: ${formData.problem}`,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to book appointment')
            }

            // Success - refresh the slots list
            toast.success('Appointment booked successfully!')
            closeBookingModal()

            // Refresh slots to update availability
            const slotsResponse = await fetch('/api/slots/open')
            if (slotsResponse.ok) {
                const updatedSlots = await slotsResponse.json()
                setSlots(updatedSlots)
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to book appointment'
            toast.error(errorMessage)
        } finally {
            setBookingSlotId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Loading available slots...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Page header */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Calendar className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-1">Available Appointments</h1>
                            <p className="text-gray-600">Browse and book your appointment with our specialists</p>
                        </div>
                    </div>
                </div>

                {/* Error banner */}
                {error && (
                    <div className="mb-8 p-5 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {/* Empty state */}
                {!error && slots.length === 0 && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-20 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5 mx-auto">
                            <Calendar className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Appointments Available</h3>
                        <p className="text-gray-500">Please check back later for available appointment slots</p>
                    </div>
                )}

                {/* Slots grid */}
                {slots.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {slots.map(slot => (
                            <div
                                key={slot.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7 hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Department Header */}
                                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-gray-100">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl flex items-center justify-center">
                                        <Stethoscope className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-bold text-gray-900 truncate mb-0.5">
                                            {slot.departmentName || slot.service?.name}
                                        </h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                                    </div>
                                </div>

                                {/* Doctor */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Doctor</span>
                                    </div>
                                    <p className="text-base font-semibold text-gray-900 ml-6">Dr. {slot.doctorName}</p>
                                </div>

                                {/* Date */}
                                <div className="mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Date</span>
                                    </div>
                                    <p className="text-base font-semibold text-gray-900 ml-6">{formatDate(slot.slotDate)}</p>
                                </div>

                                {/* Time */}
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span className="text-xs text-gray-500 uppercase tracking-wide">Time</span>
                                    </div>
                                    <p className="text-base font-semibold text-gray-900 ml-6">{formatTimeRange(slot.slotDate)}</p>
                                </div>

                                {/* Footer - Availability & Price */}
                                <div className="pt-5 border-t border-gray-100 flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${slot.remainingCapacity > 0 ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                                        <span className="text-sm font-semibold text-gray-700">
                                            {slot.remainingCapacity} / {slot.slotLimit} slots
                                        </span>
                                    </div>
                                    {slot.service?.price && (
                                        <span className="text-lg font-bold text-blue-600">
                                            Rs. {slot.service.price.toFixed(2)}
                                        </span>
                                    )}
                                </div>

                                {/* Book Button */}
                                <button
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-semibold text-sm shadow-lg shadow-blue-200 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
                                    onClick={() => openBookingModal(slot)}
                                    disabled={slot.remainingCapacity === 0}
                                >
                                    {slot.remainingCapacity === 0 ? 'Fully Booked' : 'Book Appointment'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Booking Modal */}
                {showBookingModal && selectedSlot && (
                    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-200">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 flex items-start justify-between rounded-t-2xl">
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold mb-2">Book Appointment</h2>
                                    <p className="text-blue-100 text-sm">
                                        {selectedSlot.departmentName}
                                    </p>
                                    <p className="text-blue-100 text-sm">
                                        Dr. {selectedSlot.doctorName}
                                    </p>
                                </div>
                                <button
                                    onClick={closeBookingModal}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleBookAppointment} className="p-8 space-y-6">
                                {/* Appointment Details */}
                                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                        <span className="text-gray-800 font-medium">{formatDate(selectedSlot.slotDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Clock className="w-5 h-5 text-blue-600" />
                                        <span className="text-gray-800 font-medium">{formatTimeRange(selectedSlot.slotDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-3 pt-2 border-t border-blue-200">
                                        <span className="text-2xl font-bold text-blue-600">Rs. {selectedSlot.service.price.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Name Field */}
                                <div>
                                    <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>

                                {/* Email Field */}
                                <div>
                                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>

                                {/* Phone Field */}
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Phone Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="Enter your phone number"
                                        required
                                    />
                                </div>

                                {/* Problem Field */}
                                <div>
                                    <label htmlFor="problem" className="block text-sm font-semibold text-gray-700 mb-2">
                                        Problem Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        id="problem"
                                        value={formData.problem}
                                        onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
                                        placeholder="Describe your problem or reason for visit"
                                        rows={4}
                                        required
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={closeBookingModal}
                                        className="flex-1 px-6 py-3.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                                        disabled={bookingSlotId === selectedSlot.id}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                        disabled={bookingSlotId === selectedSlot.id}
                                    >
                                        {bookingSlotId === selectedSlot.id ? (
                                            <>
                                                <Loader className="w-5 h-5 animate-spin" />
                                                Booking...
                                            </>
                                        ) : (
                                            'Confirm Booking'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
