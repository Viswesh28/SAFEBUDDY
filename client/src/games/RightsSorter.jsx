import { useState } from 'react';
import Icon from '../components/Icon';
import data from './data/rightsSorter.json';

export default function RightsSorter({ onFinish }) {
  const [selected, setSelected] = useState(null);
  const [sorted, setSorted] = useState({});
  const [message, setMessage] = useState('Choose a card, then choose the column where it belongs.');
  const place = (column) => {
    if (selected === null || sorted[selected] !== undefined) return;
    const card = data.cards[selected];
    const correct = card.column === column;
    const next = { ...sorted, [selected]: column };
    setSorted(next); setSelected(null);
    setMessage(correct ? 'Nice sorting! That card belongs there.' : `Let’s look at this together. “${card.text}” belongs in “${data.columns[card.column]}”.`);
    if (Object.keys(next).length === data.cards.length) onFinish({ score: Object.entries(next).filter(([index, value]) => data.cards[index].column === value).length, total: data.cards.length });
  };
  return <section className="game-board rights-sorter">
    <div className="game-progress"><span>{Object.keys(sorted).length} of {data.cards.length} cards sorted</span><span>Choose, then place</span></div>
    <div className="sorter-cards" aria-label="Cards to sort">
      {data.cards.map((card, index) => sorted[index] === undefined && <button type="button" key={card.text} aria-pressed={selected === index} className={`game-choice ${selected === index ? 'is-picked' : ''}`} onClick={() => setSelected(index)}>{card.text}</button>)}
    </div>
    <div className="sorter-columns" aria-label="Sorting columns">
      {data.columns.map((column, index) => <button type="button" key={column} className="sorter-column" onClick={() => place(index)} disabled={selected === null}>{column}<span>{Object.values(sorted).filter((value) => value === index).length} cards</span></button>)}
    </div>
    <p className="game-message" role="status" aria-live="polite">{message}</p>
  </section>;
}
