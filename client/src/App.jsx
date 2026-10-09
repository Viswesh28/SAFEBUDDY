import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';

// Signed-in screens load on demand, so the first visit only downloads what it shows.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const LessonPage = lazy(() => import('./pages/LessonPage'));
const QuizPage = lazy(() => import('./pages/QuizPage'));
const GamesPage = lazy(() => import('./pages/GamesPage'));
const GamePage = lazy(() => import('./pages/GamePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

const Shell = () => <ProtectedRoute><AppLayout /></ProtectedRoute>;

export default function App() {
  return <Suspense fallback={<main className="loading-page"><span className="spinner" /> Loading…</main>}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<AuthPage />} />
      <Route element={<Shell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/learn/:id" element={<LessonPage />} />
        <Route path="/quiz/:lessonId" element={<QuizPage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/games/:gameId" element={<GamePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Suspense>;
}
