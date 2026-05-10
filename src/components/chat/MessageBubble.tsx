'use client';

interface MessageSender {
    id: string;
    fullName: string;
    role: string;
}

interface Message {
    id: string;
    content: string;
    createdAt: string | Date;
    isRead: boolean;
    sender: MessageSender;
}

interface MessageBubbleProps {
    message: Message;
    currentUserId: string;
}

function formatTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, currentUserId }: MessageBubbleProps) {
    const isOwn = message.sender.id === currentUserId;

    return (
        <div className={`flex flex-col mb-3 ${isOwn ? 'items-end' : 'items-start'}`}>
            {!isOwn && (
                <span className="text-xs text-gray-500 mb-1 px-1">{message.sender.fullName}</span>
            )}
            <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${isOwn
                        ? 'bg-blue-500 text-white rounded-br-sm'
                        : 'bg-gray-200 text-gray-800 rounded-bl-sm'
                    }`}
            >
                {message.content}
            </div>
            <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                <span className="text-xs text-gray-400">{formatTime(message.createdAt)}</span>
                {isOwn && (
                    <span className={`text-xs ${message.isRead ? 'text-blue-400' : 'text-gray-400'}`}>
                        {message.isRead ? '✓✓' : '✓'}
                    </span>
                )}
            </div>
        </div>
    );
}
