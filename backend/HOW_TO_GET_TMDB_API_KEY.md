# 🔑 How to Get Your TMDB API Key

## Step-by-Step Instructions

### Step 1: Create/Login to TMDB Account

1. Go to [TMDB Website](https://www.themoviedb.org/)
2. Click **Sign Up** or **Log In** (top right)
3. Complete registration/login process

### Step 2: Request API Access

1. After logging in, go to your **Account Settings**
   - Click on your profile icon (top right)
   - Select **Settings**

2. Navigate to **API** section in the left sidebar

3. Click **Request API Key** or **Create API Key**

4. Choose the type of API key:
   - **Developer**: For personal projects (this is what you need)
   - **Production**: For commercial use (requires approval)

5. Fill out the application form:
   - **Application Name**: Movie-Mate (or any name)
   - **Application URL**: http://localhost:5000 (for development)
   - **Application Summary**: "Personal movie tracking and review application"
   - Accept the terms and conditions

6. Click **Submit**

### Step 3: Copy Your API Key

1. Once approved (usually instant for Developer keys), you'll see your API key
2. It will look something like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Note**: TMDB API keys are usually 32 characters long
   - They are alphanumeric strings (not JWT tokens)

3. **Copy the entire API key**

### Step 4: Add to Your .env File

1. Open `backend/.env` file
2. Find the line: `TMDB_API_KEY=your_tmdb_api_key_here`
3. Replace `your_tmdb_api_key_here` with your actual API key:

```env
TMDB_API_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

4. **Important**: 
   - No quotes around the API key
   - No spaces before or after
   - Just the plain API key value

5. Save the file

### Step 5: Test Your API Key

Run the test script:
```powershell
cd backend
node test-tmdb-api.js
```

If successful, you'll see:
```
✓ TMDB API Key found: a1b2c3d...o5p6
✓ Success! Found 19 genres
✓ Success! Found 20 popular movies
✅ TMDB API is working correctly!
```

## Common Issues

### ❌ "API key is invalid"
- Make sure you copied the entire key (no spaces, no quotes)
- Verify the key in your TMDB account settings
- Ensure you're using a Developer API key, not a JWT token

### ❌ "API key not set"
- Check that `.env` file exists in `backend/` folder
- Verify the line `TMDB_API_KEY=...` is present
- Make sure there are no typos in the variable name

### ❌ Wrong type of key
- **DO NOT** use JWT tokens (they start with `eyJhbGci...`)
- **DO NOT** use access tokens or refresh tokens
- **USE** only the TMDB API key (32-character alphanumeric string)

## Quick Link

Get your API key directly: https://www.themoviedb.org/settings/api

---

**Still having issues?** Make sure:
1. Your TMDB account is verified
2. You requested a Developer API key (not Production)
3. Your `.env` file is in the `backend/` directory
4. You restarted your backend server after updating `.env`
