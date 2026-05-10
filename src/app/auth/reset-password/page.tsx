'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react'

interface FormErrors {
  password?: string
  confirmPassword?: string
  token?: string
}

const ResetPasswordPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    // Validate token exists
    if (!token) {
      setErrors({ token: 'Invalid or expired reset link' })
      setIsValidatingToken(false)
      return
    }

    // In a real app, you'd validate the token with your backend
    setIsValidatingToken(false)
  }, [token])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setErrors({ token: data.message || 'Failed to reset password' })
        return
      }

      setIsSuccess(true)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      setErrors({ token: 'An error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (isValidatingToken) {
    return (
      <div className="relative overflow-hidden scroll-smooth min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />
        <div className="fixed top-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>
        <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-gray-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    )
  }

  if (errors.token && !isSuccess) {
    return (
      <div className="relative overflow-hidden scroll-smooth min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />
        <div className="fixed top-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>
        <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-md">
            <Link href="/" className="flex items-center justify-center gap-2 mb-12 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Schedulo</span>
            </Link>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h1>
              <p className="text-gray-600 mb-8">{errors.token}</p>

              <Link
                href="/auth/forgot-password"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Request New Reset Link
                <ArrowRight size={20} />
              </Link>

              <p className="text-center mt-6 text-gray-600">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Back to Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="relative overflow-hidden scroll-smooth min-h-screen">
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />
        <div className="fixed top-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>
        <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✓</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset</h1>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. Redirecting to sign in...
              </p>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300"
              >
                Go to Sign In
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden scroll-smooth min-h-screen">
      {/* Noise Texture */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"
        }}
      />

      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10" />

      {/* Animated Orbs */}
      <div className="fixed top-20 right-20 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>
      <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20 -z-10 animate-pulse"></div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 mb-12 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Schedulo</span>
          </Link>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Password</h1>
              <p className="text-gray-600">Enter a new password for your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all duration-200 bg-gray-50 focus:bg-white ${
                      errors.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    className={`w-full px-4 py-3 rounded-lg border focus:ring-2 outline-none transition-all duration-200 bg-gray-50 focus:bg-white ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">🔒 Password Requirements:</span>
                <br />
                • At least 8 characters long
                <br />
                • Mix of letters, numbers, and symbols (recommended)
              </p>
            </div>
          </div>

          {/* Footer Link */}
          <div className="text-center mt-8">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPasswordPage
