import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import ProgressRing from '../components/ProgressRing';
import Icon, { categoryIcon } from '../components/Icon';

export default function LearnPage() {
  const { token } = useAuth(); const [lessons, setLessons] = useState([]); const [progress, setProgress] = useState(null); const [active, setActive] = useState('All');
  useEffect(() => { Promise.all([api('/lessons', { token }), api('/progress/me', { token })]).then(([lessonData, progressData]) => { setLessons(lessonData.lessons); setProgress(progressData); }); }, [token]);
  if (!progress) return <main className="loading-page"><span className="spinner" /> Finding your next lesson…</main>;
  const categories = ['All', ...new Set(lessons.map((lesson) => lesson.category))];
  const filtered = active === 'All' ? lessons : lessons.filter((lesson) => lesson.category === active);
  const percent = lessons.length ? Math.round((progress.user.completedLessonIds.length / lessons.length) * 100) : 0;
  return <>
    <section className="page-heading learn-heading">
      <div>
        <p className="eyebrow">Lessons</p>
        <h1>Explore your rights</h1>
        <p className="lede">Pick a short lesson and go at your own pace.</p>
      </div>
      <div className="path-progress">
        <ProgressRing value={percent} size={64} stroke={7} />
        <div><b>{progress.user.completedLessonIds.length} of {lessons.length} complete</b><small>Your learning journey</small></div>
      </div>
    </section>

    <div className="filter-row" role="tablist" aria-label="Filter lessons by topic">
      {categories.map((category) => <button key={category} role="tab" aria-selected={active === category} onClick={() => setActive(category)} className={active === category ? 'filter active' : 'filter'}>{category}</button>)}
    </div>

    <section className="lesson-grid">
      {filtered.map((lesson, index) => {
        const complete = progress.user.completedLessonIds.includes(lesson.id);
        return <article className="lesson-card" key={lesson.id}>
          <div className="lesson-card__top" style={{ '--lesson-color': lesson.color }}>
            <span className="lesson-card__number">{String(index + 1).padStart(2, '0')}</span>
            <span className="lesson-card__icon"><Icon name={categoryIcon[lesson.category] || 'book'} size={22} /></span>
            {complete && <span className="lesson-card__done"><Icon name="check" size={13} /> Complete</span>}
          </div>
          <div className="lesson-card__body">
            <div className="lesson-meta"><span>{lesson.category}</span><span><Icon name="clock" size={13} /> {lesson.minutes} min</span></div>
            <h2>{lesson.title}</h2>
            <p>{lesson.summary}</p>
            <Link to={`/learn/${lesson.id}`} className="lesson-link">{complete ? 'Review lesson' : 'Start lesson'} <Icon name="arrowRight" size={14} /></Link>
          </div>
        </article>;
      })}
    </section>

    <aside className="learning-tip">
      <Icon name="bulb" size={20} />
      <div><b>Learning tip</b><p>There’s no race. Take time to think, ask questions, and talk to a trusted adult when you need to.</p></div>
    </aside>
  </>;
}
