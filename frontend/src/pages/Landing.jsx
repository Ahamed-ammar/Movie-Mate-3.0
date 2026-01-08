import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { TMDB_IMAGE_BASE_URL } from '../utils/constants';
import Loading from '../components/common/Loading';

const Landing = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPopularMovies();
  }, []);

  const loadPopularMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.getPopular(1);
      setPopularMovies(response.data.data.movies.slice(0, 20)); // Get first 20 movies
    } catch (err) {
      console.error('Error loading movies:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getBackdropUrl = (movie) => {
    // Try backdrop first for wide images
    if (movie.backdrop) return movie.backdrop;
    if (movie.backdrop_path) {
      return `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;
    }
    // Fallback to poster if no backdrop
    if (movie.poster) return movie.poster;
    if (movie.poster_path) {
      return `https://image.tmdb.org/t/p/w780${movie.poster_path}`;
    }
    return 'https://via.placeholder.com/1280x720?text=No+Image';
  };

  // Always use tmdbId for routing - if movie is cached, it will be found by tmdbId
  const movieId = (movie) => movie.tmdbId || movie.id || movie._id;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-[#0f0f0f] to-[#1a1a1a]"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-500 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 pt-20 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover the Movie Streaming Experience with <span className="text-yellow-400">Movie-Mate</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Our young and expert admins prepare amazing and trending movies for you to watch online and priceless.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-all transform hover:scale-105 shadow-lg shadow-yellow-400/20"
            >
              Get started
            </Link>
            <Link
              to="/browse"
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-black transition-all transform hover:scale-105"
            >
              Explore Movies
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Movies Section */}
      <section className="relative container mx-auto px-6 py-12">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 px-2">
          Popular Movies
        </h2>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loading message="Loading popular movies..." />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-400 text-lg mb-4">{error}</p>
            <button
              onClick={loadPopularMovies}
              className="px-6 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-6 -mx-6 px-6">
            <div className="flex gap-6 min-w-max">
              {popularMovies.map((movie) => (
                <Link
                  key={movieId(movie)}
                  to={`/movie/${movieId(movie)}`}
                  className="group relative flex-shrink-0 w-64 md:w-80 transition-transform hover:scale-105"
                >
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                    {/* Movie Thumbnail */}
                    <div className="relative aspect-[16/9] overflow-hidden bg-gray-800">
                      <img
                        src={getBackdropUrl(movie)}
                        alt={movie.title}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1280x720?text=No+Image';
                        }}
                      />
                      
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                      
                      {/* Movie Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-yellow-400 transition">
                          {movie.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          {movie.releaseDate && (
                            <span className="text-gray-300 text-sm">
                              {new Date(movie.releaseDate).getFullYear()}
                            </span>
                          )}
                          {movie.rating && (
                            <div className="flex items-center space-x-1">
                              <span className="text-yellow-400">⭐</span>
                              <span className="text-white font-semibold">
                                {movie.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Hover Overlay - Just darken on hover */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Scroll Indicator */}
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">← Scroll to see more movies →</p>
      </div>
    </div>
  );
};

export default Landing;
