import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { SafetyAudio, YouTubeEmbeds } from '../components/SafetyMedia';
import { lessonMedia } from '../utils/safetyMedia';
import Icon, { categoryIcon } from '../components/Icon';

export default function LessonPage() {
  const { id } = useParams(); const { token } = useAuth(); const [lesson, setLesson] = useState(null); const [completed, setCompleted] = useState(false); const [open, setOpen] = useState(0); const [error, setError] = useState('');
  useEffect(() => { Promise.all([api(`/lessons/${id}`, { token }), api('/progress/me', { token })]).then(([lessonData, progress]) => { setLesson(lessonData.lesson); setCompleted(progress.user.completedLessonIds.includes(id)); }).catch((err) => setError(err.message)); }, [id, token]);
  if (error) return <section className="error-card"><h2>That lesson is unavailable.</h2><p>{error}</p><Link to="/learn" className="button">Back to lessons</Link></section>;
  if (!lesson) return <main className="loading-page"><span className="spinner" /> Opening your lesson…</main>;
  return <article className="lesson-page">
    <Link to="/learn" className="back-link"><Icon name="arrowLeft" size={15} /> All lessons</Link>
    <header className="lesson-hero">
      <div>
        <p className="eyebrow">{lesson.category} · {lesson.level}</p>
        <h1>{lesson.title}</h1>
        <p className="lede">{lesson.summary}</p>
        <div className="lesson-hero__meta">
          <span><Icon name="clock" size={14} /> {lesson.minutes} min read</span>
          <span>{completed ? <><Icon name="check" size={14} /> Completed</> : 'Read, then take the quiz'}</span>
        </div>
      </div>
      <span className="lesson-hero__icon" aria-hidden="true"><Icon name={categoryIcon[lesson.category] || 'book'} size={40} /></span>
    </header>

    <SafetyAudio clips={lessonMedia[id]?.clips || []} />

    <div className="lesson-sections">
      {lesson.sections.map((section, index) => <article className={`lesson-section ${open === index ? 'open' : ''}`} key={`${index}-${section.heading}`}>
        <button onClick={() => setOpen(open === index ? -1 : index)} aria-expanded={open === index}>
          <span className="section-count">{String(index + 1).padStart(2, '0')}</span>
          <span><b>{section.heading}</b><small>{open === index ? 'Close' : 'Read'}</small></span>
          <Icon name={open === index ? 'arrowDown' : 'arrowRight'} size={16} className="section-chevron" />
        </button>
        {open === index && <div className="lesson-section__content">
          <p>{section.body}</p>
          {section.tip && <aside><Icon name="bulb" size={18} /><div><b>Tip</b><p>{section.tip}</p></div></aside>}
        </div>}
      </article>)}
    </div>

    <YouTubeEmbeds videos={lessonMedia[id]?.videos || []} heading="Videos for this lesson" />

    <section className="lesson-quiz-cta">
      <div>
        <h2>Check what you remember</h2>
        <p>A few short questions. You can retake the quiz any time.</p>
      </div>
      <Link className="button" to={`/quiz/${id}`}>{completed ? 'Retake quiz' : 'Start the quiz'} <Icon name="arrowRight" size={16} /></Link>
    </section>

    <aside className="lesson-disclaimer">SafeBuddy is for learning and reflection. For advice about a real situation, talk to a trusted adult or a qualified support service.</aside>
  </article>;
}
