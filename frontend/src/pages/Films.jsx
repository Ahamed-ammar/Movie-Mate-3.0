import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { moviesAPI } from '../services/api';
import { TMDB_IMAGE_BASE_URL } from '../utils/constants';
import ErrorMessage from '../components/common/ErrorMessage';
import MovieCardSkeleton from '../components/movies/MovieCardSkeleton';
import MovieCardInline from '../components/movies/MovieCardInline';
import PopularReviewsSection from '../components/reviews/PopularReviewsSection';

const Films = () => {
  const [popularMovies, setPopularMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('');
  const scrollContainerRef = useRef(null);
  const errorTimeoutRef = useRef(null);

  // Memoize helper functions to prevent recreation on every render
  const getPosterUrl = useCallback((movie) => {
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  }, []);

  const movieId = useCallback((movie) => 
    movie.tmdbId || movie.id || movie._id,
    []
  );

  const formatNumber = useCallback((num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
  }, []);

  // Memoize years array - only recalculate if needed
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);
  }, []);

  // Memoize displayed movies to prevent unnecessary recalculations
  const displayedMovies = useMemo(() => {
    return popularMovies.slice(0, 20);
  }, [popularMovies]);

  // Memoize scroll functions
  const scrollLeft = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  }, []);

  const scrollRight = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  }, []);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowError(false);
    
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    try {
      const [popularRes, genresRes, providersRes] = await Promise.all([
        moviesAPI.getPopular(1),
        moviesAPI.getGenres(),
        moviesAPI.getProviders().catch(() => ({ data: { data: { providers: [] } } })) // Handle errors gracefully
      ]);
      setPopularMovies(popularRes.data.data.movies.slice(0, 20));
      setGenres(genresRes.data.data.genres);
      // Filter providers to only show major streaming services
      const allProviders = providersRes.data.data.providers || [];
      const majorProviders = allProviders.length > 15 
        ? allProviders.filter(p => 
            ['Netflix', 'Disney Plus', 'Amazon Prime Video', 'HBO Max', 'Hulu', 'Apple TV Plus', 'Paramount Plus', 'Peacock', 'Max'].includes(p.provider_name)
          )
        : allProviders;
      setProviders(majorProviders);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load movies. Please try again later.');
      
      // Set timeout to show error after 3 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 3000);
    }
  }, []);

  const loadFilteredMovies = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowError(false);
    
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    try {
      let movies = [];
      
      if (selectedProvider) {
        const response = await moviesAPI.getByProvider(selectedProvider);
        movies = response.data.data.movies;
      } else if (selectedFilter) {
        const response = await moviesAPI.getByFilter(selectedFilter);
        movies = response.data.data.movies;
      } else if (selectedGenre) {
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
      setLoading(false);
    } catch (err) {
      setError('Failed to load filtered movies. Please try again.');
      
      // Set timeout to show error after 3 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 3000);
    }
  }, [selectedYear, selectedGenre, selectedRating, selectedProvider, selectedFilter]);

  // Debounce filter changes to prevent excessive API calls
  const debouncedLoadFiltered = useDebouncedCallback(
    loadFilteredMovies,
    300 // 300ms delay
  );

  const handleSearch = useCallback(async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Clear filters when searching
    setSelectedYear('');
    setSelectedGenre('');
    setSelectedRating('');
    setSelectedProvider('');
    setSelectedFilter('');
    
    setLoading(true);
    setError(null);
    setShowError(false);
    
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    try {
      const response = await moviesAPI.search(searchQuery.trim());
      const movies = response.data.data.movies || [];
      setPopularMovies(movies);
      setLoading(false);
      
      if (movies.length === 0) {
        setError('No movies found. Try a different search term.');
        errorTimeoutRef.current = setTimeout(() => {
          setShowError(true);
        }, 1000);
      }
    } catch (err) {
      console.error('Search error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to search movies. Please try again.';
      setError(errorMessage);
      
      // Set timeout to show error after 1 second
      errorTimeoutRef.current = setTimeout(() => {
        setShowError(true);
        setLoading(false);
      }, 1000);
    }
  }, [searchQuery]);

  const handleYearChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedYear(value);
    setSelectedGenre('');
    setSelectedProvider('');
    setSelectedFilter('');
    setSearchQuery('');
  }, []);

  const handleGenreChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedGenre(value);
    setSelectedYear('');
    setSelectedProvider('');
    setSelectedFilter('');
    setSearchQuery('');
  }, []);

  const handleRatingChange = useCallback((e) => {
    setSelectedRating(e.target.value);
  }, []);

  const handleProviderChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedProvider(value);
    setSelectedYear('');
    setSelectedGenre('');
    setSelectedFilter('');
    setSearchQuery('');
  }, []);

  const handleFilterChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedFilter(value);
    setSelectedYear('');
    setSelectedGenre('');
    setSelectedProvider('');
    setSearchQuery('');
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedYear('');
    setSelectedGenre('');
    setSelectedRating('');
    setSelectedProvider('');
    setSelectedFilter('');
    setSearchQuery('');
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    loadInitialData();
    
    // Cleanup timeout on unmount
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [loadInitialData]);

  useEffect(() => {
    // Only load filtered movies if filters are active and search query is empty
    if ((selectedYear || selectedGenre || selectedRating || selectedProvider || selectedFilter) && !searchQuery.trim()) {
      debouncedLoadFiltered();
    }
    // Note: When search is cleared, the clear button handler will call loadInitialData
  }, [selectedYear, selectedGenre, selectedRating, selectedProvider, selectedFilter, searchQuery, debouncedLoadFiltered]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-6 py-8">
        {/* Browse Filters Section */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-gray-400 font-medium uppercase text-sm mr-1">BROWSE BY:</span>
            
            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className={`px-4 py-2 pr-8 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 text-sm uppercase focus:outline-none focus:border-gray-600 appearance-none cursor-pointer transition hover:bg-[#222] ${
                  selectedYear ? 'text-white' : ''
                }`}
              >
                <option value="">YEAR</option>
                {years.map(year => (
                  <option key={year} value={year} className="bg-[#1a1a1a]">{year}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Rating Dropdown */}
            <div className="relative">
              <select
                value={selectedRating}
                onChange={handleRatingChange}
                className={`px-4 py-2 pr-8 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 text-sm uppercase focus:outline-none focus:border-gray-600 appearance-none cursor-pointer transition hover:bg-[#222] ${
                  selectedRating ? 'text-white' : ''
                }`}
              >
                <option value="" className="bg-[#1a1a1a]">RATING</option>
                <option value="9" className="bg-[#1a1a1a]">9+</option>
                <option value="8" className="bg-[#1a1a1a]">8+</option>
                <option value="7" className="bg-[#1a1a1a]">7+</option>
                <option value="6" className="bg-[#1a1a1a]">6+</option>
                <option value="5" className="bg-[#1a1a1a]">5+</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Popular Button */}
            <button
              onClick={handleResetFilters}
              className={`px-4 py-2 bg-[#1a1a1a] border border-gray-700 rounded text-sm uppercase transition hover:bg-[#222] ${
                !selectedYear && !selectedGenre && !selectedRating && !selectedProvider && !selectedFilter
                  ? 'text-white'
                  : 'text-gray-400'
              }`}
            >
              POPULAR
            </button>

            {/* Genre Dropdown */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={handleGenreChange}
                className={`px-4 py-2 pr-8 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 text-sm uppercase focus:outline-none focus:border-gray-600 appearance-none cursor-pointer transition hover:bg-[#222] ${
                  selectedGenre ? 'text-white' : ''
                }`}
              >
                <option value="">GENRE</option>
                {genres.map(genre => (
                  <option key={genre.id} value={genre.id} className="bg-[#1a1a1a] normal-case">{genre.name}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Service Dropdown */}
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={handleProviderChange}
                className={`px-4 py-2 pr-8 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 text-sm uppercase focus:outline-none focus:border-gray-600 appearance-none cursor-pointer transition hover:bg-[#222] ${
                  selectedProvider ? 'text-white' : ''
                }`}
              >
                <option value="">SERVICE</option>
                {providers.map(provider => (
                  <option key={provider.provider_id} value={provider.provider_id} className="bg-[#1a1a1a] normal-case">{provider.provider_name}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Other Dropdown */}
            <div className="relative">
              <select
                value={selectedFilter}
                onChange={handleFilterChange}
                className={`px-4 py-2 pr-8 bg-[#1a1a1a] border border-gray-700 rounded text-gray-400 text-sm uppercase focus:outline-none focus:border-gray-600 appearance-none cursor-pointer transition hover:bg-[#222] ${
                  selectedFilter ? 'text-white' : ''
                }`}
              >
                <option value="">OTHER</option>
                <option value="top_rated" className="bg-[#1a1a1a] normal-case">Top Rated</option>
                <option value="now_playing" className="bg-[#1a1a1a] normal-case">Now Playing</option>
                <option value="upcoming" className="bg-[#1a1a1a] normal-case">Upcoming</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearch} className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="FIND A FILM"
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-700 text-white rounded-lg focus:outline-none focus:border-gray-600 placeholder-gray-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setError(null);
                    setShowError(false);
                    loadInitialData();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
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
            <h2 className="text-2xl font-bold text-white">
              {searchQuery.trim() 
                ? `SEARCH RESULTS FOR "${searchQuery.toUpperCase()}"` 
                : 'POPULAR FILMS THIS WEEK'}
            </h2>
            {!searchQuery.trim() && (
              <button className="text-gray-400 hover:text-white transition text-sm">
                MORE
              </button>
            )}
          </div>

          {showError && error && <ErrorMessage message={error} onRetry={loadInitialData} />}

          {loading ? (
            <div className="relative group">
              {/* Loading Skeleton Cards */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
              >
                {Array.from({ length: 10 }).map((_, index) => (
                  <MovieCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : displayedMovies.length === 0 ? (
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

              {/* Movies Carousel - Using optimized MovieCardInline */}
              <div
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-2"
              >
                {displayedMovies.map((movie) => (
                  <MovieCardInline
                    key={movieId(movie)}
                    movie={movie}
                    getPosterUrl={getPosterUrl}
                    movieId={movieId}
                    formatNumber={formatNumber}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Popular Reviews Section */}
        <PopularReviewsSection />
      </div>
    </div>
  );
};

export default Films;
