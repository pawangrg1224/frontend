'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Loader, X, Save, Users } from 'lucide-react'

interface Patient {
    id: string
    name: string
    email: string
    phone: string
    address?: string
}

const emptyForm = { name: '', email: '', phone: '', address: '' }

export default function PatientsPage() {
    const { status } = useSession()
    const router = useRouter()
    const [patients, setPatients] = useState<Patient[]>([])
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
        if (status === 'authenticated') fetchPatients()
    }, [status])

    const fetchPatients = async () => {
        setIsLoading(true)
        try {
            const res = await fetch('/api/customers')
            if (!res.ok) throw new Error('Failed to fetch')
            const data = await res.json()
            setPatients(data.data || [])
        } catch { setError('Failed to load patients') }
        finally { setIsLoading(false) }
    }

    const openCreate = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowModal(true) }
    const openEdit = (p: Patient) => {
        setEditingId(p.id)
        setForm({ name: p.name, email: p.email, phone: p.phone, address: p.address || '' })
        setFormError(''); setShowModal(true)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) { setFormError('Name is required'); return }
        if (!form.email.trim()) { setFormError('Email is required'); return }
        if (!form.phone.trim()) { setFormError('Phone is required'); return }
        setIsSaving(true); setFormError('')
        try {
            const res = await fetch(editingId ? `/api/customers/${editingId}` : '/api/customers', {
                method: editingId ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() || undefined }),
            })
            if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed to save') }
            setShowModal(false)
            flash(editingId ? 'Patient updated!' : 'Patient registered!')
            fetchPatients()
        } catch (err) { setFormError(err instanceof Error ? err.message : 'An error occurred') }
        finally { setIsSaving(false) }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Remove patient "${name}"? This will also delete their appointment history.`)) return
        setError('')
        try {
            const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
            if (!res.ok) { const d = await res.json(); throw new Error(d.message || 'Failed') }
            setPatients(prev => prev.filter(p => p.id !== id))
            flash('Patient removed!')
        } catch (err) { setError(err instanceof Error ? err.message : 'Failed to remove patient') }
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
                    <Users className="w-7 h-7 text-blue-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
                        <p className="text-gray-500 text-sm">Manage patient records</p>
                    </div>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                    <Plus size={18} /> Register Patient
                </button>
            </div>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between">
                        <p className="text-red-700 font-medium">{error}</p>
                        <button onClick={() => setError('')}><X size={16} className="text-red-400" /></button>
                    </div>
                )}
                {successMsg && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-green-700 font-medium">{successMsg}</p></div>}

                {patients.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 mb-4">No patients registered yet</p>
                        <button onClick={openCreate} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                            <Plus size={18} /> Register first patient
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Patient Name</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Email</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Phone</th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Address</th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {patients.map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                                        <td className="px-6 py-4 text-gray-600">{p.email}</td>
                                        <td className="px-6 py-4 text-gray-600">{p.phone}</td>
                                        <td className="px-6 py-4 text-gray-500">{p.address || '—'}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openEdit(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(p.id, p.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Patient' : 'Register New Patient'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {[
                                { label: 'Full Name *', key: 'name', type: 'text', placeholder: 'Patient full name' },
                                { label: 'Email *', key: 'email', type: 'email', placeholder: 'patient@email.com' },
                                { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '+1 555-0100' },
                                { label: 'Address', key: 'address', type: 'text', placeholder: 'Home address (optional)' },
                            ].map(({ label, key, type, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                                    <input
                                        type={type}
                                        value={form[key as keyof typeof form]}
                                        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                    />
                                </div>
                            ))}
                            {formError && <p className="text-sm text-red-600">{formError}</p>}
                            <div className="flex gap-3 pt-2">
                                <button type="submit" disabled={isSaving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium">
                                    {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                                    {editingId ? 'Save Changes' : 'Register Patient'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-50 font-medium">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
