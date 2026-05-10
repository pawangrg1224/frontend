'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import MessageBubble from './MessageBubble';

interface MessageSender {
    id: string;
    fullName: string;
    role: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string;
    isRead: boolean;
    sender: MessageSender;
}

interface ChatPanelProps {
    appointmentId: string;
    currentUserId: string;
}

export default function ChatPanel({ appointmentId, currentUserId }: ChatPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);
    const lastIdRef = useRef<string | undefined>(undefined);

    const unreadCount = messages.filter(
        (m) => !m.isRead && m.sender.id !== currentUserId
    ).length;

    const markRead = useCallback(async () => {
        await fetch(`/api/chat/${appointmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'markRead' }),
        });
    }, [appointmentId]);

    const fetchMessages = useCallback(async () => {
        const url = lastIdRef.current
            ? `/api/chat/${appointmentId}?after=${lastIdRef.current}`
            : `/api/chat/${appointmentId}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data: Message[] = await res.json();
        if (data.length > 0) {
            setMessages((prev) => {
                const ids = new Set(prev.map((m) => m.id));
                const newMsgs = data.filter((m) => !ids.has(m.id));
                return [...prev, ...newMsgs];
            });
            lastIdRef.current = data[data.length - 1].id;
        }
    }, [appointmentId]);

    // Initial load + mark read
    useEffect(() => {
        fetchMessages();
        markRead();
    }, [fetchMessages, markRead]);

    // Poll every 3 seconds
    useEffect(() => {
        const interval = setInterval(fetchMessages, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    // Auto-scroll on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || sending) return;
        setSending(true);
        setInput('');
        await fetch(`/api/chat/${appointmentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: text }),
        });
        await fetchMessages();
        setSending(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50"
                onFocus={markRead}
            >
                <span className="font-semibold text-gray-700">Chat</span>
                {unreadCount > 0 && (
                    <span className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5">
                        {unreadCount}
                    </span>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
                ))}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
