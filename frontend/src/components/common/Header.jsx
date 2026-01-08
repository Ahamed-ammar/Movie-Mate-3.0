import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-[#1a1a1a] border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left - Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              {/* Logo circles */}
              <div className="flex items-center -space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-500"></div>
                <div className="w-8 h-8 rounded-full bg-green-500"></div>
                <div className="w-8 h-8 rounded-full bg-blue-500"></div>
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">
                MOVIE-MATE
              </span>
            </Link>

            {/* User Info - Only show if authenticated */}
            {isAuthenticated && (
              <>
                {/* User Profile with Dropdown Arrow */}
                <div className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-white transition cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm uppercase font-medium">{user.username}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Lightning Icon */}
                <div className="hidden md:block text-gray-400">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </>
            )}

            {/* Navigation Links - Always visible */}
            <nav className="hidden lg:flex items-center space-x-6">
              <Link
                to="/browse"
                className={`text-sm uppercase font-medium transition ${
                  isActive('/browse') || isActive('/movie') || isActive('/movies')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                FILMS
              </Link>
              {isAuthenticated && (
                <Link
                  to="/lists"
                  className={`text-sm uppercase font-medium transition ${
                    isActive('/lists')
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  LISTS
                </Link>
              )}
              <Link
                to="/members"
                className={`text-sm uppercase font-medium transition ${
                  isActive('/members')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                MEMBERS
              </Link>
              <Link
                to="/journal"
                className={`text-sm uppercase font-medium transition ${
                  isActive('/journal')
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                JOURNAL
              </Link>
            </nav>
          </div>

          {/* Right side - Search and LOG button */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button className="text-gray-400 hover:text-white transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <>
                {/* LOG Button - Green with dropdown */}
                <Link
                  to="/browse"
                  className="hidden md:flex items-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition font-medium text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>LOG</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-white transition text-sm font-medium uppercase"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-sm font-medium"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
