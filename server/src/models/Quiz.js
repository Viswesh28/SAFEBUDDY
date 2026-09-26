import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  prompt: String,
  options: [String],
  answerIndex: Number,
  explanation: String
}, { _id: false });

const quizSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true, index: true },
  lessonId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  xpReward: { type: Number, default: 30 },
  questions: [questionSchema]
}, { timestamps: true });

export default mongoose.models.Quiz || mongoose.model('Quiz', quizSchema);
