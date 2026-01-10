import { useState } from 'react';
import { Link } from 'react-router-dom';
import RatingDisplay from '../movies/RatingDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { reviewsAPI } from '../../services/api';

const ReviewCard = ({ review, onDelete, onReply }) => {
  const { user, isAuthenticated } = useAuth();
  const isOwnReview = user && user.id === review.userId?._id;
  const [isLiked, setIsLiked] = useState(review.isLiked || false);
  const [likesCount, setLikesCount] = useState(review.likesCount || review.likes?.length || 0);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replies, setReplies] = useState(review.replies || []);

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please login to like reviews');
      return;
    }

    try {
      const response = await reviewsAPI.like(review._id);
      setIsLiked(response.data.data.review.isLiked);
      setLikesCount(response.data.data.review.likesCount);
    } catch (err) {
      console.error('Error liking review:', err);
      alert(err.response?.data?.error || 'Failed to like review');
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (!isAuthenticated) {
      alert('Please login to reply to reviews');
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await reviewsAPI.reply(review._id, replyText);
      const newReply = response.data.data.review;
      setReplies([...replies, newReply]);
      setReplyText('');
      setShowReplyForm(false);
      if (onReply) onReply();
    } catch (err) {
      console.error('Error replying to review:', err);
      alert(err.response?.data?.error || 'Failed to post reply');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffInSeconds = Math.floor((now - reviewDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
    return `${Math.floor(diffInSeconds / 31536000)} years ago`;
  };

  const getProfilePictureUrl = () => {
    if (review.userId?.profilePicture) {
      return review.userId.profilePicture;
    }
    // Default avatar - you can replace this with a default image
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.username || 'User')}&background=random&color=fff&size=128`;
  };

  return (
    <div className="mb-4">
      <div className="flex items-start space-x-3 mb-2">
        {/* Profile Picture */}
        <Link to={`/profile/${review.userId?.username}`}>
          <img
            src={getProfilePictureUrl()}
            alt={review.userId?.username}
            className="w-10 h-10 rounded-full object-cover cursor-pointer"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.username || 'User')}&background=random&color=fff&size=128`;
            }}
          />
        </Link>

        <div className="flex-1">
          {/* Username and timestamp */}
          <div className="flex items-center space-x-2 mb-1">
            <Link
              to={`/profile/${review.userId?.username}`}
              className="font-semibold text-white hover:text-primary-400 transition text-sm"
            >
              @{review.userId?.username}
            </Link>
            <span className="text-gray-400 text-xs">
              {getTimeAgo(review.createdAt)}
            </span>
            {review.visibility === 'private' && (
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
                Private
              </span>
            )}
          </div>

          {/* Rating Display */}
          {!review.parentReviewId && review.ratingInteger && (
            <div className="mb-2">
              <RatingDisplay rating={review.ratingInteger} />
            </div>
          )}

          {/* Review Text */}
          {review.reviewText && (
            <p className="text-white text-sm mb-3 whitespace-pre-wrap leading-relaxed">
              {review.reviewText}
            </p>
          )}

          {/* Like and Reply Buttons */}
          <div className="flex items-center space-x-4 mt-2">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-gray-300 hover:text-white transition ${
                isLiked ? 'text-primary-400' : ''
              }`}
              disabled={!isAuthenticated}
            >
              <svg
                className="w-5 h-5"
                fill={isLiked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
              <span className="text-sm">{likesCount || 0}</span>
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="text-gray-300 hover:text-white transition text-sm"
              >
                Reply
              </button>
            )}

            {isOwnReview && onDelete && (
              <button
                onClick={() => onDelete(review._id)}
                className="text-red-400 hover:text-red-300 text-sm ml-auto"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Form */}
          {showReplyForm && isAuthenticated && (
            <form onSubmit={handleReply} className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-gray-800 text-white rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows="3"
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  type="submit"
                  disabled={isSubmittingReply || !replyText.trim()}
                  className="bg-primary-600 text-white px-4 py-1.5 rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingReply ? 'Posting...' : 'Post Reply'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyForm(false);
                    setReplyText('');
                  }}
                  className="text-gray-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Replies */}
          {replies.length > 0 && (
            <div className="mt-4 ml-4 border-l-2 border-gray-700 pl-4 space-y-4">
              {replies.map((reply) => (
                <ReviewCard
                  key={reply._id}
                  review={reply}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
