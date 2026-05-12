'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Loader, User, Calendar, Clock, Award, GraduationCap,
    Stethoscope, Heart, Brain, Bone, Eye, Baby, Wind,
    Microscope, Pill, Ear, Smile, Syringe, Zap, Activity,
    FlaskConical, Shield, ArrowLeft, CalendarCheck,
} from 'lucide-react'

interface Doctor {
    id: string
    userId: string
    fullName: string
    email: string
    specialization: string | null
    profileImage: string | null
    qualifications: string[]
    experience: number | null
    departmentStartDate: string | null
    departmentEndDate: string | null
    department: {
        id: string
        name: string
        description: string | null
        duration: number
        price: number
    } | null
    availableSlots: {
        id: string
        slotDate: string
        slotLimit: number
        isOpen: boolean
    }[]
}

// Department icon mapping
const DEPT_ICONS: { keywords: string[]; icon: React.ElementType; color: string; bg: string }[] = [
    { keywords: ['cardio', 'heart', 'cardiac'], icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { keywords: ['neuro', 'brain', 'nerve'], icon: Brain, color: 'text-purple-600', bg: 'bg-purple-100' },
    { keywords: ['ortho', 'bone', 'joint', 'spine'], icon: Bone, color: 'text-orange-600', bg: 'bg-orange-100' },
    { keywords: ['eye', 'ophthal', 'vision', 'retina'], icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { keywords: ['pediatr', 'child', 'baby', 'neonat'], icon: Baby, color: 'text-pink-600', bg: 'bg-pink-100' },
    { keywords: ['pulmo', 'lung', 'respir', 'chest', 'breath'], icon: Wind, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { keywords: ['lab', 'pathol', 'test', 'blood', 'sample'], icon: Microscope, color: 'text-green-600', bg: 'bg-green-100' },
    { keywords: ['pharma', 'drug', 'medic', 'pill'], icon: Pill, color: 'text-teal-600', bg: 'bg-teal-100' },
    { keywords: ['ent', 'ear', 'nose', 'throat'], icon: Ear, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { keywords: ['dental', 'teeth', 'oral', 'mouth', 'endodon'], icon: Smile, color: 'text-lime-600', bg: 'bg-lime-100' },
    { keywords: ['immun', 'vaccine', 'inject'], icon: Syringe, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { keywords: ['oncol', 'cancer', 'tumor'], icon: Zap, color: 'text-rose-600', bg: 'bg-rose-100' },
    { keywords: ['emerg', 'icu', 'critical', 'trauma'], icon: Activity, color: 'text-red-700', bg: 'bg-red-100' },
    { keywords: ['general', 'consult', 'gp', 'family', 'primary'], icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-100' },
    { keywords: ['research', 'clinical', 'trial', 'study'], icon: FlaskConical, color: 'text-violet-600', bg: 'bg-violet-100' },
    { keywords: ['prevent', 'wellness', 'health', 'screen'], icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

function getDeptIcon(name: string): { icon: React.ElementType; color: string; bg: string } {
    const lower = name.toLowerCase()
    for (const entry of DEPT_ICONS) {
        if (entry.keywords.some(k => lower.includes(k))) {
            return { icon: entry.icon, color: entry.color, bg: entry.bg }
        }
    }
    return { icon: Stethoscope, color: 'text-gray-600', bg: 'bg-gray-100' }
}

// Helper function to format time range (e.g., "9am to 10am" or "2pm to 3pm")
function formatTimeRange(dateString: string): string {
    const date = new Date(dateString)
    const startHour = date.getHours()
    const endHour = startHour + 1

    // Format start time
    const startAmpm = startHour >= 12 ? 'pm' : 'am'
    const startH12 = startHour > 12 ? startHour - 12 : startHour === 0 ? 12 : startHour

    // Format end time
    const endAmpm = endHour >= 12 ? 'pm' : 'am'
    const endH12 = endHour > 12 ? endHour - 12 : endHour === 0 ? 12 : endHour

    // Show range like "8am to 9am" or "11am to 12pm"
    if (startAmpm === endAmpm) {
        // Same period, show AM/PM only once: "8 to 9am"
        return `${startH12} to ${endH12}${endAmpm}`
    } else {
        // Different periods, show both: "11am to 12pm"
        return `${startH12}${startAmpm} to ${endH12}${endAmpm}`
    }
}

export default function DepartmentDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { status } = useSession()
    const departmentId = params.id as string

    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated' && departmentId) {
            fetchDoctors()
        }
    }, [status, departmentId])

    const fetchDoctors = async () => {
        setIsLoading(true)
        setError('')
        try {
            const res = await fetch(`/api/services/${departmentId}/doctors`)
            if (!res.ok) throw new Error('Failed to fetch doctors')
            const data = await res.json()
            setDoctors(data.data || [])
        } catch (err) {
            setError('Failed to load doctors for this department')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDoctorClick = (doctor: Doctor) => {
        setSelectedDoctor(doctor)
        setSelectedSlot(null)
        setShowModal(true)
    }

    const handleBookAppointment = () => {
        if (!selectedSlot || !selectedDoctor) return
        // Navigate to booking page with selected slot and doctor info
        router.push(`/dashboard/user/open-slots?slotId=${selectedSlot}&doctorId=${selectedDoctor.userId}`)
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const department = doctors[0]?.department
    const { icon: DeptIcon, color, bg } = department ? getDeptIcon(department.name) : { icon: Stethoscope, color: 'text-gray-600', bg: 'bg-gray-100' }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back</span>
                </button>

                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <DeptIcon className={`w-7 h-7 ${color}`} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {department?.name || 'Department'}
                        </h1>
                        {department?.description && (
                            <p className="text-gray-500 text-sm mt-1">{department.description}</p>
                        )}
                        {department && (
                            <div className="flex gap-4 mt-2">
                                <span className="text-xs text-gray-500">
                                    <Clock size={12} className="inline mr-1" />
                                    {department.duration} min
                                </span>
                                <span className="text-xs text-gray-500">
                                    <span className="font-semibold">${department.price.toFixed(2)}</span> consultation fee
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div>
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {doctors.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-2 font-medium">No doctors assigned yet</p>
                        <p className="text-gray-400 text-sm">
                            There are currently no doctors assigned to this department
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {doctors.map((doctor) => (
                            <div
                                key={doctor.id}
                                onClick={() => handleDoctorClick(doctor)}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all cursor-pointer hover:border-blue-300"
                            >
                                {/* Doctor Header */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {doctor.profileImage ? (
                                            <img
                                                src={doctor.profileImage}
                                                alt={doctor.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Dr. {doctor.fullName}
                                        </h3>
                                        {doctor.specialization && (
                                            <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                                                <Stethoscope size={14} />
                                                {doctor.specialization}
                                            </p>
                                        )}
                                        {doctor.experience && (
                                            <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                                <Award size={12} />
                                                {doctor.experience} years experience
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Qualifications */}
                                {doctor.qualifications && doctor.qualifications.length > 0 && (
                                    <div className="mb-4 pb-4 border-b border-gray-100">
                                        <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                            <GraduationCap size={14} />
                                            Qualifications
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {doctor.qualifications.map((qual, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium"
                                                >
                                                    {qual}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Available Slots Preview */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                                        <CalendarCheck size={14} />
                                        Available Slots
                                    </p>
                                    {doctor.availableSlots.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No upcoming slots available</p>
                                    ) : (
                                        <p className="text-sm text-blue-600 font-medium">
                                            {doctor.availableSlots.length} slot{doctor.availableSlots.length !== 1 ? 's' : ''} available
                                        </p>
                                    )}
                                </div>

                                {/* Click to view details */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-center text-gray-500">
                                        Click to view details and book appointment
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Doctor Details Modal */}
                {showModal && selectedDoctor && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center overflow-hidden">
                                        {selectedDoctor.profileImage ? (
                                            <img
                                                src={selectedDoctor.profileImage}
                                                alt={selectedDoctor.fullName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            Dr. {selectedDoctor.fullName}
                                        </h2>
                                        {selectedDoctor.specialization && (
                                            <p className="text-sm text-gray-600">{selectedDoctor.specialization}</p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <span className="text-2xl text-gray-500">&times;</span>
                                </button>
                            </div>

                            {/* Modal Content */}
                            <div className="p-6 space-y-6">
                                {/* Doctor Info */}
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    {selectedDoctor.experience && (
                                        <div className="flex items-center gap-2">
                                            <Award size={16} className="text-gray-500" />
                                            <span className="text-sm text-gray-700">
                                                <span className="font-semibold">{selectedDoctor.experience}</span> years of experience
                                            </span>
                                        </div>
                                    )}
                                    {selectedDoctor.department && (
                                        <div className="flex items-center gap-2">
                                            <Clock size={16} className="text-gray-500" />
                                            <span className="text-sm text-gray-700">
                                                Consultation: <span className="font-semibold">{selectedDoctor.department.duration} minutes</span>
                                            </span>
                                        </div>
                                    )}
                                    {selectedDoctor.department && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg font-bold text-blue-600">
                                                ${selectedDoctor.department.price.toFixed(2)}
                                            </span>
                                            <span className="text-sm text-gray-500">consultation fee</span>
                                        </div>
                                    )}
                                </div>

                                {/* Qualifications */}
                                {selectedDoctor.qualifications && selectedDoctor.qualifications.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <GraduationCap size={16} />
                                            Qualifications
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDoctor.qualifications.map((qual, idx) => (
                                                <span
                                                    key={idx}
                                                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium"
                                                >
                                                    {qual}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Available Slots */}
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <CalendarCheck size={16} />
                                        Select an Available Slot
                                    </h3>
                                    {selectedDoctor.availableSlots.length === 0 ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 font-medium">No upcoming slots available</p>
                                            <p className="text-sm text-gray-400 mt-1">Please check back later</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {selectedDoctor.availableSlots.map((slot) => {
                                                const slotDate = new Date(slot.slotDate)
                                                const isSelected = selectedSlot === slot.id
                                                const timeRange = formatTimeRange(slot.slotDate)
                                                return (
                                                    <button
                                                        key={slot.id}
                                                        onClick={() => setSelectedSlot(slot.id)}
                                                        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isSelected
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-blue-100' : 'bg-gray-100'
                                                                }`}>
                                                                <Calendar size={18} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                                                            </div>
                                                            <div className="text-left">
                                                                <p className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                    {slotDate.toLocaleDateString('en-US', {
                                                                        weekday: 'long',
                                                                        month: 'long',
                                                                        day: 'numeric',
                                                                        year: 'numeric',
                                                                    })}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <Clock size={12} className={isSelected ? 'text-blue-600' : 'text-gray-500'} />
                                                                    <span className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                                                                        {timeRange}
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {slot.slotLimit} slot{slot.slotLimit !== 1 ? 's' : ''} available
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                                <span className="text-white text-sm">✓</span>
                                                            </div>
                                                        )}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBookAppointment}
                                    disabled={!selectedSlot}
                                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${selectedSlot
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                >
                                    {selectedSlot ? 'Book Appointment' : 'Select a Slot'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
