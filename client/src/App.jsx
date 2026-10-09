import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import LearnPage from './pages/LearnPage';
import LessonPage from './pages/LessonPage';
import QuizPage from './pages/QuizPage';
import GamesPage from './pages/GamesPage';
import GamePage from './pages/GamePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

const Shell = () => <ProtectedRoute><AppLayout /></ProtectedRoute>;
export default function App() {
  return <Routes><Route path="/" element={<LandingPage />} /><Route path="/signin" element={<AuthPage />} /><Route element={<Shell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/learn" element={<LearnPage />} /><Route path="/learn/:id" element={<LessonPage />} /><Route path="/quiz/:lessonId" element={<QuizPage />} /><Route path="/games" element={<GamesPage />} /><Route path="/games/:gameId" element={<GamePage />} /><Route path="/profile" element={<ProfilePage />} /><Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} /></Route><Route path="*" element={<Navigate to="/" replace />} /></Routes>;
}
