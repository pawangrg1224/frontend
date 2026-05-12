'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Stethoscope, Loader, Calendar, ArrowLeft, Plus, Trash2, Clock,
    Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
    Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield, User, X, CheckCircle, AlertCircle,
} from 'lucide-react'

interface Service {
    id: string
    name: string
    description?: string
    duration: number
    price: number
}

interface Doctor {
    id: string
    fullName: string
    email: string
    doctorProfile: {
        id: string
        specialization: string | null
        departmentId: string | null
    } | null
}

interface Slot {
    id: string
    doctorName: string
    slotDate: string
    slotLimit: number
    isOpen: boolean
    service: { id: string; name: string }
}

// Department icon mapping
const DEPT_ICONS: { keywords: string[]; icon: React.ElementType; color: string; bg: string }[] = [
    { keywords: ['cardio', 'heart', 'cardiac'], icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
    { keywords: ['neuro', 'brain', 'nerve'], icon: Brain, color: 'text-purple-600', bg: 'bg-purple-100' },
    { keywords: ['ortho', 'bone', 'joint', 'spine'], icon: Bone, color: 'text-orange-600', bg: 'bg-orange-100' },
    { keywords: ['eye', 'ophthal', 'vision', 'retina'], icon: Eye, color: 'text-blue-600', bg: 'bg-blue-100' },
    { keywords: ['pediatr', 'child', 'baby', 'neonat'], icon: Baby, color: 'text-pink-600', bg: 'bg-pink-100' },
    { keywords: ['pulmo', 'lung', 'respir', 'chest'], icon: Wind, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    { keywords: ['lab', 'pathol', 'test', 'blood'], icon: Microscope, color: 'text-green-600', bg: 'bg-green-100' },
    { keywords: ['pharma', 'drug', 'medic', 'pill'], icon: Pill, color: 'text-teal-600', bg: 'bg-teal-100' },
    { keywords: ['ent', 'ear', 'nose', 'throat'], icon: Ear, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { keywords: ['dental', 'teeth', 'oral', 'mouth'], icon: Smile, color: 'text-lime-600', bg: 'bg-lime-100' },
    { keywords: ['immun', 'vaccine', 'inject'], icon: Syringe, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { keywords: ['oncol', 'cancer', 'tumor'], icon: Zap, color: 'text-rose-600', bg: 'bg-rose-100' },
    { keywords: ['emerg', 'icu', 'critical', 'trauma'], icon: Activity, color: 'text-red-700', bg: 'bg-red-100' },
    { keywords: ['research', 'clinical', 'trial'], icon: FlaskConical, color: 'text-violet-600', bg: 'bg-violet-100' },
    { keywords: ['prevent', 'wellness', 'health'], icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

function getDeptIcon(name: string) {
    const lower = name.toLowerCase()
    for (const e of DEPT_ICONS) {
        if (e.keywords.some(k => lower.includes(k))) return e
    }
    return { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-100' }
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

function createSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

export default function DepartmentSlotsPage() {
    const params = useParams()
    const router = useRouter()
    const { status } = useSession()
    const departmentId = params.deptname as string

    const [service, setService] = useState<Service | null>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [slots, setSlots] = useState<Slot[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [selectedDoctorForAdd, setSelectedDoctorForAdd] = useState<string | null>(null)

    // Add slot form state
    const [selectedDoctor, setSelectedDoctor] = useState('')
    const [slotDate, setSlotDate] = useState('')
    const [startHour, setStartHour] = useState('9')
    const [startMinute, setStartMinute] = useState('00')
    const [startPeriod, setStartPeriod] = useState('am')
    const [endHour, setEndHour] = useState('10')
    const [endMinute, setEndMinute] = useState('00')
    const [endPeriod, setEndPeriod] = useState('am')
    const [slotLimit, setSlotLimit] = useState('10')
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated' && departmentId) {
            fetchData()
        }
    }, [status, departmentId])

    const fetchData = async () => {
        setIsLoading(true)
        setError('')
        try {
            // Fetch service details
            const serviceRes = await fetch(`/api/services/${departmentId}`)
            if (!serviceRes.ok) throw new Error('Failed to fetch department')
            const serviceData = await serviceRes.json()
            setService(serviceData)

            // Fetch doctors
            const doctorsRes = await fetch('/api/admin/doctors')
            if (!doctorsRes.ok) throw new Error('Failed to fetch doctors')
            const doctorsData = await doctorsRes.json()
            const departmentDoctors = doctorsData.data.filter(
                (d: Doctor) => d.doctorProfile?.departmentId === departmentId
            )
            setDoctors(departmentDoctors)

            // Fetch slots
            const slotsRes = await fetch(`/api/slots?serviceId=${departmentId}`)
            if (!slotsRes.ok) throw new Error('Failed to fetch slots')
            const slotsData = await slotsRes.json()
            setSlots(slotsData.data || [])
        } catch (err) {
            setError('Failed to load data')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleAddSlot = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDoctor) {
            setFormError('Please select a doctor')
            return
        }
        if (!slotDate) {
            setFormError('Please select a date')
            return
        }

        setSaving(true)
        setFormError('')

        try {
            // Convert 12-hour to 24-hour format for start time
            let startHour24 = parseInt(startHour)
            if (startPeriod === 'pm' && startHour24 !== 12) {
                startHour24 += 12
            } else if (startPeriod === 'am' && startHour24 === 12) {
                startHour24 = 0
            }

            // Convert 12-hour to 24-hour format for end time
            let endHour24 = parseInt(endHour)
            if (endPeriod === 'pm' && endHour24 !== 12) {
                endHour24 += 12
            } else if (endPeriod === 'am' && endHour24 === 12) {
                endHour24 = 0
            }

            const startTime = startHour24 * 60 + parseInt(startMinute)
            const endTime = endHour24 * 60 + parseInt(endMinute)

            if (endTime <= startTime) {
                setFormError('End time must be after start time')
                setSaving(false)
                return
            }

            const [year, month, day] = slotDate.split('-').map(Number)

            // Create hourly slots between start and end time
            const promises = []
            for (let time = startTime; time < endTime; time += 60) {
                const h = Math.floor(time / 60)
                const m = time % 60
                const slotDateTime = new Date(year, month - 1, day, h, m, 0, 0).toISOString()

                promises.push(
                    fetch('/api/slots', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            serviceId: departmentId,
                            doctorName: selectedDoctor,
                            slotDate: slotDateTime,
                            slotLimit: Number(slotLimit),
                        }),
                    })
                )
            }

            const results = await Promise.all(promises)
            const failed = results.filter(r => !r.ok)

            if (failed.length > 0) {
                throw new Error(`Failed to create ${failed.length} slot(s)`)
            }

            setShowAddModal(false)
            fetchData()
            // Reset form
            setSelectedDoctor('')
            setSlotDate('')
            setStartHour('9')
            setStartMinute('00')
            setStartPeriod('am')
            setEndHour('10')
            setEndMinute('00')
            setEndPeriod('am')
            setSlotLimit('10')
            setSelectedDoctorForAdd(null)
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to create slots')
        } finally {
            setSaving(false)
        }
    }

    const openAddModal = (doctorName?: string) => {
        if (doctorName) {
            setSelectedDoctor(doctorName)
            setSelectedDoctorForAdd(doctorName)
        } else {
            setSelectedDoctor('')
            setSelectedDoctorForAdd(null)
        }
        setShowAddModal(true)
    }

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Are you sure you want to delete this slot?')) return

        try {
            const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete slot')
            fetchData()
        } catch (err) {
            setError('Failed to delete slot')
        }
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const { icon: DeptIcon, color, bg } = service ? getDeptIcon(service.name) : { icon: Stethoscope, color: 'text-gray-600', bg: 'bg-gray-100' }

    // Group slots by doctor
    const slotsByDoctor = slots.reduce((acc, slot) => {
        if (!acc[slot.doctorName]) acc[slot.doctorName] = []
        acc[slot.doctorName].push(slot)
        return acc
    }, {} as Record<string, Slot[]>)

    // Sort slots by date and time
    Object.keys(slotsByDoctor).forEach(doctorName => {
        slotsByDoctor[doctorName].sort((a, b) =>
            new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime()
        )
    })

    // Group slots by date for the right panel
    const slotsByDate = slots.reduce((acc, slot) => {
        const date = new Date(slot.slotDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        })
        if (!acc[date]) acc[date] = []
        acc[date].push(slot)
        return acc
    }, {} as Record<string, Slot[]>)

    // Sort slots within each date by time
    Object.keys(slotsByDate).forEach(date => {
        slotsByDate[date].sort((a, b) =>
            new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime()
        )
    })

    // Sort dates chronologically
    const sortedDates = Object.keys(slotsByDate).sort((a, b) => {
        const dateA = new Date(slotsByDate[a][0].slotDate)
        const dateB = new Date(slotsByDate[b][0].slotDate)
        return dateA.getTime() - dateB.getTime()
    })

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="text-sm font-medium">Back to Departments</span>
                </button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <DeptIcon className={`w-7 h-7 ${color}`} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {service?.name || 'Department'} Slots
                            </h1>
                            <p className="text-gray-500 text-sm mt-0.5">Manage appointment slots for this department</p>
                        </div>
                    </div>
                    <button
                        onClick={() => openAddModal()}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        <Plus size={18} />
                        Assign Doctor
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Doctors List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <User size={18} className="text-blue-600" />
                            Doctors in this Dept
                        </h2>
                        {doctors.length === 0 ? (
                            <div className="text-center py-8">
                                <User className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">No doctors assigned</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {doctors.map((doctor) => {
                                    const doctorSlots = slotsByDoctor[doctor.fullName] || []
                                    return (
                                        <div
                                            key={doctor.id}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                    <User className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 text-sm">
                                                        Dr. {doctor.fullName}
                                                    </h3>
                                                    {doctor.doctorProfile?.specialization && (
                                                        <p className="text-xs text-gray-600 mt-0.5">
                                                            {doctor.doctorProfile.specialization}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-blue-600 font-medium mt-1">
                                                        {doctorSlots.length} slot{doctorSlots.length !== 1 ? 's' : ''} assigned
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Assigned Slots */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <Calendar size={18} className="text-blue-600" />
                            Assigned Slots
                        </h2>

                        {slots.length === 0 ? (
                            <div className="text-center py-16">
                                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-2 font-medium">No slots assigned yet</p>
                                <p className="text-gray-400 text-sm">Click "Assign Doctor" to create appointment slots</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {sortedDates.map((date) => {
                                    const dateSlots = slotsByDate[date]

                                    return (
                                        <div key={date} className="border border-gray-200 rounded-lg p-4">
                                            {/* Date Header */}
                                            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                                                <Calendar size={16} className="text-blue-600" />
                                                <h3 className="font-semibold text-gray-900">
                                                    {date}
                                                </h3>
                                            </div>

                                            {/* Slots for this date */}
                                            <div className="space-y-3">
                                                {dateSlots.map((slot) => {
                                                    const timeRange = formatTimeRange(slot.slotDate)
                                                    const deptSlug = service ? createSlug(service.name) : 'department'

                                                    return (
                                                        <div
                                                            key={slot.id}
                                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                                                            onClick={() => router.push(`/dashboard/admin/slots/${deptSlug}/${slot.id}`)}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center">
                                                                    <User className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-gray-900 text-sm">
                                                                        Dr. {slot.doctorName}
                                                                    </p>
                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                        <Clock size={12} className="text-gray-500" />
                                                                        <span className="text-xs text-gray-600 font-medium">
                                                                            {timeRange}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">
                                                                            • {slot.slotLimit} slots
                                                                        </span>
                                                                        <span className={`text-xs px-1.5 py-0.5 rounded ${slot.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                            {slot.isOpen ? 'Open' : 'Closed'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteSlot(slot.id)
                                                                }}
                                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                                title="Delete slot"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Slot Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">Add Appointment Slot</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-1.5 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleAddSlot} className="p-6 space-y-4">
                            {/* Doctor Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor *</label>
                                {doctors.length === 0 ? (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                                        <AlertCircle size={14} />
                                        No doctors assigned to this department
                                    </div>
                                ) : selectedDoctorForAdd ? (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900">
                                            Dr. {selectedDoctorForAdd}
                                        </p>
                                    </div>
                                ) : (
                                    <select
                                        value={selectedDoctor}
                                        onChange={(e) => setSelectedDoctor(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        required
                                    >
                                        <option value="">Select a doctor</option>
                                        {doctors.map((doc) => (
                                            <option key={doc.id} value={doc.fullName}>
                                                Dr. {doc.fullName} {doc.doctorProfile?.specialization ? `- ${doc.doctorProfile.specialization}` : ''}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    value={slotDate}
                                    onChange={(e) => setSlotDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>

                            {/* Time Range */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={startHour}
                                            onChange={(e) => setStartHour(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            {[...Array(12)].map((_, i) => {
                                                const h = i + 1
                                                return <option key={h} value={h}>{h}</option>
                                            })}
                                        </select>
                                        <select
                                            value={startMinute}
                                            onChange={(e) => setStartMinute(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>
                                        <select
                                            value={startPeriod}
                                            onChange={(e) => setStartPeriod(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            <option value="am">AM</option>
                                            <option value="pm">PM</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={endHour}
                                            onChange={(e) => setEndHour(e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            {[...Array(12)].map((_, i) => {
                                                const h = i + 1
                                                return <option key={h} value={h}>{h}</option>
                                            })}
                                        </select>
                                        <select
                                            value={endMinute}
                                            onChange={(e) => setEndMinute(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>
                                        <select
                                            value={endPeriod}
                                            onChange={(e) => setEndPeriod(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                        >
                                            <option value="am">AM</option>
                                            <option value="pm">PM</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Hourly slots will be created between start and end time
                                </p>
                            </div>

                            {/* Slot Limit */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Slot Limit *</label>
                                <input
                                    type="number"
                                    value={slotLimit}
                                    onChange={(e) => setSlotLimit(e.target.value)}
                                    min="1"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    required
                                />
                            </div>

                            {formError && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                    <AlertCircle size={14} />
                                    {formError}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={saving || doctors.length === 0}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                                >
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                                    {saving ? 'Creating...' : 'Create Slots'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false)
                                        setSelectedDoctorForAdd(null)
                                    }}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </div >
    )
}
