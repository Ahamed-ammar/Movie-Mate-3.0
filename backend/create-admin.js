// Script to create admin user
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('✓ Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ username: 'admin' }).select('+password');
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('   Updating admin user...');
      
      // Update admin user
      existingAdmin.password = '123'; // Set password (will be hashed by pre-save hook)
      existingAdmin.role = 'admin'; // Ensure role is set
      existingAdmin.email = null; // Remove email for admin
      // Mark password as modified to trigger hashing in pre-save hook
      existingAdmin.markModified('password');
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully!');
      console.log('   Username: admin');
      console.log('   Password: 123');
      console.log('   Role: admin');
      console.log('   Email: (none - admin users don\'t need email)');
      
      // Verify password works
      const testCompare = await existingAdmin.comparePassword('123');
      if (testCompare) {
        console.log('✓ Password verification test: PASSED');
      } else {
        console.log('✗ Password verification test: FAILED');
      }
      
      process.exit(0);
    }

    // Create admin user - set role first to bypass email validation
    const admin = new User({
      username: 'admin',
      password: '123',
      role: 'admin',
      email: null // No email required for admin
    });
    
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: 123');
    console.log('   Role: admin');
    console.log('   Email: (none - admin users don\'t need email)');
    
    // Verify password works
    const testCompare = await admin.comparePassword('123');
    if (testCompare) {
      console.log('✓ Password verification test: PASSED');
    } else {
      console.log('✗ Password verification test: FAILED');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('   Username "admin" already exists');
    }
    process.exit(1);
  }
};

createAdmin();
