import Network from '../models/Network.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// @desc    Send connection request
// @route   POST /api/connections/request/:userId
// @access  Private
export const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  if (currentUserId === userId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot send connection request to yourself'
    });
  }

  // Check if user exists
  const targetUser = await User.findById(userId);
  if (!targetUser) {
    return res.status(404).json({
      success: false,
      error: 'User not found'
    });
  }

  // Check if connection already exists (either direction)
  const existingConnection = await Network.findConnection(currentUserId, userId);

  if (existingConnection) {
    if (existingConnection.status === 'pending') {
      // Check who sent the request
      if (existingConnection.requesterId.toString() === currentUserId) {
        return res.status(400).json({
          success: false,
          error: 'Connection request already sent'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'You have a pending connection request from this user'
        });
      }
    } else if (existingConnection.status === 'accepted') {
      return res.status(400).json({
        success: false,
        error: 'Already connected'
      });
    }
  }

  // Create new connection request
  const connection = await Network.create({
    requesterId: currentUserId,
    receiverId: userId,
    status: 'pending'
  });

  await connection.populate('requesterId', 'username profilePicture');
  await connection.populate('receiverId', 'username profilePicture');

  res.status(201).json({
    success: true,
    data: { connection }
  });
});

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:connectionId
// @access  Private
export const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const { connectionId } = req.params;
  const currentUserId = req.user.userId;

  const connection = await Network.findById(connectionId);

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
  }

  // Verify that current user is the receiver
  if (connection.receiverId.toString() !== currentUserId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to accept this connection request'
    });
  }

  if (connection.status !== 'pending') {
    return res.status(400).json({
      success: false,
      error: `Connection request is already ${connection.status}`
    });
  }

  connection.status = 'accepted';
  await connection.save();

  await connection.populate('requesterId', 'username profilePicture');
  await connection.populate('receiverId', 'username profilePicture');

  res.json({
    success: true,
    data: { connection }
  });
});

// @desc    Reject connection request
// @route   DELETE /api/connections/reject/:connectionId
// @access  Private
export const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const { connectionId } = req.params;
  const currentUserId = req.user.userId;

  const connection = await Network.findById(connectionId);

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection request not found'
    });
  }

  // Verify that current user is the receiver
  if (connection.receiverId.toString() !== currentUserId) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to reject this connection request'
    });
  }

  await Network.findByIdAndDelete(connectionId);

  res.json({
    success: true,
    message: 'Connection request rejected'
  });
});

// @desc    Remove connection
// @route   DELETE /api/connections/:connectionId
// @access  Private
export const removeConnection = asyncHandler(async (req, res) => {
  const { connectionId } = req.params;
  const currentUserId = req.user.userId;

  const connection = await Network.findById(connectionId);

  if (!connection) {
    return res.status(404).json({
      success: false,
      error: 'Connection not found'
    });
  }

  // Verify that current user is part of the connection
  const isPartOfConnection = 
    connection.requesterId.toString() === currentUserId ||
    connection.receiverId.toString() === currentUserId;

  if (!isPartOfConnection) {
    return res.status(403).json({
      success: false,
      error: 'Not authorized to remove this connection'
    });
  }

  await Network.findByIdAndDelete(connectionId);

  res.json({
    success: true,
    message: 'Connection removed'
  });
});

// @desc    Get connection status with a user
// @route   GET /api/connections/status/:userId
// @access  Private
export const getConnectionStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  if (currentUserId === userId) {
    return res.json({
      success: true,
      data: { status: 'self', connection: null }
    });
  }

  const connection = await Network.findConnection(currentUserId, userId);

  if (!connection) {
    return res.json({
      success: true,
      data: { status: 'none', connection: null }
    });
  }

  let status = connection.status;
  
  // Determine the perspective of the current user
  if (connection.status === 'pending') {
    if (connection.requesterId.toString() === currentUserId) {
      status = 'request_sent';
    } else {
      status = 'request_received';
    }
  }

  res.json({
    success: true,
    data: { 
      status,
      connection: {
        id: connection._id,
        requesterId: connection.requesterId,
        receiverId: connection.receiverId,
        status: connection.status,
        createdAt: connection.createdAt
      }
    }
  });
});

// @desc    Get all connections for current user
// @route   GET /api/connections
// @access  Private
export const getConnections = asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;

  const connections = await Network.getConnections(currentUserId);

  // Format connections to return the other user
  const formattedConnections = connections.map(conn => {
    const otherUser = conn.requesterId._id.toString() === currentUserId 
      ? conn.receiverId 
      : conn.requesterId;
    
    return {
      id: conn._id,
      user: {
        id: otherUser._id,
        username: otherUser.username,
        profilePicture: otherUser.profilePicture
      },
      connectedAt: conn.updatedAt // When it was accepted
    };
  });

  res.json({
    success: true,
    data: { connections: formattedConnections }
  });
});

// @desc    Get connections for a specific user (only if current user is connected to them)
// @route   GET /api/connections/user/:userId
// @access  Private
export const getUserConnections = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.user.userId;

  // Check if current user is connected to the target user
  const connection = await Network.findOne({
    status: 'accepted',
    $or: [
      { requesterId: currentUserId, receiverId: userId },
      { requesterId: userId, receiverId: currentUserId }
    ]
  });

  if (!connection) {
    return res.status(403).json({
      success: false,
      error: 'You must be connected to view this user\'s connections'
    });
  }

  // Get connections for the target user
  const connections = await Network.getConnections(userId);

  // Format connections to return the other user (excluding the current user)
  const formattedConnections = connections
    .filter(conn => {
      const otherUserId = conn.requesterId._id.toString() === userId 
        ? conn.receiverId._id.toString()
        : conn.requesterId._id.toString();
      return otherUserId !== currentUserId;
    })
    .map(conn => {
      const otherUser = conn.requesterId._id.toString() === userId 
        ? conn.receiverId 
        : conn.requesterId;
      
      return {
        id: conn._id,
        user: {
          id: otherUser._id,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture
        },
        connectedAt: conn.updatedAt
      };
    });

  res.json({
    success: true,
    data: { connections: formattedConnections }
  });
});

// @desc    Get pending connection requests (sent and received)
// @route   GET /api/connections/pending
// @access  Private
export const getPendingRequests = asyncHandler(async (req, res) => {
  const currentUserId = req.user.userId;

  const sentRequests = await Network.find({
    requesterId: currentUserId,
    status: 'pending'
  }).populate('receiverId', 'username profilePicture').sort({ createdAt: -1 });

  const receivedRequests = await Network.find({
    receiverId: currentUserId,
    status: 'pending'
  }).populate('requesterId', 'username profilePicture').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: {
      sent: sentRequests.map(conn => ({
        id: conn._id,
        user: {
          id: conn.receiverId._id,
          username: conn.receiverId.username,
          profilePicture: conn.receiverId.profilePicture
        },
        createdAt: conn.createdAt
      })),
      received: receivedRequests.map(conn => ({
        id: conn._id,
        user: {
          id: conn.requesterId._id,
          username: conn.requesterId.username,
          profilePicture: conn.requesterId.profilePicture
        },
        createdAt: conn.createdAt
      }))
    }
  });
});
