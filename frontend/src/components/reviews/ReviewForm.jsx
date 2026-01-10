import { useState } from 'react';
import RatingInput from '../movies/RatingInput';

const ReviewForm = ({ 
  initialRating, 
  initialReviewText, 
  initialVisibility = 'public',
  onSubmit, 
  onCancel,
  submitLabel = 'Submit Review'
}) => {
  const [rating, setRating] = useState(initialRating);
  const [reviewText, setReviewText] = useState(initialReviewText || '');
  const [visibility, setVisibility] = useState(initialVisibility);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ratingInteger: rating || undefined,
      reviewText: reviewText.trim() || undefined,
      visibility
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 rounded-lg p-6">
      <h3 className="text-xl font-semibold mb-4">Write a Review</h3>

      <div className="mb-4">
        <RatingInput
          rating={rating}
          onChange={(ratings) => {
            setRating(ratings.rating);
          }}
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Review (optional)
        </label>
        <textarea
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows="5"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
          placeholder="Share your thoughts about this movie..."
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Visibility
        </label>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-700 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
