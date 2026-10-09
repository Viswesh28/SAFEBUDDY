import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { gameComponents } from '../games';

export default function GamePage() {
  const { gameId } = useParams();
  const { token, setUser } = useAuth();
  const [game, setGame] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [playKey, setPlayKey] = useState(0);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const Component = gameComponents[gameId];

  useEffect(() => {
    setResult(null); setSaveError('');
    api('/games', { token }).then(({ games }) => {
      const found = games.find((item) => item.id === gameId);
      if (!found || !Component) setLoadError('That game could not be found.');
      else setGame(found);
    }).catch((err) => setLoadError(err.message));
  }, [gameId, token, Component]);

  const finish = async ({ score, total }) => {
    setSaving(true); setSaveError('');
    try {
      const data = await api(`/games/${gameId}/complete`, { method: 'POST', token, body: { score, total } });
      setUser(data.user);
      setResult(data);
      if (data.score / data.total >= 0.5) confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadError) return <section className="error-card"><h2>We couldn’t open that game.</h2><p>{loadError}</p><Link to="/games" className="button">Back to games</Link></section>;
  if (!game) return <main className="loading-page"><span className="spinner" /> Getting ready to play…</main>;

  const restart = () => { setResult(null); setPlayKey((key) => key + 1); };

  if (result) {
    const perfect = result.score === result.total;
    return <main className="quiz-result game-result">
      <span className="result-emoji">{perfect ? '🏆' : '🌟'}</span>
      <span className="eyebrow">{game.title.toUpperCase()}</span>
      <h1>{perfect ? 'Perfect play!' : 'Well played!'}</h1>
      <p>You scored {result.score} out of {result.total}.</p>
      <div className="reward-row">
        {result.firstCompletion ? <span>⚡ +{result.xpEarned} XP</span> : <span>Played again for practice</span>}
        <span>Total XP: {result.user.xp}</span>
      </div>
      {!result.firstCompletion && <p className="muted">You already earned XP for this game. Keep practising for the confidence it builds!</p>}
      {result.newBadges.length > 0 && <div className="badge-unlocked">{result.newBadges.map((badge) => <span key={badge.key}>{badge.icon} New badge: <b>{badge.title}</b></span>)}</div>}
      <div className="result-actions">
        <Link className="button" to="/games">More games <span>→</span></Link>
        <button className="secondary-button" onClick={restart}>Play again</button>
      </div>
    </main>;
  }

  return <article className="game-page">
    <Link to="/games" className="back-link">← All games</Link>
    <header className="game-page__head" style={{ '--game-color': game.color }}>
      <span className="game-card__icon">{game.icon}</span>
      <div><span className="eyebrow">SAFETY GAME · +{game.xpReward} XP FIRST TIME</span><h1>{game.title}</h1></div>
    </header>
    {saving && <p className="form-error">Saving your result…</p>}
    {saveError && <p className="form-error">⚠ {saveError}</p>}
    <Component key={playKey} onFinish={finish} />
  </article>;
}
