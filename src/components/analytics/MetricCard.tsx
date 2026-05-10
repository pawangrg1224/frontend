'use client';

import React from 'react';

interface TrendInfo {
    value: number;
    label: string;
}

interface MetricCardProps {
    label: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    trend?: TrendInfo;
    color?: 'blue' | 'green' | 'yellow' | 'purple' | 'red';
}

const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
};

export default function MetricCard({ label, value, subtitle, icon, trend, color = 'blue' }: MetricCardProps) {
    const iconBg = colorMap[color];
    const isPositive = trend && trend.value >= 0;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{label}</span>
                {icon && (
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
                        {icon}
                    </div>
                )}
            </div>
            <div>
                <span className="text-3xl font-bold text-gray-900">{value}</span>
                {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{isPositive ? '↑' : '↓'}</span>
                    <span>{Math.abs(trend.value)}%</span>
                    <span className="text-gray-400 font-normal">{trend.label}</span>
                </div>
            )}
        </div>
    );
}
