import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-gradient-to-r from-[#1a1a1a] via-[#1f1f1f] to-[#1a1a1a] border-b-2 border-yellow-600/30 sticky top-0 z-50 shadow-lg shadow-black/50">
      <div className="container mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Left - Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group" onClick={closeMobileMenu}>
            <img 
              src="/assets/popcorn.png" 
              alt="Movie Mate Popcorn" 
              className="h-11 sm:h-12 md:h-14 w-auto transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 drop-shadow-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <span 
              className="text-xl sm:text-2xl md:text-3xl font-black tracking-wide transition-all duration-300 group-hover:scale-105"
              style={{
                fontFamily: "'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', cursive, sans-serif",
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(2px 2px 4px rgba(255, 140, 0, 0.4))',
                letterSpacing: '0.03em'
              }}
            >
              MOVIE MATE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
            {isAuthenticated && (
              <>
                <Link
                  to={`/profile/${user.username}`}
                  className="flex items-center space-x-2 text-gray-400 hover:text-yellow-400 transition-all duration-200 group"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center ring-2 ring-transparent group-hover:ring-yellow-400/50 transition-all">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm uppercase font-semibold tracking-wider">{user.username}</span>
                </Link>

                <div className="text-yellow-500/60">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
              </>
            )}

            <nav className="flex items-center space-x-6">
              <Link
                to="/browse"
                className={`text-sm uppercase font-semibold tracking-wider transition-all duration-200 hover:scale-105 ${
                  isActive('/browse') || isActive('/movie') || isActive('/movies')
                    ? 'text-yellow-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                FILMS
              </Link>
              {isAuthenticated && (
                <Link
                  to="/lists"
                  className={`text-sm uppercase font-semibold tracking-wider transition-all duration-200 hover:scale-105 ${
                    isActive('/lists') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  LISTS
                </Link>
              )}
              <Link
                to="/members"
                className={`text-sm uppercase font-semibold tracking-wider transition-all duration-200 hover:scale-105 ${
                  isActive('/members') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                MEMBERS
              </Link>
              <Link
                to="/journal"
                className={`text-sm uppercase font-semibold tracking-wider transition-all duration-200 hover:scale-105 ${
                  isActive('/journal') ? 'text-yellow-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                JOURNAL
              </Link>
            </nav>
          </div>

          {/* Right side - Desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            <button className="text-gray-400 hover:text-yellow-400 transition-all duration-200 p-2 rounded-lg hover:bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {isAuthenticated ? (
              <Link
                to="/browse"
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 font-semibold text-sm shadow-lg shadow-green-500/30 hover:shadow-green-500/50 hover:scale-105"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>LOG</span>
              </Link>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-300 hover:text-yellow-400 transition-all duration-200 text-sm font-semibold uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition-all duration-200 text-sm font-bold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-yellow-400 p-2 hover:bg-gray-800 rounded-lg transition-all duration-200 hover:scale-110"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-700 mt-3 pt-3 pb-2 space-y-2">
            {isAuthenticated && (
              <Link
                to={`/profile/${user.username}`}
                onClick={closeMobileMenu}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-700 transition"
              >
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-white font-medium">{user.username}</span>
              </Link>
            )}

            <Link
              to="/browse"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-lg transition ${
                isActive('/browse') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Films
            </Link>

            {isAuthenticated && (
              <Link
                to="/lists"
                onClick={closeMobileMenu}
                className={`block px-3 py-2 rounded-lg transition ${
                  isActive('/lists') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                My Lists
              </Link>
            )}

            <Link
              to="/members"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-lg transition ${
                isActive('/members') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Members
            </Link>

            <Link
              to="/journal"
              onClick={closeMobileMenu}
              className={`block px-3 py-2 rounded-lg transition ${
                isActive('/journal') ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Journal
            </Link>

            <div className="border-t border-gray-700 pt-2 mt-2">
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-lg transition"
                >
                  Sign Out
                </button>
              ) : (
                <div className="space-y-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-lg transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={closeMobileMenu}
                    className="block px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition text-center font-medium"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
