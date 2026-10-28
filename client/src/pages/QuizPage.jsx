import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

export default function QuizPage() {
  const { lessonId } = useParams(); const navigate = useNavigate(); const { token, setUser } = useAuth(); const [quiz, setQuiz] = useState(null); const [answers, setAnswers] = useState([]); const [step, setStep] = useState(0); const [result, setResult] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  useEffect(() => { api(`/quizzes/lesson/${lessonId}`, { token }).then(({ quiz: loadedQuiz }) => { setQuiz(loadedQuiz); setAnswers(Array(loadedQuiz.questions.length).fill(null)); }).catch((err) => setError(err.message)); }, [lessonId, token]);
  const choose = (choice) => setAnswers((current) => current.map((answer, index) => index === step ? choice : answer));
  const submit = async () => { setBusy(true); setError(''); try { const data = await api(`/quizzes/${quiz.id}/submit`, { method: 'POST', body: { answers }, token }); setResult(data); setUser(data.user); if ((data.levelUp || data.newBadges?.length) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) import('canvas-confetti').then(({ default: confetti }) => confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })); } catch (err) { setError(err.message); } finally { setBusy(false); } };
  if (error && !quiz) return <section className="error-card"><h2>Quiz unavailable</h2><p>{error}</p><Link to={`/learn/${lessonId}`} className="button">Back to lesson</Link></section>;
  if (!quiz) return <main className="loading-page"><span className="spinner" /> Loading your quiz…</main>;

  if (result) return <main className="quiz-result">
    <span className="result-icon" aria-hidden="true"><Icon name={result.passed ? 'award' : 'book'} size={32} /></span>
    <p className="eyebrow">Quiz complete</p>
    <h1>{result.passed ? 'Great thinking' : 'Keep learning'}</h1>
    <p className="lede">{result.passed ? `You answered ${result.correct} of ${result.total} questions correctly.` : `You answered ${result.correct} of ${result.total}. Review the lesson and try again any time.`}</p>
    <div className="score-orbit"><b>{result.score}%</b><span>score</span></div>
    <div className="reward-row">
      {result.xpBreakdown.participation > 0 && <span><Icon name="zap" size={14} /> +{result.xpBreakdown.participation} XP for trying</span>}
      {result.xpBreakdown.lessonBonus > 0 && <span><Icon name="zap" size={14} /> +{result.xpBreakdown.lessonBonus} XP for passing</span>}
      {result.xpEarned === 0 && <span>No new XP this time</span>}
      <span>Total XP: {result.user.xp}</span>
      {result.passed && <span><Icon name="check" size={14} /> Lesson progress saved</span>}
    </div>
    {(result.newBadges?.length > 0 || result.levelUp) && <section className="result-achievements" aria-label="New achievements">
      {result.newBadges?.map((badge) => <article className="result-achievement" key={badge.key}>
        <span className="result-achievement__icon" aria-hidden="true">{badge.icon || <Icon name="award" size={20} />}</span>
        <div><b>New badge!</b><p>{badge.title}</p></div>
      </article>)}
      {result.levelUp && <article className="result-achievement result-achievement--level">
        <span className="result-achievement__icon" aria-hidden="true">{result.levelUp.card.icon}</span>
        <div><b>Level up!</b><p>{result.levelUp.card.title}</p><Link to="/cards">See your collection <Icon name="arrowRight" size={14} /></Link></div>
      </article>}
    </section>}
    <div className="feedback-list" role="status" aria-live="polite" aria-label="Answer feedback">
      {result.feedback.map((feedback, index) => <article key={index} className={feedback.correct ? 'correct' : 'review'}>
        <span className="feedback-mark"><Icon name={feedback.correct ? 'check' : 'refresh'} size={15} /></span>
        <div><b>Question {index + 1}: {feedback.correct ? 'Correct' : 'Review this one'}</b><p>{feedback.explanation}</p></div>
      </article>)}
    </div>
    <div className="result-actions">
      <Link className="button" to="/learn">Keep exploring <Icon name="arrowRight" size={16} /></Link>
      <button className="secondary-button" onClick={() => navigate(`/learn/${lessonId}`)}>Review lesson</button>
    </div>
  </main>;

  const question = quiz.questions[step]; const canContinue = answers[step] !== null;
  return <main className="quiz-page">
    <Link to={`/learn/${lessonId}`} className="back-link"><Icon name="arrowLeft" size={15} /> Leave quiz</Link>
    <header>
      <p className="eyebrow">Quick check</p>
      <div className="quiz-title-row"><h1>{quiz.title}</h1><span className="xp-tag"><Icon name="zap" size={14} /> {quiz.xpReward} XP</span></div>
      <div className="quiz-progress" role="progressbar" aria-valuemin={1} aria-valuemax={quiz.questions.length} aria-valuenow={step + 1}><i style={{ width: `${((step + 1) / quiz.questions.length) * 100}%` }} /></div>
      <p className="muted">Question {step + 1} of {quiz.questions.length}</p>
    </header>
    <section className="question-card">
      <span className="question-number">Question {String(step + 1).padStart(2, '0')}</span>
      <h2>{question.prompt}</h2>
      <div className="answer-list">
        {question.options.map((option, index) => <button key={index} type="button" aria-pressed={answers[step] === index} className={answers[step] === index ? 'selected' : ''} onClick={() => choose(index)}>
          <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
          <span className="answer-text">{option}</span>
          {answers[step] === index && <Icon name="check" size={18} className="answer-check" />}
        </button>)}
      </div>
    </section>
    <p className="sr-only" aria-live="polite">{canContinue ? `Option ${String.fromCharCode(65 + answers[step])} selected.` : ''}</p>
    {error && <p className="form-error"><Icon name="alert" size={15} /> {error}</p>}
    <footer className="quiz-controls">
      <button className="secondary-button" onClick={() => setStep((current) => current - 1)} disabled={step === 0}><Icon name="arrowLeft" size={15} /> Back</button>
      {step < quiz.questions.length - 1
        ? <button className="button" disabled={!canContinue} onClick={() => setStep((current) => current + 1)}>Next question <Icon name="arrowRight" size={16} /></button>
        : <button className="button" disabled={!canContinue || busy} onClick={submit}>{busy ? 'Checking…' : 'See my result'} <Icon name="arrowRight" size={16} /></button>}
    </footer>
  </main>;
}
