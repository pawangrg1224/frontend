'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, ArrowRight, Loader, CheckCircle } from 'lucide-react'

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Failed to send reset email')
        return
      }

      setIsSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="relative overflow-hidden scroll-smooth min-h-screen">
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

            {/* Success Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check Your Email</h1>
              <p className="text-gray-600 mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-lg font-semibold text-blue-600 mb-6">{email}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">📧 Didn't receive the email?</span>
                  <br />
                  Check your spam folder or try again.
                </p>
              </div>

              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 w-full justify-center"
              >
                Back to Sign In
                <ArrowRight size={20} />
              </Link>

              <button
                onClick={() => {
                  setIsSuccess(false)
                  setEmail('')
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Try another email
              </button>
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Enter your email to receive a password reset link</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">💡 Tip:</span> You'll receive an email with instructions to reset your password. The link expires in 24 hours.
              </p>
            </div>

            {/* Sign In Link */}
            <p className="text-center mt-8 text-gray-600">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                Sign in
              </Link>
            </p>
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

export default ForgotPasswordPage
