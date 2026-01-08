# 🎬 Movie-Mate - Project Plan & Architecture

## 📋 Project Overview

**Movie-Mate** is a full-stack MERN application for personal movie tracking, review, and journaling - similar to Letterboxd but more personal and customizable.

## 🎯 MVP Scope (Phase 1)

### Core Features to Build:
1. ✅ User Authentication (Signup/Login with JWT access + refresh tokens)
2. ✅ Movie Discovery (Search by title + TMDB integration)
3. ✅ Personal Lists (Watched, Watching, Wishlist, Favorites)
4. ✅ Dual Rating System (1-10 integer + 5-star with halves)
5. ✅ Reviews (Public/Private visibility)
6. ✅ User Profile (View public profiles)

### Phase 2 Features (Later):
- Journal entries (separate from reviews)
- Follow/Unfollow functionality
- Activity Feed (followed users' activity)
- Comments & Likes on reviews
- Recommendations engine
- Advanced browsing (genre/year/trending filters)

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Axios, Context API
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (access + refresh tokens)
- **External API:** TMDB API
- **State Management:** React Context API
- **Language:** JavaScript (no TypeScript)

## 📁 Project Structure

```
Movie-Mate/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   ├── movieController.js
│   │   │   └── reviewController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── validation.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Movie.js
│   │   │   ├── Review.js
│   │   │   └── ListEntry.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── movieRoutes.js
│   │   │   └── reviewRoutes.js
│   │   ├── services/
│   │   │   └── tmdbService.js
│   │   ├── utils/
│   │   │   ├── errorHandler.js
│   │   │   └── asyncHandler.js
│   │   └── server.js
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── Loading.jsx
│   │   │   │   └── ErrorMessage.jsx
│   │   │   ├── movies/
│   │   │   │   ├── MovieCard.jsx
│   │   │   │   ├── MovieGrid.jsx
│   │   │   │   ├── MovieSearch.jsx
│   │   │   │   └── RatingDisplay.jsx
│   │   │   ├── reviews/
│   │   │   │   ├── ReviewCard.jsx
│   │   │   │   └── ReviewForm.jsx
│   │   │   └── lists/
│   │   │       └── ListManager.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── MovieDetails.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── MyLists.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── PROJECT_PLAN.md
└── README.md
```

## 🗄️ Database Schema (MongoDB)

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String (unique, required),
  email: String (unique, required),
  password: String (hashed, required),
  bio: String,
  profilePicture: String (URL),
  joinedDate: Date (default: now),
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Movies Collection
```javascript
{
  _id: ObjectId,
  tmdbId: Number (unique, required, indexed),
  title: String (required),
  overview: String,
  poster: String (URL),
  backdrop: String (URL),
  releaseDate: Date,
  genres: [String],
  rating: Number (TMDB rating),
  cachedAt: Date (default: now)
}
```

### Reviews Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  movieId: ObjectId (ref: Movie, required, indexed),
  ratingInteger: Number (1-10, optional),
  ratingStars: Number (0-10 in 0.5 increments, optional),
  reviewText: String,
  visibility: String (enum: ['public', 'private'], default: 'public'),
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, movieId: 1 } (unique - one review per user per movie)
```

### ListEntries Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required, indexed),
  movieId: ObjectId (ref: Movie, required, indexed),
  listType: String (enum: ['watched', 'watching', 'wishlist', 'favorites'], required),
  ratingInteger: Number (1-10, optional),
  ratingStars: Number (0-10 in 0.5 increments, optional),
  reviewText: String (optional),
  dateAdded: Date (default: now),
  dateWatched: Date (for 'watched' list, optional),
  createdAt: Date,
  updatedAt: Date
}
// Compound index: { userId: 1, movieId: 1, listType: 1 } (unique)
```

## 🔐 Authentication Strategy

- **Access Token:** Short-lived (15 min), stored in memory
- **Refresh Token:** Long-lived (7 days), stored in HTTP-only cookie
- **Password:** Bcrypt hashing (salt rounds: 10)
- **Protected Routes:** Middleware to verify JWT

## 🎬 Rating System Implementation

**Dual Rating Storage:**
- `ratingInteger`: 1-10 (whole numbers)
- `ratingStars`: 0-10 (increments of 0.5) for Letterboxd-style

**UI Display:**
- Show both rating formats
- Allow toggle between formats
- Star display: visual stars (filled/half/empty)

## 🎥 Movie Data Caching Strategy

**Cache movies in MongoDB when:**
1. User searches and views movie details
2. User adds movie to any list
3. User writes a review

**Cache includes:**
- TMDB ID, title, overview, poster, backdrop
- Release date, genres, TMDB rating
- Timestamp of cache

**Benefits:**
- Reduce TMDB API calls
- Faster response times
- Maintain history even if movie removed from TMDB

## 🔌 API Endpoints (MVP)

### Authentication
- `POST /api/auth/register` - User signup
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - Logout (invalidate refresh token)
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies/search` - Search movies (query: title)
- `GET /api/movies/:id` - Get movie details
- `POST /api/movies/cache` - Cache movie from TMDB (internal)

### Lists
- `GET /api/lists` - Get user's all lists
- `GET /api/lists/:type` - Get specific list (watched/watching/wishlist/favorites)
- `POST /api/lists` - Add movie to list
- `PUT /api/lists/:id` - Update list entry (rating/review)
- `DELETE /api/lists/:id` - Remove movie from list

### Reviews
- `GET /api/reviews/movie/:movieId` - Get public reviews for a movie
- `GET /api/reviews/user/:userId` - Get user's reviews (public only or own)
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

### Users
- `GET /api/users/:username` - Get public user profile
- `PUT /api/users/profile` - Update own profile

## 🎨 UI/UX Guidelines

- **Design:** Clean, modern, minimal (Letterboxd-inspired)
- **Responsive:** Mobile-first approach
- **Colors:** Dark theme preferred
- **Loading States:** Skeleton loaders
- **Error Handling:** User-friendly error messages
- **Empty States:** Helpful messages with CTAs

## 🔒 Security Considerations

- Environment variables for sensitive data
- Input validation on backend
- XSS prevention
- CORS configuration
- Rate limiting (future)
- Helmet.js for security headers

## 📦 Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
TMDB_API_KEY=...
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

## 🚀 Deployment Plan

- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

## ✅ MVP Checklist

### Backend
- [ ] Project setup & dependencies
- [ ] Database connection
- [ ] User model & authentication
- [ ] Movie model & TMDB service
- [ ] Review model & controllers
- [ ] ListEntry model & controllers
- [ ] API routes & middleware
- [ ] Error handling
- [ ] Input validation

### Frontend
- [ ] Vite React setup
- [ ] Tailwind CSS configuration
- [ ] AuthContext & protected routes
- [ ] API service layer
- [ ] Login/Register pages
- [ ] Home/Explore page
- [ ] Movie search & discovery
- [ ] Movie details page
- [ ] Lists management page
- [ ] Review components
- [ ] User profile page
- [ ] Rating components (dual system)
- [ ] Responsive design

## 📝 Notes

- Use JavaScript (no TypeScript)
- Follow RESTful API conventions
- Consistent error response format
- API versioning: `/api/v1/` (optional for MVP)
- Code comments for complex logic
- README with setup instructions
