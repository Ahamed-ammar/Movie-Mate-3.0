import { useState, useEffect, useMemo, useCallback } from 'react';
import { reviewsAPI } from '../../services/api';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';
import PopularReviewCard from './PopularReviewCard';

/**
 * Popular Reviews Section Component
 * Displays popular reviews from this week in Letterboxd style
 */
const PopularReviewsSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize helper functions
  const getPosterUrl = useCallback((movie) => {
    if (!movie) return 'https://via.placeholder.com/500x750?text=No+Poster';
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  }, []);

  const movieId = useCallback((movie) => {
    if (!movie) return null;
    return movie.tmdbId || movie.id || movie._id;
  }, []);

  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }, []);

  // Load popular reviews
  useEffect(() => {
    const loadPopularReviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await reviewsAPI.getPopularReviews(10);
        setReviews(response.data.data.reviews || []);
      } catch (err) {
        console.error('Error loading popular reviews:', err);
        setError('Failed to load popular reviews');
        setReviews([]); // Set empty array on error
      } finally {
        setLoading(false);
      }
    };

    loadPopularReviews();
  }, []);

  // Memoize displayed reviews
  const displayedReviews = useMemo(() => {
    return reviews.slice(0, 8); // Show top 8 reviews
  }, [reviews]);

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">POPULAR REVIEWS THIS WEEK</h2>
          <button className="text-gray-400 hover:text-white transition text-sm">
            MORE
          </button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-4 animate-pulse">
              <div className="w-16 h-24 bg-gray-800 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-1/3"></div>
                <div className="h-3 bg-gray-800 rounded w-1/4"></div>
                <div className="h-3 bg-gray-800 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || displayedReviews.length === 0) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">POPULAR REVIEWS THIS WEEK</h2>
          <button className="text-gray-400 hover:text-white transition text-sm">
            MORE
          </button>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-400">
            {error || 'No popular reviews this week. Be the first to review a movie!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">POPULAR REVIEWS THIS WEEK</h2>
        <button className="text-gray-400 hover:text-white transition text-sm">
          MORE
        </button>
      </div>
      
      <div className="space-y-0">
        {displayedReviews.map((review) => (
          <PopularReviewCard
            key={review._id}
            review={review}
            getPosterUrl={getPosterUrl}
            movieId={movieId}
            formatNumber={formatNumber}
          />
        ))}
      </div>
    </div>
  );
};

export default PopularReviewsSection;
