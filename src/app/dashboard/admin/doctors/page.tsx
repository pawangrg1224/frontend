'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import {
    Loader, Trash2, Stethoscope, Plus, X, Search,
    Camera, GraduationCap, Briefcase, Building2,
    UserCheck, ChevronDown, ChevronUp, Edit2, CheckCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DoctorProfile {
    id: string
    specialization: string | null
    profileImage: string | null
    qualifications: string[]
    experience: number | null
    departmentId: string | null
    department: { id: string; name: string } | null
}

interface Doctor {
    id: string
    fullName: string
    email: string
    createdAt: string
    doctorProfile: DoctorProfile | null
}

interface Service {
    id: string
    name: string
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

// ─── Doctor Avatar ────────────────────────────────────────────────────────────

function DoctorAvatar({ doctor, size = 'md' }: { doctor: Doctor; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'sm' ? 'w-9 h-9 text-xs' : 'w-12 h-12 text-sm'
    if (doctor.doctorProfile?.profileImage) {
        return (
            <img
                src={doctor.doctorProfile.profileImage}
                alt={doctor.fullName}
                className={`${sizeClass} rounded-full object-cover flex-shrink-0 border-2 border-white shadow-sm`}
            />
        )
    }
    return (
        <div className={`${sizeClass} ${avatarColor(doctor.fullName)} rounded-full flex items-center justify-center flex-shrink-0 font-bold text-white`}>
            {initials(doctor.fullName)}
        </div>
    )
}

// ─── Edit Doctor Modal ────────────────────────────────────────────────────────

interface EditDoctorModalProps {
    doctor: Doctor
    services: Service[]
    onClose: () => void
    onSaved: (doctor: Doctor) => void
}

function EditDoctorModal({ doctor, services, onClose, onSaved }: EditDoctorModalProps) {
    const profile = doctor.doctorProfile
    const [email, setEmail] = useState(doctor.email)
    const [specialization, setSpecialization] = useState(profile?.specialization ?? '')
    const [experience, setExperience] = useState(profile?.experience?.toString() ?? '')
    const [departmentId, setDepartmentId] = useState(profile?.departmentId ?? '')
    const [qualifications, setQualifications] = useState<string[]>(profile?.qualifications ?? [''])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(profile?.profileImage ?? null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = ev => setImagePreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const addQualification = () => setQualifications(prev => [...prev, ''])
    const removeQualification = (i: number) => setQualifications(prev => prev.filter((_, idx) => idx !== i))
    const updateQualification = (i: number, val: string) =>
        setQualifications(prev => prev.map((q, idx) => idx === i ? val : q))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate email
        if (!email.trim()) {
            setError('Email is required')
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address')
            return
        }

        setSaving(true); setError('')

        const fd = new FormData()
        fd.append('email', email.trim())
        fd.append('specialization', specialization.trim())
        fd.append('experience', experience)
        fd.append('departmentId', departmentId)
        fd.append('qualifications', JSON.stringify(qualifications.filter(q => q.trim())))
        if (imageFile) fd.append('profileImage', imageFile)

        try {
            const res = await fetch(`/api/admin/doctors/${doctor.id}`, { method: 'PATCH', body: fd })
            if (!res.ok) {
                const d = await res.json()
                throw new Error(d.message || 'Failed to update doctor')
            }
            const updatedData = await res.json()

            // Merge updated data into doctor object
            const updatedDoctor = {
                ...doctor,
                email: updatedData.email || email,
                doctorProfile: updatedData.profile || updatedData
            }
            setSuccess(true)
            setTimeout(() => { onSaved(updatedDoctor); onClose() }, 1000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update doctor')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Edit2 size={16} className="text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-900">Edit Dr. {doctor.fullName}</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                        <p className="font-semibold text-gray-900">Doctor updated successfully!</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Profile image */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="relative w-24 h-24 rounded-full cursor-pointer group"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-blue-200" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                        <Camera size={20} className="text-gray-400 group-hover:text-blue-500" />
                                        <span className="text-xs text-gray-400 mt-1">Photo</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <Camera size={12} className="text-white" />
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <p className="text-xs text-gray-400">Click to change profile photo</p>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="doctor@hospital.com"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                            />
                            <p className="text-xs text-gray-500 mt-1">⚠️ Changing email will affect doctor's login credentials</p>
                        </div>

                        {/* Specialization + Experience */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Stethoscope size={13} className="text-gray-400" /> Specialization
                                </label>
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={e => setSpecialization(e.target.value)}
                                    placeholder="e.g. Cardiology"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Briefcase size={13} className="text-gray-400" /> Experience (years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={experience}
                                    onChange={e => setExperience(e.target.value)}
                                    placeholder="e.g. 10"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Building2 size={13} className="text-gray-400" /> Department
                            </label>
                            <select
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                            >
                                <option value="">Select department (optional)</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Qualifications */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <GraduationCap size={13} className="text-gray-400" /> Qualifications
                                </label>
                                <button
                                    type="button"
                                    onClick={addQualification}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={12} /> Add more
                                </button>
                            </div>
                            <div className="space-y-2">
                                {qualifications.map((q, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={q}
                                            onChange={e => updateQualification(i, e.target.value)}
                                            placeholder={`e.g. MBBS – Harvard Medical School`}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                        />
                                        {qualifications.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQualification(i)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                        )}
                    </form>
                )}

                {/* Footer */}
                {!success && (
                    <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
                        <button
                            onClick={handleSubmit as any}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle size={16} />}
                            {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-semibold text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Add Doctor Modal ─────────────────────────────────────────────────────────

interface AddDoctorModalProps {
    services: Service[]
    onClose: () => void
    onSaved: (doctor: Doctor) => void
}

function AddDoctorModal({ services, onClose, onSaved }: AddDoctorModalProps) {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [specialization, setSpecialization] = useState('')
    const [experience, setExperience] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [qualifications, setQualifications] = useState<string[]>([''])
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [tempPassword, setTempPassword] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = ev => setImagePreview(ev.target?.result as string)
        reader.readAsDataURL(file)
    }

    const addQualification = () => setQualifications(prev => [...prev, ''])
    const removeQualification = (i: number) => setQualifications(prev => prev.filter((_, idx) => idx !== i))
    const updateQualification = (i: number, val: string) =>
        setQualifications(prev => prev.map((q, idx) => idx === i ? val : q))

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fullName.trim()) { setError('Full name is required'); return }
        if (!email.trim()) { setError('Email is required'); return }

        setSaving(true); setError('')

        const fd = new FormData()
        fd.append('fullName', fullName.trim())
        fd.append('email', email.trim())
        fd.append('specialization', specialization.trim())
        fd.append('experience', experience)
        fd.append('departmentId', departmentId)
        fd.append('qualifications', JSON.stringify(qualifications.filter(q => q.trim())))
        if (imageFile) fd.append('profileImage', imageFile)

        try {
            const res = await fetch('/api/admin/doctors', { method: 'POST', body: fd })
            if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
            const data = await res.json()
            setTempPassword(data.tempPassword || null)
            setSuccess(true)
            // Don't auto-close if we have a password to show
            if (!data.tempPassword) {
                setTimeout(() => { onSaved(data); onClose() }, 1000)
            } else {
                onSaved(data)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add doctor')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Stethoscope size={16} className="text-blue-600" />
                        </div>
                        <h2 className="font-bold text-gray-900">Add Doctor</h2>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                        <p className="font-semibold text-gray-900 mb-4">Doctor added successfully!</p>
                        {tempPassword && (
                            <div className="w-full max-w-sm bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
                                <p className="text-sm text-gray-700 font-medium mb-2">
                                    Temporary Login Credentials:
                                </p>
                                <div className="bg-white rounded-lg p-3 mb-2">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-mono text-sm font-semibold text-gray-900">{email}</p>
                                </div>
                                <div className="bg-white rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Temporary Password</p>
                                    <p className="font-mono text-sm font-semibold text-blue-600">{tempPassword}</p>
                                </div>
                                <p className="text-xs text-gray-600 mt-3">
                                    ⚠️ Please save this password and share it with the doctor. They can change it after first login.
                                </p>
                            </div>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        >
                            Close
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Profile image */}
                        <div className="flex flex-col items-center gap-3">
                            <div
                                onClick={() => fileRef.current?.click()}
                                className="relative w-24 h-24 rounded-full cursor-pointer group"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-blue-200" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                        <Camera size={20} className="text-gray-400 group-hover:text-blue-500" />
                                        <span className="text-xs text-gray-400 mt-1">Photo</span>
                                    </div>
                                )}
                                <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                    <Camera size={12} className="text-white" />
                                </div>
                            </div>
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            <p className="text-xs text-gray-400">Click to upload profile photo (max 5 MB)</p>
                        </div>

                        {/* Name + Email */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Dr. Jane Smith"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="jane@hospital.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Specialization + Experience */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Stethoscope size={13} className="text-gray-400" /> Specialization
                                </label>
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={e => setSpecialization(e.target.value)}
                                    placeholder="e.g. Cardiology"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                    <Briefcase size={13} className="text-gray-400" /> Experience (years)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="60"
                                    value={experience}
                                    onChange={e => setExperience(e.target.value)}
                                    placeholder="e.g. 10"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                />
                            </div>
                        </div>

                        {/* Department */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                                <Building2 size={13} className="text-gray-400" /> Department
                            </label>
                            <select
                                value={departmentId}
                                onChange={e => setDepartmentId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                            >
                                <option value="">Select department (optional)</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Qualifications */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                                    <GraduationCap size={13} className="text-gray-400" /> Qualifications
                                </label>
                                <button
                                    type="button"
                                    onClick={addQualification}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    <Plus size={12} /> Add more
                                </button>
                            </div>
                            <div className="space-y-2">
                                {qualifications.map((q, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={q}
                                            onChange={e => updateQualification(i, e.target.value)}
                                            placeholder={`e.g. MBBS – Harvard Medical School`}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                        />
                                        {qualifications.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQualification(i)}
                                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                        )}
                    </form>
                )}

                {/* Footer */}
                {!success && (
                    <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
                        <button
                            onClick={handleSubmit as any}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
                        >
                            {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
                            {saving ? 'Adding…' : 'Add Doctor'}
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-semibold text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DoctorsPage() {
    const { status } = useSession()

    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [search, setSearch] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

    useEffect(() => {
        if (status !== 'authenticated') return
        loadAll()
    }, [status])

    const loadAll = async () => {
        setLoading(true)
        try {
            const [dRes, sRes] = await Promise.all([
                fetch('/api/admin/doctors'),
                fetch('/api/services?limit=100'),
            ])
            const [dData, sData] = await Promise.all([dRes.json(), sRes.json()])
            setDoctors(dData.data ?? [])
            setServices(sData.data ?? [])
        } catch {
            setError('Failed to load doctors')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Delete Dr. ${name}? This will also delete all related data and cannot be undone.`)) return
        setError('')
        try {
            const res = await fetch(`/api/admin/doctors/${id}`, { method: 'DELETE' })

            // Always try to parse the response
            let data;
            try {
                data = await res.json()
            } catch (parseErr) {
                throw new Error('Server returned an invalid response')
            }

            if (!res.ok) {
                // Provide more detailed error message
                throw new Error(data.message || data.error || `Failed to delete doctor (${res.status})`)
            }

            setDoctors(prev => prev.filter(d => d.id !== id))
            flash(`Dr. ${name} deleted successfully`)
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to delete doctor'
            setError(errorMsg)
            console.error('Delete error:', err)
            // Auto-clear error after 8 seconds
            setTimeout(() => setError(''), 8000)
        }
    }

    const handleEdit = (doctor: Doctor) => {
        setEditingDoctor(doctor)
        setShowEditModal(true)
    }

    const handleResetPassword = async (doctor: Doctor) => {
        if (!confirm(`Reset password for Dr. ${doctor.fullName}? A new temporary password will be generated.`)) return
        setError('')
        try {
            const res = await fetch(`/api/admin/doctors/${doctor.id}/reset-password`, { method: 'POST' })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to reset password')
            }
            const data = await res.json()
            // Show the new password to the admin
            alert(
                `Password Reset Successful!\n\n` +
                `Doctor: Dr. ${data.fullName}\n` +
                `Email: ${data.email}\n` +
                `New Temporary Password: ${data.tempPassword}\n\n` +
                `Please save this password and share it with the doctor.`
            )
            flash(`Password reset for Dr. ${doctor.fullName}`)
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to reset password'
            setError(errorMsg)
            setTimeout(() => setError(''), 8000)
        }
    }

    const handleFixAllRoles = async () => {
        if (!confirm('Fix all doctor roles and create missing profiles? This will:\n- Update all users with doctor profiles to have DOCTOR role\n- Create profiles for DOCTOR role users without profiles')) return
        setError('')
        try {
            // First fix roles
            const rolesRes = await fetch('/api/admin/doctors/fix-roles', { method: 'POST' })
            if (!rolesRes.ok) throw new Error('Failed to fix roles')
            const rolesData = await rolesRes.json()

            // Then create missing profiles
            const profilesRes = await fetch('/api/admin/doctors/create-profiles', { method: 'POST' })
            if (!profilesRes.ok) throw new Error('Failed to create profiles')
            const profilesData = await profilesRes.json()

            const totalFixed = rolesData.fixed + profilesData.created

            if (totalFixed === 0) {
                flash('All doctors already have correct roles and profiles!')
            } else {
                const messages = []
                if (rolesData.fixed > 0) messages.push(`${rolesData.fixed} role(s)`)
                if (profilesData.created > 0) messages.push(`${profilesData.created} profile(s)`)
                flash(`Successfully fixed ${messages.join(' and ')}!`)
                // Reload doctors to show updated list
                loadAll()
            }
        } catch (err) {
            setError('Failed to fix doctor roles and profiles')
            console.error('Fix all error:', err)
        }
    }

    const toggleExpand = (id: string) => {
        setExpanded(prev => {
            const n = new Set(prev)
            n.has(id) ? n.delete(id) : n.add(id)
            return n
        })
    }

    const filtered = doctors.filter(d =>
        d.fullName.toLowerCase().includes(search.toLowerCase()) ||
        d.email.toLowerCase().includes(search.toLowerCase()) ||
        (d.doctorProfile?.specialization ?? '').toLowerCase().includes(search.toLowerCase())
    )

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{doctors.length} registered doctor{doctors.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleFixAllRoles}
                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 font-semibold text-sm shadow-sm transition-all"
                        title="Fix roles and create profiles for all doctors"
                    >
                        <UserCheck size={16} /> Sync Doctors
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors"
                    >
                        <Plus size={16} /> Add Doctor
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-5">
                {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                        <CheckCircle size={15} /> {success}
                    </div>
                )}

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or specialization…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                </div>

                {/* Doctor list */}
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Stethoscope className="w-8 h-8 text-blue-400" />
                        </div>
                        <p className="text-gray-600 font-semibold">No doctors yet</p>
                        <p className="text-gray-400 text-sm mt-1">Click "Add Doctor" to register the first doctor</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(doctor => {
                            const profile = doctor.doctorProfile
                            const isExpanded = expanded.has(doctor.id)

                            return (
                                <div key={doctor.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-sm transition-shadow">
                                    {/* Main row */}
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        {/* Avatar */}
                                        <DoctorAvatar doctor={doctor} size="md" />

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-gray-900">Dr. {doctor.fullName}</p>
                                                <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <UserCheck size={10} /> Doctor
                                                </span>
                                                {profile?.department && (
                                                    <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <Building2 size={10} /> {profile.department.name}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-xs text-gray-500 mt-0.5">{doctor.email}</p>

                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                {profile?.specialization && (
                                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                                        <Stethoscope size={11} className="text-gray-400" /> {profile.specialization}
                                                    </span>
                                                )}
                                                {profile?.experience != null && (
                                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                                        <Briefcase size={11} className="text-gray-400" /> {profile.experience} yrs exp
                                                    </span>
                                                )}
                                                {profile?.qualifications && profile.qualifications.length > 0 && (
                                                    <span className="text-xs text-gray-600 flex items-center gap-1">
                                                        <GraduationCap size={11} className="text-gray-400" /> {profile.qualifications.length} qualification{profile.qualifications.length !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {(profile?.qualifications?.length ?? 0) > 0 && (
                                                <button
                                                    onClick={() => toggleExpand(doctor.id)}
                                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                    Details
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEdit(doctor)}
                                                className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit doctor"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(doctor)}
                                                className="p-2 text-orange-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                title="Reset password"
                                            >
                                                <UserCheck size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(doctor.id, doctor.fullName)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete doctor"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded qualifications */}
                                    {isExpanded && profile && (
                                        <div className="px-5 pb-4 border-t border-gray-100 pt-3 bg-gray-50/50">
                                            {profile.qualifications.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                                        <GraduationCap size={12} /> Qualifications
                                                    </p>
                                                    <div className="space-y-1.5">
                                                        {profile.qualifications.map((q, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                                                {q}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Add Doctor Modal */}
            {showAddModal && (
                <AddDoctorModal
                    services={services}
                    onClose={() => setShowAddModal(false)}
                    onSaved={(doctor) => {
                        setDoctors(prev => [doctor, ...prev])
                        flash(`Dr. ${doctor.fullName} added`)
                    }}
                />
            )}

            {/* Edit Doctor Modal */}
            {showEditModal && editingDoctor && (
                <EditDoctorModal
                    doctor={editingDoctor}
                    services={services}
                    onClose={() => {
                        setShowEditModal(false)
                        setEditingDoctor(null)
                    }}
                    onSaved={(updatedDoctor) => {
                        setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d))
                        flash(`Dr. ${updatedDoctor.fullName} updated`)
                    }}
                />
            )}
        </div>
    )
}
