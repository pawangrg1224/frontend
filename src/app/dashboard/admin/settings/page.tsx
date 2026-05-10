'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import {
    ChevronLeft,
    Loader,
    Building2,
    Bell,
    Calendar,
    Shield,
    Save,
    CheckCircle,
} from 'lucide-react'

interface BusinessSettings {
    businessName: string
    businessEmail: string
    businessPhone: string
    businessAddress: string
    timezone: string
}

interface AppointmentSettings {
    defaultDuration: string
    bufferTime: string
    maxAdvanceBooking: string
    allowCancellation: boolean
    cancellationDeadline: string
}

interface NotificationSettings {
    emailNotifications: boolean
    appointmentReminders: boolean
    reminderHours: string
    newBookingAlert: boolean
    cancellationAlert: boolean
}

const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
    'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo',
    'Asia/Kolkata', 'Australia/Sydney',
]

const AdminSettingsPage = () => {
    const { status } = useSession()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState<'business' | 'appointments' | 'notifications' | 'security'>('business')
    const [isSaving, setIsSaving] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const [business, setBusiness] = useState<BusinessSettings>({
        businessName: 'Schedulo',
        businessEmail: 'admin@schedulo.com',
        businessPhone: '',
        businessAddress: '',
        timezone: 'UTC',
    })

    const [appointments, setAppointments] = useState<AppointmentSettings>({
        defaultDuration: '60',
        bufferTime: '15',
        maxAdvanceBooking: '30',
        allowCancellation: true,
        cancellationDeadline: '24',
    })

    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        appointmentReminders: true,
        reminderHours: '24',
        newBookingAlert: true,
        cancellationAlert: true,
    })

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login')
        }
    }, [status, router])

    const showSuccess = (msg: string) => {
        setSuccessMessage(msg)
        setTimeout(() => setSuccessMessage(''), 3000)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        // Simulate save — wire up to your API as needed
        await new Promise(r => setTimeout(r, 800))
        setIsSaving(false)
        showSuccess('Settings saved successfully!')
    }

    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    const tabs = [
        { id: 'business', label: 'Business', icon: Building2 },
        { id: 'appointments', label: 'Appointments', icon: Calendar },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
    ] as const

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <Link
                    href="/dashboard/admin"
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ChevronLeft size={20} />
                    Back to Admin Panel
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                <p className="text-gray-600 mt-1">Configure system-wide options for your application</p>
            </div>

            <div className="p-6 max-w-4xl">
                {/* Success Banner */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <p className="text-green-700 font-medium">{successMessage}</p>
                    </div>
                )}

                <div className="flex gap-6">
                    {/* Sidebar Tabs */}
                    <div className="w-48 flex-shrink-0">
                        <nav className="space-y-1">
                            {tabs.map(({ id, label, icon: Icon }) => (
                                <button
                                    key={id}
                                    onClick={() => setActiveTab(id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all text-left ${activeTab === id
                                            ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }`}
                                >
                                    <Icon size={18} />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Panel */}
                    <div className="flex-1">
                        <form onSubmit={handleSave}>

                            {/* Business Settings */}
                            {activeTab === 'business' && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
                                    <h2 className="text-lg font-bold text-gray-900 mb-2">Business Information</h2>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name</label>
                                        <input
                                            type="text"
                                            value={business.businessName}
                                            onChange={e => setBusiness(p => ({ ...p, businessName: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Business Email</label>
                                        <input
                                            type="email"
                                            value={business.businessEmail}
                                            onChange={e => setBusiness(p => ({ ...p, businessEmail: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={business.businessPhone}
                                            onChange={e => setBusiness(p => ({ ...p, businessPhone: e.target.value }))}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                                        <input
                                            type="text"
                                            value={business.businessAddress}
                                            onChange={e => setBusiness(p => ({ ...p, businessAddress: e.target.value }))}
                                            placeholder="123 Main St, City, State"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                                        <select
                                            value={business.timezone}
                                            onChange={e => setBusiness(p => ({ ...p, timezone: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        >
                                            {TIMEZONES.map(tz => (
                                                <option key={tz} value={tz}>{tz}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Appointment Settings */}
                            {activeTab === 'appointments' && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
                                    <h2 className="text-lg font-bold text-gray-900 mb-2">Appointment Defaults</h2>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Default Duration (min)</label>
                                            <input
                                                type="number"
                                                min="15"
                                                max="480"
                                                value={appointments.defaultDuration}
                                                onChange={e => setAppointments(p => ({ ...p, defaultDuration: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Buffer Time (min)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                value={appointments.bufferTime}
                                                onChange={e => setAppointments(p => ({ ...p, bufferTime: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Max Advance Booking (days)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={appointments.maxAdvanceBooking}
                                            onChange={e => setAppointments(p => ({ ...p, maxAdvanceBooking: e.target.value }))}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">How far in advance customers can book</p>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Allow Cancellations</p>
                                                <p className="text-xs text-gray-500">Let customers cancel their appointments</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setAppointments(p => ({ ...p, allowCancellation: !p.allowCancellation }))}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${appointments.allowCancellation ? 'bg-blue-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${appointments.allowCancellation ? 'translate-x-5' : 'translate-x-0'
                                                    }`} />
                                            </button>
                                        </div>

                                        {appointments.allowCancellation && (
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Cancellation Deadline (hours before)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="168"
                                                    value={appointments.cancellationDeadline}
                                                    onChange={e => setAppointments(p => ({ ...p, cancellationDeadline: e.target.value }))}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Notification Settings */}
                            {activeTab === 'notifications' && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-5">
                                    <h2 className="text-lg font-bold text-gray-900 mb-2">Notification Preferences</h2>

                                    {[
                                        { key: 'emailNotifications', label: 'Email Notifications', desc: 'Send email notifications for all events' },
                                        { key: 'appointmentReminders', label: 'Appointment Reminders', desc: 'Send reminders before appointments' },
                                        { key: 'newBookingAlert', label: 'New Booking Alerts', desc: 'Notify admin when a new appointment is booked' },
                                        { key: 'cancellationAlert', label: 'Cancellation Alerts', desc: 'Notify admin when an appointment is cancelled' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">{label}</p>
                                                <p className="text-xs text-gray-500">{desc}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setNotifications(p => ({ ...p, [key]: !p[key as keyof NotificationSettings] }))}
                                                className={`relative w-11 h-6 rounded-full transition-colors ${notifications[key as keyof NotificationSettings] ? 'bg-blue-600' : 'bg-gray-300'
                                                    }`}
                                            >
                                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications[key as keyof NotificationSettings] ? 'translate-x-5' : 'translate-x-0'
                                                    }`} />
                                            </button>
                                        </div>
                                    ))}

                                    {notifications.appointmentReminders && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">Reminder Lead Time (hours)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="72"
                                                value={notifications.reminderHours}
                                                onChange={e => setNotifications(p => ({ ...p, reminderHours: e.target.value }))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">How many hours before the appointment to send a reminder</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Security Settings */}
                            {activeTab === 'security' && (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                                        <h2 className="text-lg font-bold text-gray-900">Security Options</h2>

                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Require Strong Passwords</p>
                                                <p className="text-xs text-gray-500">Enforce min 8 chars, numbers and symbols</p>
                                            </div>
                                            <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-not-allowed opacity-60">
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Session Timeout</p>
                                                <p className="text-xs text-gray-500">Auto logout after inactivity</p>
                                            </div>
                                            <select className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200">
                                                <option>30 minutes</option>
                                                <option>1 hour</option>
                                                <option>4 hours</option>
                                                <option>Never</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between py-2">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-700">Audit Logging</p>
                                                <p className="text-xs text-gray-500">Log all admin actions</p>
                                            </div>
                                            <div className="w-11 h-6 bg-blue-600 rounded-full relative cursor-not-allowed opacity-60">
                                                <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow translate-x-5" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <p className="text-sm text-amber-800">
                                            <span className="font-semibold">Note:</span> Some security settings are managed at the infrastructure level and cannot be changed here.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Save Button */}
                            {activeTab !== 'security' && (
                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors"
                                    >
                                        {isSaving ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                                        {isSaving ? 'Saving...' : 'Save Settings'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminSettingsPage
