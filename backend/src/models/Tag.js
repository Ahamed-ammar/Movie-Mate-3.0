import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
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
  tagName: {
    type: String,
    required: [true, 'Tag name is required'],
    trim: true,
    maxlength: [50, 'Tag name cannot exceed 50 characters']
  }
}, {
  timestamps: true
});

// Compound unique index: one tag per user per movie per tag name
tagSchema.index({ userId: 1, movieId: 1, tagName: 1 }, { unique: true });
tagSchema.index({ userId: 1, tagName: 1 });
tagSchema.index({ movieId: 1, tagName: 1 });

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;
