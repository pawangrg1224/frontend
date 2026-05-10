'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
    Plus, Trash2, Loader, X, Save, Calendar,
    Stethoscope, Users, ToggleLeft, ToggleRight, Edit2,
} from 'lucide-react'

interface Service { id: string; name: string }
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

const emptyForm = { serviceId: '', doctorName: '', slotDate: '', slotLimit: '20' }

export default function AdminSlotsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [slots, setSlots] = useState<Slot[]>([])
    const [services, setServices] = useState<Service[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyForm)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState('')
    const [filterDate, setFilterDate] = useState('')
    const [filterService, setFilterService] = useState('')
    const [success, setSuccess] = useState('')

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
        if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'ADMIN') {
            router.push('/dashboard')
        }
    }, [status, session, router])

    useEffect(() => {
        if (status !== 'authenticated') return
        Promise.all([
            fetch('/api/services?limit=100').then(r => r.json()),
            fetchSlots(),
        ]).then(([svcData]) => {
            setServices(svcData.data || [])
        })
    }, [status])

    const fetchSlots = async () => {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterDate) params.set('date', filterDate)
        if (filterService) params.set('serviceId', filterService)
        const res = await fetch(`/api/slots?${params}`)
        const data = await res.json()
        setSlots(data.data || [])
        setLoading(false)
    }

    useEffect(() => { if (status === 'authenticated') fetchSlots() }, [filterDate, filterService])

    const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
    const openEdit = (s: Slot) => {
        setEditingId(s.id)
        setForm({
            serviceId: s.service.id,
            doctorName: s.doctorName,
            slotDate: s.slotDate.split('T')[0],
            slotLimit: String(s.slotLimit),
        })
        setFormError(''); setShowModal(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.serviceId || !form.doctorName || !form.slotDate || !form.slotLimit) {
            setFormError('All fields are required'); return
        }
        setSaving(true); setFormError('')
        try {
            const url = editingId ? `/api/slots/${editingId}` : '/api/slots'
            const method = editingId ? 'PUT' : 'POST'
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: form.serviceId,
                    doctorName: form.doctorName,
                    slotDate: form.slotDate,
                    slotLimit: Number(form.slotLimit),
                }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.message) }
            setShowModal(false)
            flash(editingId ? 'Slot updated!' : 'Slot created!')
            fetchSlots()
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Error saving slot')
        } finally { setSaving(false) }
    }

    const toggleOpen = async (slot: Slot) => {
        await fetch(`/api/slots/${slot.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isOpen: !slot.isOpen }),
        })
        fetchSlots()
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this slot? Existing bookings will not be affected.')) return
        await fetch(`/api/slots/${id}`, { method: 'DELETE' })
        flash('Slot deleted')
        fetchSlots()
    }

    const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }

    if (status === 'loading' || loading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Appointment Slots</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Manage daily slots — set doctor, date, and patient limit</p>
                </div>
                <button onClick={openCreate}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm">
                    <Plus size={16} /> New Slot
                </button>
            </div>

            <div className="p-6 space-y-5">
                {success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">{success}</div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <select value={filterService} onChange={e => setFilterService(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                        <option value="">All Departments</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {(filterDate || filterService) && (
                        <button onClick={() => { setFilterDate(''); setFilterService('') }}
                            className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg">
                            Clear filters
                        </button>
                    )}
                </div>

                {/* Slots grid */}
                {slots.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No slots found</p>
                        <p className="text-gray-400 text-sm mt-1">Create a slot to open appointments for patients</p>
                        <button onClick={openCreate}
                            className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium text-sm mx-auto">
                            <Plus size={16} /> Create First Slot
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {slots.map(slot => (
                            <div key={slot.id} className={`bg-white rounded-xl border p-5 space-y-3 ${slot.isFull ? 'border-red-200' : slot.isOpen ? 'border-gray-200' : 'border-gray-100 opacity-70'}`}>
                                {/* Department + status */}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {slot.service.name}
                                        </span>
                                        <p className="font-semibold text-gray-900 mt-1.5">{slot.doctorName}</p>
                                    </div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${slot.isFull ? 'bg-red-100 text-red-700' : slot.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                        {slot.isFull ? 'Full' : slot.isOpen ? 'Open' : 'Closed'}
                                    </span>
                                </div>

                                {/* Date */}
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar size={14} className="text-gray-400" />
                                    {new Date(slot.slotDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                </div>

                                {/* Capacity bar */}
                                <div>
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                        <span className="flex items-center gap-1"><Users size={12} /> {slot.bookedCount} / {slot.slotLimit} booked</span>
                                        <span>{slot.availableCount} available</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${slot.isFull ? 'bg-red-500' : 'bg-blue-500'}`}
                                            style={{ width: `${Math.min(100, (slot.bookedCount / slot.slotLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 pt-1">
                                    <button onClick={() => openEdit(slot)}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-100 font-medium">
                                        <Edit2 size={12} /> Edit
                                    </button>
                                    <button onClick={() => toggleOpen(slot)}
                                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium ${slot.isOpen ? 'text-orange-600 border-orange-100 hover:bg-orange-50' : 'text-green-600 border-green-100 hover:bg-green-50'}`}>
                                        {slot.isOpen ? <><ToggleRight size={12} /> Close</> : <><ToggleLeft size={12} /> Open</>}
                                    </button>
                                    <button onClick={() => handleDelete(slot.id)}
                                        className="ml-auto flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-100 font-medium">
                                        <Trash2 size={12} /> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Stethoscope size={18} className="text-blue-600" />
                                {editingId ? 'Edit Slot' : 'Create New Slot'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                                <X size={18} className="text-gray-500" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department *</label>
                                <select value={form.serviceId} onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm">
                                    <option value="">Select department</option>
                                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Doctor Name *</label>
                                <input type="text" value={form.doctorName}
                                    onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))}
                                    placeholder="e.g. Dr. Pawan Gurung"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date *</label>
                                <input type="date" value={form.slotDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setForm(p => ({ ...p, slotDate: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Max Patients (Slot Limit) *</label>
                                <input type="number" min="1" max="200" value={form.slotLimit}
                                    onChange={e => setForm(p => ({ ...p, slotLimit: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm" />
                                <p className="text-xs text-gray-400 mt-1">Maximum number of patients that can book this slot</p>
                            </div>
                            {formError && <p className="text-sm text-red-600">{formError}</p>}
                            <div className="flex gap-3 pt-1">
                                <button type="submit" disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60 font-medium text-sm">
                                    {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={15} />}
                                    {editingId ? 'Save Changes' : 'Create Slot'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium text-sm">
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
