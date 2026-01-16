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
  if (url.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${url}`;
  if (url.startsWith('public/uploads/')) return `${BACKEND_ORIGIN}/${url.replace(/^public\//, '')}`;
  return url;
};

const Journal = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [journals, setJournals] = useState([]);
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
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Journal</h1>
            <p className="text-sm sm:text-base text-gray-400">Read journals from all members.</p>
          </div>
          {isAuthenticated && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => navigate('/journal/manage')}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-700 text-white text-sm sm:text-base rounded-lg hover:bg-gray-600 transition font-medium"
              >
                Manage
              </button>
              <button
                onClick={() => navigate('/journal/write')}
                className="flex-1 sm:flex-none px-3 sm:px-5 py-2 sm:py-2.5 bg-primary-600 text-white text-sm sm:text-base rounded-lg hover:bg-primary-700 transition font-medium"
              >
                Write
              </button>
            </div>
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
          <div className="max-w-2xl mx-auto space-y-6">
            {journals.map((j) => {
              const author = j.userId;
              const previewText = stripHtml(j.contentHtml);
              const previewLimit = 260;
              const isLong = previewText.length > previewLimit;
              const preview = previewText.slice(0, previewLimit);
              const firstImgRaw = Array.isArray(j.imageUrls) && j.imageUrls.length > 0 ? j.imageUrls[0] : null;
              const firstImg = firstImgRaw ? resolveUploadUrl(firstImgRaw) : null;
              const authorAvatar = author?.profilePicture ? resolveUploadUrl(author.profilePicture) : null;
              const created = j.createdAt ? new Date(j.createdAt) : null;

              return (
                <div key={j._id} className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="flex items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary-400 transition-all"
                        onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                      >
                        <div className="w-full h-full flex items-center justify-center text-gray-300 font-semibold text-base">
                          {(author?.username || '?').charAt(0).toUpperCase()}
                        </div>
                        {authorAvatar && (
                          <img
                            src={authorAvatar}
                            alt={author.username}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-white font-semibold truncate cursor-pointer hover:text-primary-400 transition text-[15px]"
                          onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                        >
                          {author?.username || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {created ? created.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{j.title}</h2>

                  {/* LinkedIn-style: text first */}
                  <p className="text-gray-300 leading-relaxed line-clamp-4 mb-3 text-[15px]">
                    {preview}{isLong ? '…' : ''}
                  </p>
                  {isLong && (
                    <button
                      className="text-primary-400 hover:text-primary-300 transition text-sm font-semibold mb-4 inline-flex items-center gap-1"
                      onClick={() => navigate(`/journal/${j._id}`)}
                    >
                      Read more
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Then media preview (fixed, post-like) */}
                  {firstImg && (
                    <div className="flex justify-center mt-4">
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
                    <button
                      className="text-gray-400 hover:text-primary-400 transition text-sm font-medium inline-flex items-center gap-1.5"
                      onClick={() => {
                        if (author?.username) navigate(`/profile/${author.username}`);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
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
