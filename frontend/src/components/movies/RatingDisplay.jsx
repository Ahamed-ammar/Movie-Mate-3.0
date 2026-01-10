const RatingDisplay = ({ rating }) => {
  if (rating === undefined || rating === null) return null;
  
  // Validate rating is a valid integer and within range (1-10)
  const numRating = Number(rating);
  if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 10) {
    return <span className="text-gray-400 text-sm">Invalid rating</span>;
  }
  
  // Convert integer rating (1-10) to stars (1-5)
  // Mapping: 1-2 → 1 star, 3-4 → 2 stars, 5-6 → 3 stars, 7-8 → 4 stars, 9-10 → 5 stars
  const stars = Math.ceil(numRating / 2);
  const fullStars = Math.min(5, Math.max(1, stars));
  const emptyStars = 5 - fullStars;

  return (
    <div className="flex items-center">
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i}>★</span>
        ))}
        {emptyStars > 0 && [...Array(emptyStars)].map((_, i) => (
          <span key={i + fullStars} className="text-gray-600">★</span>
        ))}
      </div>
      <span className="ml-2 text-gray-300">{numRating}/10</span>
    </div>
  );
};

export default RatingDisplay;
