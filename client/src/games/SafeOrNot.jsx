import { useState } from 'react';
import Icon from '../components/Icon';
import scenarios from './data/safeOrNot.json';

const choices = [
  { id: 'safe', label: 'Safe', tone: 'safe' },
  { id: 'unsafe', label: 'Not safe', tone: 'unsafe' },
  { id: 'ask', label: 'Ask a trusted adult', tone: 'ask' }
];

export default function SafeOrNot({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);

  const scenario = scenarios[index];
  const pick = (choice) => {
    if (picked) return;
    setPicked(choice);
    if (choice === scenario.answer) setScore((current) => current + 1);
  };
  const next = () => {
    if (index === scenarios.length - 1) return onFinish({ score, total: scenarios.length });
    setPicked(null);
    setIndex((current) => current + 1);
  };
  const correct = picked === scenario.answer;

  return <section className="game-board safe-or-not">
    <div className="game-progress"><span>Situation {index + 1} of {scenarios.length}</span><span>{score} correct</span></div>
    <div className="game-progress__bar"><i style={{ width: `${(index / scenarios.length) * 100}%` }} /></div>
    <article className="game-scenario"><span className="game-scenario__icon"><Icon name="bulb" size={22} /></span><p>{scenario.text}</p></article>
    <p className="game-prompt">What would you do?</p>
    <div className="game-choices">
      {choices.map((choice) => <button key={choice.id} type="button" aria-pressed={picked === choice.id} className={`game-choice ${picked === choice.id ? 'is-picked' : ''} ${picked && choice.id === scenario.answer ? 'is-answer' : ''}`} disabled={Boolean(picked)} onClick={() => pick(choice.id)}>
        <span className={`tone-dot tone-dot--${choice.tone}`} aria-hidden="true" />{choice.label}
        {picked && choice.id === scenario.answer && <span className="game-choice__result"><Icon name="check" size={15} /> Correct answer</span>}
        {picked === choice.id && !correct && <span className="game-choice__result"><Icon name="alert" size={15} /> Your answer</span>}
      </button>)}
    </div>
    {picked && <aside className={`game-feedback ${correct ? 'good' : 'review'}`} role="status" aria-live="polite">
      <b>{correct ? 'Great call' : 'Good to learn this one'}</b>
      <p>{scenario.explain}</p>
      <button className="button" onClick={next}>{index === scenarios.length - 1 ? 'See my score' : 'Next situation'} <Icon name="arrowRight" size={16} /></button>
    </aside>}
  </section>;
}
