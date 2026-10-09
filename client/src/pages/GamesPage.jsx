import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { YouTubeEmbeds } from '../components/SafetyMedia';
import { playSoundVideos } from '../utils/safetyMedia';

export default function GamesPage() {
  const { token } = useAuth();
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/games', { token }).then(({ games: list }) => setGames(list)).catch((err) => setError(err.message));
  }, [token]);

  if (error) return <section className="error-card"><h2>Games are unavailable right now.</h2><p>{error}</p></section>;
  if (!games) return <main className="loading-page"><span className="spinner" /> Getting the games ready…</main>;

  const finished = games.filter((game) => game.completed).length;
  return <>
    <section className="page-heading games-heading">
      <div>
        <span className="eyebrow">PLAY & LEARN</span>
        <h1>Safety games</h1>
        <p>Practise safe choices in fun, low-pressure games. There are no wrong answers to fear, only things to learn.</p>
      </div>
      <div className="path-progress"><div><b>{finished}/{games.length} played</b><small>Each game gives XP the first time you finish it</small></div></div>
    </section>

    <section className="game-grid">
      {games.map((game) => <Link key={game.id} to={`/games/${game.id}`} className="game-card" style={{ '--game-color': game.color }}>
        <div className="game-card__top"><span className="game-card__icon">{game.icon}</span>{game.completed ? <span className="game-card__done">✓ Played</span> : <span className="game-card__xp">⚡ +{game.xpReward} XP</span>}</div>
        <div className="game-card__body">
          <div className="lesson-meta"><span>◷ {game.minutes} min</span><span>{game.completed ? 'Play again for practice' : 'New'}</span></div>
          <h2>{game.title}</h2>
          <p>{game.description}</p>
          <span className="lesson-link">{game.completed ? 'Play again' : 'Play now'} <span>→</span></span>
        </div>
      </Link>)}
    </section>

    <div className="safety-sound"><YouTubeEmbeds videos={playSoundVideos} heading="Sound and songs from YouTube" note="Songs and stories from YouTube channels, shown in YouTube’s player. Listen with a trusted adult." /></div>

    <aside className="learning-tip"><span>💡</span><div><b>Remember</b><p>In a real emergency in India, call <b>112</b>. For someone to talk to at any time, call <b>CHILDLINE 1098</b> (free, 24 hours).</p></div></aside>
    <p className="credits-note">Built with open-source tools (React, Vite, Express, SQLite, canvas-confetti). The games are original SafeBuddy content.</p>
  </>;
}
