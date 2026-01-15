import { useEffect, useMemo, useState } from 'react';
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
  return url;
};

const Journal = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [journals, setJournals] = useState([]);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadJournals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await journalsAPI.getAll(page, 20);
      setJournals(res.data.data.journals || []);
      setTotalPages(res.data.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load journals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const isEmpty = useMemo(() => !loading && journals.length === 0, [loading, journals.length]);

  if (loading) return <Loading message="Loading journals..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadJournals} />;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Journal</h1>
            <p className="text-gray-400">Read journals from all members.</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => navigate('/journal/write')}
              className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              Write your journal
            </button>
          )}
        </div>

        {isEmpty ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-4">No journals yet.</p>
            {isAuthenticated && (
              <button
                onClick={() => navigate('/journal/write')}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Be the first to write one
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {journals.map((j) => {
              const author = j.userId;
              const previewText = stripHtml(j.contentHtml);
              const isExpanded = expandedIds.has(j._id);
              const previewLimit = 260;
              const isLong = previewText.length > previewLimit;
              const preview = isExpanded ? previewText : previewText.slice(0, previewLimit);
              const firstImgRaw = Array.isArray(j.imageUrls) && j.imageUrls.length > 0 ? j.imageUrls[0] : null;
              const firstImg = firstImgRaw ? resolveUploadUrl(firstImgRaw) : null;
              const created = j.createdAt ? new Date(j.createdAt) : null;

              return (
                <div key={j._id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 cursor-pointer"
                        onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                      >
                        {author?.profilePicture ? (
                          <img src={author.profilePicture} alt={author.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 font-semibold">
                            {(author?.username || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-white font-semibold truncate cursor-pointer hover:text-primary-400 transition"
                          onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                        >
                          {author?.username || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {created ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-3">{j.title}</h2>

                  {/* LinkedIn-style: text first */}
                  <p className={`text-gray-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-4'} mb-2`}>
                    {preview}{!isExpanded && isLong ? '…' : ''}
                  </p>
                  {isLong && (
                    <button
                      className="text-primary-400 hover:text-primary-300 transition text-sm font-medium mb-4"
                      onClick={() => {
                        setExpandedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(j._id)) next.delete(j._id);
                          else next.add(j._id);
                          return next;
                        });
                      }}
                    >
                      {isExpanded ? 'Read less' : 'Read more'}
                    </button>
                  )}

                  {/* Then media preview (fixed, post-like) */}
                  {firstImg && (
                    <div className="rounded-lg overflow-hidden bg-gray-900 border border-gray-700">
                      <div className="w-full aspect-[16/9] max-h-[260px]">
                        <img
                          src={firstImg}
                          alt={j.title}
                          className="w-full h-full object-cover block"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <button
                      className="text-primary-400 hover:text-primary-300 transition text-sm font-medium"
                      onClick={() => {
                        // Simple expand-in-place: navigate to profile for now; can add dedicated journal page later
                        // Keeping scope small per request.
                        if (author?.username) navigate(`/profile/${author.username}`);
                      }}
                    >
                      View author profile
                    </button>
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

export default Journal;
