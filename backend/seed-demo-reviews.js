// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import Movie from './src/models/Movie.js';
import Review from './src/models/Review.js';

// Demo reviews data
const demoReviews = [
  {
    movieTitle: 'Marty Supreme',
    movieYear: 2025,
    username: 'admin',
    ratingStars: 4.5,
    reviewText: 'M(arty) M(auser) W(illy) W(onka)',
    likes: 36124
  },
  {
    movieTitle: 'Stranger Things 5: The Finale',
    movieYear: 2025,
    username: 'admin',
    ratingStars: 1.5,
    reviewText: 'look how they massacred my boy',
    likes: 8608
  },
  {
    movieTitle: 'Avatar: Fire and Ash',
    movieYear: 2025,
    username: 'admin',
    ratingStars: 3.5,
    reviewText: 'Two gay dads fighting for their adopted son\'s custody',
    likes: 25792
  },
  {
    movieTitle: 'Marty Supreme',
    movieYear: 2025,
    username: 'admin',
    ratingStars: 5.0,
    reviewText: 'Tricks you into thinking it\'ll be a normal sports movie for 30 minutes before evolving into the most batshit, nightmarish, Safdie-esque Safdie comedy of errors to date. The third act of this might be the most exhilarated I\'ve been by a movie all decade.',
    likes: 45231
  },
  {
    movieTitle: 'The Dark Knight',
    movieYear: 2008,
    username: 'admin',
    ratingStars: 5.0,
    reviewText: 'A masterpiece of modern cinema. Heath Ledger\'s performance is absolutely phenomenal.',
    likes: 125000
  },
  {
    movieTitle: 'Inception',
    movieYear: 2010,
    username: 'admin',
    ratingStars: 4.5,
    reviewText: 'Mind-bending brilliance. Christopher Nolan at his finest.',
    likes: 98000
  },
  {
    movieTitle: 'Parasite',
    movieYear: 2019,
    username: 'admin',
    ratingStars: 5.0,
    reviewText: 'A perfect blend of dark comedy and social commentary. Bong Joon-ho is a genius.',
    likes: 87000
  },
  {
    movieTitle: 'Everything Everywhere All at Once',
    movieYear: 2022,
    username: 'admin',
    ratingStars: 5.0,
    reviewText: 'An absolute masterpiece that defies genre. Michelle Yeoh is incredible.',
    likes: 75000
  }
];

const seedDemoReviews = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Find admin user
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      console.error('Admin user not found. Please create admin user first.');
      process.exit(1);
    }

    console.log(`Found admin user: ${adminUser.username}`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const reviewData of demoReviews) {
      try {
        // Try to find movie by title and year
        let movie = await Movie.findOne({
          title: { $regex: new RegExp(reviewData.movieTitle, 'i') },
          releaseDate: { $regex: new RegExp(reviewData.movieYear.toString()) }
        });

        // If movie not found, try to find by title only
        if (!movie) {
          movie = await Movie.findOne({
            title: { $regex: new RegExp(reviewData.movieTitle, 'i') }
          });
        }

        if (!movie) {
          console.log(`⚠️  Movie "${reviewData.movieTitle}" not found. Skipping review.`);
          skippedCount++;
          continue;
        }

        // Check if review already exists
        const existingReview = await Review.findOne({
          userId: adminUser._id,
          movieId: movie._id
        });

        if (existingReview) {
          console.log(`✓ Review for "${reviewData.movieTitle}" already exists. Skipping.`);
          skippedCount++;
          continue;
        }

        // Create review
        const review = await Review.create({
          userId: adminUser._id,
          movieId: movie._id,
          ratingStars: reviewData.ratingStars,
          reviewText: reviewData.reviewText,
          visibility: 'public'
        });

        console.log(`✓ Created review for "${reviewData.movieTitle}" (${reviewData.ratingStars} stars)`);
        createdCount++;
      } catch (error) {
        console.error(`Error creating review for "${reviewData.movieTitle}":`, error.message);
        skippedCount++;
      }
    }

    console.log('\n✅ Demo reviews seeding completed!');
    console.log(`Created: ${createdCount}`);
    console.log(`Skipped: ${skippedCount}`);
    console.log(`Total: ${demoReviews.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding demo reviews:', error);
    process.exit(1);
  }
};

seedDemoReviews();
