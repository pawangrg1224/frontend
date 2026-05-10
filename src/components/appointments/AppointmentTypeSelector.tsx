'use client';

interface Domain {
    id: string;
    company: string;
    address?: string;
}

interface AppointmentTypeSelectorProps {
    value: 'ONLINE' | 'OFFLINE';
    onChange: (v: 'ONLINE' | 'OFFLINE') => void;
    meetingLink?: string;
    onMeetingLinkChange?: (v: string) => void;
    domainId?: string;
    onDomainIdChange?: (v: string) => void;
    domains?: Domain[];
}

function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

export default function AppointmentTypeSelector({
    value,
    onChange,
    meetingLink = '',
    onMeetingLinkChange,
    domainId = '',
    onDomainIdChange,
    domains = [],
}: AppointmentTypeSelectorProps) {
    const urlInvalid = value === 'ONLINE' && meetingLink && !isValidUrl(meetingLink);

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={() => onChange('ONLINE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${value === 'ONLINE'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    Online
                </button>
                <button
                    type="button"
                    onClick={() => onChange('OFFLINE')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${value === 'OFFLINE'
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    In-Person
                </button>
            </div>

            {value === 'ONLINE' && (
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Meeting Link</label>
                    <input
                        type="url"
                        value={meetingLink}
                        onChange={(e) => onMeetingLinkChange?.(e.target.value)}
                        placeholder="https://meet.example.com/..."
                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${urlInvalid ? 'border-red-400' : 'border-gray-300'
                            }`}
                    />
                    {urlInvalid && <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>}
                </div>
            )}

            {value === 'OFFLINE' && domains.length > 0 && (
                <div>
                    <label className="block text-sm text-gray-600 mb-1">Location</label>
                    <select
                        value={domainId}
                        onChange={(e) => onDomainIdChange?.(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <option value="">Select a location</option>
                        {domains.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.company}{d.address ? ` — ${d.address}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}
        </div>
    );
}
