'use client';

import { useEffect, useState, useCallback } from 'react';
import StarRating from './StarRating';

interface Review {
    id: string;
    rating: number;
    feedback?: string;
    createdAt: string;
    helpfulCount: number;
    isFlagged: boolean;
    isHidden: boolean;
    adminResponse?: string;
    customer: { name: string };
}

interface ReviewListProps {
    serviceId?: string;
    showAdminControls?: boolean;
}

const PAGE_SIZE = 10;

export default function ReviewList({ serviceId, showAdminControls = false }: ReviewListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [avgRating, setAvgRating] = useState(0);
    const [totalCount, setTotalCount] = useState(0);

    const fetchReviews = useCallback(async (pageNum: number) => {
        setLoading(true);
        const params = new URLSearchParams();
        if (serviceId) params.set('serviceId', serviceId);
        params.set('page', String(pageNum));
        params.set('limit', String(PAGE_SIZE));
        const res = await fetch(`/api/reviews?${params}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        const items: Review[] = data.reviews ?? data;
        if (pageNum === 1) {
            setReviews(items);
        } else {
            setReviews((prev) => [...prev, ...items]);
        }
        setAvgRating(data.avgRating ?? 0);
        setTotalCount(data.total ?? items.length);
        setHasMore(items.length === PAGE_SIZE);
        setLoading(false);
    }, [serviceId]);

    useEffect(() => {
        setPage(1);
        fetchReviews(1);
    }, [fetchReviews]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchReviews(next);
    };

    const handleVote = async (id: string) => {
        await fetch(`/api/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'vote' }),
        });
        fetchReviews(1);
    };

    const handleAdminAction = async (id: string, action: 'flag' | 'hide' | 'respond', response?: string) => {
        await fetch(`/api/reviews/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, adminResponse: response }),
        });
        fetchReviews(1);
    };

    return (
        <div className="space-y-4">
            {/* Summary */}
            {totalCount > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="text-4xl font-bold text-gray-800">{avgRating.toFixed(1)}</div>
                    <div>
                        <StarRating value={Math.round(avgRating)} readonly size="md" />
                        <p className="text-sm text-gray-500 mt-1">{totalCount} review{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                </div>
            )}

            {loading && reviews.length === 0 && (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-100 rounded-xl h-24 animate-pulse" />
                    ))}
                </div>
            )}

            {reviews.map((review) => (
                <div
                    key={review.id}
                    className={`bg-white border rounded-xl p-4 space-y-2 ${review.isHidden ? 'opacity-50' : ''}`}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <StarRating value={review.rating} readonly size="sm" />
                            <p className="text-sm font-medium text-gray-700 mt-1">
                                {review.customer.name.split(' ')[0]}
                            </p>
                        </div>
                        <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                    </div>

                    {review.feedback && (
                        <p className="text-sm text-gray-600">{review.feedback}</p>
                    )}

                    {review.adminResponse && (
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700">
                            <span className="font-medium">Response: </span>{review.adminResponse}
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-1">
                        <button
                            onClick={() => handleVote(review.id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 transition-colors"
                        >
                            👍 <span>{review.helpfulCount ?? 0} helpful</span>
                        </button>

                        {showAdminControls && (
                            <>
                                <button
                                    onClick={() => handleAdminAction(review.id, 'flag')}
                                    className="text-xs text-orange-500 hover:text-orange-600"
                                >
                                    {review.isFlagged ? 'Unflag' : 'Flag'}
                                </button>
                                <button
                                    onClick={() => handleAdminAction(review.id, 'hide')}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    {review.isHidden ? 'Show' : 'Hide'}
                                </button>
                                <button
                                    onClick={() => {
                                        const resp = prompt('Enter admin response:');
                                        if (resp) handleAdminAction(review.id, 'respond', resp);
                                    }}
                                    className="text-xs text-blue-500 hover:text-blue-600"
                                >
                                    Respond
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}

            {hasMore && (
                <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Load more'}
                </button>
            )}

            {!loading && reviews.length === 0 && (
                <p className="text-center text-gray-400 py-8">No reviews yet.</p>
            )}
        </div>
    );
}
