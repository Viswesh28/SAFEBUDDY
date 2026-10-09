import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null); const [lessons, setLessons] = useState([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api('/progress/me', { token }), api('/lessons', { token })]).then(([progress, lessonData]) => { setData(progress); setLessons(lessonData.lessons); }).catch((err) => setError(err.message)); }, [token]);
  const next = useMemo(() => lessons.find((lesson) => !data?.user?.completedLessonIds.includes(lesson.id)) || lessons[0], [lessons, data]);
  if (error) return <section className="error-card"><h2>We couldn’t load your journey.</h2><p>{error}</p></section>;
  if (!data) return <main className="loading-page"><span className="spinner" /> Preparing your learning path…</main>;
  const completion = data.stats.totalLessons ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) : 0;
  return <>
    <section className="welcome-row"><div><span className="eyebrow">YOUR SAFE SPACE</span><h1>Hi, {user.name.split(' ')[0]}! <span>👋</span></h1><p>One small lesson today can build a stronger tomorrow.</p></div><div className="streak-card"><span>🔥</span><div><b>{data.user.streak || 0} day streak</b><small>Keep your spark going!</small></div></div></section>
    <section className="dashboard-grid"><article className="continue-card"><div className="continue-card__content"><span className="pill">{next ? `UP NEXT · ${next.category}` : 'ALL LESSONS COMPLETE'}</span><h2>{next?.title || 'Well done, learner!'}</h2><p>{next?.summary || 'You have finished every lesson. Try the safety games or revisit a lesson any time.'}</p>{next ? <Link className="button" to={`/learn/${next.id}`}>Continue learning <span>→</span></Link> : <Link className="button" to="/games">Play safety games <span>→</span></Link>}</div><div className="continue-card__art"><span>{next?.icon || '🏆'}</span><i>✦</i><i>✦</i></div></article>
      <article className="journey-card"><span className="eyebrow">YOUR JOURNEY</span><ProgressRing value={completion} size={112} stroke={10} label={`${completion}%`} /><b>{data.stats.completedLessons} of {data.stats.totalLessons} lessons</b><p>Every lesson makes you wiser.</p><Link to="/learn">View all lessons →</Link></article>
    </section>
    <section className="stat-grid"><article><span className="stat-icon stat-icon--yellow">⚡</span><div><b>{data.user.xp}</b><small>Total XP</small></div></article><article><span className="stat-icon stat-icon--pink">◉</span><div><b>{data.stats.averageScore}%</b><small>Quiz average</small></div></article><article><span className="stat-icon stat-icon--green">✦</span><div><b>{data.user.badges.length}</b><small>Badges earned</small></div></article><article><span className="stat-icon stat-icon--violet">🎮</span><div><b>{data.stats.gamesCompleted || 0}/{data.stats.totalGames || 0}</b><small>Games played</small></div></article></section>
    <section className="section-block"><div className="section-title"><div><span className="eyebrow">KEEP EXPLORING</span><h2>Pick up where you left off</h2></div><Link to="/learn">See all <span>→</span></Link></div><div className="mini-lesson-grid">{lessons.slice(0, 3).map((lesson) => { const done = data.user.completedLessonIds.includes(lesson.id); return <Link key={lesson.id} className="mini-lesson" to={`/learn/${lesson.id}`}><span className="mini-lesson__icon" style={{ background: `${lesson.color}18`, color: lesson.color }}>{lesson.icon}</span><div><span>{lesson.category} · {lesson.minutes} min</span><h3>{lesson.title}</h3><small className={done ? 'complete-label' : ''}>{done ? '✓ Completed' : 'Start lesson →'}</small></div></Link>; })}</div></section>
    <aside className="care-banner"><span>💛</span><div><b>Remember: you are never alone.</b><p>If a situation feels unsafe, confusing, or worrying, talk to a trusted adult. In an immediate emergency in India, call 112.</p></div><Link to="/learn/personal-safety">Safety tips →</Link></aside>
  </>;
}
