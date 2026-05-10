'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  duration: number
  price: number
  createdAt: string
}

const AdminServicesPage = () => {
  const { status } = useSession()
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchServices()
    }
  }, [status])

  const fetchServices = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/services')
      if (!response.ok) throw new Error('Failed to fetch services')
      const data = await response.json()
      setServices(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      const response = await fetch(`/api/admin/services/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete service')
      setServices(services.filter(s => s.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <Link
          href="/dashboard/admin"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back to Admin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">All Services</h1>
        <p className="text-gray-600 mt-1">System-wide service management</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {services.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No services found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Duration</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{service.name}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{service.description || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{service.duration} min</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${service.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminServicesPage
