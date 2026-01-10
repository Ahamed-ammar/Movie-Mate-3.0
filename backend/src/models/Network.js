import mongoose from 'mongoose';

const networkSchema = new mongoose.Schema({
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Requester ID is required'],
    index: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required'],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    required: true
  }
}, {
  timestamps: true
});

// Compound unique index: one relationship per user pair (bidirectional)
// This ensures we can have either direction but not duplicates
networkSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

// Prevent self-connection
networkSchema.pre('save', function(next) {
  if (this.requesterId.toString() === this.receiverId.toString()) {
    return next(new Error('Users cannot connect with themselves'));
  }
  next();
});

// Indexes for efficient queries
networkSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
networkSchema.index({ receiverId: 1, status: 1, createdAt: -1 });

// Static method to find connection between two users (either direction)
networkSchema.statics.findConnection = function(userId1, userId2) {
  return this.findOne({
    $or: [
      { requesterId: userId1, receiverId: userId2 },
      { requesterId: userId2, receiverId: userId1 }
    ]
  });
};

// Static method to get all connections for a user
networkSchema.statics.getConnections = function(userId) {
  return this.find({
    status: 'accepted',
    $or: [
      { requesterId: userId },
      { receiverId: userId }
    ]
  }).populate('requesterId', 'username profilePicture').populate('receiverId', 'username profilePicture');
};

const Network = mongoose.model('Network', networkSchema);

export default Network;
