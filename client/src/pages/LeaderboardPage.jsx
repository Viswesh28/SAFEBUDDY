import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';

const medal = ['🥇', '🥈', '🥉'];
export default function LeaderboardPage() {
  const { token, user } = useAuth(); const [learners, setLearners] = useState(null);
  useEffect(() => { api('/progress/leaderboard', { token }).then(({ learners: list }) => setLearners(list)); }, [token]);
  if (!learners) return <main className="loading-page"><span className="spinner" /> Gathering the good vibes…</main>;
  const rank = learners.findIndex((learner) => learner.id === user.id) + 1;
  return <><section className="page-heading leaderboard-heading"><div><span className="eyebrow">CELEBRATE GROWTH</span><h1>Learning leaders <span>🏆</span></h1><p>Every learner here is building confidence, one step at a time.</p></div><div className="leaderboard-illustration"><span>✦</span><span>🏆</span><span>✦</span></div></section><aside className="leaderboard-note"><span>💡</span><p>This board celebrates effort, not competition. Your best learning is at <b>your own pace.</b></p></aside><section className="podium">{learners.slice(0, 3).map((learner, index) => <article key={learner.id} className={`podium-card podium-card--${index + 1}`}><span className="podium-medal">{medal[index]}</span><span className="podium-avatar">{learner.avatar}</span><b>{learner.name.split(' ')[0]}</b><small>{learner.xp} XP</small><i>{index + 1}</i></article>)}</section><section className="rank-list"><div className="rank-list__head"><span>Rank</span><span>Learner</span><span>XP</span><span>Badges</span></div>{learners.map((learner, index) => <article className={learner.id === user.id ? 'rank-row is-you' : 'rank-row'} key={learner.id}><span className="rank-number">{index + 1}</span><div className="rank-user"><span className="avatar">{learner.avatar}</span><div><b>{learner.name}{learner.id === user.id && <em>You</em>}</b><small>{learner.completedLessonIds.length} lessons explored</small></div></div><b className="rank-xp">⚡ {learner.xp}</b><span className="rank-badges">{learner.badges.slice(0, 3).map((badge) => badge.icon).join(' ') || '—'}</span></article>)}</section>{rank > 0 && <aside className="your-rank"><span>🌟</span><p>You’re currently <b>#{rank}</b>. Keep showing up for your learning journey!</p></aside>}</>;
}
