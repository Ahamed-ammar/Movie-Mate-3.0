import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersAPI, reviewsAPI } from '../services/api';
import ReviewCard from '../components/reviews/ReviewCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await usersAPI.getProfile(username);
      const userData = profileRes.data.data.user;
      setUser(userData);

      // Load reviews using userId
      try {
        const reviewsRes = await reviewsAPI.getUserReviews(userData.id);
        setReviews(reviewsRes.data.data.reviews);
      } catch (err) {
        // Reviews might not be accessible or user has no reviews
        setReviews([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProfile} />;
  if (!user) return <div>User not found</div>;

  const isOwnProfile = currentUser && currentUser.id === user.id;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-800 rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{user.username}</h1>
            {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}
            <div className="flex gap-6 text-sm text-gray-400">
              <span>Joined {new Date(user.joinedDate).toLocaleDateString()}</span>
              {user.reviewCount !== undefined && (
                <span>{user.reviewCount} reviews</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-400">No reviews yet.</p>
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))
        )}
      </div>
    </div>
  );
};

export default Profile;
