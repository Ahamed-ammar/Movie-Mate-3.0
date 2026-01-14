import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { moviesAPI } from '../services/api';
import MovieCard from '../components/movies/MovieCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const PersonMovies = () => {
  const { personName } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role'); // 'cast' or 'crew'
  
  const [movies, setMovies] = useState([]);
  const [person, setPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadPersonMovies();
  }, [personName, role, page]);

  const loadPersonMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await moviesAPI.getByPerson(personName, role, page);
      setMovies(response.data.data.movies);
      setPerson(response.data.data.person);
      setTotalPages(response.data.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading movies..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadPersonMovies} />;

  const roleTitle = role === 'cast' ? 'Movies Starring' : role === 'crew' ? 'Movies Directed by' : 'Movies by';

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-400 hover:text-white transition flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-6 mb-6">
            {person?.profile_path && (
              <img
                src={person.profile_path}
                alt={person.name}
                className="w-24 h-24 rounded-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/200?text=No+Photo';
                }}
              />
            )}
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{person?.name || personName}</h1>
              <p className="text-gray-400 text-lg">{roleTitle}</p>
            </div>
          </div>
        </div>

        {/* Movies Count */}
        <div className="mb-6">
          <p className="text-gray-400">
            {movies.length > 0 ? `${movies.length} movies found` : 'No movies found'}
          </p>
        </div>

        {/* Movies Grid */}
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
              {movies.map((movie) => (
                <MovieCard key={movie.tmdbId || movie._id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No movies found for {person?.name || personName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonMovies;
