import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { TMDB_IMAGE_BASE_URL } from '../utils/constants';
import MovieCard from '../components/movies/MovieCard';
import PlaylistForm from '../components/playlists/PlaylistForm';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const PlaylistDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    loadPlaylist();
  }, [id]);

  const loadPlaylist = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await playlistsAPI.getPlaylist(id);
      setPlaylist(response.data.data.playlist);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await playlistsAPI.delete(id);
      // Navigate back to profile page with playlists tab
      if (user && user.username) {
        navigate(`/profile/${user.username}`);
        // The Profile component will handle showing the playlists tab
      } else {
        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete playlist');
    }
  };

  const handleUpdate = async (playlistData) => {
    try {
      await playlistsAPI.update(id, playlistData);
      setShowEditForm(false);
      await loadPlaylist(); // Reload to show updated data
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update playlist');
    }
  };

  const handleRemoveMovie = async (movie) => {
    if (!window.confirm('Remove this movie from the playlist?')) {
      return;
    }

    try {
      // Use the movie's _id (MongoDB ID) for removal
      const movieId = movie._id || movie.id;
      if (!movieId) {
        alert('Movie ID not found');
        return;
      }
      await playlistsAPI.removeMovie(id, movieId);
      await loadPlaylist(); // Reload to show updated movies
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove movie');
    }
  };

  if (loading) return <Loading message="Loading playlist..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPlaylist} />;
  if (!playlist) return <div className="text-white text-center py-20">Playlist not found</div>;

  // Check ownership - handle both populated userId object and string ID
  const playlistUserId = playlist.userId?._id || playlist.userId;
  const currentUserId = user?.id || user?._id;
  const isOwnPlaylist = isAuthenticated && user && playlistUserId && currentUserId && 
    (playlistUserId.toString() === currentUserId.toString() || 
     playlistUserId.toString() === user.id?.toString() || 
     playlistUserId.toString() === user._id?.toString());
  const movies = playlist.movies || [];
  const movieList = movies.map(entry => entry.movieId || entry).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-2">{playlist.name}</h1>
              {playlist.description && (
                <p className="text-gray-300 text-lg mb-4">{playlist.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>{movieList.length} {movieList.length === 1 ? 'movie' : 'movies'}</span>
                <span>•</span>
                <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                {playlist.userId && (
                  <>
                    <span>•</span>
                    <span>By {playlist.userId.username}</span>
                  </>
                )}
              </div>
            </div>
            
            {/* Action Buttons (only for own playlists) */}
            {isOwnPlaylist && (
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium"
                >
                  {showEditForm ? 'Cancel Edit' : 'Update Playlist'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                >
                  Delete Playlist
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {showEditForm && isOwnPlaylist && (
          <div className="mb-8">
            <PlaylistForm
              playlist={playlist}
              onSubmit={handleUpdate}
              onCancel={() => setShowEditForm(false)}
            />
          </div>
        )}

        {/* Movies Grid */}
        {movieList.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-lg mb-4">This playlist is empty</p>
            {isOwnPlaylist && (
              <button
                onClick={() => navigate(`/browse?addToPlaylist=${id}`)}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
              >
                Add Movies
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-white">Movies</h2>
              {isOwnPlaylist && (
                <button
                  onClick={() => navigate(`/browse?addToPlaylist=${id}`)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
                >
                  + Add More Movies
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {movieList.map((movie) => (
                <div key={movie._id || movie.id} className="relative group">
                  <MovieCard movie={movie} />
                  {isOwnPlaylist && (
                    <button
                      onClick={() => handleRemoveMovie(movie)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded opacity-0 group-hover:opacity-100 transition text-sm font-medium"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetails;
