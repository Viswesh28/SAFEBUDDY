import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Lesson from '../models/Lesson.js';
import Quiz from '../models/Quiz.js';
import Attempt from '../models/Attempt.js';
import { lessons, quizzes, starterUsers } from './seedData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoPath = path.resolve(__dirname, '../../data/demo-db.json');
let mode = 'json';
let db = null;

const makeId = () => crypto.randomUUID();
const clone = (value) => JSON.parse(JSON.stringify(value));
const withoutPassword = (user) => {
  if (!user) return null;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
const mongoPlain = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject ? doc.toObject() : doc;
  const { externalId, _id, __v, ...rest } = plain;
  return { id: externalId, ...rest };
};
const toMongo = ({ id, ...value }) => ({ externalId: id || makeId(), ...value });

async function buildDefaultDb() {
  const users = [];
  for (const person of starterUsers) {
    const password = person.role === 'admin' ? 'Admin@123' : 'Learn@123';
    users.push({ ...person, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  return { users, lessons: clone(lessons), quizzes: clone(quizzes), attempts: [] };
}

async function persist() {
  if (mode === 'json') await fs.writeFile(demoPath, JSON.stringify(db, null, 2));
}

export async function initialiseRepository() {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
      mode = 'mongo';
      await seedMongoIfEmpty();
      console.log('Connected to MongoDB.');
      return mode;
    } catch (error) {
      console.warn(`MongoDB unavailable (${error.message}). Using local demo store instead.`);
    }
  }
  mode = 'json';
  try {
    db = JSON.parse(await fs.readFile(demoPath, 'utf8'));
  } catch {
    db = await buildDefaultDb();
    await persist();
  }
  console.log('Using local JSON demo store. Set MONGO_URI to use MongoDB.');
  return mode;
}

async function seedMongoIfEmpty() {
  if (await Lesson.countDocuments()) return;
  const seededUsers = [];
  for (const person of starterUsers) {
    const password = person.role === 'admin' ? 'Admin@123' : 'Learn@123';
    seededUsers.push(toMongo({ ...person, passwordHash: await bcrypt.hash(password, 10) }));
  }
  await Promise.all([
    User.insertMany(seededUsers),
    Lesson.insertMany(lessons.map(toMongo)),
    Quiz.insertMany(quizzes.map(toMongo))
  ]);
  console.log('Seeded MongoDB with SafeBuddy demo content.');
}

export const repositoryMode = () => mode;

export async function findUserByEmail(email) {
  if (mode === 'mongo') return mongoPlain(await User.findOne({ email: email.toLowerCase() }));
  return clone(db.users.find((user) => user.email === email.toLowerCase()) || null);
}

export async function findUserById(id) {
  if (mode === 'mongo') return mongoPlain(await User.findOne({ externalId: id }));
  return clone(db.users.find((user) => user.id === id) || null);
}

export async function createUser({ name, email, passwordHash, avatar = '🌟', role = 'learner' }) {
  const user = { id: makeId(), name, email: email.toLowerCase(), passwordHash, avatar, role, xp: 0, streak: 0, completedLessonIds: [], badges: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  if (mode === 'mongo') return mongoPlain(await User.create(toMongo(user)));
  db.users.push(user);
  await persist();
  return clone(user);
}

export async function updateUser(id, updates) {
  if (mode === 'mongo') return mongoPlain(await User.findOneAndUpdate({ externalId: id }, { $set: updates }, { new: true }));
  const index = db.users.findIndex((user) => user.id === id);
  if (index < 0) return null;
  db.users[index] = { ...db.users[index], ...updates, updatedAt: new Date().toISOString() };
  await persist();
  return clone(db.users[index]);
}

export async function allLessons({ includeUnpublished = false } = {}) {
  if (mode === 'mongo') {
    const query = includeUnpublished ? {} : { published: true };
    return (await Lesson.find(query).sort({ order: 1 })).map(mongoPlain);
  }
  return clone(db.lessons.filter((lesson) => includeUnpublished || lesson.published !== false).sort((a, b) => a.order - b.order));
}

export async function lessonById(id) {
  if (mode === 'mongo') return mongoPlain(await Lesson.findOne({ externalId: id }));
  return clone(db.lessons.find((lesson) => lesson.id === id) || null);
}

export async function createLesson(payload) {
  const lesson = { id: makeId(), published: true, order: (await allLessons({ includeUnpublished: true })).length + 1, ...payload };
  if (mode === 'mongo') return mongoPlain(await Lesson.create(toMongo(lesson)));
  db.lessons.push(lesson);
  await persist();
  return clone(lesson);
}

export async function updateLesson(id, updates) {
  if (mode === 'mongo') return mongoPlain(await Lesson.findOneAndUpdate({ externalId: id }, { $set: updates }, { new: true }));
  const index = db.lessons.findIndex((lesson) => lesson.id === id);
  if (index < 0) return null;
  db.lessons[index] = { ...db.lessons[index], ...updates };
  await persist();
  return clone(db.lessons[index]);
}

export async function quizByLessonId(lessonId) {
  if (mode === 'mongo') return mongoPlain(await Quiz.findOne({ lessonId }));
  return clone(db.quizzes.find((quiz) => quiz.lessonId === lessonId) || null);
}

export async function quizById(id) {
  if (mode === 'mongo') return mongoPlain(await Quiz.findOne({ externalId: id }));
  return clone(db.quizzes.find((quiz) => quiz.id === id) || null);
}

export async function createQuiz(payload) {
  const quiz = { id: makeId(), xpReward: 30, ...payload };
  if (mode === 'mongo') return mongoPlain(await Quiz.create(toMongo(quiz)));
  db.quizzes.push(quiz);
  await persist();
  return clone(quiz);
}

export async function attemptsForUser(userId) {
  if (mode === 'mongo') return (await Attempt.find({ userId }).sort({ createdAt: -1 })).map((doc) => ({ id: doc._id.toString(), ...doc.toObject(), _id: undefined, __v: undefined }));
  return clone(db.attempts.filter((attempt) => attempt.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

export async function saveAttempt(attempt) {
  const record = { id: makeId(), ...attempt, createdAt: new Date().toISOString() };
  if (mode === 'mongo') {
    const created = await Attempt.create(record);
    return { id: created._id.toString(), ...created.toObject() };
  }
  db.attempts.push(record);
  await persist();
  return clone(record);
}

export async function leaderboard() {
  if (mode === 'mongo') return (await User.find({ role: 'learner' }).sort({ xp: -1, name: 1 }).limit(20)).map(mongoPlain).map(withoutPassword);
  return clone(db.users.filter((user) => user.role === 'learner').sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name)).slice(0, 20).map(withoutPassword));
}

export { withoutPassword };
