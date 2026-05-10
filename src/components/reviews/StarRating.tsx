'use client';

import { useState } from 'react';

interface StarRatingProps {
    value: number;
    onChange?: (v: number) => void;
    readonly?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
};

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
    const [hovered, setHovered] = useState(0);
    const sizeClass = sizeMap[size];

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = (hovered || value) >= star;
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readonly}
                        onClick={() => !readonly && onChange?.(star)}
                        onMouseEnter={() => !readonly && setHovered(star)}
                        onMouseLeave={() => !readonly && setHovered(0)}
                        className={`${sizeClass} leading-none transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
                            } ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
                        aria-label={`${star} star${star !== 1 ? 's' : ''}`}
                    >
                        ★
                    </button>
                );
            })}
            {readonly && value > 0 && (
                <span className="text-sm text-gray-600 ml-1">{value.toFixed(1)}</span>
            )}
        </div>
    );
}
