import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  key: String,
  title: String,
  icon: String,
  earnedAt: { type: Date, default: Date.now }
}, { _id: false });

const userSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 60 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['learner', 'admin'], default: 'learner' },
  avatar: { type: String, default: '🌟' },
  xp: { type: Number, default: 0 },
  streak: { type: Number, default: 0 },
  completedLessonIds: [{ type: String }],
  completedGameIds: [{ type: String }],
  badges: [badgeSchema],
  lastActiveAt: Date
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', userSchema);
