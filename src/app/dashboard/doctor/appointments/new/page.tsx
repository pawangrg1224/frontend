"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader } from "lucide-react";

interface Customer {
  id: string;
  name: string;
}

interface Domain {
  id: string;
  company: string;
}

interface Service {
  id: string;
  name: string;
}

const NewAppointmentPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    customerId: "",
    serviceId: "",
    domainId: "",
    date: "",
    notes: "",
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDomains = async () => {
    try {
      const response = await fetch("/api/domains");
      if (!response.ok) throw new Error("Failed to fetch domains");
      const data = await response.json();
      setDomains(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Failed to fetch customers");
      const data = await response.json();
      setCustomers(data.data);
    } catch (err) {
      setErrors((prev) => ({ ...prev, customers: "Failed to load customers" }));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      const data = await response.json();
      setServices(data.data);
    } catch (err) {
      setErrors((prev) => ({ ...prev, services: "Failed to load services" }));
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      Promise.all([fetchCustomers(), fetchServices(), fetchDomains()]);
    }
  }, [status]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId) newErrors.customerId = "Customer is required";
    if (!formData.serviceId) newErrors.serviceId = "Service is required";
    if (!formData.date) newErrors.date = "Date and time are required";
    if (new Date(formData.date) < new Date())
      newErrors.date = "Date must be in the future";
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          domainId: formData.domainId || null,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        setErrors({ submit: data.message });
        return;
      }
      router.push("/dashboard/doctor/appointments");
    } catch (err) {
      setErrors({ submit: "An error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <Link
          href="/dashboard/doctor/appointments"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeft size={20} />
          Back to Appointments
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">New Appointment</h1>
      </div>

      <div className="p-6">
        <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-6">
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 font-medium">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.customerId
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-600 text-sm mt-1">{errors.customerId}</p>
              )}
              {customers.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  No customers yet.{" "}
                  <Link
                    href="/dashboard/customers/new"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Service *
              </label>
              <select
                name="serviceId"
                value={formData.serviceId}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.serviceId
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
              {errors.serviceId && (
                <p className="text-red-600 text-sm mt-1">{errors.serviceId}</p>
              )}
              {services.length === 0 && (
                <p className="text-gray-500 text-sm mt-2">
                  No services yet.{" "}
                  <Link
                    href="/dashboard/services/new"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Domain (Company)
              </label>
              <select
                name="domainId"
                value={formData.domainId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              >
                <option value="">Select a domain (optional)</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.company}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.date
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-blue-200 focus:border-blue-500"
                }`}
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any special notes or instructions..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader className="w-4 h-4 animate-spin" />}
                Schedule Appointment
              </button>
              <Link
                href="/dashboard/doctor/appointments"
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentPage;
