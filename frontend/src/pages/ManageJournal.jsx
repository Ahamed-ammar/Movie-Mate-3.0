import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { journalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { API_URL } from '../utils/constants';

const stripHtml = (html = '') => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');
const resolveUploadUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${url}`;
  if (url.startsWith('public/uploads/')) return `${BACKEND_ORIGIN}/${url.replace(/^public\//, '')}`;
  return url;
};

const ManageJournal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadJournals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journalsAPI.getMy(page, 20);
      setJournals(res.data.data.journals || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load your journals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleDelete = async (journalId) => {
    if (!window.confirm('Are you sure you want to delete this journal? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(journalId);
    try {
      await journalsAPI.delete(journalId);
      setJournals((prev) => prev.filter((j) => j._id !== journalId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete journal');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) return <Loading message="Loading your journals..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadJournals} />;

  const isEmpty = journals.length === 0;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">Manage My Journals</h1>
            <p className="text-sm sm:text-base text-gray-400">View, edit, and delete your journals.</p>
          </div>
          <button
            onClick={() => navigate('/journal')}
            className="w-full sm:w-auto px-4 py-2 bg-gray-700 text-white text-sm sm:text-base rounded-lg hover:bg-gray-600 transition font-medium"
          >
            Back to All Journals
          </button>
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">You haven't written any journals yet.</p>
            <button
              onClick={() => navigate('/journal/write')}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Write your first journal
            </button>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {journals.map((j) => {
              const previewText = stripHtml(j.contentHtml);
              const preview = previewText.slice(0, 220);
              const firstImgRaw = Array.isArray(j.imageUrls) && j.imageUrls.length > 0 ? j.imageUrls[0] : null;
              const firstImg = firstImgRaw ? resolveUploadUrl(firstImgRaw) : null;
              const created = j.createdAt ? new Date(j.createdAt) : null;
              const likesCount = j.likesCount || 0;
              const authorAvatar = user?.profilePicture ? resolveUploadUrl(user.profilePicture) : null;

              return (
                <div key={j._id} className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-semibold text-base">
                          {(user?.username || '?').charAt(0).toUpperCase()}
                        </div>
                        {authorAvatar && (
                          <img
                            src={authorAvatar}
                            alt={user.username}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate text-[15px]">
                          {user?.username || 'You'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {created ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(j._id)}
                      disabled={deleteLoading === j._id}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {deleteLoading === j._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{j.title}</h2>

                  <p className="text-gray-300 leading-relaxed line-clamp-4 mb-4 text-[15px]">
                    {preview}{previewText.length > 220 ? '…' : ''}
                  </p>

                  {firstImg && (
                    <div className="flex justify-center mt-4 mb-4">
                      <div className="rounded-xl overflow-hidden bg-gray-900/50 border border-gray-700/50 max-w-md shadow-md">
                        <img
                          src={firstImg}
                          alt={j.title}
                          className="w-full h-auto max-h-[200px] object-contain block"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span className="font-semibold text-white">{likesCount}</span>
                      <span>{likesCount === 1 ? 'Like' : 'Likes'}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-white">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageJournal;
