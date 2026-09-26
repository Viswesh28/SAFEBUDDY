import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String, default: '📚' },
  color: { type: String, default: '#5B5CE2' },
  minutes: { type: Number, default: 5 },
  level: { type: String, enum: ['Starter', 'Explorer', 'Champion'], default: 'Starter' },
  order: { type: Number, default: 0 },
  sections: [{ heading: String, body: String, tip: String }],
  published: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Lesson || mongoose.model('Lesson', lessonSchema);
