import mongoose from 'mongoose';

const attemptSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  quizId: { type: String, required: true },
  lessonId: { type: String, required: true },
  score: Number,
  total: Number,
  answers: [Number]
}, { timestamps: true });

export default mongoose.models.Attempt || mongoose.model('Attempt', attemptSchema);
