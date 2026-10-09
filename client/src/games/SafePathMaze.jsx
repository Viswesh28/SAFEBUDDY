import { useEffect, useMemo, useState } from 'react';

// Legend: S start, H home, h trusted helper (collect), R risky spot (costs a heart), # wall, . safe path
// A route from S to H avoiding every R exists and collects every helper on the way.
const layout = [
  'S..R...',
  'R#.#.#.',
  '.#h..#.',
  '...#R#.',
  '##.h...',
  '.#R###.',
  '....h.H'
];
const rows = layout.length;
const cols = layout[0].length;
const totalHelpers = layout.join('').split('').filter((cell) => cell === 'h').length;
const start = { r: 0, c: 0 };
const home = { r: rows - 1, c: cols - 1 };
const cellAt = (r, c) => layout[r][c];

const tileIcon = { H: '🏠', h: '⭐', R: '⚠️', '#': '' };
const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1], w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1] };
const hintFor = { '#': 'A wall. Try another way.', R: 'Risky spot! Find another way, and ask a trusted adult when unsure.' };

export default function SafePathMaze({ onFinish }) {
  const [pos, setPos] = useState(start);
  const [collected, setCollected] = useState(() => new Set());
  const [hearts, setHearts] = useState(3);
  const [message, setMessage] = useState('Guide your buddy home. Collect ⭐ trusted helpers and avoid ⚠️ risky spots.');
  const [status, setStatus] = useState('playing');

  const restart = () => { setPos(start); setCollected(new Set()); setHearts(3); setStatus('playing'); setMessage('Let’s try again. Pick your path carefully.'); };

  const move = (dr, dc) => {
    if (status !== 'playing') return;
    const r = pos.r + dr;
    const c = pos.c + dc;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    const cell = cellAt(r, c);
    if (cell === '#') return setMessage(hintFor['#']);
    if (cell === 'R') {
      const remaining = hearts - 1;
      setHearts(remaining);
      if (remaining <= 0) { setStatus('lost'); return setMessage('Out of hearts. Every adventure starts again. You can try once more!'); }
      return setMessage(hintFor.R);
    }
    setPos({ r, c });
    if (cell === 'h') {
      const key = `${r},${c}`;
      if (!collected.has(key)) {
        const next = new Set(collected).add(key);
        setCollected(next);
        setMessage('Trusted helper found! ⭐ Remember: a trusted adult is always a good person to talk to.');
      }
    }
    if (cell === 'H') {
      setStatus('won');
      setMessage('You made it home safely!');
      onFinish({ score: collected.size, total: totalHelpers });
    }
  };

  useEffect(() => {
    const handler = (event) => {
      const step = moves[event.key];
      if (!step) return;
      event.preventDefault();
      move(...step);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const grid = useMemo(() => layout.map((row, r) => row.split('').map((cell, c) => ({ cell, r, c }))), []);

  return <section className="game-board safe-path">
    <div className="game-progress"><span>❤️ {hearts} hearts left</span><span>⭐ {collected.size} of {totalHelpers} helpers</span></div>
    <div className="maze" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="img" aria-label="Maze board">
      {grid.flat().map(({ cell, r, c }) => {
        const isBuddy = pos.r === r && pos.c === c;
        const isCollected = cell === 'h' && collected.has(`${r},${c}`);
        const className = ['maze__cell', cell === '#' ? 'is-wall' : '', cell === 'R' ? 'is-risk' : '', cell === 'h' ? 'is-helper' : '', cell === 'H' ? 'is-home' : '', isCollected ? 'is-collected' : ''].join(' ');
        return <div key={`${r}-${c}`} className={className}>
          {isBuddy ? <span className="maze__buddy">🧒</span> : (isCollected ? '✅' : tileIcon[cell] ?? '')}
        </div>;
      })}
    </div>
    <p className="game-message" aria-live="polite">{message}</p>
    {status === 'lost' ? <button className="button" onClick={restart}>Try again <span>↻</span></button> : <div className="dpad" aria-label="Move buddy">
      <span /><button aria-label="Up" onClick={() => move(-1, 0)}>▲</button><span />
      <button aria-label="Left" onClick={() => move(0, -1)}>◀</button><span />
      <button aria-label="Right" onClick={() => move(0, 1)}>▶</button>
      <span /><button aria-label="Down" onClick={() => move(1, 0)}>▼</button><span />
    </div>}
    <p className="game-hint">Use the arrow keys, WASD, or the buttons to move.</p>
  </section>;
}
