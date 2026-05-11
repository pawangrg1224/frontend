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
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Page header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Open Slots</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Browse and book available appointment slots</p>
                    </div>
                </div>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 font-medium">{error}</p>
                </div>
            )}

            {/* Empty state */}
            {!error && slots.length === 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No open slots available</h3>
                    <p className="text-gray-400 text-sm">Check back later for available appointment slots</p>
                </div>
            )}

            {/* Slots grid */}
            {slots.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.map(slot => (
                        <div
                            key={slot.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all"
                        >
                            {/* Department Header */}
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-semibold text-gray-900 truncate">
                                        {slot.departmentName || slot.service?.name}
                                    </h3>
                                    <p className="text-xs text-gray-500">Department</p>
                                </div>
                            </div>

                            {/* Doctor */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-500">Doctor</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 ml-6">Dr. {slot.doctorName}</p>
                            </div>

                            {/* Date */}
                            <div className="mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-500">Date</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 ml-6">{formatDate(slot.slotDate)}</p>
                            </div>

                            {/* Time */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs text-gray-500">Time</span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 ml-6">{formatTimeRange(slot.slotDate)}</p>
                            </div>

                            {/* Footer - Availability & Price */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${slot.remainingCapacity > 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-sm font-medium text-gray-700">
                                        {slot.remainingCapacity} / {slot.slotLimit} available
                                    </span>
                                </div>
                                {slot.service?.price && (
                                    <span className="text-sm font-bold text-blue-600">
                                        Rs. {slot.service.price.toFixed(2)}
                                    </span>
                                )}
                            </div>

                            {/* Book Button */}
                            <button
                                className="w-full mt-4 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Book Appointment</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {selectedSlot.departmentName} - Dr. {selectedSlot.doctorName}
                                </p>
                            </div>
                            <button
                                onClick={closeBookingModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleBookAppointment} className="p-6 space-y-4">
                            {/* Appointment Details */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-700">{formatDate(selectedSlot.slotDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="w-4 h-4 text-blue-600" />
                                    <span className="text-gray-700">{formatTimeRange(selectedSlot.slotDate)}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="font-semibold text-blue-600">Rs. {selectedSlot.service.price.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>

                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>

                            {/* Phone Field */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter your phone number"
                                    required
                                />
                            </div>

                            {/* Problem Field */}
                            <div>
                                <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-1">
                                    Problem Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="problem"
                                    value={formData.problem}
                                    onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    placeholder="Describe your problem or reason for visit"
                                    rows={4}
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeBookingModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                                    disabled={bookingSlotId === selectedSlot.id}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    disabled={bookingSlotId === selectedSlot.id}
                                >
                                    {bookingSlotId === selectedSlot.id ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Booking...
                                        </>
                                    ) : (
                                        'Book Appointment'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
