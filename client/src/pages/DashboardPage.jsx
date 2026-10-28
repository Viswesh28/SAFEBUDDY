import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Icon, { categoryIcon } from '../components/Icon';

export default function DashboardPage() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [games, setGames] = useState([]);
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/progress/me', { token }), api('/lessons', { token }), api('/games', { token }), api('/collection', { token })])
      .then(([progress, lessonData, gameData, collectionData]) => {
        setData(progress);
        setLessons(lessonData.lessons);
        setGames(gameData.games);
        setCollection(collectionData);
      })
      .catch((err) => setError(err.message));
  }, [token]);
  const tryNext = useMemo(() => {
    const lesson = lessons.find((item) => !data?.user?.completedLessonIds.includes(item.id));
    if (lesson) return { title: lesson.title, description: lesson.summary, to: `/learn/${lesson.id}`, icon: categoryIcon[lesson.category] || 'book', label: `Lesson · ${lesson.category}` };
    const game = games.find((item) => !item.completed);
    if (game) return { title: game.title, description: game.description, to: `/games/${game.id}`, icon: 'game', label: 'Safety game' };
    return null;
  }, [lessons, games, data]);
  if (error) return <section className="error-card"><h2>We couldn’t load your journey.</h2><p>{error}</p></section>;
  if (!data || !collection) return <main className="loading-page"><span className="spinner" /> Preparing your learning path…</main>;
  const completion = data.stats.totalLessons ? Math.round((data.stats.completedLessons / data.stats.totalLessons) * 100) : 0;
  const earnedBadges = collection.badges.filter((badge) => badge.earned).length;
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
      <article className="try-next-card">
        <div className="try-next-card__content">
          <span className="pill">{tryNext?.label || 'You did it!'}</span>
          <h2>Try this next</h2>
          <h3>{tryNext?.title || 'All caught up'}</h3>
          <p>{tryNext?.description || 'You have completed every lesson and game. Revisit any activity whenever you like.'}</p>
          <Link className="button" to={tryNext?.to || '/games'}>{tryNext ? 'Start now' : 'Explore games'} <Icon name="arrowRight" size={16} /></Link>
        </div>
        <div className="try-next-card__art" aria-hidden="true"><Icon name={tryNext?.icon || 'check'} size={48} /></div>
      </article>
      <Link to="/cards" className="my-collection-card">
        <div className="my-collection-card__heading"><span className="stat-icon"><Icon name="award" size={19} /></span><div><span className="eyebrow">My Collection</span><h2>{collection.level.icon} {collection.level.title}</h2></div></div>
        <div className="my-collection-card__progress-label"><b>{data.user.xp} XP</b><span>{collection.level.xpToNext ? `${collection.level.xpToNext} XP to go` : 'Top level reached'}</span></div>
        <div className="my-collection-card__progress" role="progressbar" aria-label="Progress to next level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={collection.level.percent}><span style={{ width: `${collection.level.percent}%` }} /></div>
        <div className="my-collection-card__footer"><span>{earnedBadges} of {collection.badges.length} badges</span><span className="text-action">View collection <Icon name="arrowRight" size={14} /></span></div>
      </Link>
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
