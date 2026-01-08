# 🔧 Troubleshooting TMDB API Errors

## Common Issues and Solutions

### 1. "Failed to load movies" Error

This error can occur due to several reasons:

#### Check 1: Is Backend Running?
```powershell
# In backend directory
cd backend
npm run dev
```
You should see: `Server running in development mode on port 5000`

**Test backend directly:**
```powershell
# Open browser or use curl
http://localhost:5000/api/health
```
Should return: `{"success":true,"message":"Movie-Mate API is running"}`

#### Check 2: Frontend Environment Variables
Make sure `frontend/.env` file exists with:
```env
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

**Important:** After changing `.env`, restart the frontend server!

#### Check 3: TMDB API Key
Test if your TMDB API key is working:
```powershell
cd backend
node test-tmdb-api.js
```

If you see errors:
- **"API key is invalid"** → Update `TMDB_API_KEY` in `backend/.env`
- **"API key not set"** → Make sure `.env` file exists in `backend/` folder
- **"JWT token detected"** → You're using wrong type of key. See `HOW_TO_GET_TMDB_API_KEY.md`

#### Check 4: MongoDB Connection
Backend needs MongoDB to work. Check if:
- `MONGODB_URI` is set in `backend/.env`
- MongoDB Atlas cluster is running
- Your IP is whitelisted in MongoDB Atlas

### 2. Browser Console Errors

Open browser DevTools (F12) and check:
- **Network tab**: See if API requests are failing
- **Console tab**: Check for error messages

Common errors:
- `ECONNREFUSED` → Backend not running
- `CORS error` → Backend CORS not configured correctly
- `401 Unauthorized` → TMDB API key invalid
- `404 Not Found` → Wrong API endpoint

### 3. Step-by-Step Debugging

1. **Test Backend Health:**
   ```powershell
   curl http://localhost:5000/api/health
   ```

2. **Test TMDB API Directly:**
   ```powershell
   cd backend
   node test-tmdb-api.js
   ```

3. **Test Backend Movie Endpoint:**
   ```powershell
   curl http://localhost:5000/api/movies/popular
   ```

4. **Check Frontend Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for error messages
   - Check Network tab for failed requests

### 4. Quick Fix Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm run dev` in frontend folder)
- [ ] `backend/.env` file exists with valid values:
  - [ ] `TMDB_API_KEY` is a valid TMDB API key (not JWT token)
  - [ ] `MONGODB_URI` is valid MongoDB connection string
  - [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are set
- [ ] `frontend/.env` file exists with:
  - [ ] `VITE_API_URL=http://localhost:5000/api`
- [ ] Restarted both servers after changing `.env` files
- [ ] MongoDB Atlas cluster is accessible
- [ ] Internet connection is working

### 5. Still Not Working?

1. **Check Backend Logs:**
   Look at the terminal where backend is running for error messages

2. **Check Frontend Logs:**
   Look at browser console (F12) for error messages

3. **Test TMDB API Key:**
   ```powershell
   cd backend
   node test-tmdb-api.js
   ```

4. **Verify Environment Variables:**
   ```powershell
   # In backend folder
   node -e "require('dotenv').config(); console.log('TMDB_API_KEY:', process.env.TMDB_API_KEY ? 'SET' : 'NOT SET')"
   ```

## Need More Help?

Check these files:
- `backend/HOW_TO_GET_TMDB_API_KEY.md` - How to get TMDB API key
- `HOW_TO_RUN.md` - How to run the project
- `SETUP.md` - Initial setup instructions

