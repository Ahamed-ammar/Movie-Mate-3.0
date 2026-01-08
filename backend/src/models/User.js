import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: function() {
      return this.role !== 'admin'; // Email not required for admin
    },
    unique: true,
    sparse: true, // Allow null values with unique index
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        // Skip validation if email is null (for admin users)
        if (!value || this.role === 'admin') {
          return true;
        }
        // Validate email format for regular users
        return /^\S+@\S+\.\S+$/.test(value);
      },
      message: 'Please provide a valid email'
    },
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    validate: {
      validator: function(value) {
        // Admin users can have shorter passwords (min 3), regular users need 6
        if (this.role === 'admin') {
          return value && value.length >= 3;
        }
        return value && value.length >= 6;
      },
      message: function(props) {
        if (this.role === 'admin') {
          return 'Password must be at least 3 characters for admin';
        }
        return 'Password must be at least 6 characters';
      }
    },
    select: false // Don't return password in queries by default
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  refreshToken: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Validate password length based on role before hashing
  if (this.isModified('password') && this.password) {
    const minLength = this.role === 'admin' ? 3 : 6;
    if (this.password.length < minLength) {
      return next(new Error(`Password must be at least ${minLength} characters${this.role === 'admin' ? ' for admin' : ''}`));
    }
  }
  
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
