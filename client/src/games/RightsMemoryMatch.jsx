import { useMemo, useState } from 'react';
import Icon from '../components/Icon';
import pairs from './data/rightsMemoryMatch.json';

export default function RightsMemoryMatch({ onFinish }) {
  const cards = useMemo(() => pairs.flatMap((pair, index) => [{ id: `${index}-right`, pair: index, text: pair.right }, { id: `${index}-example`, pair: index, text: pair.example }]), []);
  const [open, setOpen] = useState([]); const [matched, setMatched] = useState([]); const [showPairs, setShowPairs] = useState(false); const [message, setMessage] = useState('Choose two cards to find a matching pair.');
  const flip = (card) => {
    if (open.includes(card.id) || matched.includes(card.pair) || open.length === 2) return;
    const next = [...open, card.id];
    if (next.length < 2) return setOpen(next);
    const first = cards.find((item) => item.id === next[0]);
    if (first.pair === card.pair) { const nextMatched = [...matched, card.pair]; setMatched(nextMatched); setOpen([]); setMessage('A match! You found a right and its everyday example.'); if (nextMatched.length === pairs.length) onFinish({ score: pairs.length, total: pairs.length }); } else { setOpen(next); setMessage('Let’s look at this together. These cards are not a pair.'); window.setTimeout(() => setOpen([]), 850); }
  };
  return <section className="game-board memory-match"><div className="game-progress"><span>{matched.length} of {pairs.length} pairs found</span><button type="button" className="secondary-button" onClick={() => setShowPairs((value) => !value)}>{showPairs ? 'Hide the pairs' : 'Show me the pairs'}</button></div>{showPairs && <ul className="pair-list">{pairs.map((pair) => <li key={pair.right}><b>{pair.right}:</b> {pair.example}</li>)}</ul>}<div className="memory-grid">{cards.map((card) => { const visible = showPairs || open.includes(card.id) || matched.includes(card.pair); return <button type="button" key={card.id} className={`memory-card ${visible ? 'is-open' : ''}`} aria-label={visible ? card.text : 'Hidden memory card'} onClick={() => flip(card)} disabled={matched.includes(card.pair)}>{visible ? card.text : <Icon name="star" size={20} />}</button>; })}</div><p className="game-message" role="status" aria-live="polite">{message}</p></section>;
}
