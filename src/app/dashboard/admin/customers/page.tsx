'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Loader, Trash2 } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  createdAt: string
}

const AdminCustomersPage = () => {
  const { status } = useSession()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCustomers()
    }
  }, [status])

  const fetchCustomers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')
      const data = await response.json()
      setCustomers(data.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const response = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete customer')
      setCustomers(customers.filter(c => c.id !== id))
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
        <h1 className="text-3xl font-bold text-gray-900">All Customers</h1>
        <p className="text-gray-600 mt-1">System-wide customer management</p>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {customers.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No customers found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Name</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Email</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Address</th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{customer.name}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{customer.address || '-'}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(customer.id)}
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

export default AdminCustomersPage
