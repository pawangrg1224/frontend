'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Plus, Edit2, Trash2, Loader, X, Save,
  Heart, Brain, Bone, Eye, Baby, Stethoscope,
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

const emptyForm = { name: '', description: '', duration: '30', price: '0' }

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
  const [successMsg, setSuccessMsg] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState('')

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

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
  const openEdit = (s: Service) => {
    setEditingId(s.id)
    setForm({ name: s.name, description: s.description || '', duration: String(s.duration), price: String(s.price) })
    setFormError(''); setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setFormError('Department name is required'); return }
    if (Number(form.duration) < 1) { setFormError('Duration must be at least 1 minute'); return }
    if (Number(form.price) < 0) { setFormError('Price cannot be negative'); return }
    setIsSaving(true); setFormError('')
    try {
      const res = await fetch(editingId ? `/api/services/${editingId}` : '/api/services', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          duration: Number(form.duration),
          price: Number(form.price),
        }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to save') }
      setShowModal(false)
      flash(editingId ? 'Department updated!' : 'Department added!')
      fetchServices()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred')
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove "${name}" department? This will also remove all related appointments.`)) return
    setError('')
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed') }
      setServices(prev => prev.filter(s => s.id !== id))
      flash('Department removed!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove department')
    }
  }

  const flash = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000) }

  if (status === 'loading' || isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
            <p className="text-gray-500 text-sm mt-0.5">Manage hospital departments and medical services</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} /> New Department
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')}><X size={16} className="text-red-400" /></button>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">{successMsg}</p>
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2 font-medium">No departments added yet</p>
            <p className="text-gray-400 text-sm mb-6">Add your first hospital department to get started</p>
            <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
              <Plus size={18} /> Add First Department
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const { icon: Icon, color, bg } = getDeptIcon(service.name)
              return (
                <div key={service.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all hover:border-blue-200">
                  {/* Icon + Name */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-6 h-6 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 leading-tight">{service.name}</h3>
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
                      <p className="text-sm font-semibold text-gray-800">${service.price.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(service)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-blue-600 hover:bg-blue-50 rounded-lg py-2 transition-colors font-medium text-sm border border-blue-100"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, service.name)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-red-600 hover:bg-red-50 rounded-lg py-2 transition-colors font-medium text-sm border border-red-100"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingId ? 'Edit Department' : 'Add New Department'}
                </h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Cardiology, Orthopedics, Neurology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">The icon will be assigned automatically based on the name</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description of services offered..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Appointment Duration (min) *</label>
                  <input
                    type="number"
                    min="1"
                    value={form.duration}
                    onChange={e => setForm(p => ({ ...p, duration: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Consultation Fee ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Live icon preview */}
              {form.name.trim() && (() => {
                const { icon: PreviewIcon, color, bg } = getDeptIcon(form.name)
                return (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                      <PreviewIcon className={`w-5 h-5 ${color}`} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Icon preview</p>
                      <p className="text-sm font-medium text-gray-800">{form.name}</p>
                    </div>
                  </div>
                )
              })()}

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {editingId ? 'Save Changes' : 'Add Department'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
