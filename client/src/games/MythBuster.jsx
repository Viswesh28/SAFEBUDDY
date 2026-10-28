import { useState } from 'react';
import Icon from '../components/Icon';
import cards from './data/mythBuster.json';

const choices = [
  { id: true, label: 'True', tone: 'safe' },
  { id: false, label: 'False', tone: 'ask' }
];

export default function MythBuster({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const card = cards[index];

  const pick = (choice) => {
    if (picked !== null) return;
    setPicked(choice);
    if (choice === card.answer) setScore((current) => current + 1);
  };
  const next = () => {
    if (index === cards.length - 1) return onFinish({ score, total: cards.length });
    setPicked(null);
    setIndex((current) => current + 1);
  };
  const correct = picked === card.answer;

  return <section className="game-board myth-buster">
    <div className="game-progress"><span>Card {index + 1} of {cards.length}</span><span>{score} correct</span></div>
    <div className="game-progress__bar"><i style={{ width: `${(index / cards.length) * 100}%` }} /></div>
    <article className="game-scenario"><span className="game-scenario__icon"><Icon name="bulb" size={22} /></span><p>{card.statement}</p></article>
    <p className="game-prompt">Is this true or false?</p>
    <div className="game-choices">
      {choices.map((choice) => <button key={String(choice.id)} type="button" aria-pressed={picked === choice.id} className={`game-choice ${picked === choice.id ? 'is-picked' : ''} ${picked !== null && choice.id === card.answer ? 'is-answer' : ''}`} disabled={picked !== null} onClick={() => pick(choice.id)}>
        <span className={`tone-dot tone-dot--${choice.tone}`} aria-hidden="true" />{choice.label}
        {picked !== null && choice.id === card.answer && <span className="game-choice__result"><Icon name="check" size={15} /> Correct answer</span>}
        {picked === choice.id && !correct && <span className="game-choice__result"><Icon name="alert" size={15} /> Your answer</span>}
      </button>)}
    </div>
    {picked !== null && <aside className={`game-feedback ${correct ? 'good' : 'review'}`} role="status" aria-live="polite">
      <b>{correct ? 'Nice thinking' : "Let's look at this together"}</b>
      <p>{card.explain}</p>
      <button className="button" onClick={next}>{index === cards.length - 1 ? 'See my score' : 'Next card'} <Icon name="arrowRight" size={16} /></button>
    </aside>}
  </section>;
}
