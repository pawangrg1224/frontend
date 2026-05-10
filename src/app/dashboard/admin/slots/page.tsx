'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
    Stethoscope, UserCheck, UserX, UserPlus, X, Loader,
    Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
    Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield,
    Clock, DollarSign, ChevronLeft, ChevronRight, Plus,
    Calendar, Trash2, CheckCircle, AlertCircle, Users,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Service {
    id: string
    name: string
    description?: string
    duration: number
    price: number
    doctorName: string | null
}

interface Doctor {
    id: string
    fullName: string
    email: string
    doctorProfile: { id: string; specialization: string | null; departmentId: string | null } | null
}

interface Slot {
    id: string
    doctorName: string
    slotDate: string
    slotLimit: number
    isOpen: boolean
    bookedCount: number
    availableCount: number
    isFull: boolean
    service: { id: string; name: string }
}

// ─── Dept icon map ────────────────────────────────────────────────────────────

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

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_COLORS = ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-pink-500']
function avatarColor(name: string) {
    let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

// ─── Calendar helpers ─────────────────────────────────────────────────────────

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
    return new Date(year, month, 1).getDay()
}
function toDateKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
function todayKey() {
    const d = new Date()
    return toDateKey(d.getFullYear(), d.getMonth(), d.getDate())
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

interface MiniCalendarProps {
    slotsByDate: Record<string, Slot[]>
    onDateClick: (dateKey: string) => void
}

function MiniCalendar({ slotsByDate, onDateClick }: MiniCalendarProps) {
    const today = new Date()
    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth())

    const daysInMonth = getDaysInMonth(year, month)
    const firstDay = getFirstDayOfMonth(year, month)
    const tk = todayKey()

    const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
    const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

    // Build grid cells
    const cells: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 select-none">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <span className="text-sm font-semibold text-gray-800">{MONTHS[month]} {year}</span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                    <ChevronRight size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                ))}
            </div>

            {/* Date cells */}
            <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, i) => {
                    if (!day) return <div key={`empty-${i}`} />
                    const key = toDateKey(year, month, day)
                    const isToday = key === tk
                    const isPast = key < tk
                    const hasSlots = !!slotsByDate[key]?.length
                    const slotCount = slotsByDate[key]?.length ?? 0

                    return (
                        <button
                            key={key}
                            disabled={isPast}
                            onClick={() => onDateClick(key)}
                            className={`
                relative flex flex-col items-center justify-center h-9 w-full rounded-lg text-xs font-medium transition-all
                ${isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 hover:text-blue-700'}
                ${isToday ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : ''}
                ${hasSlots && !isToday ? 'bg-green-50 text-green-700 border border-green-200' : ''}
              `}
                        >
                            {day}
                            {hasSlots && (
                                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-green-500'}`} />
                            )}
                            {hasSlots && slotCount > 1 && !isToday && (
                                <span className="absolute -top-1 -right-1 text-[9px] font-bold bg-blue-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center">
                                    {slotCount}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-green-500" /> Has slots
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <div className="w-2 h-2 rounded-full bg-blue-600" /> Today
                </div>
            </div>
        </div>
    )
}

// ─── Add Slot Modal ───────────────────────────────────────────────────────────

interface AddSlotModalProps {
    dateKey: string
    service: Service
    doctors: Doctor[]
    existingSlots: Slot[]
    onClose: () => void
    onSaved: (slot: Slot) => void
}

interface ChangeDoctorModalProps {
    slot: Slot
    service: Service
    doctors: Doctor[]
    onClose: () => void
    onSaved: (slot: Slot) => void
}

const TIME_SLOTS: string[] = []  // Removed fixed preset times

function formatTime(t: string) {
    const [h, m] = t.split(':').map(Number)
    const nextHour = h + 1

    // Format start time
    const startAmpm = h >= 12 ? 'pm' : 'am'
    const startH12 = h > 12 ? h - 12 : h === 0 ? 12 : h

    // Format end time
    const endAmpm = nextHour >= 12 ? 'pm' : 'am'
    const endH12 = nextHour > 12 ? nextHour - 12 : nextHour === 0 ? 12 : nextHour

    // Show range like "8 to 9" or "8pm to 9pm"
    if (startAmpm === endAmpm) {
        // Same period, show AM/PM only once: "8 to 9pm"
        return `${startH12} to ${endH12}${endAmpm}`
    } else {
        // Different periods, show both: "11am to 12pm"
        return `${startH12}${startAmpm} to ${endH12}${endAmpm}`
    }
}

function formatDateDisplay(key: string) {
    const [y, mo, d] = key.split('-').map(Number)
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Change Doctor Modal ──────────────────────────────────────────────────────

function ChangeDoctorModal({ slot, service, doctors, onClose, onSaved }: ChangeDoctorModalProps) {
    const [selectedDoctor, setSelectedDoctor] = useState(slot.doctorName)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    // Filter doctors by department
    const departmentDoctors = doctors.filter(d => d.doctorProfile?.departmentId === service.id)

    const handleSave = async () => {
        if (!selectedDoctor) {
            setError('Please select a doctor')
            return
        }

        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/slots/${slot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorName: selectedDoctor }),
            })

            if (res.ok) {
                const updated = await res.json()
                onSaved(updated)
                onClose()
            } else {
                setError('Failed to update doctor')
            }
        } catch (err) {
            setError('An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const d = new Date(slot.slotDate)
    const dateStr = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const timeStr = formatTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="font-bold text-gray-900">Change Doctor</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{dateStr} · {timeStr}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Select Doctor *</label>
                        {departmentDoctors.length === 0 ? (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                                <AlertCircle size={14} /> No doctors assigned to this department
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {departmentDoctors.map(doc => (
                                    <button
                                        key={doc.id}
                                        type="button"
                                        onClick={() => setSelectedDoctor(doc.fullName)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${selectedDoctor === doc.fullName
                                            ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                                            : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 ${avatarColor(doc.fullName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-white text-xs font-bold">{initials(doc.fullName)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm">Dr. {doc.fullName}</p>
                                            <p className="text-xs text-gray-500">{doc.doctorProfile?.specialization ?? 'General Practitioner'}</p>
                                        </div>
                                        {selectedDoctor === doc.fullName && (
                                            <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            <AlertCircle size={14} /> {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving || departmentDoctors.length === 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm transition-colors"
                    >
                        {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                        {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Add Slot Modal ───────────────────────────────────────────────────────────

function AddSlotModal({ dateKey, service, doctors, existingSlots, onClose, onSaved }: AddSlotModalProps) {
    const [doctorName, setDoctorName] = useState(service.doctorName ?? (doctors[0]?.fullName ?? ''))
    const [selectedTimes, setSelectedTimes] = useState<string[]>([])
    const [slotLimit, setSlotLimit] = useState('10')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [savedCount, setSavedCount] = useState(0)

    // Time picker state - Start and End time
    const [startHour, setStartHour] = useState('8')
    const [startMinute, setStartMinute] = useState('00')
    const [startPeriod, setStartPeriod] = useState('am')
    const [endHour, setEndHour] = useState('9')
    const [endMinute, setEndMinute] = useState('00')
    const [endPeriod, setEndPeriod] = useState('am')

    // Filter doctors by department
    const departmentDoctors = doctors.filter(d => d.doctorProfile?.departmentId === service.id)

    // Times already booked for this date+service
    const bookedTimes = new Set(
        existingSlots
            .filter(s => s.slotDate.startsWith(dateKey))
            .map(s => {
                const d = new Date(s.slotDate)
                return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            })
    )

    const toggleTime = (t: string) => {
        setSelectedTimes(prev =>
            prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
        )
    }

    const addTimeSlot = () => {
        // Convert 12-hour format to 24-hour format for start time
        let startHour24 = parseInt(startHour)
        if (startPeriod === 'pm' && startHour24 !== 12) {
            startHour24 += 12
        } else if (startPeriod === 'am' && startHour24 === 12) {
            startHour24 = 0
        }

        // Convert 12-hour format to 24-hour format for end time
        let endHour24 = parseInt(endHour)
        if (endPeriod === 'pm' && endHour24 !== 12) {
            endHour24 += 12
        } else if (endPeriod === 'am' && endHour24 === 12) {
            endHour24 = 0
        }

        const startTime = startHour24 * 60 + parseInt(startMinute)
        const endTime = endHour24 * 60 + parseInt(endMinute)

        if (endTime <= startTime) {
            setError('End time must be after start time')
            return
        }

        // Generate hourly slots between start and end time
        const newSlots: string[] = []
        for (let time = startTime; time < endTime; time += 60) {
            const h = Math.floor(time / 60)
            const m = time % 60
            const timeString = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

            if (bookedTimes.has(timeString)) {
                setError(`Time ${formatTime(timeString)} already has a slot`)
                return
            }

            if (!selectedTimes.includes(timeString)) {
                newSlots.push(timeString)
            }
        }

        if (newSlots.length === 0) {
            setError('All times in this range are already selected')
            return
        }

        setSelectedTimes(prev => [...prev, ...newSlots].sort())
        setError('')
    }

    const removeTime = (t: string) => {
        setSelectedTimes(prev => prev.filter(x => x !== t))
    }

    const handleSave = async () => {
        if (!doctorName) { setError('Please select a doctor'); return }
        if (selectedTimes.length === 0) { setError('Select at least one time slot'); return }
        if (Number(slotLimit) < 1) { setError('Slot limit must be at least 1'); return }

        setSaving(true); setError('')
        let saved = 0

        for (const time of selectedTimes) {
            const [h, m] = time.split(':').map(Number)
            const [y, mo, d] = dateKey.split('-').map(Number)
            const slotDate = new Date(y, mo - 1, d, h, m, 0, 0).toISOString()

            const res = await fetch('/api/slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: service.id,
                    doctorName,
                    slotDate,
                    slotLimit: Number(slotLimit),
                }),
            })

            if (res.ok) {
                const slot = await res.json()
                onSaved({ ...slot, bookedCount: 0, availableCount: Number(slotLimit), isFull: false })
                saved++
            }
        }

        setSaving(false)
        if (saved > 0) {
            setSavedCount(saved)
            setTimeout(onClose, 1200)
        } else {
            setError('Failed to create slots')
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div>
                        <h2 className="font-bold text-gray-900">Add Appointment Slots</h2>
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                            <Calendar size={11} /> {formatDateDisplay(dateKey)} · {service.name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {savedCount > 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                        <p className="font-semibold text-gray-900">{savedCount} slot{savedCount !== 1 ? 's' : ''} created!</p>
                        <p className="text-sm text-gray-500 mt-1">Closing…</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Doctor selector */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor *</label>
                            {departmentDoctors.length === 0 ? (
                                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                                    <AlertCircle size={14} /> No doctors assigned to this department
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {departmentDoctors.map(doc => (
                                        <button
                                            key={doc.id}
                                            type="button"
                                            onClick={() => setDoctorName(doc.fullName)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${doctorName === doc.fullName
                                                ? 'border-blue-400 bg-blue-50 ring-1 ring-blue-300'
                                                : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className={`w-9 h-9 ${avatarColor(doc.fullName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-white text-xs font-bold">{initials(doc.fullName)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-gray-900 text-sm">Dr. {doc.fullName}</p>
                                                <p className="text-xs text-gray-500">{doc.doctorProfile?.specialization ?? 'General Practitioner'}</p>
                                            </div>
                                            {doctorName === doc.fullName && (
                                                <CheckCircle size={16} className="text-blue-500 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Time Selection with Dropdowns */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Add Time Slots *</label>

                            {/* Time Picker Dropdowns - Start and End Time */}
                            <div className="space-y-3 mb-3">
                                {/* Start Time */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">Start Time</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={startHour}
                                            onChange={(e) => setStartHour(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            {[...Array(12)].map((_, i) => {
                                                const h = i + 1
                                                return <option key={h} value={h}>{h}</option>
                                            })}
                                        </select>

                                        <select
                                            value={startMinute}
                                            onChange={(e) => setStartMinute(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>

                                        <select
                                            value={startPeriod}
                                            onChange={(e) => setStartPeriod(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            <option value="am">AM</option>
                                            <option value="pm">PM</option>
                                        </select>
                                    </div>
                                </div>

                                {/* End Time */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-1 block">End Time</label>
                                    <div className="flex gap-2">
                                        <select
                                            value={endHour}
                                            onChange={(e) => setEndHour(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            {[...Array(12)].map((_, i) => {
                                                const h = i + 1
                                                return <option key={h} value={h}>{h}</option>
                                            })}
                                        </select>

                                        <select
                                            value={endMinute}
                                            onChange={(e) => setEndMinute(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            <option value="00">00</option>
                                            <option value="15">15</option>
                                            <option value="30">30</option>
                                            <option value="45">45</option>
                                        </select>

                                        <select
                                            value={endPeriod}
                                            onChange={(e) => setEndPeriod(e.target.value)}
                                            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-medium"
                                        >
                                            <option value="am">AM</option>
                                            <option value="pm">PM</option>
                                        </select>

                                        <button
                                            type="button"
                                            onClick={addTimeSlot}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1 whitespace-nowrap"
                                        >
                                            <Plus size={14} /> Add Range
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Show selected times */}
                            {selectedTimes.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-medium text-gray-600">Selected times:</p>
                                        <span className="text-xs text-blue-600 font-medium">{selectedTimes.length} slot{selectedTimes.length !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTimes.map(t => (
                                            <div key={t} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
                                                <span>{formatTime(t)}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeTime(t)}
                                                    className="hover:text-blue-900 ml-1"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Slot limit */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Max Patients per Slot *
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSlotLimit(v => String(Math.max(1, Number(v) - 1)))}
                                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold"
                                >−</button>
                                <input
                                    type="number"
                                    min="1"
                                    max="200"
                                    value={slotLimit}
                                    onChange={e => setSlotLimit(e.target.value)}
                                    className="w-20 text-center px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm font-semibold"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSlotLimit(v => String(Math.min(200, Number(v) + 1)))}
                                    className="w-9 h-9 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold"
                                >+</button>
                                <span className="text-xs text-gray-400">patients max</span>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {savedCount === 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
                        <button
                            onClick={handleSave}
                            disabled={saving || departmentDoctors.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm transition-colors"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                            {saving ? 'Creating…' : `Create ${selectedTimes.length > 0 ? selectedTimes.length : ''} Slot${selectedTimes.length !== 1 ? 's' : ''}`}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-semibold text-sm transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Assign Doctor Modal ──────────────────────────────────────────────────────

interface AssignDoctorModalProps {
    service: Service
    doctors: Doctor[]
    onClose: () => void
    onAssigned: (doctor: Doctor) => void
}

function AssignDoctorModal({ service, doctors, onClose, onAssigned }: AssignDoctorModalProps) {
    const [assigning, setAssigning] = useState(false)
    const [error, setError] = useState('')

    // Filter out doctors already assigned to this department
    const unassignedDoctors = doctors.filter(d => d.doctorProfile?.departmentId !== service.id)

    const handleAssign = async (doctor: Doctor) => {
        setAssigning(true); setError('')
        try {
            // Assign doctor to department by setting departmentId
            const res = await fetch(`/api/admin/doctors/${doctor.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ departmentId: service.id }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
            onAssigned(doctor)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to assign')
        } finally {
            setAssigning(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                    <div>
                        <h2 className="font-bold text-gray-900 text-sm">Assign Doctor</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{service.name}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={16} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-4">
                    {doctors.length === 0 ? (
                        <div className="text-center py-6">
                            <UserX className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No doctors registered</p>
                            <p className="text-xs text-gray-400 mt-1">Go to Staff → Make Doctor first</p>
                        </div>
                    ) : unassignedDoctors.length === 0 ? (
                        <div className="text-center py-6">
                            <UserCheck className="w-8 h-8 text-green-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">All doctors assigned</p>
                            <p className="text-xs text-gray-400 mt-1">All available doctors are already assigned to this department</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-72 overflow-y-auto">
                            {unassignedDoctors.map(doc => (
                                <button
                                    key={doc.id}
                                    disabled={assigning}
                                    onClick={() => handleAssign(doc)}
                                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-left transition-all disabled:opacity-50"
                                >
                                    <div className={`w-9 h-9 ${avatarColor(doc.fullName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <span className="text-white text-xs font-bold">{initials(doc.fullName)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm">Dr. {doc.fullName}</p>
                                        <p className="text-xs text-gray-500 truncate">{doc.doctorProfile?.specialization ?? 'General Practitioner'}</p>
                                    </div>
                                    {assigning && <Loader className="w-3 h-3 animate-spin text-blue-500" />}
                                </button>
                            ))}
                        </div>
                    )}
                    {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSlotsPage() {
    const { status } = useSession()

    const [services, setServices] = useState<Service[]>([])
    const [allDoctors, setAllDoctors] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedService, setSelectedService] = useState<Service | null>(null)
    const [serviceSlots, setServiceSlots] = useState<Slot[]>([])
    const [slotsLoading, setSlotsLoading] = useState(false)
    const [success, setSuccess] = useState('')

    // Modals
    const [addSlotDate, setAddSlotDate] = useState<string | null>(null)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [changeDoctorSlot, setChangeDoctorSlot] = useState<Slot | null>(null)

    const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

    // ── Load services + doctors ──────────────────────────────────────────────

    useEffect(() => {
        if (status !== 'authenticated') return
        Promise.all([
            fetch('/api/services?limit=100').then(r => r.json()),
            fetch('/api/admin/doctors').then(r => r.json()),
        ]).then(([svcData, docData]) => {
            const svcs: Service[] = svcData.data ?? []
            setServices(svcs)
            setAllDoctors(docData.data ?? [])
            if (svcs.length > 0) setSelectedService(svcs[0])
        }).finally(() => setLoading(false))
    }, [status])

    // ── Load slots for selected service ─────────────────────────────────────

    const loadServiceSlots = useCallback(async (serviceId: string) => {
        setSlotsLoading(true)
        const res = await fetch(`/api/slots?serviceId=${serviceId}`)
        const data = await res.json()
        setServiceSlots(data.data ?? [])
        setSlotsLoading(false)
    }, [])

    useEffect(() => {
        if (selectedService) loadServiceSlots(selectedService.id)
    }, [selectedService, loadServiceSlots])

    // ── Doctors for selected service ─────────────────────────────────────────

    const serviceDoctors = selectedService
        ? allDoctors.filter(d =>
            // Primary: doctor assigned to this service
            d.fullName === selectedService.doctorName ||
            // Also include all doctors (admin can assign any doctor to a slot)
            true
        )
        : allDoctors

    // Slots grouped by date key
    const slotsByDate: Record<string, Slot[]> = {}
    for (const slot of serviceSlots) {
        const key = slot.slotDate.split('T')[0]
        if (!slotsByDate[key]) slotsByDate[key] = []
        slotsByDate[key].push(slot)
    }

    // ── Handlers ─────────────────────────────────────────────────────────────

    const handleSlotSaved = (slot: Slot) => {
        setServiceSlots(prev => [...prev, slot])
        flash('Slot created!')
    }

    const handleDeleteSlot = async (slotId: string) => {
        if (!confirm('Delete this slot?')) return
        const res = await fetch(`/api/slots/${slotId}`, { method: 'DELETE' })
        if (res.ok) {
            setServiceSlots(prev => prev.filter(s => s.id !== slotId))
            flash('Slot deleted')
        }
    }

    const handleToggleSlot = async (slot: Slot) => {
        await fetch(`/api/slots/${slot.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOpen: !slot.isOpen }),
        })
        setServiceSlots(prev => prev.map(s => s.id === slot.id ? { ...s, isOpen: !s.isOpen } : s))
    }

    const handleDoctorAssigned = (doctorName: string) => {
        setServices(prev => prev.map(s => s.id === selectedService!.id ? { ...s, doctorName } : s))
        setSelectedService(prev => prev ? { ...prev, doctorName } : prev)
        setShowAssignModal(false)
        flash(`Dr. ${doctorName} assigned to ${selectedService!.name}`)
    }

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Appointment Slots</h1>
                <p className="text-gray-500 text-xs mt-0.5">Select a department → assign doctor → click calendar dates to add slots</p>
            </div>

            {success && (
                <div className="mx-6 mt-4 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium shrink-0">
                    <CheckCircle size={15} /> {success}
                </div>
            )}

            {/* ── Main 2-column layout ── */}
            <div className="flex flex-1 overflow-hidden">

                {/* ── LEFT: Department list ── */}
                <div className="w-64 shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Departments</p>
                    </div>
                    {services.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-400">No departments yet</div>
                    ) : (
                        <div className="py-2">
                            {services.map(svc => {
                                const { icon: Icon, color, bg } = getDeptIcon(svc.name)
                                const isSelected = selectedService?.id === svc.id
                                const svcSlotCount = svc.id === selectedService?.id
                                    ? serviceSlots.length
                                    : 0

                                return (
                                    <button
                                        key={svc.id}
                                        onClick={() => setSelectedService(svc)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${isSelected
                                            ? 'bg-blue-50 border-r-2 border-blue-600'
                                            : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`w-4 h-4 ${color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                                                {svc.name}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">
                                                {svc.doctorName ? `Dr. ${svc.doctorName}` : 'No doctor'}
                                            </p>
                                        </div>
                                        {isSelected && svcSlotCount > 0 && (
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                                                {svcSlotCount}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Detail panel ── */}
                {!selectedService ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                            <p className="text-sm">Select a department</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Dept header */}
                        {(() => {
                            const { icon: Icon, color, bg } = getDeptIcon(selectedService.name)
                            return (
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl font-bold text-gray-900">{selectedService.name}</h2>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                                            <span className="flex items-center gap-1"><Clock size={11} /> {selectedService.duration} min</span>
                                            <span className="flex items-center gap-1"><DollarSign size={11} /> ${selectedService.price.toFixed(2)}</span>
                                            <span className="flex items-center gap-1"><Users size={11} /> {serviceSlots.length} slots total</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* ── Two-column: Doctor info + Calendar ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                            {/* Left: Doctor info + assign */}
                            <div className="space-y-4">
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm font-semibold text-gray-700">Assigned Doctor</h3>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                                        >
                                            <UserPlus size={12} />
                                            {selectedService.doctorName ? 'Change' : 'Assign Doctor'}
                                        </button>
                                    </div>

                                    {selectedService.doctorName ? (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl">
                                            <div className={`w-12 h-12 ${avatarColor(selectedService.doctorName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                <span className="text-white font-bold">{initials(selectedService.doctorName)}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-gray-900">Dr. {selectedService.doctorName}</p>
                                                <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                                    <UserCheck size={11} /> Assigned to this department
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                            <UserX className="w-8 h-8 text-amber-400" />
                                            <div>
                                                <p className="text-sm font-medium text-amber-800">No doctor assigned</p>
                                                <p className="text-xs text-amber-600 mt-0.5">Assign a doctor to enable slot creation</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Department Doctors */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">
                                            Department Doctors ({allDoctors.filter(d => d.doctorProfile?.departmentId === selectedService.id).length})
                                        </h3>
                                        <button
                                            onClick={() => setShowAssignModal(true)}
                                            className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                                        >
                                            <Plus size={12} />
                                            Assign Doctor
                                        </button>
                                    </div>

                                    {allDoctors.filter(d => d.doctorProfile?.departmentId === selectedService.id).length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-6 text-center">
                                            <UserX className="w-10 h-10 text-gray-300 mb-2" />
                                            <p className="text-xs text-gray-500 font-medium">No doctors assigned</p>
                                            <p className="text-xs text-gray-400 mt-1">Click "Assign Doctor" to add doctors to this department</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {allDoctors
                                                .filter(d => d.doctorProfile?.departmentId === selectedService.id)
                                                .map(doc => (
                                                    <div key={doc.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                                        <div className={`w-8 h-8 ${avatarColor(doc.fullName)} rounded-full flex items-center justify-center flex-shrink-0`}>
                                                            <span className="text-white text-xs font-bold">{initials(doc.fullName)}</span>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 truncate">Dr. {doc.fullName}</p>
                                                            <p className="text-xs text-gray-400 truncate">{doc.doctorProfile?.specialization ?? 'General Practitioner'}</p>
                                                        </div>
                                                        <button
                                                            onClick={async () => {
                                                                if (!confirm(`Remove Dr. ${doc.fullName} from this department?`)) return
                                                                // Unassign doctor by setting departmentId to null
                                                                const res = await fetch(`/api/admin/doctors/${doc.id}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ departmentId: null }),
                                                                })
                                                                if (res.ok) {
                                                                    setAllDoctors(prev => prev.map(d =>
                                                                        d.id === doc.id
                                                                            ? { ...d, doctorProfile: d.doctorProfile ? { ...d.doctorProfile, departmentId: null } : null }
                                                                            : d
                                                                    ))
                                                                    flash(`Dr. ${doc.fullName} removed from department`)
                                                                }
                                                            }}
                                                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                            title="Remove from department"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right: Calendar */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-700">Slot Calendar</h3>
                                        <p className="text-xs text-gray-400">Click a date to add slots</p>
                                    </div>
                                    {slotsLoading ? (
                                        <div className="flex items-center justify-center h-48 bg-white rounded-xl border border-gray-200">
                                            <Loader className="w-6 h-6 animate-spin text-blue-500" />
                                        </div>
                                    ) : (
                                        <MiniCalendar
                                            slotsByDate={slotsByDate}
                                            onDateClick={(dateKey) => setAddSlotDate(dateKey)}
                                        />
                                    )}
                                </div>

                                {/* Upcoming slots list */}
                                {serviceSlots.length > 0 && (
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Upcoming Slots</h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {[...serviceSlots]
                                                .sort((a, b) => new Date(a.slotDate).getTime() - new Date(b.slotDate).getTime())
                                                .slice(0, 20)
                                                .map(slot => {
                                                    const d = new Date(slot.slotDate)
                                                    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                                                    const pct = slot.slotLimit > 0 ? Math.round((slot.bookedCount / slot.slotLimit) * 100) : 0
                                                    return (
                                                        <div key={slot.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                                            <div className="text-center min-w-[40px]">
                                                                <p className="text-xs font-bold text-gray-800">{dateStr}</p>
                                                                <p className="text-xs text-gray-400">{timeStr}</p>
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-medium text-gray-700 truncate">Dr. {slot.doctorName}</p>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div className={`h-full rounded-full ${pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">{slot.bookedCount}/{slot.slotLimit}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${slot.isFull ? 'bg-red-100 text-red-600' : slot.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                                    {slot.isFull ? 'Full' : slot.isOpen ? 'Open' : 'Closed'}
                                                                </span>
                                                                <button
                                                                    onClick={() => setChangeDoctorSlot(slot)}
                                                                    className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                    title="Change Doctor"
                                                                >
                                                                    <Users size={12} />
                                                                </button>
                                                                <button onClick={() => handleDeleteSlot(slot.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Add Slot Modal ── */}
            {addSlotDate && selectedService && (
                <AddSlotModal
                    dateKey={addSlotDate}
                    service={selectedService}
                    doctors={allDoctors}
                    existingSlots={serviceSlots}
                    onClose={() => setAddSlotDate(null)}
                    onSaved={handleSlotSaved}
                />
            )}

            {/* ── Change Doctor Modal ── */}
            {changeDoctorSlot && selectedService && (
                <ChangeDoctorModal
                    slot={changeDoctorSlot}
                    service={selectedService}
                    doctors={allDoctors}
                    onClose={() => setChangeDoctorSlot(null)}
                    onSaved={(updated) => {
                        setServiceSlots(prev => prev.map(s => s.id === updated.id ? updated : s))
                        setChangeDoctorSlot(null)
                    }}
                />
            )}

            {/* ── Assign Doctor Modal ── */}
            {showAssignModal && selectedService && (
                <AssignDoctorModal
                    service={selectedService}
                    doctors={allDoctors}
                    onClose={() => setShowAssignModal(false)}
                    onAssigned={handleDoctorAssigned}
                />
            )}
        </div>
    )
}
