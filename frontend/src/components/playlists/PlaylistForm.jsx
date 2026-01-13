import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { moviesAPI } from '../../services/api';
import { TMDB_IMAGE_BASE_URL } from '../../utils/constants';
import MovieCardInline from '../movies/MovieCardInline';

const PlaylistForm = ({ playlist, onSubmit, onCancel }) => {
  const navigate = useNavigate();
  const [name, setName] = useState(playlist?.name || '');
  const [description, setDescription] = useState(playlist?.description || '');
  const [isPublic, setIsPublic] = useState(playlist?.isPublic !== undefined ? playlist.isPublic : true);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize selected movies from playlist if editing
    if (playlist && playlist.movies) {
      const movies = playlist.movies.map(entry => entry.movieId || entry);
      setSelectedMovies(movies);
    } else {
      // For new playlists, check localStorage for temp data
      try {
        const tempPlaylist = JSON.parse(localStorage.getItem('tempPlaylist') || '{}');
        if (tempPlaylist.selectedMovies && tempPlaylist.selectedMovies.length > 0) {
          setSelectedMovies(tempPlaylist.selectedMovies);
          if (tempPlaylist.name) setName(tempPlaylist.name);
          if (tempPlaylist.description) setDescription(tempPlaylist.description);
        }
      } catch (err) {
        console.error('Error loading temp playlist:', err);
      }
    }
  }, [playlist]);

  // Save temp playlist data to localStorage when form fields change
  useEffect(() => {
    if (!playlist) {
      try {
        localStorage.setItem('tempPlaylist', JSON.stringify({
          name,
          description,
          selectedMovies
        }));
      } catch (err) {
        console.error('Error saving temp playlist:', err);
      }
    }
  }, [name, description, selectedMovies, playlist]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.search(searchQuery.trim());
      const movies = response.data.data.movies || [];
      setSearchResults(movies);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to search movies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = (movie) => {
    // Check if movie is already selected
    const exists = selectedMovies.some(
      m => (m._id && movie._id && m._id === movie._id) ||
           (m.tmdbId && movie.tmdbId && m.tmdbId === movie.tmdbId) ||
           (m.id && movie.id && m.id === movie.id)
    );
    
    if (!exists) {
      setSelectedMovies([...selectedMovies, movie]);
    }
  };

  const handleRemoveMovie = (movieToRemove) => {
    setSelectedMovies(selectedMovies.filter(movie => {
      if (movie._id && movieToRemove._id) return movie._id !== movieToRemove._id;
      if (movie.tmdbId && movieToRemove.tmdbId) return movie.tmdbId !== movieToRemove.tmdbId;
      if (movie.id && movieToRemove.id) return movie.id !== movieToRemove.id;
      return true;
    }));
  };

  const handleAddMovies = () => {
    // Save current form state to localStorage
    try {
      localStorage.setItem('tempPlaylist', JSON.stringify({
        name,
        description,
        selectedMovies
      }));
    } catch (err) {
      console.error('Error saving temp playlist:', err);
    }
    
    // Get the current location to use as return URL
    // Use the base path with a parameter to indicate returning from add mode
    const returnTo = `${window.location.pathname.split('?')[0]}?hideForm=true`;
    
    // Navigate to Films page with addToPlaylist parameter and returnTo
    if (playlist) {
      // For existing playlist, use playlist ID
      navigate(`/browse?addToPlaylist=${playlist._id}&returnTo=${encodeURIComponent(returnTo)}`);
    } else {
      // For new playlist, use 'true' flag
      navigate(`/browse?addToPlaylist=true&returnTo=${encodeURIComponent(returnTo)}`);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    const movieIds = selectedMovies.map(movie => ({
      _id: movie._id,
      tmdbId: movie.tmdbId || movie.id,
      id: movie.id
    }));

    // Clear temp playlist from localStorage after submitting
    if (!playlist) {
      try {
        localStorage.removeItem('tempPlaylist');
      } catch (err) {
        console.error('Error clearing temp playlist:', err);
      }
    }

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      movieIds,
      isPublic
    });
  };

  const getPosterUrl = (movie) => {
    if (movie.poster) return movie.poster;
    if (movie.poster_path) return `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    return 'https://via.placeholder.com/500x750?text=No+Poster';
  };

  const movieId = (movie) => {
    return movie.tmdbId || movie.id || movie._id;
  };

  const formatNumber = () => '';

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">
        {playlist ? 'Edit Playlist' : 'Create New Playlist'}
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Playlist Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Playlist Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="Enter playlist name"
            required
            maxLength={100}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            placeholder="Describe your playlist..."
            maxLength={500}
          />
        </div>

        {/* Privacy Setting */}
        <div className="mb-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 text-primary-600 bg-gray-700 border-gray-600 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-300">Make playlist public</span>
          </label>
        </div>

        {/* Selected Movies */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-300">
              Selected Movies ({selectedMovies.length})
            </label>
            <button
              type="button"
              onClick={handleAddMovies}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
            >
              + Add Movies
            </button>
          </div>
          {selectedMovies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {selectedMovies.map((movie) => (
                <div key={movieId(movie)} className="relative group">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700">
                    <img
                      src={getPosterUrl(movie)}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMovie(movie)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove movie"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <p className="mt-2 text-xs text-gray-400 line-clamp-2">{movie.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Movies */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Add Movies
          </label>
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
              placeholder="Search for movies..."
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <p className="text-sm text-gray-400 mb-3">Search Results:</p>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {searchResults.map((movie) => {
                  const isSelected = selectedMovies.some(
                    m => (m._id && movie._id && m._id === movie._id) ||
                         (m.tmdbId && movie.tmdbId && m.tmdbId === movie.tmdbId) ||
                         (m.id && movie.id && m.id === movie.id)
                  );
                  
                  return (
                    <div key={movieId(movie)} className="flex-shrink-0 w-44 relative group">
                      <div className="aspect-[2/3] rounded-lg overflow-hidden bg-gray-700 mb-2">
                        <img
                          src={getPosterUrl(movie)}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2 mb-2">{movie.title}</p>
                      <button
                        type="button"
                        onClick={() => isSelected ? handleRemoveMovie(movie) : handleAddMovie(movie)}
                        className={`w-full px-3 py-1.5 rounded text-xs font-medium transition ${
                          isSelected
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {isSelected ? 'Remove' : 'Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition font-medium"
          >
            {playlist ? 'Update Playlist' : 'Create Playlist'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PlaylistForm;
