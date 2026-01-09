import mongoose from 'mongoose';

const watchListSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['want_to_watch', 'watching', 'watched'],
    default: 'want_to_watch'
  },
  priority: {
    type: Number,
    min: [1, 'Priority must be at least 1'],
    max: [5, 'Priority cannot exceed 5'],
    default: 3
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Compound unique index: one entry per user per movie
watchListSchema.index({ userId: 1, movieId: 1 }, { unique: true });
watchListSchema.index({ userId: 1, status: 1, createdAt: -1 });

const WatchList = mongoose.model('WatchList', watchListSchema);

export default WatchList;
