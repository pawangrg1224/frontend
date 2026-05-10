'use client';

import { useEffect, useState, useCallback } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import MetricCard from './MetricCard';

type Period = 'day' | 'week' | 'month' | 'year';

interface AnalyticsData {
    totalAppointments: number;
    revenue: number;
    noShowRate: number;
    retentionRate: number;
    appointmentTrends: { month: string; count: number }[];
    revenueByService: { name: string; revenue: number }[];
    statusDistribution: { status: string; count: number }[];
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function Skeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-64 bg-gray-200 rounded-xl" />
                <div className="h-64 bg-gray-200 rounded-xl" />
            </div>
            <div className="h-64 bg-gray-200 rounded-xl" />
        </div>
    );
}

export default function AnalyticsDashboard() {
    const [period, setPeriod] = useState<Period>('month');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        if (res.ok) setData(await res.json());
        setLoading(false);
    }, [period]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleExport = async () => {
        const res = await fetch('/api/admin/analytics/export');
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const PERIODS: Period[] = ['day', 'week', 'month', 'year'];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${period === p ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    ↓ Export CSV
                </button>
            </div>

            {loading || !data ? (
                <Skeleton />
            ) : (
                <>
                    {/* Metric Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <MetricCard
                            label="Total Appointments"
                            value={data.totalAppointments}
                            color="blue"
                            icon={<span className="text-lg">📅</span>}
                        />
                        <MetricCard
                            label="Revenue"
                            value={`$${data.revenue.toLocaleString()}`}
                            color="green"
                            icon={<span className="text-lg">💰</span>}
                        />
                        <MetricCard
                            label="No-Show Rate"
                            value={`${data.noShowRate.toFixed(1)}%`}
                            color="yellow"
                            icon={<span className="text-lg">⚠️</span>}
                        />
                        <MetricCard
                            label="Retention Rate"
                            value={`${data.retentionRate.toFixed(1)}%`}
                            color="purple"
                            icon={<span className="text-lg">🔄</span>}
                        />
                    </div>

                    {/* Charts row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Line chart: appointment trends */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Appointment Trends</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <LineChart data={data.appointmentTrends}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar chart: revenue by service */}
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue by Service (Top 5)</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={data.revenueByService.slice(0, 5)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie chart: status distribution */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Appointment Status Distribution</h3>
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <ResponsiveContainer width={220} height={220}>
                                <PieChart>
                                    <Pie
                                        data={data.statusDistribution}
                                        dataKey="count"
                                        nameKey="status"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={90}
                                        label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {data.statusDistribution.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-2">
                                {data.statusDistribution.map((item, i) => (
                                    <div key={item.status} className="flex items-center gap-2 text-sm">
                                        <span
                                            className="w-3 h-3 rounded-full inline-block"
                                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                        />
                                        <span className="text-gray-600 capitalize">{item.status.toLowerCase()}</span>
                                        <span className="font-medium text-gray-800">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
