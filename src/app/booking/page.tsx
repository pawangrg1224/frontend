'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Calendar, Users, Stethoscope, Loader, CheckCircle,
  ChevronRight, Search, User,
} from 'lucide-react'

interface Service { id: string; name: string; description?: string; duration: number; price: number }
interface Slot {
  id: string
  doctorName: string
  slotDate: string
  slotLimit: number
  bookedCount: number
  availableCount: number
  isFull: boolean
  service: { id: string; name: string }
}

export default function BookingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<'dept' | 'slot' | 'confirm' | 'done'>('dept')
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [error, setError] = useState('')
  const [bookedAppointment, setBookedAppointment] = useState<{ id: string } | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/public/services').then(r => r.json()).then(d => setServices(d.data || []))
  }, [])

  useEffect(() => {
    if (!selectedService || !selectedDate) return
    setSlotsLoading(true)
    fetch(`/api/slots?serviceId=${selectedService.id}&date=${selectedDate}`)
      .then(r => r.json())
      .then(d => setSlots(d.data || []))
      .finally(() => setSlotsLoading(false))
  }, [selectedService, selectedDate])

  const handleBook = async () => {
    if (!selectedSlot) return
    if (status !== 'authenticated') {
      router.push(`/auth/login?callbackUrl=/booking`)
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/public/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot.id, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Booking failed')
      setBookedAppointment(data)
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally { setLoading(false) }
  }

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  // Not signed in — show sign in prompt
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to Book</h2>
          <p className="text-gray-500 mb-6">You need to be signed in to book an appointment.</p>
          <Link href="/auth/login?callbackUrl=/booking"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
            Sign In
          </Link>
          <Link href="/auth/signup" className="block mt-3 text-sm text-blue-600 hover:underline">
            Don&apos;t have an account? Sign up
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )

  // Done
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-1">
            <span className="font-semibold">{selectedSlot?.service.name}</span> with{' '}
            <span className="font-semibold">{selectedSlot?.doctorName}</span>
          </p>
          <p className="text-gray-400 text-sm mb-6">
            {selectedSlot && new Date(selectedSlot.slotDate).toLocaleDateString(undefined, {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
          <Link href="/dashboard/my-appointments"
            className="block w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors mb-3">
            View My Appointments
          </Link>
          <button onClick={() => { setStep('dept'); setSelectedService(null); setSelectedSlot(null); setNotes('') }}
            className="block w-full border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
            Book Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Book Appointment</h1>
              <p className="text-xs text-gray-500">Welcome, {session?.user?.name}</p>
            </div>
          </div>
          <Link href="/dashboard/my-appointments" className="text-sm text-blue-600 hover:underline font-medium">
            My Appointments →
          </Link>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm">
          {[
            { key: 'dept', label: '1. Department' },
            { key: 'slot', label: '2. Available Slots' },
            { key: 'confirm', label: '3. Confirm' },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={14} className="text-gray-300" />}
              <span className={`font-medium ${step === s.key ? 'text-blue-600' : ['dept', 'slot', 'confirm'].indexOf(step) > i ? 'text-green-600' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">{error}</div>
        )}

        {/* Step 1: Choose Department */}
        {step === 'dept' && (
          <div className="space-y-4">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search departments..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredServices.map(svc => (
                <button key={svc.id} onClick={() => { setSelectedService(svc); setStep('slot') }}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{svc.name}</p>
                      {svc.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{svc.description}</p>}
                    </div>
                    <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-blue-400" />
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>{svc.duration} min</span>
                    <span>${svc.price.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Choose Slot */}
        {step === 'slot' && selectedService && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('dept')} className="text-sm text-blue-600 hover:underline">← Back</button>
              <h2 className="font-semibold text-gray-900">{selectedService.name} — Available Slots</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Date</label>
              <input type="date" value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
            </div>

            {slotsLoading && <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-blue-500" /></div>}

            {!slotsLoading && selectedDate && slots.length === 0 && (
              <div className="text-center py-10 bg-white rounded-xl border border-gray-200">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-medium">No slots available for this date</p>
                <p className="text-gray-400 text-sm mt-1">Try a different date or department</p>
              </div>
            )}

            {!slotsLoading && slots.length > 0 && (
              <div className="space-y-3">
                {slots.map(slot => (
                  <button key={slot.id} disabled={slot.isFull}
                    onClick={() => { setSelectedSlot(slot); setStep('confirm') }}
                    className={`w-full bg-white border rounded-xl p-4 text-left transition-all ${slot.isFull ? 'opacity-50 cursor-not-allowed border-gray-100' : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'} ${selectedSlot?.id === slot.id ? 'border-blue-500 ring-2 ring-blue-100' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{slot.doctorName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {new Date(slot.slotDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${slot.isFull ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {slot.isFull ? 'Full' : `${slot.availableCount} left`}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="flex items-center gap-1"><Users size={11} /> {slot.bookedCount}/{slot.slotLimit} booked</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${slot.isFull ? 'bg-red-400' : 'bg-blue-400'}`}
                          style={{ width: `${Math.min(100, (slot.bookedCount / slot.slotLimit) * 100)}%` }} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedSlot && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('slot')} className="text-sm text-blue-600 hover:underline">← Back</button>
              <h2 className="font-semibold text-gray-900">Confirm Booking</h2>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Department</span>
                <span className="font-semibold text-gray-900">{selectedSlot.service.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Doctor</span>
                <span className="font-semibold text-gray-900">{selectedSlot.doctorName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-semibold text-gray-900">
                  {new Date(selectedSlot.slotDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Available Seats</span>
                <span className="font-semibold text-green-600">{selectedSlot.availableCount} remaining</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Patient</span>
                <span className="font-semibold text-gray-900">{session?.user?.name}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optional)</label>
              <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Any symptoms or special requests..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
            </div>

            <button onClick={handleBook} disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors">
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              {loading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
