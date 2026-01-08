import MovieCard from './MovieCard';
import Loading from '../common/Loading';

const MovieGrid = ({ movies, loading }) => {
  if (loading) {
    return <Loading message="Loading movies..." />;
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No movies found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie) => (
        <MovieCard key={movie._id || movie.id || movie.tmdbId} movie={movie} />
      ))}
    </div>
  );
};

export default MovieGrid;
