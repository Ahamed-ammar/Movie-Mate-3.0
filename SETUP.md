# 🚀 Quick Setup Guide

## Prerequisites
- Node.js v18+ installed
- MongoDB Atlas account (free tier works)
- TMDB API key ([Get it here](https://www.themoviedb.org/settings/api))

## Step-by-Step Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/moviemate?retryWrites=true&w=majority
JWT_ACCESS_SECRET=generate_a_random_long_string_here
JWT_REFRESH_SECRET=generate_another_random_long_string_here
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Generate JWT secrets:**
```bash
# On Linux/Mac
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use any random string generator (make them long and random!)
```

Start backend:
```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

Start frontend:
```bash
npm run dev
```

### 3. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 🎯 First Steps

1. Register a new account
2. Search for movies
3. Add movies to your lists
4. Write reviews and rate movies
5. Explore other users' profiles

## 🐛 Troubleshooting

### Backend Issues
- **MongoDB Connection Error**: Check your MONGODB_URI in `.env`
- **Port Already in Use**: Change PORT in `.env` or kill the process using port 5000
- **TMDB API Error**: Verify your TMDB_API_KEY is correct

### Frontend Issues
- **API Connection Error**: Ensure backend is running on port 5000
- **CORS Errors**: Check FRONTEND_URL in backend `.env`
- **Build Errors**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

## 📝 Notes

- Make sure both servers are running simultaneously
- Backend must be running before frontend can make API calls
- Movie data will be cached in MongoDB as users interact with movies
- Refresh tokens are stored in HTTP-only cookies for security
