import { Link } from 'react-router-dom';
import RatingDisplay from '../movies/RatingDisplay';
import { useAuth } from '../../contexts/AuthContext';

const ReviewCard = ({ review, onDelete }) => {
  const { user } = useAuth();
  const isOwnReview = user && user.id === review.userId?._id;

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Link
            to={`/profile/${review.userId?.username}`}
            className="font-semibold text-white hover:text-primary-400 transition"
          >
            {review.userId?.username}
          </Link>
          {review.visibility === 'private' && (
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
              Private
            </span>
          )}
        </div>
        {isOwnReview && onDelete && (
          <button
            onClick={() => onDelete(review._id)}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Delete
          </button>
        )}
      </div>

      <RatingDisplay
        ratingInteger={review.ratingInteger}
        ratingStars={review.ratingStars}
        showBoth
      />

      {review.reviewText && (
        <p className="text-gray-300 mt-4 whitespace-pre-wrap">
          {review.reviewText}
        </p>
      )}

      <p className="text-gray-400 text-sm mt-4">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
};

export default ReviewCard;
