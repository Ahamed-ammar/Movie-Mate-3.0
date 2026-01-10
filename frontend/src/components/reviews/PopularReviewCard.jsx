import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';

/**
 * Popular Review Card Component
 * Displays a review in the Letterboxd-style popular reviews section
 */
const PopularReviewCard = memo(({ review, getPosterUrl, movieId, formatNumber }) => {
  // Memoize movie data
  const movie = review.movieId;
  const reviewer = review.userId;
  
  // Memoize poster URL
  const posterUrl = useMemo(() => {
    if (!movie) return 'https://via.placeholder.com/500x750?text=No+Poster';
    return getPosterUrl(movie);
  }, [movie, getPosterUrl]);

  // Memoize movie ID
  const id = useMemo(() => {
    if (!movie) return null;
    return movieId(movie);
  }, [movie, movieId]);

  // Memoize release year
  const releaseYear = useMemo(() => {
    if (!movie?.releaseDate) return null;
    return new Date(movie.releaseDate).getFullYear();
  }, [movie?.releaseDate]);

  // Memoize star rating display (convert integer rating 1-10 to stars 1-5)
  const starRating = useMemo(() => {
    if (!review.ratingInteger) return null;
    const numRating = Number(review.ratingInteger);
    if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 10) {
      return null;
    }
    // Convert integer rating (1-10) to stars (1-5)
    // Mapping: 1-2 → 1 star, 3-4 → 2 stars, 5-6 → 3 stars, 7-8 → 4 stars, 9-10 → 5 stars
    const stars = Math.ceil(numRating / 2);
    const fullStars = Math.min(5, Math.max(1, stars));
    const emptyStars = 5 - fullStars;
    
    return { fullStars, emptyStars };
  }, [review.ratingInteger]);

  // Memoize likes count (using a mock number for now, can be replaced with actual likes)
  const likesCount = useMemo(() => {
    // For demo purposes, generate a random like count
    // In production, this would come from a likes model
    return Math.floor(Math.random() * 50000) + 1000;
  }, []);

  // Memoize review text snippet (first 100 characters)
  const reviewSnippet = useMemo(() => {
    if (!review.reviewText) return '';
    return review.reviewText.length > 100 
      ? review.reviewText.substring(0, 100) + '...'
      : review.reviewText;
  }, [review.reviewText]);

  // Memoize reviewer avatar
  const avatarUrl = useMemo(() => {
    if (reviewer?.profilePicture) return reviewer.profilePicture;
    // Default avatar based on username first letter
    const firstLetter = reviewer?.username?.charAt(0).toUpperCase() || '?';
    return `https://ui-avatars.com/api/?name=${firstLetter}&background=random&color=fff&size=32`;
  }, [reviewer]);

  if (!movie || !reviewer) return null;

  return (
    <div className="flex gap-4 mb-6 pb-6 border-b border-gray-800 last:border-0">
      {/* Movie Poster */}
      <Link
        to={`/movie/${id}`}
        className="flex-shrink-0 w-16 h-24 md:w-20 md:h-28 rounded overflow-hidden bg-gray-800"
      >
        <img
          src={posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
          }}
        />
      </Link>

      {/* Review Content */}
      <div className="flex-1 min-w-0">
        {/* Movie Title and Year */}
        <Link
          to={`/movie/${id}`}
          className="block mb-2"
        >
          <h3 className="text-white font-medium hover:text-green-400 transition">
            {movie.title} {releaseYear && `(${releaseYear})`}
          </h3>
        </Link>

        {/* Reviewer Info and Rating */}
        <div className="flex items-center gap-2 mb-2">
          <Link
            to={`/profile/${reviewer.username}`}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <img
              src={avatarUrl}
              alt={reviewer.username}
              className="w-6 h-6 rounded-full object-cover"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${reviewer.username?.charAt(0).toUpperCase() || '?'}&background=random&color=fff&size=32`;
              }}
            />
            <span className="text-gray-300 text-sm">{reviewer.username}</span>
          </Link>
          
          {/* Star Rating */}
          {starRating && (
            <div className="flex items-center gap-1 ml-2">
              <div className="flex text-green-400 text-sm">
                {[...Array(starRating.fullStars)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
                {starRating.emptyStars > 0 && (
                  <span className="text-gray-600">
                    {[...Array(starRating.emptyStars)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Review Text */}
        {review.reviewText && (
          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
            {reviewSnippet}
          </p>
        )}

        {/* Likes */}
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <span className="text-red-400">❤</span>
          <span>Like review</span>
          <span className="ml-1">{formatNumber(likesCount)} likes</span>
        </div>
      </div>
    </div>
  );
});

PopularReviewCard.displayName = 'PopularReviewCard';

export default PopularReviewCard;
