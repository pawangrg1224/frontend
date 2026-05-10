'use client';

import { useState } from 'react';
import StarRating from './StarRating';

interface ReviewFormProps {
    appointmentId: string;
    onSuccess?: () => void;
}

export default function ReviewForm({ appointmentId, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId, rating, feedback: feedback || undefined }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit review');
            }
            setSuccess(true);
            onSuccess?.();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <div className="text-green-600 text-2xl mb-2">✓</div>
                <p className="text-green-700 font-medium">Thank you for your review!</p>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Leave a Review</h3>

            <div>
                <label className="block text-sm text-gray-600 mb-1">Rating *</label>
                <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
                <label className="block text-sm text-gray-600 mb-1">
                    Feedback <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value.slice(0, 1000))}
                    rows={4}
                    placeholder="Share your experience..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
                <p className="text-xs text-gray-400 text-right mt-1">{feedback.length}/1000</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors"
            >
                {loading ? 'Submitting...' : 'Submit Review'}
            </button>
        </form>
    );
}
