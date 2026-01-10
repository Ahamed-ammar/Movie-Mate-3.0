import { useState } from 'react';

const RatingInput = ({ 
  rating: initialRating, 
  onChange
}) => {
  const [rating, setRating] = useState(initialRating || '');

  const handleRatingChange = (value) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setRating(num);
      onChange({ rating: num });
    } else if (value === '') {
      setRating('');
      onChange({ rating: undefined });
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Rating (1-10)
      </label>
      <input
        type="number"
        min="1"
        max="10"
        step="1"
        value={rating}
        onChange={(e) => handleRatingChange(e.target.value)}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
        placeholder="Enter rating (1-10)"
      />
      {rating !== '' && (
        <p className="text-sm text-gray-400 mt-2">
          Selected: {rating}/10
        </p>
      )}
    </div>
  );
};

export default RatingInput;
