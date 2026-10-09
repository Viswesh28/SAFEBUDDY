import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import Icon from '../components/Icon';

export default function ProfilePage() {
  const { token, user } = useAuth(); const [data, setData] = useState(null); const [lessons, setLessons] = useState([]);
  useEffect(() => { Promise.all([api('/progress/me', { token }), api('/lessons', { token })]).then(([progress, lessonData]) => { setData(progress); setLessons(lessonData.lessons); }); }, [token]);
  const recent = useMemo(() => data?.attempts?.slice(0, 4) || [], [data]);
  if (!data) return <main className="loading-page"><span className="spinner" /> Opening your journey…</main>;
  const complete = data.stats.totalLessons ? Math.round(data.stats.completedLessons / data.stats.totalLessons * 100) : 0;
  return <>
    <section className="profile-hero">
      <span className="profile-avatar-large" aria-hidden="true">{user.avatar || user.name[0]}</span>
      <div>
        <p className="eyebrow">My journey</p>
        <h1>{user.name}</h1>
        <p className="lede">Learner profile</p>
      </div>
      <div className="profile-xp"><Icon name="zap" size={16} /><b>{data.user.xp}</b><small>Total XP</small></div>
    </section>

    <section className="profile-stats">
      <article><Icon name="flame" size={18} /><b>{data.user.streak}</b><small>Day streak</small></article>
      <article><Icon name="book" size={18} /><b>{data.stats.completedLessons}</b><small>Lessons done</small></article>
      <article><Icon name="target" size={18} /><b>{data.stats.averageScore}%</b><small>Quiz average</small></article>
      <article><Icon name="award" size={18} /><b>{data.user.badges.length}</b><small>Badges</small></article>
    </section>

    <section className="profile-grid">
      <article className="profile-card journey-overview">
        <p className="eyebrow">Progress</p>
        <h2>Progress so far</h2>
        <div className="journey-overview__body">
          <ProgressRing value={complete} size={120} stroke={9} />
          <div>
            <b>{data.stats.completedLessons} of {data.stats.totalLessons} lessons explored</b>
            <p>{data.stats.gamesCompleted || 0} of {data.stats.totalGames || 0} safety games played.</p>
            <div className="journey-links"><Link to="/learn">Explore lessons <Icon name="arrowRight" size={14} /></Link><Link to="/games">Play games <Icon name="arrowRight" size={14} /></Link></div>
          </div>
        </div>
      </article>
      <article className="profile-card">
        <p className="eyebrow">Badges</p>
        <h2>Your badges</h2>
        {data.user.badges.length
          ? <div className="badge-grid">{data.user.badges.map((badge) => <div key={badge.key} className="badge"><span className="badge__icon"><Icon name="award" size={18} /></span><small>{badge.title}</small></div>)}</div>
          : <p className="muted">Complete a lesson quiz to earn your first badge.</p>}
      </article>
    </section>

    <section className="section-block">
      <div className="section-title"><div><p className="eyebrow">Recent activity</p><h2>Your quiz results</h2></div></div>
      {recent.length
        ? <div className="activity-list">
          {recent.map((attempt) => {
            const lesson = lessons.find((item) => item.id === attempt.lessonId);
            const passed = attempt.score >= 60;
            return <article key={attempt.id}>
              <span className={passed ? 'activity-icon good' : 'activity-icon'}><Icon name={passed ? 'check' : 'refresh'} size={16} /></span>
              <div><b>{lesson?.title || 'Lesson quiz'}</b><small>{new Date(attempt.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {attempt.score}% score</small></div>
              <span className="activity-score">{passed ? 'Passed' : 'Try again'}</span>
            </article>;
          })}
        </div>
        : <div className="empty-inline"><Icon name="target" size={20} /><p>Your quiz results will appear here after your first quiz.</p></div>}
    </section>
  </>;
}
