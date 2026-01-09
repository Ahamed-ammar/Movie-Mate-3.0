import mongoose from 'mongoose';

const networkSchema = new mongoose.Schema({
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower ID is required'],
    index: true
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following ID is required'],
    index: true
  }
}, {
  timestamps: true
});

// Compound unique index: one relationship per follower-following pair
networkSchema.index({ followerId: 1, followingId: 1 }, { unique: true });
// Prevent self-following
networkSchema.pre('save', function(next) {
  if (this.followerId.toString() === this.followingId.toString()) {
    return next(new Error('Users cannot follow themselves'));
  }
  next();
});

// Indexes for efficient queries
networkSchema.index({ followerId: 1, createdAt: -1 });
networkSchema.index({ followingId: 1, createdAt: -1 });

const Network = mongoose.model('Network', networkSchema);

export default Network;
