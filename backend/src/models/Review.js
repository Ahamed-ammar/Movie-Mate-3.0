import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  movieId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Movie',
    required: [true, 'Movie ID is required'],
    index: true
  },
  ratingInteger: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot exceed 10'],
    validate: {
      validator: Number.isInteger,
      message: 'Integer rating must be a whole number'
    }
  },
  ratingStars: {
    type: Number,
    min: [0, 'Star rating cannot be negative'],
    max: [10, 'Star rating cannot exceed 10'],
    validate: {
      validator: (value) => value === undefined || (value * 2) % 1 === 0,
      message: 'Star rating must be in 0.5 increments (0, 0.5, 1, 1.5, etc.)'
    }
  },
  reviewText: {
    type: String,
    maxlength: [5000, 'Review cannot exceed 5000 characters']
  },
  visibility: {
    type: String,
    enum: ['public', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

// Compound unique index: one review per user per movie
reviewSchema.index({ userId: 1, movieId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
