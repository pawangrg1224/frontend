'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader, Plus, Edit2, Trash2, X, Save, Check, XCircle } from 'lucide-react'
import { toast, Toaster } from 'sonner'

interface Appointment {
  id: string
  date: string
  status: string
  notes?: string
  customer: { id: string; name: string; email: string }
  service: { id: string; name: string }
  user: { fullName: string; email: string }
  slot?: { id: string; slotLimit: number }
}

interface Customer { id: string; name: string }
interface Service { id: string; name: string }
interface User { id: string; fullName: string; email: string }

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']

const statusColor = (s: string) => {
  switch (s) {
    case 'CONFIRMED': return 'bg-green-100 text-green-700'
    case 'COMPLETED': return 'bg-blue-100 text-blue-700'
    case 'CANCELLED': return 'bg-red-100 text-red-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

const emptyForm = { customerId: '', serviceId: '', userId: '', date: '', status: 'PENDING', notes: '' }

const AdminAppointmentsPage = () => {
  const { status } = useSession()
  const router = useRouter()

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAll()
    }
  }, [status])

  const fetchAll = async () => {
    setIsLoading(true)
    try {
      const [aptsRes, cusRes, svcRes, usrRes] = await Promise.all([
        fetch('/api/admin/appointments'),
        fetch('/api/customers'),
        fetch('/api/services'),
        fetch('/api/admin/users'),
      ])
      const [apts, cus, svc, usr] = await Promise.all([
        aptsRes.json(), cusRes.json(), svcRes.json(), usrRes.json(),
      ])
      setAppointments(apts.data || [])
      setCustomers(cus.data || [])
      setServices(svc.data || [])
      setUsers(usr.data || [])
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async (apt: Appointment) => {
    setProcessingId(apt.id)
    try {
      const res = await fetch(`/api/admin/appointments/${apt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.message || 'Failed to accept appointment')
        return
      }
      toast.success('Appointment accepted!')
      fetchAll()
    } catch {
      toast.error('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (apt: Appointment) => {
    setProcessingId(apt.id)
    try {
      const res = await fetch(`/api/admin/appointments/${apt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.message || 'Failed to reject appointment')
        return
      }
      toast.success('Appointment rejected!')
      fetchAll()
    } catch {
      toast.error('An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormErrors({})
    setShowModal(true)
  }

  const openEdit = (apt: Appointment) => {
    setEditingId(apt.id)
    setForm({
      customerId: apt.customer.id,
      serviceId: apt.service.id,
      userId: '',
      date: new Date(apt.date).toISOString().slice(0, 16),
      status: apt.status,
      notes: apt.notes || '',
    })
    setFormErrors({})
    setShowModal(true)
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.customerId) errs.customerId = 'Customer is required'
    if (!form.serviceId) errs.serviceId = 'Service is required'
    if (!editingId && !form.userId) errs.userId = 'User is required'
    if (!form.date) errs.date = 'Date is required'
    return errs
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return }

    setIsSaving(true)
    try {
      const url = editingId ? `/api/admin/appointments/${editingId}` : '/api/admin/appointments'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.message || 'Failed to save')
        return
      }
      setShowModal(false)
      toast.success(editingId ? 'Appointment updated!' : 'Appointment created!')
      fetchAll()
    } catch {
      toast.error('An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this appointment?')) return
    try {
      const res = await fetch(`/api/admin/appointments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setAppointments(prev => prev.filter(a => a.id !== id))
      toast.success('Appointment deleted!')
    } catch {
      toast.error('Failed to delete appointment')
    }
  }

  // Separate pending and other appointments
  const pendingAppointments = appointments.filter(apt => apt.status === 'PENDING')
  const otherAppointments = appointments.filter(apt => apt.status !== 'PENDING')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <Link href="/dashboard/admin" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ChevronLeft size={20} /> Back to Admin
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Appointments</h1>
            <p className="text-gray-600 mt-1">Manage appointment requests and bookings</p>
          </div>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus size={18} /> New Appointment
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
            <p className="text-red-700 font-medium">{error}</p>
            <button onClick={() => setError('')}><X size={16} className="text-red-500" /></button>
          </div>
        )}

        {/* Pending Appointments Section */}
        {pendingAppointments.length > 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Pending Requests</h2>
              <p className="text-sm text-gray-600">New appointment requests waiting for approval</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Notes</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pendingAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{apt.user.fullName}</div>
                        <div className="text-xs text-gray-500">{apt.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{apt.customer.name}</div>
                        <div className="text-xs text-gray-500">{apt.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{apt.service.name}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(apt.date).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        {apt.notes ? (
                          <div className="text-xs text-gray-600 max-w-xs truncate" title={apt.notes}>
                            {apt.notes}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No notes</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAccept(apt)}
                            disabled={processingId === apt.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                            title="Accept"
                          >
                            {processingId === apt.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(apt)}
                            disabled={processingId === apt.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                            title="Reject"
                          >
                            {processingId === apt.id ? (
                              <Loader className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle size={14} />
                            )}
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Appointments Section */}
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">All Appointments</h2>
            <p className="text-sm text-gray-600">Complete list of all appointments</p>
          </div>
          {appointments.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-4">No appointments yet</p>
              <button onClick={openCreate} className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={18} /> Create first appointment
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">User</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Service</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{apt.user.fullName}</div>
                        <div className="text-xs text-gray-500">{apt.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{apt.customer.name}</div>
                        <div className="text-xs text-gray-500">{apt.customer.email}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{apt.service.name}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(apt.date).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(apt)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingId ? 'Edit Appointment' : 'New Appointment'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Customer */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Customer *</label>
                <select
                  value={form.customerId}
                  onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${formErrors.customerId ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select customer</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {formErrors.customerId && <p className="text-red-600 text-xs mt-1">{formErrors.customerId}</p>}
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Service *</label>
                <select
                  value={form.serviceId}
                  onChange={e => setForm(p => ({ ...p, serviceId: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${formErrors.serviceId ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">Select service</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {formErrors.serviceId && <p className="text-red-600 text-xs mt-1">{formErrors.serviceId}</p>}
              </div>

              {/* User — only on create */}
              {!editingId && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Assign to User *</label>
                  <select
                    value={form.userId}
                    onChange={e => setForm(p => ({ ...p, userId: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${formErrors.userId ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    <option value="">Select user</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>)}
                  </select>
                  {formErrors.userId && <p className="text-red-600 text-xs mt-1">{formErrors.userId}</p>}
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 ${formErrors.date ? 'border-red-300' : 'border-gray-300'}`}
                />
                {formErrors.date && <p className="text-red-600 text-xs mt-1">{formErrors.date}</p>}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                >
                  {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {editingId ? 'Save Changes' : 'Create Appointment'}
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

export default AdminAppointmentsPage
