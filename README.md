# 🎬 Movie-Mate

A full-stack MERN application for personal movie tracking, review, and journaling - similar to Letterboxd but more personal and customizable.

## 🚀 Features

### MVP (Phase 1)
- ✅ User Authentication (JWT-based with access & refresh tokens)
- ✅ Movie Discovery (Search, Trending, Popular)
- ✅ Personal Lists (Watched, Watching, Wishlist, Favorites)
- ✅ Dual Rating System (1-10 integer + 5-star with halves)
- ✅ Reviews (Public/Private visibility)
- ✅ User Profiles

### Phase 2 (Coming Soon)
- Journal entries (separate from reviews)
- Follow/Unfollow functionality
- Activity Feed
- Comments & Likes on reviews
- Recommendations engine
- Advanced browsing filters

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- TMDB API Integration

### Frontend
- React (Vite)
- Tailwind CSS
- React Router DOM
- Axios
- Context API for state management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- TMDB API key ([Get it here](https://www.themoviedb.org/settings/api))

## 🔧 Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd Movie-Mate
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/moviemate?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_super_secret_access_token_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_token_key_here
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 📁 Project Structure

```
Movie-Mate/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth & validation middleware
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── services/        # External API services (TMDB)
│   │   ├── utils/           # Utility functions
│   │   └── server.js        # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React Context providers
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── utils/           # Utility functions
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies/search?query=title` - Search movies
- `GET /api/movies/:id` - Get movie details
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/popular` - Get popular movies
- `GET /api/movies/genres` - Get genres list

### Lists
- `GET /api/lists` - Get all user lists
- `GET /api/lists/:type` - Get specific list
- `POST /api/lists` - Add movie to list
- `PUT /api/lists/:id` - Update list entry
- `DELETE /api/lists/:id` - Remove from list

### Reviews
- `GET /api/reviews/movie/:movieId` - Get movie reviews
- `GET /api/reviews/user/:userId` - Get user reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Users
- `GET /api/users/:username` - Get user profile
- `PUT /api/users/profile` - Update own profile

## 🎯 Usage

1. **Register/Login**: Create an account or login to start tracking movies
2. **Discover Movies**: Search for movies, browse trending or popular films
3. **Add to Lists**: Add movies to your watched, watching, wishlist, or favorites
4. **Rate & Review**: Rate movies using the dual rating system and write reviews
5. **View Profiles**: Check out other users' public profiles and reviews

## 🔒 Security Features

- Password hashing with bcrypt
- JWT tokens with refresh mechanism
- HTTP-only cookies for refresh tokens
- Protected routes
- Input validation
- CORS configuration

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables
3. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your repository
3. Set environment variables
4. Deploy

### Database
- Use MongoDB Atlas for production

## 📝 Notes

- Movie data is cached in MongoDB when users interact with it
- Both rating systems (integer and stars) can be used simultaneously
- Reviews can be set to public or private
- All list types support ratings and notes

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome!

## 📄 License

MIT License

## 🙏 Acknowledgments

- Movie data provided by [TMDB](https://www.themoviedb.org/)
- Inspired by [Letterboxd](https://letterboxd.com/)
