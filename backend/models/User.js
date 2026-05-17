const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,   // allows null (phone/OAuth users may have no email)
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      minlength: 6,
      // null for OAuth users
    },
    googleId:   { type: String },
    twitterId:  { type: String },
    provider: {
      type: String,
      enum: ['local', 'google', 'twitter', 'phone'],
      default: 'local',
    },

    // Profile
    avatar:         { type: String, default: '' },
    college:        { type: String, default: '' },
    branch:         { type: String, default: '' },
    year:           { type: String, default: '' },
    targetRole:     { type: String, default: '' },

    // CV & Skills
    cvPath:         { type: String, default: '' },
    skills:         [{ type: String }],

    // Gamification
 // Gamification
    placementScore: { type: Number, default: 0 },

    streak: {
      type: Number,
      default: 0,
    },

    badges: [{ type: String }],

    lastActive: {
      type: Date,
      default: Date.now,
    },

    totalPractices: {
      type: Number,
      default: 0,
    },

    aptitudeTestsTaken: {
      type: Number,
      default: 0,
    },

    interviewsTaken: {
      type: Number,
      default: 0,
 },
  },
  { timestamps: true }
);

// ── Hash password before save ──────────────────────────────
UserSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare password ─────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);