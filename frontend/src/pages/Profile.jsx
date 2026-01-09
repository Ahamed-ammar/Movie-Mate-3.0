import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { usersAPI, reviewsAPI } from '../services/api';
import ReviewCard from '../components/reviews/ReviewCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('activity');
  const [data, setData] = useState({
    activity: [],
    films: [],
    diary: [],
    reviews: [],
    watchlist: [],
    playlists: [],
    likes: [],
    tags: [],
    network: { followers: [], following: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (user) {
      loadTabData();
    }
  }, [user, activeTab]);

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

  const loadTabData = async () => {
    try {
      switch (activeTab) {
        case 'activity':
          // TODO: Load activity data
          setData(prev => ({ ...prev, activity: [] }));
          break;
        case 'films':
          // TODO: Load films data (movies user has interacted with)
          setData(prev => ({ ...prev, films: [] }));
          break;
        case 'diary':
          // TODO: Load diary entries
          setData(prev => ({ ...prev, diary: [] }));
          break;
        case 'reviews':
          try {
            const reviewsRes = await reviewsAPI.getUserReviews(user.id);
            setData(prev => ({ ...prev, reviews: reviewsRes.data.data.reviews || [] }));
          } catch (err) {
            setData(prev => ({ ...prev, reviews: [] }));
          }
          break;
        case 'watchlist':
          // TODO: Load watchlist
          setData(prev => ({ ...prev, watchlist: [] }));
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
          // TODO: Load network (followers/following)
          setData(prev => ({ ...prev, network: { followers: [], following: [] } }));
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

  const tabs = [
    { id: 'activity', label: 'Activity' },
    { id: 'films', label: 'Films' },
    { id: 'diary', label: 'Diary' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'watchlist', label: 'WatchList' },
    { id: 'playlists', label: 'PlayLists' },
    { id: 'likes', label: 'Likes' },
    { id: 'tags', label: 'Tags' },
    { id: 'network', label: 'Network' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Activity feed coming soon</p>
          </div>
        );
      case 'films':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Films list coming soon</p>
          </div>
        );
      case 'diary':
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Diary entries coming soon</p>
          </div>
        );
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
        return (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">Watchlist coming soon</p>
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
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Followers</h3>
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400">{data.network.followers.length} followers</p>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4 text-white">Following</h3>
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <p className="text-gray-400">{data.network.following.length} following</p>
              </div>
            </div>
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
              <h1 className="text-3xl font-bold text-white">{user.username}</h1>
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
