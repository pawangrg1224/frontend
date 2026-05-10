'use client';

import { useEffect, useState, useCallback } from 'react';

interface Slot {
    id: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    isBooked?: boolean;
}

interface AvailabilityCalendarProps {
    userId: string;
    onSlotChange?: () => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const START_HOUR = 8;
const END_HOUR = 18;

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, n: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + n);
    return d;
}

function toTimeLabel(hour: number, min: number): string {
    const h = hour % 12 || 12;
    const ampm = hour < 12 ? 'am' : 'pm';
    return `${h}:${min === 0 ? '00' : '30'}${ampm}`;
}

function slotKey(date: Date, hour: number, min: number): string {
    const d = new Date(date);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
}

export default function AvailabilityCalendar({ userId, onSlotChange }: AvailabilityCalendarProps) {
    const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
    const [slots, setSlots] = useState<Slot[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchSlots = useCallback(async () => {
        setLoading(true);
        const from = weekStart.toISOString();
        const to = addDays(weekStart, 7).toISOString();
        const res = await fetch(`/api/availability?userId=${userId}&from=${from}&to=${to}`);
        if (res.ok) {
            const data = await res.json();
            setSlots(data.slots ?? data);
        }
        setLoading(false);
    }, [userId, weekStart]);

    useEffect(() => { fetchSlots(); }, [fetchSlots]);

    const getSlotForCell = (dayIndex: number, hour: number, min: number): Slot | undefined => {
        const cellDate = addDays(weekStart, dayIndex);
        const iso = slotKey(cellDate, hour, min);
        return slots.find((s) => {
            const start = new Date(s.startTime);
            return start.toISOString() === iso;
        });
    };

    const handleCellClick = async (dayIndex: number, hour: number, min: number) => {
        const existing = getSlotForCell(dayIndex, hour, min);
        if (existing) {
            await fetch(`/api/availability/${existing.id}`, { method: 'DELETE' });
        } else {
            const cellDate = addDays(weekStart, dayIndex);
            const start = new Date(cellDate);
            start.setHours(hour, min, 0, 0);
            const end = new Date(start);
            end.setMinutes(end.getMinutes() + 30);
            await fetch('/api/availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, startTime: start.toISOString(), endTime: end.toISOString() }),
            });
        }
        await fetchSlots();
        onSlotChange?.();
    };

    const timeRows: { hour: number; min: number }[] = [];
    for (let h = START_HOUR; h < END_HOUR; h++) {
        timeRows.push({ hour: h, min: 0 });
        timeRows.push({ hour: h, min: 30 });
    }

    const weekLabel = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${addDays(weekStart, 6).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Navigation */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <button
                    onClick={() => setWeekStart((w) => addDays(w, -7))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                    ‹
                </button>
                <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
                <button
                    onClick={() => setWeekStart((w) => addDays(w, 7))}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600"
                >
                    ›
                </button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Available</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Booked</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200 inline-block" /> Empty</span>
            </div>

            {/* Grid */}
            <div className={`overflow-auto ${loading ? 'opacity-50' : ''}`}>
                <div className="grid" style={{ gridTemplateColumns: `4rem repeat(7, 1fr)` }}>
                    {/* Header row */}
                    <div className="h-8" />
                    {DAYS.map((day, i) => {
                        const d = addDays(weekStart, i);
                        return (
                            <div key={day} className="h-8 flex flex-col items-center justify-center border-l border-gray-100">
                                <span className="text-xs font-medium text-gray-500">{day}</span>
                                <span className="text-xs text-gray-400">{d.getDate()}</span>
                            </div>
                        );
                    })}

                    {/* Time rows */}
                    {timeRows.map(({ hour, min }) => (
                        <>
                            <div
                                key={`label-${hour}-${min}`}
                                className="h-7 flex items-center justify-end pr-2 text-xs text-gray-400"
                            >
                                {min === 0 ? toTimeLabel(hour, min) : ''}
                            </div>
                            {DAYS.map((_, dayIndex) => {
                                const slot = getSlotForCell(dayIndex, hour, min);
                                let bg = 'bg-gray-50 hover:bg-gray-100';
                                if (slot) {
                                    bg = slot.isBooked ? 'bg-blue-200 cursor-not-allowed' : 'bg-green-300 hover:bg-green-400';
                                }
                                return (
                                    <div
                                        key={`cell-${dayIndex}-${hour}-${min}`}
                                        onClick={() => !slot?.isBooked && handleCellClick(dayIndex, hour, min)}
                                        className={`h-7 border-l border-t border-gray-100 cursor-pointer transition-colors ${bg}`}
                                    />
                                );
                            })}
                        </>
                    ))}
                </div>
            </div>
        </div>
    );
}
