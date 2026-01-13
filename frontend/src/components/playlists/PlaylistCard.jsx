import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';

const PlaylistCard = ({ playlist, isOwnPlaylist }) => {
  const movies = playlist.movies || [];
  const displayedMovies = movies.slice(0, 5); // Show up to 5 posters
  const remainingCount = Math.max(0, movies.length - 5);

  const getPosterUrl = (movie) => {
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] cursor-pointer">
      <Link to={`/playlist/${playlist._id}`} className="block">
        {/* Poster Stack */}
        <div className="relative h-64 bg-gray-900 flex items-center justify-center">
          {displayedMovies.length > 0 ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {displayedMovies.map((movieEntry, index) => {
                const movie = movieEntry.movieId || movieEntry;
                const posterUrl = getPosterUrl(movie);
                const offset = index * 16; // Overlap amount
                const zIndex = displayedMovies.length - index;
                
                return (
                  <div
                    key={movie._id || movie.id || index}
                    className="absolute"
                    style={{
                      left: `calc(50% - 64px + ${offset - (displayedMovies.length - 1) * 8}px)`,
                      zIndex,
                      transform: `translateX(-50%)`
                    }}
                  >
                    <div
                      className="w-24 h-36 rounded-md overflow-hidden shadow-lg border-2 border-gray-700"
                    >
                      <img
                        src={posterUrl}
                        alt={movie.title || 'Movie poster'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                        }}
                      />
                    </div>
                  </div>
                );
              })}
              {remainingCount > 0 && (
                <div
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 text-white px-3 py-2 rounded-md text-sm font-semibold z-10"
                >
                  +{remainingCount}
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 text-center">
              <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No movies yet</p>
            </div>
          )}
        </div>

        {/* Playlist Info */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-gray-400 text-sm mb-2 line-clamp-2">
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{movies.length} {movies.length === 1 ? 'movie' : 'movies'}</span>
            {isOwnPlaylist && (
              <span className="text-gray-600">
                {playlist.isPublic ? 'Public' : 'Private'}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default PlaylistCard;
