'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader, Mail, Send, X, CheckCircle } from 'lucide-react'

interface Doctor {
    id: string
    fullName: string
    email: string
    doctorProfile: {
        specialization: string | null
    } | null
}

interface NotificationLog {
    id: string
    type: string
    status: 'SENT' | 'FAILED' | 'PENDING' | 'DELIVERED' | 'BOUNCED'
    recipientEmail: string
    retryCount: number
    sentAt?: string
    createdAt: string
    customer: { id: string; name: string; email: string }
    appointment: { id: string; date: string; status: string }
}

const STATUS_STYLES: Record<string, string> = {
    SENT: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    DELIVERED: 'bg-blue-100 text-blue-800',
    BOUNCED: 'bg-gray-100 text-gray-700',
}

// ─── Send Message Modal ───────────────────────────────────────────────────────

interface SendMessageModalProps {
    doctor: Doctor | null
    doctors: Doctor[]
    onClose: () => void
    onSent: () => void
}

function SendMessageModal({ doctor, doctors, onClose, onSent }: SendMessageModalProps) {
    const [selectedDoctors, setSelectedDoctors] = useState<string[]>(doctor ? [doctor.id] : [])
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [messageType, setMessageType] = useState<'promotion' | 'notice' | 'announcement' | 'custom'>('custom')
    const [sending, setSending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Pre-filled templates
    const templates = {
        promotion: {
            subject: '🎉 Congratulations on Your Promotion!',
            message: 'Dear Dr. {{name}},\n\nCongratulations on your well-deserved promotion! Your dedication and commitment to patient care have been exemplary.\n\nWe look forward to your continued success.\n\nBest regards,\nAdministration'
        },
        notice: {
            subject: '📢 Important Notice',
            message: 'Dear Dr. {{name}},\n\nThis is an important notice regarding:\n\n[Please provide details here]\n\nThank you for your attention.\n\nBest regards,\nAdministration'
        },
        announcement: {
            subject: '📣 Hospital Announcement',
            message: 'Dear Dr. {{name}},\n\nWe would like to inform you about:\n\n[Please provide announcement details here]\n\nThank you.\n\nBest regards,\nAdministration'
        }
    }

    useEffect(() => {
        if (messageType !== 'custom' && templates[messageType]) {
            setSubject(templates[messageType].subject)
            setMessage(templates[messageType].message)
        }
    }, [messageType])

    const toggleDoctor = (doctorId: string) => {
        setSelectedDoctors(prev =>
            prev.includes(doctorId)
                ? prev.filter(id => id !== doctorId)
                : [...prev, doctorId]
        )
    }

    const selectAll = () => {
        setSelectedDoctors(doctors.map(d => d.id))
    }

    const deselectAll = () => {
        setSelectedDoctors([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (selectedDoctors.length === 0) {
            setError('Please select at least one doctor')
            return
        }

        if (!subject.trim()) {
            setError('Subject is required')
            return
        }

        if (!message.trim()) {
            setError('Message is required')
            return
        }

        setSending(true)
        setError('')

        try {
            const res = await fetch('/api/admin/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorIds: selectedDoctors,
                    subject: subject.trim(),
                    message: message.trim(),
                    messageType
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.message || 'Failed to send message')
            }

            setSuccess(true)
            setTimeout(() => {
                onSent()
                onClose()
            }, 1500)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message')
        } finally {
            setSending(false)
        }
    }

    const selectedCount = selectedDoctors.length

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Mail size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="font-bold text-gray-900">Send Message to Doctor{selectedCount !== 1 ? 's' : ''}</h2>
                            {selectedCount > 0 && (
                                <p className="text-xs text-gray-500">{selectedCount} recipient{selectedCount !== 1 ? 's' : ''} selected</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>

                {success ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                        <p className="font-semibold text-gray-900">Message sent successfully!</p>
                        <p className="text-sm text-gray-500 mt-1">Email notifications have been queued for delivery</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Message Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Message Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['promotion', 'notice', 'announcement', 'custom'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setMessageType(type)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${messageType === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        {type === 'custom' ? 'Custom Message' : type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Recipients */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-gray-700">Recipients *</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAll}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">|</span>
                                    <button
                                        type="button"
                                        onClick={deselectAll}
                                        className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <div className="border border-gray-300 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                                {doctors.map((doc) => (
                                    <label
                                        key={doc.id}
                                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDoctors.includes(doc.id)}
                                            onChange={() => toggleDoctor(doc.id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-200"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">Dr. {doc.fullName}</p>
                                            <p className="text-xs text-gray-500">{doc.email}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Subject */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject *</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="e.g., Congratulations on your promotion!"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                            />
                        </div>

                        {/* Message */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message *</label>
                            <textarea
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Type your message here..."
                                rows={8}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                💡 Use {'{'}{'{'} name {'}'}{'}'}  to personalize with doctor's name
                            </p>
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
                            disabled={sending || selectedDoctors.length === 0}
                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-semibold text-sm"
                        >
                            {sending ? <Loader className="w-4 h-4 animate-spin" /> : <Send size={16} />}
                            {sending ? 'Sending...' : `Send to ${selectedCount} Doctor${selectedCount !== 1 ? 's' : ''}`}
                        </button>
                        <button
                            type="button"
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

export default function AdminNotificationsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [logs, setLogs] = useState<NotificationLog[]>([])
    const [doctors, setDoctors] = useState<Doctor[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [resending, setResending] = useState<string | null>(null)
    const [showMessageModal, setShowMessageModal] = useState(false)
    const [success, setSuccess] = useState('')

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const LIMIT = 20

    const flash = (msg: string) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(''), 4000)
    }

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
        if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard')
    }, [status, session, router])

    const fetchLogs = useCallback(async (p: number) => {
        setLoading(true)
        const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) })
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/admin/notifications?${params}`)
        if (res.ok) {
            const data = await res.json()
            setLogs(data.logs ?? [])
            setTotal(data.total ?? 0)
        }
        setLoading(false)
    }, [startDate, endDate, statusFilter])

    useEffect(() => {
        if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
            fetchLogs(page)
            fetchDoctors()
        }
    }, [fetchLogs, page, status, session])

    const fetchDoctors = async () => {
        try {
            const res = await fetch('/api/admin/doctors')
            if (res.ok) {
                const data = await res.json()
                setDoctors(data.data ?? [])
            }
        } catch (err) {
            console.error('Failed to fetch doctors:', err)
        }
    }

    const handleResend = async (logId: string) => {
        setResending(logId)
        await fetch('/api/admin/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ logId }),
        })
        setResending(null)
        fetchLogs(page)
    }

    const handleFilter = () => {
        setPage(1)
        fetchLogs(1)
    }

    const totalPages = Math.ceil(total / LIMIT)

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-500 mt-1">Email notification log and delivery status</p>
                    </div>
                    <button
                        onClick={() => setShowMessageModal(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-semibold text-sm shadow-sm transition-colors"
                    >
                        <Mail size={16} /> Send Message to Doctors
                    </button>
                </div>
            </div>

            <div className="p-6 space-y-4">
                {/* Success Message */}
                {success && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
                        <CheckCircle size={15} /> {success}
                    </div>
                )}
                {/* Filters */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">From</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">To</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Status</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <option value="">All</option>
                            <option value="SENT">Sent</option>
                            <option value="DELIVERED">Delivered</option>
                            <option value="PENDING">Pending</option>
                            <option value="FAILED">Failed</option>
                            <option value="BOUNCED">Bounced</option>
                        </select>
                    </div>
                    <button
                        onClick={handleFilter}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                        Apply
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No notifications found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipient</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Appointment</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sent At</th>
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Retries</th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-700 font-medium">{log.type.replace(/_/g, ' ')}</td>
                                            <td className="px-4 py-3">
                                                <p className="text-gray-800">{log.customer.name}</p>
                                                <p className="text-gray-400 text-xs">{log.recipientEmail}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[log.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {new Date(log.appointment.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {log.sentAt ? new Date(log.sentAt).toLocaleString() : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 text-center">{log.retryCount}</td>
                                            <td className="px-4 py-3">
                                                {log.status === 'FAILED' && (
                                                    <button
                                                        onClick={() => handleResend(log.id)}
                                                        disabled={resending === log.id}
                                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                                                    >
                                                        {resending === log.id ? 'Sending...' : 'Resend'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                            Page {page} of {totalPages} ({total} total)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Send Message Modal */}
            {showMessageModal && (
                <SendMessageModal
                    doctor={null}
                    doctors={doctors}
                    onClose={() => setShowMessageModal(false)}
                    onSent={() => {
                        flash('Messages sent successfully!')
                        fetchLogs(page)
                    }}
                />
            )}
        </div>
    )
}
