import { useState, useEffect } from 'react';
import { moviesAPI } from '../../services/api';
import MovieGrid from './MovieGrid';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

const MovieSearch = () => {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length > 2) {
        searchMovies();
      } else {
        setMovies([]);
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.search(query);
      setMovies(response.data.data.movies);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search for movies..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500"
        />
      </div>

      {error && <ErrorMessage message={error} onRetry={searchMovies} />}

      {loading ? (
        <Loading message="Searching movies..." />
      ) : (
        <MovieGrid movies={movies} />
      )}
    </div>
  );
};

export default MovieSearch;
