'use client';

import { useEffect, useState } from 'react';

interface EmailTemplateEditorProps {
    type: string;
    onSave?: () => void;
}

const AVAILABLE_VARIABLES = [
    '{{customerName}}',
    '{{appointmentDate}}',
    '{{appointmentTime}}',
    '{{serviceName}}',
    '{{doctorName}}',
    '{{location}}',
    '{{meetingLink}}',
    '{{cancellationReason}}',
    '{{companyName}}',
    '{{supportEmail}}',
];

const SAMPLE_DATA: Record<string, string> = {
    customerName: 'Jane Doe',
    appointmentDate: 'January 15, 2025',
    appointmentTime: '10:00 AM',
    serviceName: 'General Consultation',
    doctorName: 'Dr. Smith',
    location: '123 Medical Center Dr',
    meetingLink: 'https://meet.example.com/abc123',
    cancellationReason: 'Schedule conflict',
    companyName: 'City Hospital',
    supportEmail: 'support@cityhospital.com',
};

function renderTemplate(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => SAMPLE_DATA[key] ?? `{{${key}}}`);
}

export default function EmailTemplateEditor({ type, onSave }: EmailTemplateEditorProps) {
    const [subject, setSubject] = useState('');
    const [htmlBody, setHtmlBody] = useState('');
    const [textBody, setTextBody] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [preview, setPreview] = useState(false);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await fetch(`/api/admin/email-templates?type=${type}`);
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setSubject(data.subject ?? '');
                    setHtmlBody(data.htmlBody ?? '');
                    setTextBody(data.textBody ?? '');
                }
            }
            setLoading(false);
        };
        load();
    }, [type]);

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/email-templates', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, subject, htmlBody, textBody }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save template');
            }
            setMessage({ type: 'success', text: 'Template saved successfully.' });
            onSave?.();
        } catch (err: unknown) {
            setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Something went wrong' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-10 bg-gray-200 rounded-lg" />
                <div className="h-48 bg-gray-200 rounded-lg" />
                <div className="h-32 bg-gray-200 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Subject */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
            </div>

            {/* HTML Body */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HTML Body</label>
                <textarea
                    value={htmlBody}
                    onChange={(e) => setHtmlBody(e.target.value)}
                    rows={12}
                    placeholder="<p>Hello {{customerName}},</p>"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                />
            </div>

            {/* Text Body */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plain Text Body</label>
                <textarea
                    value={textBody}
                    onChange={(e) => setTextBody(e.target.value)}
                    rows={6}
                    placeholder="Hello {{customerName}},..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
                />
            </div>

            {/* Variables reference */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">Available Variables</p>
                <div className="flex flex-wrap gap-2">
                    {AVAILABLE_VARIABLES.map((v) => (
                        <code
                            key={v}
                            className="text-xs bg-white border border-gray-300 rounded px-2 py-0.5 text-blue-600 cursor-pointer hover:bg-blue-50"
                            onClick={() => {
                                const el = document.activeElement as HTMLTextAreaElement | null;
                                if (el && el.tagName === 'TEXTAREA') {
                                    const start = el.selectionStart;
                                    const end = el.selectionEnd;
                                    const val = el.value;
                                    el.value = val.slice(0, start) + v + val.slice(end);
                                    el.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }}
                        >
                            {v}
                        </code>
                    ))}
                </div>
            </div>

            {/* Preview */}
            <div>
                <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className="text-sm text-blue-500 hover:text-blue-600 underline"
                >
                    {preview ? 'Hide Preview' : 'Show Preview'}
                </button>
                {preview && (
                    <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs text-gray-500">
                            Subject: {renderTemplate(subject)}
                        </div>
                        <div
                            className="p-4 text-sm"
                            dangerouslySetInnerHTML={{ __html: renderTemplate(htmlBody) }}
                        />
                    </div>
                )}
            </div>

            {message && (
                <p className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {message.text}
                </p>
            )}

            <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium px-6 py-2 rounded-lg transition-colors"
            >
                {saving ? 'Saving...' : 'Save Template'}
            </button>
        </div>
    );
}
