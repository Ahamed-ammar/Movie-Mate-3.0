import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema({
  tmdbId: {
    type: Number,
    required: [true, 'TMDB ID is required'],
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title is required']
  },
  overview: {
    type: String,
    default: ''
  },
  poster: {
    type: String,
    default: ''
  },
  backdrop: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: Date
  },
  genres: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0
  },
  cachedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster searches
movieSchema.index({ title: 'text', overview: 'text' });

const Movie = mongoose.model('Movie', movieSchema);

export default Movie;
