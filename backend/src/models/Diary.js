import mongoose from 'mongoose';

const diarySchema = new mongoose.Schema({
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
  watchedDate: {
    type: Date,
    required: [true, 'Watched date is required'],
    default: Date.now
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be negative'],
    max: [10, 'Rating cannot exceed 10']
  },
  review: {
    type: String,
    maxlength: [5000, 'Review cannot exceed 5000 characters']
  },
  tags: [{
    type: String,
    trim: true
  }],
  rewatch: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound unique index: one diary entry per user per movie per watched date
diarySchema.index({ userId: 1, movieId: 1, watchedDate: 1 }, { unique: true });
diarySchema.index({ userId: 1, watchedDate: -1 });

const Diary = mongoose.model('Diary', diarySchema);

export default Diary;
