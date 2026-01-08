import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import { TMDB_IMAGE_BASE_URL } from '../utils/constants';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const Films = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear || selectedGenre || selectedRating) {
      loadFilteredMovies();
    }
  }, [selectedYear, selectedGenre, selectedRating]);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [popularRes, genresRes] = await Promise.all([
        moviesAPI.getPopular(1),
        moviesAPI.getGenres()
      ]);
      setPopularMovies(popularRes.data.data.movies.slice(0, 20));
      setGenres(genresRes.data.data.genres);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      let movies = [];
      
      if (selectedGenre) {
        const response = await moviesAPI.getByGenre(selectedGenre);
        movies = response.data.data.movies;
      } else if (selectedYear) {
        const response = await moviesAPI.getByYear(selectedYear);
        movies = response.data.data.movies;
      } else {
        const response = await moviesAPI.getPopular();
        movies = response.data.data.movies;
      }

      // Filter by rating if selected
      if (selectedRating) {
        movies = movies.filter(movie => movie.rating >= parseFloat(selectedRating));
      }

      setPopularMovies(movies.slice(0, 20));
    } catch (err) {
      setError('Failed to load filtered movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.search(searchQuery.trim());
      setPopularMovies(response.data.data.movies);
    } catch (err) {
      setError('Failed to search movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  const getPosterUrl = (movie) => {
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  };

  const movieId = (movie) => movie.tmdbId || movie.id || movie._id;

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  };

  // Generate years for dropdown (current year back to 1900)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-6 py-8">
        {/* Browse Filters Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <span className="text-gray-400 font-medium uppercase text-sm">BROWSE BY:</span>
            
            {/* Year Dropdown */}
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setSelectedGenre(''); // Clear genre when year is selected
              }}
              className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-gray-600 ${
                selectedYear
                  ? 'bg-[#2a2a2a] border-gray-600 text-white'
                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300'
              }`}
            >
              <option value="">YEAR</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>

            {/* Rating Dropdown */}
            <select
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-gray-600 ${
                selectedRating
                  ? 'bg-[#2a2a2a] border-gray-600 text-white'
                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300'
              }`}
            >
              <option value="">RATING</option>
              <option value="9">9+</option>
              <option value="8">8+</option>
              <option value="7">7+</option>
              <option value="6">6+</option>
              <option value="5">5+</option>
            </select>

            {/* Popular Button */}
            <button
              onClick={() => {
                setSelectedYear('');
                setSelectedGenre('');
                setSelectedRating('');
                setSearchQuery('');
                loadInitialData();
              }}
              className={`px-4 py-2 border rounded-lg text-sm transition ${
                !selectedYear && !selectedGenre && !selectedRating
                  ? 'bg-[#2a2a2a] border-gray-600 text-white'
                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300 hover:bg-[#222]'
              }`}
            >
              POPULAR
            </button>

            {/* Genre Dropdown */}
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setSelectedYear(''); // Clear year when genre is selected
              }}
              className={`px-4 py-2 border rounded-lg text-sm focus:outline-none focus:border-gray-600 ${
                selectedGenre
                  ? 'bg-[#2a2a2a] border-gray-600 text-white'
                  : 'bg-[#1a1a1a] border-gray-700 text-gray-300'
              }`}
            >
              <option value="">GENRE</option>
              {genres.map(genre => (
                <option key={genre.id} value={genre.id}>{genre.name}</option>
              ))}
            </select>

            <button className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-[#222] transition uppercase">
              SERVICE
            </button>
            <button className="px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-gray-400 rounded-lg text-sm hover:bg-[#222] transition uppercase">
              OTHER
            </button>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FIND A FILM"
              className="flex-1 px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-600 placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Popular Films Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">POPULAR FILMS THIS WEEK</h2>
            <button className="text-gray-400 hover:text-white transition text-sm">
              MORE
            </button>
          </div>

          {error && <ErrorMessage message={error} onRetry={loadInitialData} />}

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loading message="Loading movies..." />
            </div>
          ) : popularMovies.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No movies found</p>
            </div>
          ) : (
            <div className="relative group">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/70 hover:bg-black/90 rounded-full flex items-center justify-center text-white transition opacity-0 group-hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Movies Carousel */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
              >
                {popularMovies.map((movie) => (
                  <Link
                    key={movieId(movie)}
                    to={`/movie/${movieId(movie)}`}
                    className="group flex-shrink-0 w-44 md:w-52 transition-transform hover:scale-105"
                  >
                    <div className="relative">
                      {/* Movie Poster */}
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-gray-800 mb-2">
                        <img
                          src={getPosterUrl(movie)}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                          }}
                        />
                        {movie.rating && (
                          <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            ⭐ {movie.rating.toFixed(1)}
                          </div>
                        )}
                      </div>

                      {/* Movie Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mt-2 px-1">
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>{formatNumber((movie.rating || 7) * 50000)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                          </svg>
                          <span>{formatNumber((movie.rating || 7) * 10000)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          <span>{formatNumber((movie.rating || 7) * 20000)}</span>
                        </div>
                      </div>

                      {/* Movie Title */}
                      <h3 className="text-white font-medium text-sm mt-2 line-clamp-2 group-hover:text-yellow-400 transition">
                        {movie.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Films;
