'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
    ChevronLeft, Loader, Stethoscope,
    Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
    Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield,
    UserCheck, UserX, Clock, DollarSign, Users, GraduationCap,
    Star, Calendar, CalendarDays, X, CheckCircle, AlertCircle,
    Award, BookOpen,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
    id: string
    name: string
    description?: string
    duration: number
    price: number
}

interface Doctor {
    id: string
    fullName: string
    email: string | null
    specialization: string | null
    isAvailable: boolean
    // enriched fields (mock or real)
    education?: string[]
    experience?: number
    rating?: number
    isMock?: boolean
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

// ─── Mock doctor data ─────────────────────────────────────────────────────────

const MOCK_DOCTORS: Omit<Doctor, 'id'>[] = [
    {
        fullName: 'Sarah Mitchell',
        email: 'sarah.mitchell@medibook.com',
        specialization: 'Senior Consultant',
        isAvailable: true,
        education: ['MBBS – Harvard Medical School', 'MD Cardiology – Johns Hopkins', 'Fellowship – Mayo Clinic'],
        experience: 14,
        rating: 4.9,
        isMock: true,
    },
    {
        fullName: 'James Okonkwo',
        email: 'james.okonkwo@medibook.com',
        specialization: 'Specialist',
        isAvailable: true,
        education: ['MBBS – University of Lagos', 'MS – Stanford University', 'Board Certified Specialist'],
        experience: 9,
        rating: 4.7,
        isMock: true,
    },
    {
        fullName: 'Priya Sharma',
        email: 'priya.sharma@medibook.com',
        specialization: 'Consultant',
        isAvailable: false,
        education: ['MBBS – AIIMS New Delhi', 'MD – PGI Chandigarh', 'DNB – National Board'],
        experience: 7,
        rating: 4.8,
        isMock: true,
    },
    {
        fullName: 'David Chen',
        email: 'david.chen@medibook.com',
        specialization: 'Associate Consultant',
        isAvailable: true,
        education: ['MBBS – Peking University', 'MS – University of Toronto', 'Residency – Cleveland Clinic'],
        experience: 5,
        rating: 4.6,
        isMock: true,
    },
]

// Generate mock slots for a doctor (next 5 weekdays)
function generateMockSlots(doctorId: string): SlotInfo[] {
    const slots: SlotInfo[] = []
    const today = new Date()
    let count = 0
    let offset = 1
    while (count < 5) {
        const d = new Date(today)
        d.setDate(today.getDate() + offset)
        offset++
        if (d.getDay() === 0 || d.getDay() === 6) continue // skip weekends
        const booked = Math.floor(Math.random() * 6)
        const limit = 8
        slots.push({
            id: `mock-slot-${doctorId}-${count}`,
            slotDate: d.toISOString(),
            slotLimit: limit,
            bookedCount: booked,
            remainingCapacity: limit - booked,
            isFull: booked >= limit,
        })
        count++
    }
    return slots
}

// ─── Icon helpers ─────────────────────────────────────────────────────────────

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
    { keywords: ['dental', 'teeth', 'oral', 'mouth'], icon: Smile, color: 'text-lime-600', bg: 'bg-lime-100' },
    { keywords: ['immun', 'vaccine', 'inject'], icon: Syringe, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { keywords: ['oncol', 'cancer', 'tumor'], icon: Zap, color: 'text-rose-600', bg: 'bg-rose-100' },
    { keywords: ['emerg', 'icu', 'critical', 'trauma'], icon: Activity, color: 'text-red-700', bg: 'bg-red-100' },
    { keywords: ['research', 'clinical', 'trial'], icon: FlaskConical, color: 'text-violet-600', bg: 'bg-violet-100' },
    { keywords: ['prevent', 'wellness', 'health', 'screen'], icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-100' },
]

function getDeptIcon(name: string) {
    const lower = name.toLowerCase()
    for (const entry of DEPT_ICONS) {
        if (entry.keywords.some(k => lower.includes(k))) return entry
    }
    return { icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-100' }
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DepartmentDoctorsPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { data: session, status } = useSession()

    const [dept, setDept] = useState<Department | null>(null)
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)

    // Drawer state
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [slots, setSlots] = useState<SlotInfo[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)

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
    const isDoctorUser = (session?.user as { isDoctor?: boolean })?.isDoctor ?? false
    const canSelectPatient = isAdmin || isDoctorUser

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
    }, [status, router])

    useEffect(() => {
        if (status !== 'authenticated' || !id) return

        Promise.all([
            fetch(`/api/services/${id}`).then(r => r.ok ? r.json() : null),
            fetch(`/api/services/${id}/doctors`).then(r => r.ok ? r.json() : null),
        ])
            .then(([deptData, doctorData]) => {
                if (deptData) setDept(deptData)

                // Merge real doctors with mock doctors
                const realDoctors: Doctor[] = (doctorData?.data ?? []).map((d: Doctor) => ({
                    ...d,
                    education: d.education ?? ['MBBS', 'MD – Specialization'],
                    experience: d.experience ?? 5,
                    rating: d.rating ?? 4.5,
                }))

                // Add mock doctors with stable IDs
                const mockWithIds: Doctor[] = MOCK_DOCTORS.map((m, i) => ({
                    ...m,
                    id: `mock-doctor-${i}`,
                }))

                // Deduplicate: if a real doctor has the same name as a mock, prefer real
                const realNames = new Set(realDoctors.map(d => d.fullName.toLowerCase()))
                const filteredMocks = mockWithIds.filter(m => !realNames.has(m.fullName.toLowerCase()))

                setDoctors([...realDoctors, ...filteredMocks])
            })
            .finally(() => setLoading(false))
    }, [status, id])

    // Load customers for admin/doctor booking
    useEffect(() => {
        if (!showBooking || !canSelectPatient) return
        setCustomersLoading(true)
        fetch('/api/customers')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.data) setCustomers(data.data) })
            .catch(() => { })
            .finally(() => setCustomersLoading(false))
    }, [showBooking, canSelectPatient])

    const openDrawer = (doctor: Doctor) => {
        setSelectedDoctor(doctor)
        setDrawerOpen(true)
        setShowBooking(false)
        setBookSuccess(false)
        setSelectedSlot(null)

        if (doctor.isMock) {
            // Use generated mock slots
            setSlots(generateMockSlots(doctor.id))
        } else {
            // Fetch real slots
            setSlotsLoading(true)
            fetch(`/api/services/${id}/doctors/${doctor.id}`)
                .then(r => r.ok ? r.json() : null)
                .then(data => { if (data?.slots) setSlots(data.slots) })
                .catch(() => setSlots([]))
                .finally(() => setSlotsLoading(false))
        }
    }

    const closeDrawer = () => {
        setDrawerOpen(false)
        setShowBooking(false)
        setBookSuccess(false)
        setSelectedSlot(null)
        setTimeout(() => setSelectedDoctor(null), 300)
    }

    const openBooking = (slot: SlotInfo) => {
        setSelectedSlot(slot)
        setBookForm({ customerId: '', notes: '' })
        setBookError('')
        setBookSuccess(false)
        setShowBooking(true)
    }

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedSlot || !dept) return
        if (canSelectPatient && !bookForm.customerId) {
            setBookError('Please select a patient')
            return
        }
        setIsBooking(true)
        setBookError('')
        try {
            if (selectedDoctor?.isMock) {
                // Simulate booking for mock doctors
                await new Promise(r => setTimeout(r, 800))
                setBookSuccess(true)
                // Decrease mock slot capacity visually
                setSlots(prev => prev.map(s =>
                    s.id === selectedSlot.id
                        ? { ...s, bookedCount: s.bookedCount + 1, remainingCapacity: s.remainingCapacity - 1, isFull: s.remainingCapacity - 1 <= 0 }
                        : s
                ))
            } else {
                const body: Record<string, unknown> = {
                    serviceId: id,
                    slotId: selectedSlot.id,
                    date: selectedSlot.slotDate,
                    notes: bookForm.notes || undefined,
                }
                if (canSelectPatient) {
                    body.customerId = bookForm.customerId
                } else {
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
                // Refresh real slots
                const refreshed = await fetch(`/api/services/${id}/doctors/${selectedDoctor!.id}`)
                if (refreshed.ok) {
                    const data = await refreshed.json()
                    setSlots(data.slots)
                }
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

    if (loading || status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!dept) {
        return <div className="p-6 text-center text-gray-500">Department not found.</div>
    }

    const { icon: DeptIcon, color, bg } = getDeptIcon(dept.name)
    const availableCount = doctors.filter(d => d.isAvailable).length

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ── Header ── */}
            <div className="bg-white border-b border-gray-200 px-6 py-5">
                <Link
                    href="/dashboard/services"
                    className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-sm mb-4 transition-colors"
                >
                    <ChevronLeft size={16} /> Back to Departments
                </Link>
                <div className="flex items-center gap-4 flex-wrap">
                    <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <DeptIcon className={`w-7 h-7 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-2xl font-bold text-gray-900">{dept.name}</h1>
                        {dept.description && <p className="text-gray-500 text-sm mt-0.5">{dept.description}</p>}
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} /> {dept.duration} min per appointment</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><DollarSign size={12} /> ${dept.price.toFixed(2)} consultation fee</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Users size={12} /> {doctors.length} doctor{doctors.length !== 1 ? 's' : ''}
                                {availableCount > 0 && <span className="text-green-600 font-medium ml-1">· {availableCount} available</span>}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Doctor grid ── */}
            <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-5">Our Doctors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {doctors.map(doctor => (
                        <DoctorCard key={doctor.id} doctor={doctor} onSelect={openDrawer} />
                    ))}
                </div>
            </div>

            {/* ── Drawer overlay ── */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                    onClick={closeDrawer}
                />
            )}

            {/* ── Drawer panel ── */}
            <div className={`fixed top-0 right-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                {selectedDoctor && (
                    <>
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 ${getAvatarColor(selectedDoctor.fullName)} rounded-full flex items-center justify-center`}>
                                    <span className="text-white font-bold text-sm">{getInitials(selectedDoctor.fullName)}</span>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Dr. {selectedDoctor.fullName}</p>
                                    <p className="text-xs text-gray-500">{selectedDoctor.specialization ?? 'General Practitioner'}</p>
                                </div>
                            </div>
                            <button onClick={closeDrawer} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* Doctor info strip */}
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-6 flex-wrap">
                                {selectedDoctor.experience && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Award size={13} className="text-blue-500" />
                                        <span>{selectedDoctor.experience} yrs experience</span>
                                    </div>
                                )}
                                {selectedDoctor.rating && (
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <Star size={13} className="text-amber-400 fill-amber-400" />
                                        <span>{selectedDoctor.rating} rating</span>
                                    </div>
                                )}
                                {selectedDoctor.isAvailable ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                                        <UserCheck size={11} /> Available
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                                        <UserX size={11} /> Unavailable
                                    </span>
                                )}
                            </div>

                            {/* Slots section */}
                            <div className="px-6 py-5">
                                <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <CalendarDays size={16} className="text-blue-500" />
                                    Available Appointment Slots
                                </h3>

                                {slotsLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader className="w-6 h-6 animate-spin text-blue-500" />
                                    </div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center py-10">
                                        <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500">No upcoming slots available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {slots.map(slot => {
                                            const { date, weekday, time } = formatSlotDate(slot.slotDate)
                                            const pct = slot.slotLimit > 0 ? Math.round((slot.bookedCount / slot.slotLimit) * 100) : 100
                                            return (
                                                <div key={slot.id} className={`rounded-xl border p-4 transition-all ${slot.isFull ? 'border-gray-200 opacity-60' : 'border-gray-200 hover:border-blue-200 hover:shadow-sm'}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">{weekday}</p>
                                                            <p className="text-sm font-semibold text-gray-900">{date}</p>
                                                            <p className="text-sm font-medium text-blue-600 mt-0.5">{time}</p>
                                                        </div>
                                                        {slot.isFull
                                                            ? <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Full</span>
                                                            : <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Open</span>
                                                        }
                                                    </div>
                                                    {/* Capacity bar */}
                                                    <div className="mb-3">
                                                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                            <span className="flex items-center gap-1"><Users size={10} /> {slot.bookedCount}/{slot.slotLimit} booked</span>
                                                            <span>{slot.remainingCapacity} left</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                                                        <span className="flex items-center gap-1"><Clock size={10} /> {dept.duration} min</span>
                                                        <span className="flex items-center gap-1"><DollarSign size={10} /> ${dept.price.toFixed(2)}</span>
                                                    </div>
                                                    <button
                                                        disabled={slot.isFull}
                                                        onClick={() => openBooking(slot)}
                                                        className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${slot.isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                                    >
                                                        {slot.isFull ? 'Fully Booked' : 'Book This Slot'}
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Booking modal ── */}
            {showBooking && selectedSlot && selectedDoctor && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 ${getAvatarColor(selectedDoctor.fullName)} rounded-full flex items-center justify-center`}>
                                    <span className="text-white text-sm font-bold">{getInitials(selectedDoctor.fullName)}</span>
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900 text-sm">Book Appointment</h2>
                                    <p className="text-xs text-gray-400">Dr. {selectedDoctor.fullName} · {formatSlotDate(selectedSlot.slotDate).date}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowBooking(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        {bookSuccess ? (
                            <div className="p-8 text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <p className="font-semibold text-gray-900">Appointment Booked!</p>
                                <p className="text-sm text-gray-500 mt-1">Your appointment with Dr. {selectedDoctor.fullName} has been scheduled.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleBook} className="p-6 space-y-4">
                                {/* Slot summary */}
                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-blue-800">
                                        <CalendarDays size={14} />
                                        <span className="font-medium">{formatSlotDate(selectedSlot.slotDate).date}</span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-blue-600">
                                        <span className="flex items-center gap-1"><Clock size={11} /> {dept.duration} min</span>
                                        <span className="flex items-center gap-1"><DollarSign size={11} /> ${dept.price.toFixed(2)}</span>
                                        <span className="flex items-center gap-1"><Users size={11} /> {selectedSlot.remainingCapacity} spots left</span>
                                    </div>
                                </div>

                                {canSelectPatient && (
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Patient *</label>
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

// ─── Doctor Card ──────────────────────────────────────────────────────────────

function DoctorCard({ doctor, onSelect }: { doctor: Doctor; onSelect: (d: Doctor) => void }) {
    const avatarColor = getAvatarColor(doctor.fullName)
    const initials = getInitials(doctor.fullName)

    return (
        <button
            onClick={() => onSelect(doctor)}
            className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-md hover:border-blue-200 transition-all group w-full flex flex-col"
        >
            {/* Top row: avatar + availability */}
            <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <span className="text-white text-xl font-bold">{initials}</span>
                </div>
                {doctor.isAvailable ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                        <UserCheck size={11} /> Available
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-1 rounded-full">
                        <UserX size={11} /> Unavailable
                    </span>
                )}
            </div>

            {/* Name */}
            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">
                Dr. {doctor.fullName}
            </h3>

            {/* Specialization */}
            <p className="text-sm text-blue-600 font-medium mt-0.5">
                {doctor.specialization ?? 'General Practitioner'}
            </p>

            {/* Rating + experience */}
            <div className="flex items-center gap-3 mt-2">
                {doctor.rating && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Star size={11} className="text-amber-400 fill-amber-400" />
                        {doctor.rating}
                    </span>
                )}
                {doctor.experience && (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Award size={11} className="text-gray-400" />
                        {doctor.experience} yrs
                    </span>
                )}
            </div>

            {/* Education */}
            {doctor.education && doctor.education.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5">
                    <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1">
                        <GraduationCap size={12} className="text-gray-400" /> Qualifications
                    </p>
                    {doctor.education.slice(0, 2).map((edu, i) => (
                        <p key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                            <BookOpen size={10} className="text-gray-300 mt-0.5 flex-shrink-0" />
                            {edu}
                        </p>
                    ))}
                    {doctor.education.length > 2 && (
                        <p className="text-xs text-gray-400 italic">+{doctor.education.length - 2} more</p>
                    )}
                </div>
            )}

            {/* CTA */}
            <p className="text-xs text-blue-500 mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                View slots & book →
            </p>
        </button>
    )
}
