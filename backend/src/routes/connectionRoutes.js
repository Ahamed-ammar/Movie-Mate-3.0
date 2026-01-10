import express from 'express';
import {
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  removeConnection,
  getConnectionStatus,
  getConnections,
  getUserConnections,
  getPendingRequests
} from '../controllers/connectionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get connection status with a specific user
router.get('/status/:userId', getConnectionStatus);

// Get all connections for current user
router.get('/', getConnections);

// Get connections for a specific user (only if connected)
router.get('/user/:userId', getUserConnections);

// Get pending requests (sent and received)
router.get('/pending', getPendingRequests);

// Send connection request
router.post('/request/:userId', sendConnectionRequest);

// Accept connection request
router.put('/accept/:connectionId', acceptConnectionRequest);

// Reject connection request
router.delete('/reject/:connectionId', rejectConnectionRequest);

// Remove connection
router.delete('/:connectionId', removeConnection);

export default router;
