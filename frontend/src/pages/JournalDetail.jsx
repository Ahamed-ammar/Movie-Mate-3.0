import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { journalsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { API_URL } from '../utils/constants';

const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, '');
const resolveUploadUrl = (url) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_ORIGIN}${url}`;
  if (url.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${url}`;
  if (url.startsWith('public/uploads/')) return `${BACKEND_ORIGIN}/${url.replace(/^public\//, '')}`;
  return url;
};

const JournalDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadJournal = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await journalsAPI.getById(id);
        setJournal(res.data.data.journal);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load journal');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadJournal();
    }
  }, [id]);

  if (loading) return <Loading message="Loading journal..." />;
  if (error) return <ErrorMessage message={error} />;
  if (!journal) return <ErrorMessage message="Journal not found" />;

  const author = journal.userId;
  const created = journal.createdAt ? new Date(journal.createdAt) : null;
  const images = Array.isArray(journal.imageUrls) 
    ? journal.imageUrls.map(url => resolveUploadUrl(url)).filter(Boolean)
    : [];
  const isOwner = user && author && user.userId === author._id;
  const authorAvatar = author?.profilePicture ? resolveUploadUrl(author.profilePicture) : null;

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/journal')}
          className="mb-6 text-gray-400 hover:text-yellow-400 transition-all duration-200 flex items-center gap-2 text-sm sm:text-base font-medium group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Journals
        </button>

        {/* Journal Card */}
        <article className="bg-gradient-to-br from-gray-800 to-gray-850 rounded-2xl shadow-2xl border border-gray-700/50 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-900/50 border-b border-gray-700/50 p-6 sm:p-8">
            {/* Author Info */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-yellow-400 transition-all"
                  onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                >
                  <div className="w-full h-full flex items-center justify-center text-gray-300 font-bold text-xl">
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
                <div>
                  <div
                    className="text-white text-lg sm:text-xl font-bold cursor-pointer hover:text-yellow-400 transition-colors"
                    onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                  >
                    {author?.username || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {created ? created.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </div>
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => navigate('/journal/manage')}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-all"
                >
                  Manage
                </button>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight">
              {journal.title}
            </h1>
          </div>

          {/* Content Body */}
          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            {/* Content - Enhanced for readability */}
            <div 
              className="journal-content text-gray-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: journal.contentHtml }}
            />

            {/* Images */}
            {images.length > 0 && (
              <div className="mt-10 space-y-8">
                <div className="border-t border-gray-700/50 pt-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Images ({images.length})
                  </h3>
                </div>
                {images.map((img, idx) => (
                  <div key={idx} className="rounded-xl overflow-hidden bg-gray-900 border border-gray-700 shadow-lg">
                    <img
                      src={img}
                      alt={`${journal.title} - Image ${idx + 1}`}
                      className="w-full h-auto object-contain max-h-[600px]"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-900/50 border-t border-gray-700/50 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => author?.username && navigate(`/profile/${author.username}`)}
                className="text-gray-400 hover:text-yellow-400 transition-all text-sm font-medium inline-flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View {author?.username}'s Profile
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
};

export default JournalDetail;
