'use client'

import React, { useEffect, useState } from 'react'
import { CalendarDays, Clock, Loader, Building2, Users } from 'lucide-react'

interface DoctorSlot {
    id: string
    departmentName: string
    slotDate: string        // ISO date string
    slotLimit: number
    bookingCount: number
    isOpen?: boolean
}

function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })
}

export default function DoctorSlotsPage() {
    const [slots, setSlots] = useState<DoctorSlot[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch('/api/slots/my-slots')
            .then(r => {
                if (!r.ok) throw new Error('Failed to load slots')
                return r.json()
            })
            .then((data: DoctorSlot[]) => setSlots(data))
            .catch(() => setError('Failed to load your slots. Please try again later.'))
            .finally(() => setLoading(false))
    }, [])

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
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-1">
                    <CalendarDays className="w-7 h-7 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">My Slots</h1>
                </div>
                <p className="text-gray-500 ml-10">View your assigned appointment slots</p>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-700 font-medium">{error}</p>
                </div>
            )}

            {/* Empty state */}
            {!error && slots.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <CalendarDays className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">You have no slots assigned</h3>
                    <p className="text-gray-400 text-sm">No appointment slots are currently assigned to you.</p>
                </div>
            )}

            {/* Slots grid */}
            {slots.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.map(slot => (
                        <div
                            key={slot.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            {/* Department */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">{slot.departmentName}</h3>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                                <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                                <span>{formatDate(slot.slotDate)}</span>
                            </div>

                            {/* Capacity and booking count */}
                            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100 mt-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        Capacity: <span className="font-medium">{slot.slotLimit}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-500 shrink-0" />
                                    <span className="text-sm text-gray-700">
                                        Booked: <span className="font-medium">{slot.bookingCount}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
