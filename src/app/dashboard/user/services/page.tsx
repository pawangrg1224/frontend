'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Loader, X, Stethoscope,
  Heart, Brain, Bone, Eye, Baby,
  Activity, Syringe, Microscope, Pill, Ear, Smile,
  Wind, Zap, Shield, FlaskConical,
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
}

// Map department keywords to icons and colors
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

export default function DepartmentsPage() {
  const { status } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') fetchServices()
  }, [status])

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/services?limit=100')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setServices(data.data || [])
    } catch {
      setError('Failed to load departments')
    } finally {
      setIsLoading(false)
    }
  }

  const handleServiceClick = (serviceId: string) => {
    router.push(`/dashboard/user/services/${serviceId}`)
  }

  if (status === 'loading' || isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Departments</h1>
            <p className="text-gray-500 text-sm mt-0.5">Browse our medical departments and book an appointment</p>
          </div>
        </div>
      </div>

      <div>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')}><X size={16} className="text-red-400" /></button>
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2 font-medium">No departments available</p>
            <p className="text-gray-400 text-sm">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const { icon: Icon, color, bg } = getDeptIcon(service.name)
              return (
                <div
                  key={service.id}
                  onClick={() => handleServiceClick(service.id)}
                  className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-xl transition-all hover:border-blue-300 cursor-pointer group hover:scale-[1.02]"
                >
                  {/* Icon + Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{service.name}</h3>
                      {service.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{service.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-4 py-3 border-t border-b border-gray-100 mb-4">
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                      <p className="text-sm font-semibold text-gray-800">{service.duration} min</p>
                    </div>
                    <div className="w-px bg-gray-100" />
                    <div className="flex-1 text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Consultation Fee</p>
                      <p className="text-sm font-semibold text-gray-800">Rs. {service.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Call to action */}
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-medium text-sm py-2 px-3 rounded-lg bg-blue-50 group-hover:bg-blue-100 transition-colors border border-blue-100">
                    <Stethoscope size={14} />
                    <span>View Doctors & Book</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
