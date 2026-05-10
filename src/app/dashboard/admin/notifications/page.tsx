'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

export default function AdminNotificationsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [logs, setLogs] = useState<NotificationLog[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [resending, setResending] = useState<string | null>(null)

    // Filters
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [statusFilter, setStatusFilter] = useState('')

    const LIMIT = 20

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
        }
    }, [fetchLogs, page, status, session])

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
                <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 mt-1">Email notification log and delivery status</p>
            </div>

            <div className="p-6 space-y-4">
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
        </div>
    )
}
