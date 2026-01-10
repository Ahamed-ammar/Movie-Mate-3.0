import { useState, useEffect, useRef } from 'react';
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
  
  // Use refs to track loading state and prevent unnecessary reloads on remounts
  const isLoadingRef = useRef(false);
  const currentIdRef = useRef(id);
  
  // Use sessionStorage to persist loaded state across React StrictMode remounts
  const getCachedMovieId = () => {
    try {
      return sessionStorage.getItem(`movie_${id}_loaded`);
    } catch {
      return null;
    }
  };
  
  const setCachedMovieId = () => {
    try {
      sessionStorage.setItem(`movie_${id}_loaded`, id);
    } catch {
      // Ignore storage errors
    }
  };
  
  const clearCachedMovieId = () => {
    try {
      sessionStorage.removeItem(`movie_${id}_loaded`);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    // #region agent log
    const cachedId = getCachedMovieId();
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:48',message:'Component mounted, starting loadMovieDetails',data:{movieId:id,currentId:currentIdRef.current,isLoading:isLoadingRef.current,hasMovie:!!movie,cachedId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    
    // Only load if ID changed
    if (id !== currentIdRef.current) {
      currentIdRef.current = id;
      clearCachedMovieId(); // Clear cache for new ID
      // Reset state when ID changes
      setMovie(null);
      setReviews([]);
      setError(null);
      loadMovieDetails();
    } else if (!isLoadingRef.current && (!getCachedMovieId() || !movie)) {
      // Load if we haven't loaded yet (no cache), OR if state was lost on remount (movie is null but we had cached it)
      // This handles React StrictMode remounts in development
      loadMovieDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMovieDetails = async (suppressError = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:50',message:'loadMovieDetails called',data:{movieId:id,suppressError,isLoading:isLoadingRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    
    // Prevent concurrent loads
    if (isLoadingRef.current && !suppressError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:54',message:'Skipping loadMovieDetails - already loading',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    if (!suppressError) {
      setError(null);
    }
    try {
      // Load movie first, then reviews separately so movie can still display if reviews fail
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:37',message:'Calling moviesAPI.getById',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
      // #endregion
      const movieRes = await moviesAPI.getById(id);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:38',message:'Movie API response received',data:{hasData:!!movieRes?.data,hasMovie:!!movieRes?.data?.data?.movie,movieId:movieRes?.data?.data?.movie?._id,tmdbId:movieRes?.data?.data?.movie?.tmdbId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
      // #endregion
      const movieData = movieRes.data.data.movie;
      
      if (!movieData) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:40',message:'Movie data missing from response',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
        // #endregion
        throw new Error('Movie data is missing from response');
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:60',message:'Setting movie state',data:{movieId:movieData._id,tmdbId:movieData.tmdbId,title:movieData.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      setMovie(movieData);
      setCachedMovieId(); // Mark as loaded in sessionStorage (persists across remounts)
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:63',message:'setMovie called, cached in sessionStorage',data:{movieDataId:movieData._id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Load reviews separately - don't fail if reviews fail
      try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:47',message:'Calling reviewsAPI.getMovieReviews',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const reviewsRes = await reviewsAPI.getMovieReviews(id);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:48',message:'Reviews API response received',data:{hasData:!!reviewsRes?.data,hasReviews:!!reviewsRes?.data?.data?.reviews,reviewCount:reviewsRes?.data?.data?.reviews?.length,responseStructure:Object.keys(reviewsRes?.data || {}).join(',')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B'})}).catch(()=>{});
        // #endregion
        // Safely handle response structure
        if (reviewsRes?.data?.data?.reviews) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:50',message:'Setting reviews from data.data.reviews',data:{reviewCount:reviewsRes.data.data.reviews.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setReviews(reviewsRes.data.data.reviews);
        } else if (reviewsRes?.data?.reviews) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:52',message:'Setting reviews from data.reviews',data:{reviewCount:reviewsRes.data.reviews.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setReviews(reviewsRes.data.reviews);
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:54',message:'No reviews found in response, setting empty array',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          setReviews([]);
        }
      } catch (reviewsErr) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:57',message:'Failed to load reviews',data:{error:reviewsErr?.message,status:reviewsErr?.response?.status,errorData:reviewsErr?.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.warn('Failed to load reviews, continuing with movie:', reviewsErr);
        setReviews([]); // Set empty reviews array
      }

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
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:79',message:'Error in loadMovieDetails',data:{error:err?.message,status:err?.response?.status,errorData:err?.response?.data,suppressError},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      console.error('Error loading movie details:', err);
      if (!suppressError) {
        const errorMessage = err.response?.data?.error || err.message || 'Failed to load movie details';
        setError(errorMessage);
        setMovie(null); // Clear movie on error
        throw err;
      } else {
        // When suppressing error, don't clear movie state - keep existing data
        // This prevents blank pages when reload fails after review submission
        console.warn('Failed to reload movie details (suppressed, keeping existing data):', err);
        // Don't clear movie state - keep what we have
      }
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      // #region agent log
      const cachedId = getCachedMovieId();
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:115',message:'loadMovieDetails finally block - setLoading(false) called',data:{hasMovie:!!movie,cachedId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C,D'})}).catch(()=>{});
      // #endregion
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
    if (!movie) {
      alert('Movie data is not available. Please refresh the page.');
      return;
    }
    
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
      
      // Reload only reviews instead of entire movie details to avoid TMDB API call
      try {
        const reviewsRes = await reviewsAPI.getMovieReviews(id);
        // Safely handle response structure
        if (reviewsRes?.data?.data?.reviews) {
          setReviews(reviewsRes.data.data.reviews);
        } else if (reviewsRes?.data?.reviews) {
          setReviews(reviewsRes.data.reviews);
        } else {
          // If response structure is unexpected, reload full movie details safely
          console.warn('Unexpected response structure, reloading movie details');
          await loadMovieDetails(true); // suppressError = true to avoid showing error
        }
      } catch (err) {
        // If review reload fails, reload full movie details as fallback
        console.warn('Failed to reload reviews after submission, reloading full movie details:', err);
        try {
          await loadMovieDetails(true); // suppressError = true to avoid showing error
        } catch (reloadErr) {
          console.error('Failed to reload movie details after review submission:', reloadErr);
          // Don't show error to user since review was saved successfully
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save review');
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewsAPI.delete(reviewId);
        // Reload only reviews instead of entire movie details to avoid TMDB API call
        try {
          const reviewsRes = await reviewsAPI.getMovieReviews(id);
          // Safely handle response structure
          if (reviewsRes?.data?.data?.reviews) {
            setReviews(reviewsRes.data.data.reviews);
          } else if (reviewsRes?.data?.reviews) {
            setReviews(reviewsRes.data.reviews);
          } else {
            // If response structure is unexpected, remove from local state
            setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewId));
          }
        } catch (err) {
          // If review reload fails, just remove from local state
          // The review was deleted successfully, and we don't want to risk breaking the page
          console.warn('Failed to reload reviews after delete:', err);
          // Remove the deleted review from local state
          setReviews(prevReviews => prevReviews.filter(r => r._id !== reviewId));
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete review');
      }
    }
  };

  // Debug logging - track state changes
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:188',message:'State changed - useEffect triggered',data:{loading,hasError:!!error,hasMovie:!!movie,movieId:id,movieTitle:movie?.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (!loading && !error && !movie) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:190',message:'BLANK PAGE CONDITION: No movie, no error, not loading',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error('MovieDetails: Component rendered with no movie, no error, and not loading. ID:', id);
    }
  }, [loading, error, movie, id]);
  
  // Track movie state changes specifically
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:198',message:'Movie state changed',data:{hasMovie:!!movie,movieId:movie?._id,movieTitle:movie?.title},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
  }, [movie]);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:189',message:'Render decision point',data:{loading,hasError:!!error,hasMovie:!!movie,movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  if (loading) return <Loading message="Loading movie details..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadMovieDetails} />;
  if (!movie) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/60e60c1d-154b-42f5-86fd-e42bebca266f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MovieDetails.jsx:191',message:'Rendering movie not found',data:{movieId:id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Movie not found</h2>
          <p className="text-gray-400 mb-4">The movie with ID {id} could not be loaded.</p>
          <button
            onClick={() => loadMovieDetails()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
