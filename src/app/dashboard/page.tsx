'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader } from 'lucide-react'
import { deriveLogicalRole } from '@/lib/role'

/**
 * Root /dashboard — immediately redirects to the correct role sub-dashboard.
 *   admin   → /dashboard/admin
 *   doctor  → /dashboard/doctor
 *   patient → /dashboard/user
 */
export default function DashboardRootPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
      return
    }
    if (status === 'authenticated') {
      const role = (session?.user as { role?: string })?.role ?? 'USER'
      const isDoctor = (session?.user as { isDoctor?: boolean })?.isDoctor ?? false
      const logical = deriveLogicalRole(role, isDoctor)

      if (logical === 'admin') router.replace('/dashboard/admin')
      else if (logical === 'doctor') router.replace('/dashboard/doctor')
      else router.replace('/dashboard/user')
    }
  }, [status, session, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Loader className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )
}
