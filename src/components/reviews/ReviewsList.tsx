import { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { reviewsAPI } from '@/lib/api';
import { Review } from '@/types/product';
import { useToast } from '@/hooks/use-toast';

interface ReviewsListProps {
  productId: string;
  triggerRefresh?: number;
}

export default function ReviewsList({ productId, triggerRefresh }: ReviewsListProps) {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'highest'>('recent');
  const [displayCount, setDisplayCount] = useState(3); // Start with 3 reviews
  const CHUNK_SIZE = 3; // Load 3 reviews at a time

  useEffect(() => {
    fetchReviews();
  }, [productId, triggerRefresh]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await reviewsAPI.getByProductId(productId);
      setReviews(data);

      // Calculate average rating
      if (data.length > 0) {
        const avg = data.reduce((sum: number, review: Review) => sum + review.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (review: Review) => {
    try {
      await reviewsAPI.markHelpful(productId, review._id || '');
      // Refresh reviews
      fetchReviews();
      toast({
        title: 'Thank you!',
        description: 'Your feedback has been recorded.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark review as helpful',
        variant: 'destructive'
      });
    }
  };

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'helpful') {
      return (b.helpful || 0) - (a.helpful || 0);
    }
    if (sortBy === 'highest') {
      return b.rating - a.rating;
    }
    // recent
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length
  }));

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0 border-t">
      <h3 className="text-2xl font-playfair font-bold mb-6">Customer Reviews</h3>

      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg mb-2">No reviews yet</p>
          <p className="text-sm">Be the first to review this perfume!</p>
        </div>
      ) : (
        <>
          {/* Rating Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 pb-8 border-b">
            {/* Average Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-4xl font-playfair font-bold mb-2">{averageRating}</div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(averageRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-gray-300'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600">Based on {reviews.length} reviews</p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 space-y-2">
              {ratingDistribution.map(({ rating, count }) => (
                <div key={rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium min-w-[40px]">{rating} stars</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 transition-all"
                      style={{ width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 min-w-[30px] text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                sortBy === 'recent'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('helpful')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                sortBy === 'helpful'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Most Helpful
            </button>
            <button
              onClick={() => setSortBy('highest')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                sortBy === 'highest'
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Highest Rated
            </button>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {sortedReviews.slice(0, displayCount).map((review) => (
              <div key={review._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-lg">{review.title}</h4>
                    <p className="text-sm text-gray-600">by {review.authorName}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex gap-0.5 justify-end mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={16}
                          className={
                            star <= review.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString()
                        : 'Just now'}
                    </p>
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>

                {/* Helpful Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkHelpful(review)}
                  className="gap-2"
                >
                  <ThumbsUp size={16} />
                  Helpful ({review.helpful || 0})
                </Button>
              </div>
            ))}
          </div>

          {/* Load More Reviews Button */}
          {displayCount < sortedReviews.length && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => setDisplayCount(prev => Math.min(prev + CHUNK_SIZE, sortedReviews.length))}
                variant="outline"
                className="px-8 py-2 text-base"
              >
                Read More Reviews ({displayCount} of {sortedReviews.length})
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
