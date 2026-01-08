const Footer = () => {
  return (
    <footer className="bg-[#0f0f0f] border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center text-gray-500">
          <p>&copy; 2024 Movie-Mate. Track your life in film.</p>
          <p className="mt-2 text-sm text-gray-600">
            Movie data provided by{' '}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-500 transition"
            >
              TMDB
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
