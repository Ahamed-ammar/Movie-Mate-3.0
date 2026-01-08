import { useState, useEffect } from 'react';
import { listsAPI } from '../services/api';
import { LIST_TYPES, LIST_TYPE_LABELS } from '../utils/constants';
import MovieCard from '../components/movies/MovieCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const MyLists = () => {
  const [lists, setLists] = useState({
    watched: [],
    watching: [],
    wishlist: [],
    favorites: []
  });
  const [activeList, setActiveList] = useState(LIST_TYPES.WATCHED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listsAPI.getAll();
      setLists(response.data.data.lists);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromList = async (entryId) => {
    if (window.confirm('Remove this movie from the list?')) {
      try {
        await listsAPI.remove(entryId);
        await loadLists();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to remove from list');
      }
    }
  };

  if (loading) return <Loading message="Loading your lists..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadLists} />;

  const activeMovies = lists[activeList].map(entry => entry.movieId).filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Lists</h1>

      <div className="mb-6">
        <div className="flex space-x-4 border-b border-gray-700">
          {Object.values(LIST_TYPES).map((type) => (
            <button
              key={type}
              onClick={() => setActiveList(type)}
              className={`px-4 py-2 ${
                activeList === type
                  ? 'border-b-2 border-primary-400 text-primary-400'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {LIST_TYPE_LABELS[type]} ({lists[type].length})
            </button>
          ))}
        </div>
      </div>

      {activeMovies.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">
            Your {LIST_TYPE_LABELS[activeList].toLowerCase()} list is empty.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {activeMovies.map((movie) => (
            <div key={movie._id} className="relative group">
              <MovieCard movie={movie} />
              <button
                onClick={() => {
                  const entry = lists[activeList].find(e => e.movieId._id === movie._id);
                  if (entry) handleRemoveFromList(entry._id);
                }}
                className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyLists;
