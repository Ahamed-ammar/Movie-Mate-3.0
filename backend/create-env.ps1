# Script to create .env file for backend

$envContent = @"
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/moviemate?retryWrites=true&w=majority
JWT_ACCESS_SECRET=change_this_to_a_random_secret_key_at_least_32_characters_long
JWT_REFRESH_SECRET=change_this_to_another_random_secret_key_at_least_32_characters_long
TMDB_API_KEY=your_tmdb_api_key_here
TMDB_BASE_URL=https://api.themoviedb.org/3
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8
Write-Host "✓ .env file created successfully in backend directory!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠ IMPORTANT: Update the following values in .env file:" -ForegroundColor Yellow
Write-Host "  1. MONGODB_URI - Replace with your MongoDB Atlas connection string" -ForegroundColor Yellow
Write-Host "  2. JWT_ACCESS_SECRET - Generate a random secret (at least 32 characters)" -ForegroundColor Yellow
Write-Host "  3. JWT_REFRESH_SECRET - Generate another random secret (at least 32 characters)" -ForegroundColor Yellow
Write-Host "  4. TMDB_API_KEY - Get from https://www.themoviedb.org/settings/api" -ForegroundColor Yellow
