'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Root /dashboard — immediately redirects to the correct role sub-dashboard
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

      if (role === 'ADMIN') {
        router.replace('/dashboard/admin')
      } else if (role === 'DOCTOR') {
        router.replace('/dashboard/doctor')
      } else {
        router.replace('/dashboard/user')
      }
    }
  }, [status, session, router])

  // Return null instead of showing loader - redirect happens immediately
  return null
}
