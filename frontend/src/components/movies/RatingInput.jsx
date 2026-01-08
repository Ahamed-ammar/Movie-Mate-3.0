import { useState } from 'react';

const RatingInput = ({ 
  ratingInteger: initialInteger, 
  ratingStars: initialStars, 
  onChange,
  showBoth = true 
}) => {
  const [ratingInteger, setRatingInteger] = useState(initialInteger || '');
  const [ratingStars, setRatingStars] = useState(initialStars !== undefined ? initialStars : '');

  const handleIntegerChange = (value) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 1 && num <= 10) {
      setRatingInteger(num);
      onChange({ ratingInteger: num, ratingStars: ratingStars || undefined });
    } else if (value === '') {
      setRatingInteger('');
      onChange({ ratingInteger: undefined, ratingStars: ratingStars || undefined });
    }
  };

  const handleStarClick = (value) => {
    setRatingStars(value);
    onChange({ ratingInteger: ratingInteger || undefined, ratingStars: value });
  };

  const renderStarInput = () => {
    const stars = [];
    for (let i = 0; i <= 10; i += 0.5) {
      const isSelected = ratingStars === i;
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => handleStarClick(i)}
          className={`px-2 py-1 rounded ${
            isSelected
              ? 'bg-yellow-500 text-black'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          {i}
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="space-y-4">
      {showBoth && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Star Rating (0-10, 0.5 increments)
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {renderStarInput()}
          </div>
          {ratingStars !== '' && (
            <p className="text-sm text-gray-400 mt-2">
              Selected: {ratingStars} stars
            </p>
          )}
        </div>
      )}

      {showBoth && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Integer Rating (1-10)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={ratingInteger}
            onChange={(e) => handleIntegerChange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="Enter rating (1-10)"
          />
        </div>
      )}

      {!showBoth && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rating
          </label>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="number"
                min="1"
                max="10"
                step="0.5"
                value={ratingStars !== '' ? ratingStars : ratingInteger}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 10) {
                    handleStarClick(val);
                  }
                }}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
                placeholder="0-10"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingInput;
