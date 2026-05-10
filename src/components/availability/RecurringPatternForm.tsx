'use client';

import { useState } from 'react';

interface RecurringPatternFormProps {
    userId: string;
    onSuccess?: () => void;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
const DAY_LABELS: Record<string, string> = {
    MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu',
    FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

export default function RecurringPatternForm({ userId, onSuccess }: RecurringPatternFormProps) {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [effectiveFrom, setEffectiveFrom] = useState('');
    const [effectiveTo, setEffectiveTo] = useState('');
    const [bufferMinutes, setBufferMinutes] = useState(0);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const toggleDay = (day: string) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedDays.length === 0) {
            setMessage({ type: 'error', text: 'Select at least one day.' });
            return;
        }
        if (!effectiveFrom) {
            setMessage({ type: 'error', text: 'Effective from date is required.' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const res = await fetch('/api/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'pattern',
                    userId,
                    dayOfWeek: selectedDays,
                    startTime,
                    endTime,
                    effectiveFrom,
                    effectiveTo: effectiveTo || undefined,
                    bufferMinutes,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save pattern');
            }
            setMessage({ type: 'success', text: 'Recurring pattern saved successfully.' });
            onSuccess?.();
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
            <h3 className="font-semibold text-gray-800">Set Recurring Availability</h3>

            {/* Days */}
            <div>
                <label className="block text-sm text-gray-600 mb-2">Days of Week</label>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleDay(day)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${selectedDays.includes(day)
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                                }`}
                        >
                            {DAY_LABELS[day]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Times */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">End Time</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Effective From *</label>
                    <input
                        type="date"
                        value={effectiveFrom}
                        onChange={(e) => setEffectiveFrom(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Effective To <span className="text-gray-400">(optional)</span></label>
                    <input
                        type="date"
                        value={effectiveTo}
                        onChange={(e) => setEffectiveTo(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>
            </div>

            {/* Buffer */}
            <div>
                <label className="block text-sm text-gray-600 mb-1">Buffer Minutes</label>
                <input
                    type="number"
                    min={0}
                    value={bufferMinutes}
                    onChange={(e) => setBufferMinutes(Number(e.target.value))}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message.text}
                </p>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
            >
                {loading ? 'Saving...' : 'Save Pattern'}
            </button>
        </form>
    );
}
