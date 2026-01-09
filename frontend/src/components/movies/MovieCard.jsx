import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';

const MovieCard = ({ movie }) => {
  // Memoize poster URL to prevent recalculation on every render
  const posterUrl = useMemo(() => {
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  }, [movie.poster, movie.poster_path]);

  // Memoize movie ID to prevent recalculation
  const movieId = useMemo(() => 
    movie.tmdbId || movie.id || movie._id,
    [movie.tmdbId, movie.id, movie._id]
  );

  // Memoize release year to prevent date parsing on every render
  const releaseYear = useMemo(() => {
    if (!movie.releaseDate) return null;
    return new Date(movie.releaseDate).getFullYear();
  }, [movie.releaseDate]);

  // Memoize rating display
  const ratingDisplay = useMemo(() => {
    if (!movie.rating) return null;
    return movie.rating.toFixed(1);
  }, [movie.rating]);

  return (
    <Link
      to={`/movie/${movieId}`}
      className="block group transition-transform hover:scale-105"
    >
      <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        <div className="relative aspect-[2/3] overflow-hidden">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
            }}
          />
          {ratingDisplay && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              ⭐ {ratingDisplay}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-primary-400 transition">
            {movie.title}
          </h3>
          {releaseYear && (
            <p className="text-gray-400 text-sm">
              {releaseYear}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

// Memoize component to prevent re-renders when props haven't changed
export default memo(MovieCard);
