'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  CheckCircle, XCircle, Clock, CheckCheck,
  MapPin, Video, User, Phone, Mail, FileText,
  Loader, Calendar,
} from 'lucide-react'

interface Appointment {
  id: string
  date: string
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'
  type: 'ONLINE' | 'OFFLINE'
  meetingLink?: string
  notes?: string
  customer: { id: string; name: string; email: string; phone: string }
  service: { id: string; name: string }
  domain?: { id: string; company: string; address?: string } | null
  review?: { id: string } | null
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CONFIRMED: 'bg-blue-100   text-blue-800   border-blue-200',
  CANCELLED: 'bg-red-100    text-red-800    border-red-200',
  COMPLETED: 'bg-green-100  text-green-800  border-green-200',
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  PENDING: <Clock size={13} />,
  CONFIRMED: <CheckCircle size={13} />,
  CANCELLED: <XCircle size={13} />,
  COMPLETED: <CheckCheck size={13} />,
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-6 max-w-4xl mx-auto">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-48 bg-gray-200 rounded-xl" />
      <div className="h-32 bg-gray-200 rounded-xl" />
      <div className="h-64 bg-gray-200 rounded-xl" />
    </div>
  )
}

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/appointments/${id}`)
      .then(r => { if (!r.ok) { router.push('/dashboard/appointments'); return null } return r.json() })
      .then(data => { if (data) setAppointment(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id, router])

  const updateStatus = async (status: string) => {
    if (!appointment) return
    setUpdating(status)
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        const updated = await res.json()
        setAppointment(prev => prev ? { ...prev, status: updated.status } : prev)
      }
    } finally {
      setUpdating(null)
    }
  }

  const isAdmin = (session?.user as { role?: string })?.role === 'ADMIN'

  if (loading) return <div className="min-h-screen bg-gray-50"><Skeleton /></div>
  if (!appointment) return null

  const { status } = appointment

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Appointment Details</h1>
        <div className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[status]}`}>
          {STATUS_ICONS[status]}
          {status}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-5">

        {/* Main card */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          {/* Service + date */}
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{appointment.service.name}</h2>
              <div className="flex items-center gap-2 mt-1.5 text-gray-500 text-sm">
                <Calendar size={14} />
                {new Date(appointment.date).toLocaleDateString(undefined, {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                })}
                {' at '}
                {new Date(appointment.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
              {appointment.type === 'ONLINE' ? '🎥 Online' : '📍 In-Person'}
            </span>
          </div>

          {/* Meeting link */}
          {appointment.type === 'ONLINE' && appointment.meetingLink && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Video size={16} className="text-blue-600 shrink-0" />
              <a href={appointment.meetingLink} target="_blank" rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm font-medium truncate">
                {appointment.meetingLink}
              </a>
            </div>
          )}

          {/* Location */}
          {appointment.type === 'OFFLINE' && appointment.domain && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <MapPin size={16} className="text-gray-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-800">{appointment.domain.company}</p>
                {appointment.domain.address && <p className="text-xs text-gray-500 mt-0.5">{appointment.domain.address}</p>}
              </div>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <FileText size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{appointment.notes}</p>
            </div>
          )}

          {/* ── Action Buttons ── */}
          {isAdmin && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Update Status</p>
              <div className="flex flex-wrap gap-2">

                {/* Confirm — only when PENDING */}
                {status === 'PENDING' && (
                  <button
                    onClick={() => updateStatus('CONFIRMED')}
                    disabled={!!updating}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {updating === 'CONFIRMED'
                      ? <Loader size={14} className="animate-spin" />
                      : <CheckCircle size={14} />}
                    Confirm Appointment
                  </button>
                )}

                {/* Complete — when PENDING or CONFIRMED */}
                {(status === 'PENDING' || status === 'CONFIRMED') && (
                  <button
                    onClick={() => updateStatus('COMPLETED')}
                    disabled={!!updating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {updating === 'COMPLETED'
                      ? <Loader size={14} className="animate-spin" />
                      : <CheckCheck size={14} />}
                    Mark as Completed
                  </button>
                )}

                {/* Cancel — when PENDING or CONFIRMED */}
                {(status === 'PENDING' || status === 'CONFIRMED') && (
                  <button
                    onClick={() => updateStatus('CANCELLED')}
                    disabled={!!updating}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {updating === 'CANCELLED'
                      ? <Loader size={14} className="animate-spin" />
                      : <XCircle size={14} />}
                    Cancel
                  </button>
                )}

                {/* Re-open — when CANCELLED */}
                {status === 'CANCELLED' && (
                  <button
                    onClick={() => updateStatus('PENDING')}
                    disabled={!!updating}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {updating === 'PENDING'
                      ? <Loader size={14} className="animate-spin" />
                      : <Clock size={14} />}
                    Re-open
                  </button>
                )}

                {/* Completed — no actions */}
                {status === 'COMPLETED' && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 border border-green-200 text-sm font-semibold rounded-lg">
                    <CheckCheck size={14} /> Appointment Completed
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Patient info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User size={16} className="text-gray-500" /> Patient Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="font-medium text-gray-800">{appointment.customer.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="font-medium text-gray-800">{appointment.customer.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Phone</p>
                <p className="font-medium text-gray-800">{appointment.customer.phone}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
