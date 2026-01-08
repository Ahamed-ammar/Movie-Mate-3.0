const RatingDisplay = ({ ratingInteger, ratingStars, showBoth = false }) => {
  const renderStarRating = (stars) => {
    if (stars === undefined || stars === null) return null;

    const fullStars = Math.floor(stars);
    const hasHalfStar = stars % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        <div className="flex text-yellow-400">
          {[...Array(fullStars)].map((_, i) => (
            <span key={i}>★</span>
          ))}
          {hasHalfStar && <span>☆</span>}
          {[...Array(emptyStars)].map((_, i) => (
            <span key={i + fullStars + (hasHalfStar ? 1 : 0)} className="text-gray-600">★</span>
          ))}
        </div>
        <span className="ml-2 text-gray-300">{stars.toFixed(1)}</span>
      </div>
    );
  };

  const renderIntegerRating = (rating) => {
    if (rating === undefined || rating === null) return null;

    return (
      <div className="flex items-center">
        <div className="flex text-primary-400">
          {[...Array(10)].map((_, i) => (
            <span key={i} className={i < rating ? 'text-primary-400' : 'text-gray-600'}>
              ⭐
            </span>
          ))}
        </div>
        <span className="ml-2 text-gray-300">{rating}/10</span>
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
