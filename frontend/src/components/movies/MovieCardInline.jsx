import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';

/**
 * Optimized inline movie card component for carousel displays
 * Uses memoization to prevent unnecessary re-renders
 * Designed specifically for the Films page carousel
 */
const MovieCardInline = memo(({ movie, getPosterUrl, movieId, formatNumber, addToWatchlistMode, onAddToWatchlist, addToPlaylistMode, onAddToPlaylist, isAdding }) => {
  // Memoize poster URL
  const posterUrl = useMemo(() => getPosterUrl(movie), [movie, getPosterUrl]);
  
  // Memoize movie ID
  const id = useMemo(() => movieId(movie), [movie, movieId]);
  
  // Memoize stats calculations to prevent recalculation on every render
  const stats = useMemo(() => {
    const rating = movie.rating || 7;
    return {
      views: formatNumber(rating * 50000),
      lists: formatNumber(rating * 10000),
      likes: formatNumber(rating * 20000)
    };
  }, [movie.rating, formatNumber]);

  // Memoize rating display
  const ratingDisplay = useMemo(() => {
    if (!movie.rating) return null;
    return movie.rating.toFixed(1);
  }, [movie.rating]);

  const handleAddClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (addToPlaylistMode && onAddToPlaylist && !isAdding) {
      onAddToPlaylist(movie);
    } else if (addToWatchlistMode && onAddToWatchlist && !isAdding) {
      onAddToWatchlist(movie);
    }
  };

  const cardContent = (
    <div className={`group flex-shrink-0 w-44 md:w-52 transition-transform ${(addToWatchlistMode || addToPlaylistMode) ? '' : 'hover:scale-105'}`}>
      <div className="relative">
        {/* Movie Poster */}
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800 mb-2">
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
            }}
          />
          {ratingDisplay && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              ⭐ {ratingDisplay}
            </div>
          )}
          {(addToWatchlistMode || addToPlaylistMode) && (
            <button
              onClick={handleAddClick}
              disabled={isAdding}
              className="absolute top-2 left-2 w-10 h-10 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition shadow-lg z-10"
              title={addToPlaylistMode ? "Add to playlist" : "Add to watchlist"}
            >
              {isAdding ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Movie Stats */}
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2 px-1">
          <div className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>{stats.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>{stats.lists}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{stats.likes}</span>
          </div>
        </div>

        {/* Movie Title */}
        <h3 className="text-white font-medium text-sm mt-2 line-clamp-2 group-hover:text-yellow-400 transition">
          {movie.title}
        </h3>
      </div>
    </div>
  );

  // In add mode, wrap in Link but ensure button clicks don't navigate
  const wrappedContent = (addToWatchlistMode || addToPlaylistMode) ? (
    <Link 
      to={`/movie/${id}`}
      onClick={(e) => {
        // Prevent navigation if clicking the add button
        if (e.target.closest('button')) {
          e.preventDefault();
        }
      }}
      className="block"
    >
      {cardContent}
    </Link>
  ) : (
    <Link to={`/movie/${id}`}>
      {cardContent}
    </Link>
  );

  return wrappedContent;
});

MovieCardInline.displayName = 'MovieCardInline';

export default MovieCardInline;
