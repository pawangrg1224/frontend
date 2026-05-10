'use client'

import React, { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader, LogOut } from 'lucide-react'

interface UserData {
  email: string
  name?: string
}

const SettingsPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUserData({
        email: session.user.email || '',
        name: session.user.name || '',
      })
      setProfileForm({
        name: session.user.name || '',
        email: session.user.email || '',
      })
      setIsLoading(false)
    }
  }, [status, session])

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfileForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validatePassword = () => {
    const newErrors: Record<string, string> = {}
    if (!passwordForm.currentPassword) newErrors.currentPassword = 'Current password is required'
    if (!passwordForm.newPassword) newErrors.newPassword = 'New password is required'
    if (passwordForm.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters'
    if (!passwordForm.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    return newErrors
  }

  const validateProfile = () => {
    const newErrors: Record<string, string> = {}
    if (!profileForm.name.trim()) newErrors.name = 'Name is required'
    if (!profileForm.email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      newErrors.email = 'Invalid email format'
    }
    return newErrors
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validatePassword()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ submit: data.message || 'Failed to change password' })
        return
      }

      setSuccessMessage('Password changed successfully!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrors({ submit: 'An error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors = validateProfile()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsSubmitting(true)
    setSuccessMessage('')
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ submit: data.message || 'Failed to update profile' })
        return
      }

      setUserData(profileForm)
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setErrors({ submit: 'An error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      <div className="p-6">
        <div className="grid gap-6 max-w-2xl">
          {/* Success Message */}
          {successMessage && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 font-medium">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Account Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <p className="text-gray-900 font-medium">{userData?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900 font-medium">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Update Profile */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Update Profile</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                Save Profile
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password *
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.currentPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.currentPassword && <p className="text-red-600 text-sm mt-1">{errors.currentPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Minimum 6 characters"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.newPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.newPassword && <p className="text-red-600 text-sm mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
                  }`}
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                Update Password
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-50 rounded-lg border border-red-200 p-6">
            <h2 className="text-xl font-bold text-red-900 mb-4">Danger Zone</h2>
            <p className="text-red-700 text-sm mb-4">
              Sign out from your account on this device.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
