import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import Icon, { categoryIcon } from '../components/Icon';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null); const [lessons, setLessons] = useState([]); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api('/progress/me', { token }), api('/lessons', { token })]).then(([progress, lessonData]) => { setData(progress); setLessons(lessonData.lessons); }).catch((err) => setError(err.message)); }, [token]);
  const next = useMemo(() => lessons.find((lesson) => !data?.user?.completedLessonIds.includes(lesson.id)) || lessons[0], [lessons, data]);
  if (error) return <section className="error-card"><h2>We couldn’t load your journey.</h2><p>{error}</p></section>;
  if (!data) return <main className="loading-page"><span className="spinner" /> Preparing your learning path…</main>;
  const completion = data.stats.totalLessons ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) : 0;
  const nextIcon = categoryIcon[next?.category] || 'book';
  return <>
    <section className="welcome-row">
      <div>
        <p className="eyebrow">Dashboard</p>
        <h1>Hi, {user.name.split(' ')[0]}</h1>
        <p className="lede">One small lesson today can build a stronger tomorrow.</p>
      </div>
      <div className="streak-card">
        <Icon name="flame" size={20} />
        <div><b>{data.user.streak || 0} day streak</b><small>Come back tomorrow to keep it going</small></div>
      </div>
    </section>

    <section className="dashboard-grid">
      <article className="continue-card">
        <div className="continue-card__content">
          <span className="pill">{next ? `Up next · ${next.category}` : 'All lessons complete'}</span>
          <h2>{next?.title || 'Well done, learner'}</h2>
          <p>{next?.summary || 'You have finished every lesson. Try the safety games or revisit a lesson any time.'}</p>
          {next
            ? <Link className="button" to={`/learn/${next.id}`}>Continue learning <Icon name="arrowRight" size={16} /></Link>
            : <Link className="button" to="/games">Play safety games <Icon name="arrowRight" size={16} /></Link>}
        </div>
        <div className="continue-card__art" aria-hidden="true"><Icon name={nextIcon} size={56} /></div>
      </article>
      <article className="journey-card">
        <p className="eyebrow">Your journey</p>
        <ProgressRing value={completion} size={112} stroke={8} label={`${completion}%`} />
        <b>{data.stats.completedLessons} of {data.stats.totalLessons} lessons</b>
        <p>Keep going at your own pace.</p>
        <Link to="/learn" className="text-action">View all lessons <Icon name="arrowRight" size={14} /></Link>
      </article>
    </section>

    <section className="stat-grid">
      <article><span className="stat-icon"><Icon name="zap" size={18} /></span><div><b>{data.user.xp}</b><small>Total XP</small></div></article>
      <article><span className="stat-icon"><Icon name="target" size={18} /></span><div><b>{data.stats.averageScore}%</b><small>Quiz average</small></div></article>
      <article><span className="stat-icon"><Icon name="award" size={18} /></span><div><b>{data.user.badges.length}</b><small>Badges earned</small></div></article>
      <article><span className="stat-icon"><Icon name="game" size={18} /></span><div><b>{data.stats.gamesCompleted || 0}/{data.stats.totalGames || 0}</b><small>Games played</small></div></article>
    </section>

    <section className="section-block">
      <div className="section-title">
        <div>
          <p className="eyebrow">Keep exploring</p>
          <h2>Pick up where you left off</h2>
        </div>
        <Link to="/learn" className="text-action">See all <Icon name="arrowRight" size={14} /></Link>
      </div>
      <div className="mini-lesson-grid">
        {lessons.slice(0, 3).map((lesson) => {
          const done = data.user.completedLessonIds.includes(lesson.id);
          return <Link key={lesson.id} className="mini-lesson" to={`/learn/${lesson.id}`}>
            <span className="mini-lesson__icon"><Icon name={categoryIcon[lesson.category] || 'book'} size={18} /></span>
            <div>
              <span className="mini-lesson__meta">{lesson.category} · {lesson.minutes} min</span>
              <h3>{lesson.title}</h3>
              <small className={done ? 'complete-label' : 'mini-lesson__cta'}>{done ? <><Icon name="check" size={14} /> Completed</> : <>Start lesson <Icon name="arrowRight" size={13} /></>}</small>
            </div>
          </Link>;
        })}
      </div>
    </section>

    <aside className="care-banner">
      <Icon name="heart" size={20} />
      <div>
        <b>You are never alone.</b>
        <p>If a situation feels unsafe, confusing, or worrying, talk to a trusted adult. In an immediate emergency in India, call 112.</p>
      </div>
      <Link to="/learn/personal-safety" className="text-action">Safety tips <Icon name="arrowRight" size={14} /></Link>
    </aside>
  </>;
}
