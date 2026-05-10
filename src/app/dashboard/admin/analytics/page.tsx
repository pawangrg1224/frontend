'use client'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export default function AdminAnalyticsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    useEffect(() => {
        if (status === 'unauthenticated') router.push('/auth/login')
        if (status === 'authenticated' && session?.user?.role !== 'ADMIN') router.push('/dashboard')
    }, [status, session, router])
    if (status === 'loading') return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-6">
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-500 mt-1">Appointment trends, revenue, and performance metrics</p>
            </div>
            <div className="p-6"><AnalyticsDashboard /></div>
        </div>
    )
}
