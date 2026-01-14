import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersAPI, connectionsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';

const Members = () => {
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingConnections, setProcessingConnections] = useState(new Set());
  const [openMenuUserId, setOpenMenuUserId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [page, searchQuery]);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await usersAPI.getAll(page, searchQuery);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
  };

  const handleSendRequest = async (userId) => {
    if (!isAuthenticated) {
      alert('Please login to connect with users');
      return;
    }

    setProcessingConnections(prev => new Set(prev).add(userId));
    try {
      await connectionsAPI.sendRequest(userId);
      // Reload users to update connection status
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to send connection request');
    } finally {
      setProcessingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleAcceptRequest = async (connectionId) => {
    setProcessingConnections(prev => new Set(prev).add(connectionId));
    try {
      await connectionsAPI.acceptRequest(connectionId);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept connection');
    } finally {
      setProcessingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (connectionId) => {
    setProcessingConnections(prev => new Set(prev).add(connectionId));
    try {
      await connectionsAPI.rejectRequest(connectionId);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to reject connection');
    } finally {
      setProcessingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) {
      return;
    }

    setProcessingConnections(prev => new Set(prev).add(connectionId));
    try {
      await connectionsAPI.removeConnection(connectionId);
      await loadUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove connection');
    } finally {
      setProcessingConnections(prev => {
        const newSet = new Set(prev);
        newSet.delete(connectionId);
        return newSet;
      });
    }
  };

  const renderConnectionButton = (user) => {
    const isProcessing = processingConnections.has(user.id) || processingConnections.has(user.connectionId);
    const isMenuOpen = openMenuUserId === user.id;

    // Current user's own profile
    if (currentUser && currentUser.id === user.id) {
      return (
        <button
          onClick={() => navigate(`/profile/${user.username}`)}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
        >
          View Profile
        </button>
      );
    }

    // Not authenticated
    if (!isAuthenticated) {
      return (
        <button
          onClick={() => navigate('/login')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm"
        >
          Login to Connect
        </button>
      );
    }

    // Already connected - show Connected status with menu
    if (user.connectionStatus === 'accepted') {
      return (
        <div className="flex items-center gap-2 relative">
          <button
            disabled
            className="px-4 py-2 bg-gray-600 text-white rounded-lg cursor-default text-sm"
          >
            Connected
          </button>
          <div className="relative">
            <button
              onClick={() => setOpenMenuUserId(isMenuOpen ? null : user.id)}
              className="p-2 hover:bg-gray-700 rounded-lg transition"
            >
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isMenuOpen && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setOpenMenuUserId(null)}
                />
                
                {/* Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={() => {
                      setOpenMenuUserId(null);
                      handleRemoveConnection(user.connectionId);
                    }}
                    disabled={isProcessing}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600 transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Removing...' : 'Remove Connection'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    // Pending request - current user sent it
    if (user.connectionStatus === 'pending' && user.isRequester) {
      return (
        <button
          disabled
          className="px-4 py-2 bg-gray-600 text-white rounded-lg cursor-not-allowed text-sm"
        >
          Request Sent
        </button>
      );
    }

    // Pending request - other user sent it
    if (user.connectionStatus === 'pending' && !user.isRequester) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => handleAcceptRequest(user.connectionId)}
            disabled={isProcessing}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
          >
            {isProcessing ? '...' : 'Accept'}
          </button>
          <button
            onClick={() => handleRejectRequest(user.connectionId)}
            disabled={isProcessing}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
          >
            {isProcessing ? '...' : 'Reject'}
          </button>
        </div>
      );
    }

    // No connection
    return (
      <button
        onClick={() => handleSendRequest(user.id)}
        disabled={isProcessing}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm disabled:opacity-50"
      >
        {isProcessing ? 'Sending...' : 'Connect'}
      </button>
    );
  };

  if (loading) return <Loading message="Loading members..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadUsers} />;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">Members</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search members by username..."
              className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Members List */}
        {users.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-gray-800 rounded-lg p-6 hover:bg-gray-750 transition"
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Picture */}
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/profile/${user.username}`)}
                    >
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-2xl text-gray-400">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-xl font-semibold text-white mb-1 cursor-pointer hover:text-primary-400 transition truncate"
                        onClick={() => navigate(`/profile/${user.username}`)}
                      >
                        {user.username}
                      </h3>
                      
                      {/* Bio */}
                      {user.bio ? (
                        <p className="text-gray-400 text-sm line-clamp-2">
                          {user.bio}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Movie enthusiast</p>
                      )}

                      {/* Join Date */}
                      <p className="text-gray-500 text-xs mt-1">
                        Joined {new Date(user.joinedDate).toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    </div>

                    {/* Connection Button */}
                    <div className="flex-shrink-0">
                      {renderConnectionButton(user)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No members found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Members;
