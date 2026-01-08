import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { moviesAPI, reviewsAPI, listsAPI } from '../services/api';
import { TMDB_IMAGE_BASE_URL } from '../utils/constants';
import RatingDisplay from '../components/movies/RatingDisplay';
import ReviewForm from '../components/reviews/ReviewForm';
import ReviewCard from '../components/reviews/ReviewCard';
import ListManager from '../components/lists/ListManager';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [existingEntries, setExistingEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);

  useEffect(() => {
    loadMovieDetails();
  }, [id]);

  const loadMovieDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [movieRes, reviewsRes] = await Promise.all([
        moviesAPI.getById(id),
        reviewsAPI.getMovieReviews(id)
      ]);

      const movieData = movieRes.data.data.movie;
      setMovie(movieData);
      setReviews(reviewsRes.data.data.reviews);

      // Load user's list entries if authenticated
      if (isAuthenticated) {
        try {
          const listsRes = await listsAPI.getAll();
          const allEntries = [
            ...listsRes.data.data.lists.watched,
            ...listsRes.data.data.lists.watching,
            ...listsRes.data.data.lists.wishlist,
            ...listsRes.data.data.lists.favorites
          ];
          const movieEntries = allEntries.filter(
            entry => entry.movieId?._id === movieData._id || entry.movieId?.tmdbId === movieData.tmdbId
          );
          setExistingEntries(movieEntries);
        } catch (err) {
          // User might not have any lists yet
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load movie details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (entryData) => {
    try {
      await listsAPI.add(entryData);
      await loadMovieDetails();
      alert('Movie added to list successfully!');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add to list');
    }
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      if (editingReview) {
        await reviewsAPI.update(editingReview._id, reviewData);
      } else {
        await reviewsAPI.create({
          ...reviewData,
          movieId: movie._id
        });
      }
      setShowReviewForm(false);
      setEditingReview(null);
      await loadMovieDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewsAPI.delete(reviewId);
        await loadMovieDetails();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete review');
      }
    }
  };

  if (loading) return <Loading message="Loading movie details..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadMovieDetails} />;
  if (!movie) return <div>Movie not found</div>;

  const backdropUrl = movie.backdrop
    ? movie.backdrop
    : 'https://via.placeholder.com/1920x1080?text=No+Backdrop';

  return (
    <div>
      {/* Hero Section with Backdrop */}
      <div
        className="relative h-96 bg-cover bg-center"
        style={{ backgroundImage: `url(${backdropUrl})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={movie.poster || `${TMDB_IMAGE_BASE_URL}${movie.poster_path || ''}`}
                alt={movie.title}
                className="w-48 h-72 object-cover rounded-lg shadow-2xl"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/500x750?text=No+Poster';
                }}
              />
              <div className="flex-1 text-white">
                <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
                {movie.releaseDate && (
                  <p className="text-xl text-gray-300 mb-4">
                    {new Date(movie.releaseDate).getFullYear()}
                  </p>
                )}
                {movie.rating && (
                  <div className="mb-4">
                    <span className="text-lg">TMDB Rating: ⭐ {movie.rating.toFixed(1)}</span>
                  </div>
                )}
                {movie.genres && movie.genres.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.genres.map((genre, index) => (
                      <span
                        key={index}
                        className="bg-primary-600/80 text-white px-3 py-1 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-white">Overview</h2>
              <p className="text-gray-300 leading-relaxed">
                {movie.overview || 'No overview available.'}
              </p>
            </div>

            {/* Director Section */}
            {movie.director && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-white">Director</h2>
                <div className="flex items-center space-x-4">
                  {movie.director.profile_path && (
                    <img
                      src={movie.director.profile_path}
                      alt={movie.director.name}
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200?text=No+Photo';
                      }}
                    />
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-white">{movie.director.name}</h3>
                    <p className="text-gray-400">Director</p>
                  </div>
                </div>
              </div>
            )}

            {/* Cast Section */}
            {movie.actors && movie.actors.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-white">Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {movie.actors.map((actor, index) => (
                    <div key={index} className="text-center">
                      {actor.profile_path ? (
                        <img
                          src={actor.profile_path}
                          alt={actor.name}
                          className="w-full h-48 object-cover rounded-lg mb-2"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x300?text=No+Photo';
                          }}
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-700 rounded-lg mb-2 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">No Photo</span>
                        </div>
                      )}
                      <h3 className="font-semibold text-white text-sm mb-1">{actor.name}</h3>
                      <p className="text-gray-400 text-xs">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Reviews</h2>
                {isAuthenticated && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                  >
                    Write Review
                  </button>
                )}
              </div>

              {showReviewForm && (
                <div className="mb-6">
                  <ReviewForm
                    initialRatingInteger={editingReview?.ratingInteger}
                    initialRatingStars={editingReview?.ratingStars}
                    initialReviewText={editingReview?.reviewText}
                    initialVisibility={editingReview?.visibility}
                    onSubmit={handleSubmitReview}
                    onCancel={() => {
                      setShowReviewForm(false);
                      setEditingReview(null);
                    }}
                    submitLabel={editingReview ? 'Update Review' : 'Submit Review'}
                  />
                </div>
              )}

              {reviews.length === 0 ? (
                <p className="text-gray-400">No reviews yet. Be the first to review!</p>
              ) : (
                reviews.map((review) => (
                  <ReviewCard
                    key={review._id}
                    review={review}
                    onDelete={handleDeleteReview}
                  />
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {isAuthenticated && (
              <ListManager
                movie={movie}
                onAddToList={handleAddToList}
                existingEntries={existingEntries}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;
