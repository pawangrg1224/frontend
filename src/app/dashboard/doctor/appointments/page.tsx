"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Loader, Calendar, Clock, User } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  status: string;
  notes?: string;
  customer: { id: string; name: string; email: string };
  service: { id: string; name: string };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-blue-100 text-blue-800",
};

const AppointmentsPage = () => {
  const { status } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchAppointments = async () => {
      try {
        const res = await fetch("/api/appointments");
        if (!res.ok) throw new Error("Failed to fetch appointments");
        const data = await res.json();
        setAppointments(data.data || []);
      } catch (err) {
        setError("Could not load appointments.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAppointments();
  }, [status]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <Link
          href="/dashboard/doctor/appointments/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus size={18} />
          New Appointment
        </Link>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {appointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No appointments yet</h3>
            <p className="text-gray-500 mb-6">Get started by scheduling your first appointment.</p>
            <Link
              href="/dashboard/doctor/appointments/new"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus size={18} />
              New Appointment
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{apt.service.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {apt.customer.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {new Date(apt.date).toLocaleString()}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-sm text-gray-400 mt-1">{apt.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[apt.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {apt.status}
                  </span>
                  <Link
                    href={`/dashboard/appointments/${apt.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
