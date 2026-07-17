'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Loader, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { toast, Toaster } from 'sonner'

export default function AccountPage() {
    const { data: session } = useSession()
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Please fill in all fields')
            return
        }

        if (newPassword.length < 8) {
            toast.error('New password must be at least 8 characters')
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error('New passwords do not match')
            return
        }

        if (currentPassword === newPassword) {
            toast.error('New password must be different from current password')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/doctor/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                toast.success('Password changed successfully!')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
            } else {
                toast.error(data.message || 'Failed to change password')
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <Toaster position="top-right" richColors />

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Settings</h1>
                <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Lock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                        <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                    </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                id="currentPassword"
                                type={showCurrent ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter your current password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                id="newPassword"
                                type={showNew ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter your new password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNew(!showNew)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5">Must be at least 8 characters</p>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                type={showConfirm ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your new password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Password Requirements
                        </h3>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className={newPassword.length >= 8 ? 'text-green-600' : 'text-gray-400'} />
                                At least 8 characters
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className={newPassword === confirmPassword && newPassword ? 'text-green-600' : 'text-gray-400'} />
                                Passwords match
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle size={14} className={currentPassword && newPassword !== currentPassword ? 'text-green-600' : 'text-gray-400'} />
                                Different from current password
                            </li>
                        </ul>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader size={20} className="animate-spin" />
                                Changing Password...
                            </>
                        ) : (
                            'Change Password'
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Account Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {session?.user?.name}</p>
                    <p><span className="font-medium">Email:</span> {session?.user?.email}</p>
                    <p><span className="font-medium">Role:</span> Doctor</p>
                </div>
            </div>
        </div>
    )
}
