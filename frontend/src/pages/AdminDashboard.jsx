import { useState, useEffect } from 'react';
import { adminAPI } from '../services/adminAPI';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats state
  const [stats, setStats] = useState(null);
  const [topReviewers, setTopReviewers] = useState([]);
  const [mostReviewedMovies, setMostReviewedMovies] = useState([]);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersPagination, setUsersPagination] = useState({ page: 1, limit: 20 });
  const [usersSearch, setUsersSearch] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsPagination, setReviewsPagination] = useState({ page: 1, limit: 20 });

  // Journals state
  const [journals, setJournals] = useState([]);
  const [journalsPagination, setJournalsPagination] = useState({ page: 1, limit: 20 });

  useEffect(() => {
    // Check if user is admin
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'stats':
          await loadStats();
          break;
        case 'users':
          await loadUsers();
          break;
        case 'reviews':
          await loadReviews();
          break;
        case 'journals':
          await loadJournals();
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const res = await adminAPI.getStats();
    setStats(res.data.data.stats);
    setTopReviewers(res.data.data.topReviewers);
    setMostReviewedMovies(res.data.data.mostReviewedMovies);
  };

  const loadUsers = async () => {
    const res = await adminAPI.getAllUsers({
      page: usersPagination.page,
      limit: usersPagination.limit,
      search: usersSearch
    });
    setUsers(res.data.data.users);
    setUsersPagination(res.data.data.pagination);
  };

  const loadReviews = async () => {
    const res = await adminAPI.getAllReviews({
      page: reviewsPagination.page,
      limit: reviewsPagination.limit
    });
    setReviews(res.data.data.reviews);
    setReviewsPagination(res.data.data.pagination);
  };

  const loadJournals = async () => {
    const res = await adminAPI.getAllJournals({
      page: journalsPagination.page,
      limit: journalsPagination.limit
    });
    setJournals(res.data.data.journals);
    setJournalsPagination(res.data.data.pagination);
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}" and all their data? This cannot be undone.`)) {
      try {
        await adminAPI.deleteUser(userId);
        alert('User deleted successfully');
        loadUsers();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await adminAPI.deleteReview(reviewId);
        alert('Review deleted successfully');
        loadReviews();
        // Refresh stats if on stats tab
        if (activeTab === 'stats') {
          loadStats();
        }
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete review');
      }
    }
  };

  const handleDeleteJournal = async (journalId) => {
    if (window.confirm('Are you sure you want to delete this journal?')) {
      try {
        await adminAPI.deleteJournal(journalId);
        alert('Journal deleted successfully');
        loadJournals();
      } catch (err) {
        alert(err.response?.data?.error || 'Failed to delete journal');
      }
    }
  };

  const handleSearchUsers = (e) => {
    e.preventDefault();
    setUsersPagination({ ...usersPagination, page: 1 });
    loadUsers();
  };

  const tabs = [
    { id: 'stats', label: 'Dashboard' },
    { id: 'users', label: 'Users' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'journals', label: 'Journals' }
  ];

  const renderStats = () => (
    <div>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-base font-medium opacity-90">Total Users</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{stats?.totalUsers || 0}</p>
          <p className="text-xs sm:text-sm mt-2 opacity-80">+{stats?.recentUsers || 0} this week</p>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-base font-medium opacity-90">Total Reviews</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{stats?.totalReviews || 0}</p>
          <p className="text-xs sm:text-sm mt-2 opacity-80">+{stats?.recentReviews || 0} this week</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-base font-medium opacity-90">Total Movies</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{stats?.totalMovies || 0}</p>
          <p className="text-xs sm:text-sm mt-2 opacity-80">In database</p>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-lg p-4 sm:p-6 text-white">
          <h3 className="text-sm sm:text-base font-medium opacity-90">Connections</h3>
          <p className="text-2xl sm:text-3xl font-bold mt-2">{stats?.totalConnections || 0}</p>
          <p className="text-xs sm:text-sm mt-2 opacity-80">Active connections</p>
        </div>
      </div>

      {/* Top Reviewers & Most Reviewed Movies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Reviewers */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Top Reviewers</h3>
          {topReviewers.length === 0 ? (
            <p className="text-gray-400 text-sm">No reviewers yet</p>
          ) : (
            <div className="space-y-3">
              {topReviewers.map((reviewer, index) => (
                <div key={reviewer._id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-gray-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-medium text-sm sm:text-base truncate">{reviewer.username}</p>
                      <p className="text-gray-400 text-xs sm:text-sm truncate">{reviewer.email}</p>
                    </div>
                  </div>
                  <span className="text-green-400 font-bold text-sm sm:text-base ml-2">{reviewer.reviewCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Most Reviewed Movies */}
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Most Reviewed Movies</h3>
          {mostReviewedMovies.length === 0 ? (
            <p className="text-gray-400 text-sm">No movies reviewed yet</p>
          ) : (
            <div className="space-y-3">
              {mostReviewedMovies.map((movie, index) => (
                <div key={movie._id} className="flex items-center justify-between bg-gray-700 rounded p-3">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <span className="text-gray-400 font-bold text-sm sm:text-base">#{index + 1}</span>
                    <p className="text-white font-medium text-sm sm:text-base truncate flex-1">{movie.title}</p>
                  </div>
                  <span className="text-blue-400 font-bold text-sm sm:text-base ml-2">{movie.reviewCount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div>
      {/* Search */}
      <div className="mb-4 sm:mb-6">
        <form onSubmit={handleSearchUsers} className="flex gap-2">
          <input
            type="text"
            value={usersSearch}
            onChange={(e) => setUsersSearch(e.target.value)}
            placeholder="Search by username or email..."
            className="flex-1 px-3 sm:px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
          />
          <button
            type="submit"
            className="px-4 sm:px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm sm:text-base font-medium"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Role</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Reviews</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{u.username}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{u.email}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">{u.email || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      u.role === 'admin' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">{u.reviewCount || 0}</td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u._id, u.username)}
                        className="text-red-400 hover:text-red-300 transition font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersPagination.pages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-700 flex items-center justify-between">
            <button
              onClick={() => {
                setUsersPagination({ ...usersPagination, page: usersPagination.page - 1 });
                setTimeout(loadUsers, 100);
              }}
              disabled={usersPagination.page === 1}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="text-gray-300 text-sm">
              Page {usersPagination.page} of {usersPagination.pages}
            </span>
            <button
              onClick={() => {
                setUsersPagination({ ...usersPagination, page: usersPagination.page + 1 });
                setTimeout(loadUsers, 100);
              }}
              disabled={usersPagination.page === usersPagination.pages}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderReviews = () => (
    <div>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Movie</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">User</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rating</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {reviews.map((review) => (
                <tr key={review._id} className="hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-medium text-white">{review.movieId?.title || 'Unknown'}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{review.userId?.username}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">
                    {review.userId?.username || 'Unknown'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <span className="text-yellow-400 font-semibold text-sm">★ {review.rating}/10</span>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteReview(review._id)}
                      className="text-red-400 hover:text-red-300 transition font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {reviewsPagination.pages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-700 flex items-center justify-between">
            <button
              onClick={() => {
                setReviewsPagination({ ...reviewsPagination, page: reviewsPagination.page - 1 });
                setTimeout(loadReviews, 100);
              }}
              disabled={reviewsPagination.page === 1}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="text-gray-300 text-sm">
              Page {reviewsPagination.page} of {reviewsPagination.pages}
            </span>
            <button
              onClick={() => {
                setReviewsPagination({ ...reviewsPagination, page: reviewsPagination.page + 1 });
                setTimeout(loadReviews, 100);
              }}
              disabled={reviewsPagination.page === reviewsPagination.pages}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderJournals = () => (
    <div>
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Title</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden sm:table-cell">User</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider hidden md:table-cell">Date</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {journals.map((journal) => (
                <tr key={journal._id} className="hover:bg-gray-700">
                  <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-medium text-white truncate max-w-xs">{journal.title}</div>
                    <div className="text-xs text-gray-400 sm:hidden">{journal.userId?.username}</div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden sm:table-cell">
                    {journal.userId?.username || 'Unknown'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-300 hidden md:table-cell">
                    {new Date(journal.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleDeleteJournal(journal._id)}
                      className="text-red-400 hover:text-red-300 transition font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {journalsPagination.pages > 1 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-700 flex items-center justify-between">
            <button
              onClick={() => {
                setJournalsPagination({ ...journalsPagination, page: journalsPagination.page - 1 });
                setTimeout(loadJournals, 100);
              }}
              disabled={journalsPagination.page === 1}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Previous
            </button>
            <span className="text-gray-300 text-sm">
              Page {journalsPagination.page} of {journalsPagination.pages}
            </span>
            <button
              onClick={() => {
                setJournalsPagination({ ...journalsPagination, page: journalsPagination.page + 1 });
                setTimeout(loadJournals, 100);
              }}
              disabled={journalsPagination.page === journalsPagination.pages}
              className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded disabled:opacity-50 text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (loading) return <Loading message="Loading..." />;
    if (error) return <ErrorMessage message={error} onRetry={loadData} />;

    switch (activeTab) {
      case 'stats':
        return renderStats();
      case 'users':
        return renderUsers();
      case 'reviews':
        return renderReviews();
      case 'journals':
        return renderJournals();
      default:
        return null;
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-400">Manage users, reviews, and system statistics</p>
      </div>

      {/* Tabs */}
      <div className="bg-[#1a1a1a] rounded-lg mb-4 sm:mb-6">
        <div className="border-b border-gray-700">
          <nav className="flex overflow-x-auto scrollbar-hide -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium uppercase whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500'
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
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;
