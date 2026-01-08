import { Link } from 'react-router-dom';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';

const MovieCard = ({ movie }) => {
  const posterUrl = movie.poster
    ? movie.poster
    : movie.poster_path
    ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Poster';

  const movieId = movie._id || movie.id || movie.tmdbId;

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
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
            }}
          />
          {movie.rating && (
            <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              ⭐ {movie.rating.toFixed(1)}
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white mb-1 line-clamp-2 group-hover:text-primary-400 transition">
            {movie.title}
          </h3>
          {movie.releaseDate && (
            <p className="text-gray-400 text-sm">
              {new Date(movie.releaseDate).getFullYear()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
