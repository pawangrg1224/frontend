'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Stethoscope, Loader, Calendar, ChevronRight,
    Heart, Brain, Bone, Eye, Baby, Wind, Microscope, Pill,
    Ear, Smile, Syringe, Zap, Activity, FlaskConical, Shield, Clock, DollarSign,
} from 'lucide-react'

interface Service {
    id: string
    name: string
    description?: string
    duration: number
    price: number
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

export default function AdminSlotsPage() {
    const router = useRouter()
    const { status } = useSession()
    const [services, setServices] = useState<Service[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchServices()
        }
    }, [status])

    const fetchServices = async () => {
        setIsLoading(true)
        setError('')
        try {
            const res = await fetch('/api/services?limit=100')
            if (!res.ok) throw new Error('Failed to fetch departments')
            const data = await res.json()
            setServices(data.data || [])
        } catch (err) {
            setError('Failed to load departments')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDepartmentClick = (departmentId: string) => {
        router.push(`/dashboard/admin/slots/${departmentId}`)
    }

    if (status === 'loading' || isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Slot Management</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Select a department to manage appointment slots</p>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{error}</p>
                </div>
            )}

            {/* Department Cards */}
            {services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                    <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2 font-medium">No departments available</p>
                    <p className="text-gray-400 text-sm">Add departments first to manage slots</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => {
                        const { icon: Icon, color, bg } = getDeptIcon(service.name)
                        return (
                            <button
                                key={service.id}
                                onClick={() => handleDepartmentClick(service.id)}
                                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all text-left group"
                            >
                                {/* Icon + Name */}
                                <div className="flex items-start gap-4 mb-4">
                                    <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                        <Icon className={`w-7 h-7 ${color}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                            {service.name}
                                        </h3>
                                        {service.description && (
                                            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{service.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="py-3 border-t border-b border-gray-100 mb-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-lg font-bold text-blue-600">Rs. {service.price.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500">booking fee</p>
                                    </div>
                                </div>

                                {/* Action */}
                                <div className="flex items-center justify-between text-blue-600 group-hover:text-blue-700">
                                    <span className="text-sm font-medium">Manage Slots</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
