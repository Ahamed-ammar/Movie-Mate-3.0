const RatingDisplay = ({ ratingInteger, ratingStars, showBoth = false }) => {
  const renderStarRating = (stars) => {
    if (stars === undefined || stars === null) return null;
    
    // Validate stars is a valid number and within range
    const numStars = Number(stars);
    if (isNaN(numStars) || numStars < 0 || numStars > 10) {
      return <span className="text-gray-400 text-sm">Invalid rating</span>;
    }

    // Clamp to 5 stars max for display (scale 10-point to 5-star)
    const scaledStars = (numStars / 10) * 5;
    const fullStars = Math.floor(scaledStars);
    const hasHalfStar = scaledStars % 1 >= 0.5;
    const emptyStars = Math.max(0, 5 - fullStars - (hasHalfStar ? 1 : 0)); // Ensure non-negative

    return (
      <div className="flex items-center">
        <div className="flex text-yellow-400">
          {fullStars > 0 && [...Array(fullStars)].map((_, i) => (
            <span key={i}>★</span>
          ))}
          {hasHalfStar && <span>☆</span>}
          {emptyStars > 0 && [...Array(emptyStars)].map((_, i) => (
            <span key={i + fullStars + (hasHalfStar ? 1 : 0)} className="text-gray-600">★</span>
          ))}
        </div>
        <span className="ml-2 text-gray-300">{numStars.toFixed(1)}</span>
      </div>
    );
  };

  const renderIntegerRating = (rating) => {
    if (rating === undefined || rating === null) return null;
    
    // Validate rating is a valid number and within range
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 0 || numRating > 10) {
      return <span className="text-gray-400 text-sm">Invalid rating</span>;
    }
    
    const clampedRating = Math.max(0, Math.min(10, Math.floor(numRating)));

    return (
      <div className="flex items-center">
        <div className="flex text-primary-400">
          {[...Array(10)].map((_, i) => (
            <span key={i} className={i < clampedRating ? 'text-primary-400' : 'text-gray-600'}>
              ⭐
            </span>
          ))}
        </div>
        <span className="ml-2 text-gray-300">{clampedRating}/10</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {ratingStars !== undefined && ratingStars !== null && (
        <div>
          <span className="text-xs text-gray-400">Star Rating: </span>
          {renderStarRating(ratingStars)}
        </div>
      )}
      {ratingInteger !== undefined && ratingInteger !== null && (
        <div>
          <span className="text-xs text-gray-400">Integer Rating: </span>
          {renderIntegerRating(ratingInteger)}
        </div>
      )}
      {showBoth && ratingStars === undefined && ratingInteger === undefined && (
        <p className="text-gray-400 text-sm">No rating</p>
      )}
    </div>
  );
};

export default RatingDisplay;
