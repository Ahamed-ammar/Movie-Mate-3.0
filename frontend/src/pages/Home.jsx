import { useState, useEffect } from 'react';
import { moviesAPI } from '../services/api';
import MovieGrid from '../components/movies/MovieGrid';
import MovieSearch from '../components/movies/MovieSearch';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const Home = () => {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('search');

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const [trending, popular] = await Promise.all([
        moviesAPI.getTrending('day'),
        moviesAPI.getPopular()
      ]);
      setTrendingMovies(trending.data.data.movies);
      setPopularMovies(popular.data.data.movies);
    } catch (err) {
      console.error('Error loading movies:', err);
      
      // More detailed error messages
      let errorMessage = 'Failed to load movies';
      
      if (err.code === 'ECONNREFUSED' || err.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to backend server. Make sure the backend is running on port 5000.';
      } else if (err.response) {
        // Server responded with error
        errorMessage = err.response.data?.error || err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        // Request made but no response
        errorMessage = 'No response from server. Check if backend is running and API_URL is correct.';
      } else {
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Discover Movies</h1>

      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 ${
              activeTab === 'search'
                ? 'border-b-2 border-primary-400 text-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`px-4 py-2 ${
              activeTab === 'trending'
                ? 'border-b-2 border-primary-400 text-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Trending
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`px-4 py-2 ${
              activeTab === 'popular'
                ? 'border-b-2 border-primary-400 text-primary-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Popular
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={loadMovies} />}

      {activeTab === 'search' && <MovieSearch />}
      
      {activeTab === 'trending' && (
        loading ? <Loading /> : <MovieGrid movies={trendingMovies} />
      )}
      
      {activeTab === 'popular' && (
        loading ? <Loading /> : <MovieGrid movies={popularMovies} />
      )}
    </div>
  );
};

export default Home;
