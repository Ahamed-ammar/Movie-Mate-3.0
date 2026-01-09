import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  activityType: {
    type: String,
    enum: ['review', 'rating', 'diary_entry', 'list_add', 'like', 'follow', 'tag'],
    required: [true, 'Activity type is required']
  },
  targetType: {
    type: String,
    enum: ['movie', 'review', 'list', 'user', 'diary'],
    required: [true, 'Target type is required']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Target ID is required']
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ activityType: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
