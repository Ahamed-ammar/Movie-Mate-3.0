import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { usersAPI, reviewsAPI, connectionsAPI, listsAPI } from '../services/api';
import ReviewCard from '../components/reviews/ReviewCard';
import MovieCard from '../components/movies/MovieCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loadingConnectionStatus, setLoadingConnectionStatus] = useState(false);
  const [data, setData] = useState({
    reviews: [],
    watchlist: [],
    playlists: [],
    likes: [],
    tags: [],
    network: { connections: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (user && currentUser) {
      loadConnectionStatus();
    }
  }, [user, currentUser]);

  useEffect(() => {
    if (user) {
      loadTabData();
    }
  }, [user, activeTab]);

  // Refresh watchlist when returning from add mode
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('added') === 'true') {
      // Switch to watchlist tab if not already there
      if (activeTab !== 'watchlist') {
        setActiveTab('watchlist');
      }
      // Remove the query parameter
      navigate(location.pathname, { replace: true });
    }
  }, [location.search, location.pathname, navigate]);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await usersAPI.getProfile(username);
      const userData = profileRes.data.data.user;
      setUser(userData);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const loadConnectionStatus = async () => {
    if (!currentUser || !user || currentUser.id === user.id || currentUser._id === user.id) {
      return;
    }
    
    setLoadingConnectionStatus(true);
    try {
      const res = await connectionsAPI.getConnectionStatus(user.id);
      setConnectionStatus(res.data.data);
    } catch (err) {
      console.error('Failed to load connection status:', err);
    } finally {
      setLoadingConnectionStatus(false);
    }
  };

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'reviews':
          try {
            const reviewsRes = await reviewsAPI.getUserReviews(user.id);
            setData(prev => ({ ...prev, reviews: reviewsRes.data.data.reviews || [] }));
          } catch (err) {
            setData(prev => ({ ...prev, reviews: [] }));
          }
          break;
        case 'watchlist':
          if (isOwnProfile) {
            setLoadingWatchlist(true);
            try {
              const watchlistRes = await listsAPI.getList('wishlist');
              setData(prev => ({ 
                ...prev, 
                watchlist: watchlistRes.data.data.entries || [] 
              }));
            } catch (err) {
              console.error('Error loading watchlist:', err);
              setData(prev => ({ ...prev, watchlist: [] }));
            } finally {
              setLoadingWatchlist(false);
            }
          } else {
            setData(prev => ({ ...prev, watchlist: [] }));
          }
          break;
        case 'playlists':
          // TODO: Load playlists
          setData(prev => ({ ...prev, playlists: [] }));
          break;
        case 'likes':
          // TODO: Load likes
          setData(prev => ({ ...prev, likes: [] }));
          break;
        case 'tags':
          // TODO: Load tags
          setData(prev => ({ ...prev, tags: [] }));
          break;
        case 'network':
          try {
            let connectionsRes;
            if (isOwnProfile) {
              connectionsRes = await connectionsAPI.getConnections();
            } else {
              // Load connections for the profile user (only if connected)
              connectionsRes = await connectionsAPI.getUserConnections(user.id);
            }
            setData(prev => ({ 
              ...prev, 
              network: { connections: connectionsRes.data.data.connections || [] } 
            }));
          } catch (err) {
            // If error is 403, user is not connected - handled in renderTabContent
            setData(prev => ({ ...prev, network: { connections: [] } }));
          }
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(`Error loading ${activeTab} data:`, err);
    }
  };

  if (loading) return <Loading message="Loading profile..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadProfile} />;
  if (!user) return <div className="text-white text-center py-20">User not found</div>;

  const isOwnProfile = currentUser && (currentUser.id === user.id || currentUser._id === user.id);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  const handleConnect = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      if (connectionStatus?.status === 'none' || connectionStatus?.status === 'request_received') {
        if (connectionStatus?.status === 'request_received') {
          // Accept existing request
          await connectionsAPI.acceptRequest(connectionStatus.connection.id);
        } else {
          // Send new request
          await connectionsAPI.sendRequest(user.id);
        }
        await loadConnectionStatus();
        // Reload profile to update connection count
        await loadProfile();
        // Reload network tab if viewing network tab
        if (activeTab === 'network') {
          await loadTabData();
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to process connection request');
    }
  };

  const handleRemoveConnection = async (connectionId) => {
    if (window.confirm('Remove this connection?')) {
      try {
        await connectionsAPI.removeConnection(connectionId);
        await loadTabData();
        await loadConnectionStatus();
        // Reload profile to update connection count
        await loadProfile();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to remove connection');
      }
    }
  };

  const tabs = [
    { id: 'reviews', label: 'Reviews' },
    { id: 'watchlist', label: 'WatchList' },
    { id: 'playlists', label: 'PlayLists' },
    { id: 'likes', label: 'Likes' },
    { id: 'tags', label: 'Tags' },
    { id: 'network', label: 'Network' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'reviews':
        return (
          <div>
            {data.reviews.length === 0 ? (
              <p className="text-gray-400 text-center py-20">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {data.reviews.map((review) => (
                  <ReviewCard key={review._id} review={review} />
                ))}
              </div>
            )}
          </div>
        );
      case 'watchlist':
        if (!isOwnProfile) {
          return (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Watchlist is private</p>
            </div>
          );
        }

        if (loadingWatchlist) {
          return (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Loading watchlist...</p>
            </div>
          );
        }

        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                Watchlist ({data.watchlist.length})
              </h3>
              <Link
                to="/browse?addToWatchlist=true"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium"
              >
                + Add Movies
              </Link>
            </div>
            {data.watchlist.length === 0 ? (
              <div className="text-center py-20 bg-gray-800 rounded-lg">
                <p className="text-gray-400">Your watchlist is empty. Click "Add Movies" to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {data.watchlist.map((entry) => (
                  <MovieCard key={entry._id} movie={entry.movieId} />
                ))}
              </div>
            )}
          </div>
        );
      case 'playlists':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Playlists coming soon</p>
          </div>
        );
      case 'likes':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Likes coming soon</p>
          </div>
        );
      case 'tags':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Tags coming soon</p>
          </div>
        );
      case 'network':
        // Show connections if own profile OR if connected
        const isConnected = connectionStatus?.status === 'accepted';
        if (!isOwnProfile && !isConnected) {
          return (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">Connect to view this user's network</p>
            </div>
          );
        }
        return (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-white">Connections</h3>
            {data.network.connections.length === 0 ? (
              <div className="text-center py-20 bg-gray-800 rounded-lg">
                <p className="text-gray-400">No connections yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.network.connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                  >
                    <Link
                      to={`/profile/${conn.user.username}`}
                      className="flex items-center space-x-3 flex-1"
                    >
                      <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white">
                        {conn.user.profilePicture ? (
                          <img
                            src={conn.user.profilePicture}
                            alt={conn.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span>{conn.user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{conn.user.username}</p>
                        <p className="text-gray-400 text-sm">
                          Connected {new Date(conn.connectedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => handleRemoveConnection(conn.id)}
                      className="ml-4 px-3 py-1 text-sm text-red-400 hover:text-red-300 transition"
                      title="Remove connection"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Profile Header */}
      <div className="bg-[#1a1a1a] rounded-lg p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-4xl text-white">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{user.username.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">{user.username}</h1>
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleConnect}
                    disabled={loadingConnectionStatus}
                    className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                      connectionStatus?.status === 'accepted' || connectionStatus?.status === 'request_sent'
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : connectionStatus?.status === 'request_received'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loadingConnectionStatus
                      ? 'Loading...'
                      : connectionStatus?.status === 'accepted'
                      ? 'Connected'
                      : connectionStatus?.status === 'request_sent'
                      ? 'Request Sent'
                      : connectionStatus?.status === 'request_received'
                      ? 'Accept'
                      : 'Connect'}
                  </button>
                )}
              </div>
              {isOwnProfile && (
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Logout
                </button>
              )}
            </div>
            {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}
            <div className="flex gap-6 text-sm text-gray-400">
              <span>Joined {new Date(user.joinedDate || user.createdAt).toLocaleDateString()}</span>
              {user.reviewCount !== undefined && (
                <span>{user.reviewCount} reviews</span>
              )}
              {user.connectionCount !== undefined && (
                <span>{user.connectionCount} {user.connectionCount === 1 ? 'connection' : 'connections'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] rounded-lg mb-6">
        <div className="border-b border-gray-700">
          <nav className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium uppercase whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-green-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-[#1a1a1a] rounded-lg p-8">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;
