import mongoose from 'mongoose';

const listEntrySchema = new mongoose.Schema({
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
  listType: {
    type: String,
    enum: ['watched', 'watching', 'wishlist', 'favorites'],
    required: [true, 'List type is required']
  },
  ratingInteger: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [10, 'Rating cannot exceed 10'],
    validate: {
      validator: (value) => value === undefined || Number.isInteger(value),
      message: 'Integer rating must be a whole number'
    }
  },
  ratingStars: {
    type: Number,
    min: [0, 'Star rating cannot be negative'],
    max: [10, 'Star rating cannot exceed 10'],
    validate: {
      validator: (value) => value === undefined || (value * 2) % 1 === 0,
      message: 'Star rating must be in 0.5 increments'
    }
  },
  reviewText: {
    type: String,
    maxlength: [5000, 'Review text cannot exceed 5000 characters']
  },
  dateAdded: {
    type: Date,
    default: Date.now
  },
  dateWatched: {
    type: Date
  }
}, {
  timestamps: true
});

// Compound unique index: one entry per user per movie per list type
listEntrySchema.index({ userId: 1, movieId: 1, listType: 1 }, { unique: true });

const ListEntry = mongoose.model('ListEntry', listEntrySchema);

export default ListEntry;
