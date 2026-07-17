'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader, User, Mail, Briefcase, Award, Calendar, Edit2, X, Camera, Plus, Trash2 } from 'lucide-react'
import { toast, Toaster } from 'sonner'
import Image from 'next/image'

interface DoctorProfile {
    id: string
    userId: string
    specialization: string | null
    profileImage: string | null
    qualifications: string[]
    experience: number | null
    department: { id: string; name: string } | null
    departmentId: string | null
    departmentStartDate: string | null
    user: {
        fullName: string
        email: string
    }
}

interface Department {
    id: string
    name: string
}

export default function DoctorProfilePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [profile, setProfile] = useState<DoctorProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [departments, setDepartments] = useState<Department[]>([])

    // Form state
    const [specialization, setSpecialization] = useState('')
    const [experience, setExperience] = useState('')
    const [departmentId, setDepartmentId] = useState('')
    const [qualifications, setQualifications] = useState<string[]>([])
    const [newQualification, setNewQualification] = useState('')
    const [profileImage, setProfileImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const fileRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchProfile()
            fetchDepartments()
        }
    }, [status])

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/doctor/profile')
            if (res.ok) {
                const data = await res.json()
                setProfile(data)
                // Pre-fill form
                setSpecialization(data.specialization || '')
                setExperience(data.experience?.toString() || '')
                setDepartmentId(data.departmentId || '')
                setQualifications(data.qualifications || [])
                setImagePreview(data.profileImage)
            } else {
                toast.error('Failed to load profile')
            }
        } catch (error) {
            toast.error('Failed to load profile')
        } finally {
            setLoading(false)
        }
    }

    const fetchDepartments = async () => {
        try {
            console.log('Fetching departments...')
            const res = await fetch('/api/services?limit=100')
            console.log('Response status:', res.status)

            if (res.ok) {
                const data = await res.json()
                console.log('Departments fetched:', data)
                console.log('Number of departments:', data.data?.length || 0)
                setDepartments(data.data || [])
            } else {
                console.error('Failed to fetch departments, status:', res.status)
                const errorData = await res.json().catch(() => ({}))
                console.error('Error data:', errorData)
                toast.error('Failed to load departments')
            }
        } catch (error) {
            console.error('Failed to fetch departments:', error)
            toast.error('Failed to load departments')
        }
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Image must be under 5 MB')
                return
            }
            setProfileImage(file)
            setImagePreview(URL.createObjectURL(file))
        }
    }

    const addQualification = () => {
        if (newQualification.trim()) {
            setQualifications([...qualifications, newQualification.trim()])
            setNewQualification('')
        }
    }

    const removeQualification = (index: number) => {
        setQualifications(qualifications.filter((_, i) => i !== index))
    }

    const handleSave = async () => {
        if (!specialization.trim()) {
            toast.error('Please enter your specialization')
            return
        }

        setSaving(true)
        try {
            const formData = new FormData()
            formData.append('specialization', specialization.trim())
            formData.append('experience', experience.trim())
            formData.append('departmentId', departmentId)
            formData.append('qualifications', JSON.stringify(qualifications))
            if (profileImage) {
                formData.append('profileImage', profileImage)
            }

            const res = await fetch('/api/doctor/profile', {
                method: 'PUT',
                body: formData,
            })

            if (res.ok) {
                toast.success('Profile updated successfully!')
                setShowEditModal(false)
                fetchProfile()
            } else {
                const data = await res.json()
                toast.error(data.message || 'Failed to update profile')
            }
        } catch (error) {
            toast.error('Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                    <p className="text-yellow-800">
                        Unable to load profile. Please try again or contact administrator.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Toaster position="top-right" richColors />

            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
                    <p className="text-gray-600">View and manage your professional information</p>
                </div>
                <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm transition-colors"
                >
                    <Edit2 size={16} /> Edit Profile
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Cover */}
                <div className="h-32 bg-gradient-to-r from-blue-600 to-teal-600"></div>

                {/* Profile Content */}
                <div className="px-6 pb-6">
                    {/* Profile Image */}
                    <div className="flex items-end gap-6 -mt-16 mb-6">
                        <div className="relative">
                            {profile.profileImage ? (
                                <Image
                                    src={profile.profileImage}
                                    alt={profile.user.fullName}
                                    width={120}
                                    height={120}
                                    className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg object-cover"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-lg bg-blue-100 flex items-center justify-center">
                                    <User className="w-16 h-16 text-blue-600" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900">Dr. {profile.user.fullName}</h2>
                            <p className="text-gray-600">{profile.specialization || 'General Physician'}</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Email */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Mail size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Email</p>
                                <p className="text-gray-900">{profile.user.email}</p>
                            </div>
                        </div>

                        {/* Specialization */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase size={20} className="text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Specialization</p>
                                <p className="text-gray-900">{profile.specialization || 'Not specified'}</p>
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar size={20} className="text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Experience</p>
                                <p className="text-gray-900">
                                    {profile.experience ? `${profile.experience} years` : 'Not specified'}
                                </p>
                            </div>
                        </div>

                        {/* Department */}
                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Briefcase size={20} className="text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium mb-1">Department</p>
                                <p className="text-gray-900">{profile.department?.name || 'Not assigned'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Qualifications */}
                    <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Award size={20} className="text-blue-600" />
                            <h3 className="text-lg font-bold text-gray-900">Qualifications</h3>
                        </div>
                        {profile.qualifications && profile.qualifications.length > 0 ? (
                            <div className="space-y-2">
                                {profile.qualifications.map((qual, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg"
                                    >
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        <p className="text-gray-900">{qual}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No qualifications added yet</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Edit2 size={16} className="text-blue-600" />
                                </div>
                                <h2 className="font-bold text-gray-900">Edit Profile</h2>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Profile Image */}
                            <div className="flex flex-col items-center gap-3">
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="relative w-24 h-24 rounded-full cursor-pointer group"
                                >
                                    {imagePreview ? (
                                        <Image src={imagePreview} alt="Preview" width={96} height={96} className="w-24 h-24 rounded-full object-cover border-2 border-blue-200" />
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                            <Camera size={20} className="text-gray-400 group-hover:text-blue-500" />
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                                        <Camera size={12} className="text-white" />
                                    </div>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                <p className="text-xs text-gray-400">Click to change profile photo</p>
                            </div>

                            {/* Specialization */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Specialization *</label>
                                <input
                                    type="text"
                                    value={specialization}
                                    onChange={(e) => setSpecialization(e.target.value)}
                                    placeholder="e.g., Cardiology, Pediatrics, General Medicine"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            {/* Experience */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Experience (years)</label>
                                <input
                                    type="number"
                                    value={experience}
                                    onChange={(e) => setExperience(e.target.value)}
                                    placeholder="e.g., 5"
                                    min="0"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                />
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                                <select
                                    value={departmentId}
                                    onChange={(e) => setDepartmentId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                >
                                    <option value="">Select a department</option>
                                    {departments.length === 0 ? (
                                        <option value="" disabled>No departments available - contact admin</option>
                                    ) : (
                                        departments.map((dept) => (
                                            <option key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </option>
                                        ))
                                    )}
                                </select>
                                {departments.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1.5">
                                        No departments found. Please ask the administrator to create departments first.
                                    </p>
                                )}
                            </div>

                            {/* Qualifications */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Qualifications</label>
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newQualification}
                                        onChange={(e) => setNewQualification(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addQualification())}
                                        placeholder="e.g., MBBS, MD"
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={addQualification}
                                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
                                    >
                                        <Plus size={16} /> Add
                                    </button>
                                </div>
                                {qualifications.length > 0 && (
                                    <div className="space-y-2">
                                        {qualifications.map((qual, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                <span className="text-gray-900">{qual}</span>
                                                <button
                                                    onClick={() => removeQualification(index)}
                                                    className="text-red-600 hover:bg-red-100 p-1.5 rounded-lg"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
