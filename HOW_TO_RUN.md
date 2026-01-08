# 🚀 How to Run Movie-Mate Project

## Prerequisites Check

Before running, make sure you have:
- ✅ Node.js installed (v18 or higher) - Check with: `node --version`
- ✅ MongoDB Atlas account and connection string
- ✅ TMDB API key ([Get it here](https://www.themoviedb.org/settings/api))

## Step 1: Install Dependencies

### Backend Dependencies
```powershell
cd backend
npm install
```

### Frontend Dependencies
```powershell
cd frontend
npm install
```

## Step 2: Set Up Environment Variables

### Backend Environment (.env file)

Create a file named `.env` in the `backend` folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster.mongodb.net/moviemate?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your_random_secret_key_min_32_characters_long
JWT_REFRESH_SECRET=your_another_random_secret_key_min_32_characters_long
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**To generate JWT secrets (run in Node.js):**
```javascript
// Open Node.js REPL: node
require('crypto').randomBytes(64).toString('hex')
// Copy the generated strings to your .env file
```

### Frontend Environment (.env file)

Create a file named `.env` in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
```

## Step 3: Run the Application

You need **TWO terminal windows** open - one for backend, one for frontend.

### Terminal 1: Start Backend Server

```powershell
cd backend
npm run dev
```

You should see:
```
MongoDB Connected: ...
Server running in development mode on port 5000
```

Backend will be available at: **http://localhost:5000**

### Terminal 2: Start Frontend Server

```powershell
cd frontend
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Frontend will be available at: **http://localhost:5173**

## Step 4: Access the Application

1. Open your browser and go to: **http://localhost:5173**
2. You should see the Movie-Mate homepage
3. Click "Sign Up" to create an account
4. Start exploring movies!

## 🐛 Troubleshooting

### Backend Won't Start

**Issue: Port 5000 already in use**
```powershell
# Find what's using port 5000
netstat -ano | findstr :5000
# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in backend/.env to something else like 5001
```

**Issue: MongoDB connection error**
- Double-check your MONGODB_URI in `.env`
- Make sure your IP is whitelisted in MongoDB Atlas
- Verify your MongoDB username and password

**Issue: TMDB API errors**
- Verify your TMDB_API_KEY is correct
- Check if you have API access enabled in TMDB settings

### Frontend Won't Start

**Issue: Port 5173 already in use**
```powershell
# Find what's using port 5173
netstat -ano | findstr :5173
# Kill the process
taskkill /PID <PID> /F

# Vite will automatically use the next available port
```

**Issue: Cannot connect to backend API**
- Make sure backend is running on port 5000
- Check `VITE_API_URL` in `frontend/.env` matches backend URL
- Verify CORS settings in backend (FRONTEND_URL should be http://localhost:5173)

### Dependencies Not Installing

**Issue: npm install fails**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json, then reinstall
rm -r node_modules
rm package-lock.json
npm install
```

## 📝 Quick Commands Reference

### Start Everything (2 terminals needed)
```powershell
# Terminal 1
cd backend && npm run dev

# Terminal 2 (new terminal)
cd frontend && npm run dev
```

### Check if servers are running
```powershell
# Backend health check
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"Movie-Mate API is running"}

# Frontend (just open in browser)
# http://localhost:5173
```

### Stop Servers
Press `Ctrl + C` in each terminal window

## ✅ Verification Checklist

- [ ] Backend dependencies installed (`cd backend && npm install`)
- [ ] Frontend dependencies installed (`cd frontend && npm install`)
- [ ] Backend `.env` file created with all required variables
- [ ] Frontend `.env` file created
- [ ] MongoDB connection string is correct
- [ ] TMDB API key is valid
- [ ] Backend server starts without errors
- [ ] Frontend server starts without errors
- [ ] Can access http://localhost:5173 in browser
- [ ] Can register/login a new user

## 🎯 First Steps After Running

1. **Register an account** - Click "Sign Up" and create your account
2. **Search for movies** - Use the search bar to find movies
3. **Add to lists** - Click on a movie and add it to your lists
4. **Rate and review** - Write reviews and rate movies
5. **Explore** - Check out trending and popular movies

---

**Need help?** Check the main README.md or SETUP.md files for more details.
