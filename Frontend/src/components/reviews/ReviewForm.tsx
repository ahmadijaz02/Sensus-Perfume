import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { reviewsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  productId: string;
  productName: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, productName, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rating || !title || !comment || !authorName || !authorEmail) {
      toast({
        title: 'Required Fields',
        description: 'Please fill in all fields.',
        variant: 'destructive'
      });
      return;
    }

    if (comment.length < 10) {
      toast({
        title: 'Comment Too Short',
        description: 'Please write at least 10 characters.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await reviewsAPI.create(productId, {
        rating,
        title,
        comment,
        authorName,
        authorEmail
      });

      toast({
        title: 'Review Submitted',
        description: 'Thank you for your review!',
        variant: 'default'
      });

      // Reset form
      setRating(0);
      setTitle('');
      setComment('');
      setAuthorName('');
      setAuthorEmail('');

      // Refresh reviews list
      onReviewSubmitted();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit review',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4 md:px-0">
      <h3 className="text-2xl font-playfair font-bold mb-6">Write a Review</h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium mb-3">Rate {productName}</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-gray-300'
                  } transition-colors`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Name</label>
          <Input
            type="text"
            placeholder="Enter your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Email</label>
          <Input
            type="email"
            placeholder="your@email.com"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            required
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-2">Review Title</label>
          <Input
            type="text"
            placeholder="e.g., Amazing fragrance!"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Review</label>
          <Textarea
            placeholder="Share your thoughts about this perfume..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </div>
  );
}
