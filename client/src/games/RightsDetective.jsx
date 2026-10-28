import { useState } from 'react';
import Icon from '../components/Icon';
import rounds from './data/rightsDetective.json';

export default function RightsDetective({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const round = rounds[index];

  const pick = (optionIndex) => {
    if (picked !== null) return;
    setPicked(optionIndex);
    if (round.options[optionIndex] === round.answer) setScore((current) => current + 1);
  };
  const next = () => {
    if (index === rounds.length - 1) return onFinish({ score, total: rounds.length });
    setPicked(null);
    setIndex((current) => current + 1);
  };
  const correct = picked !== null && round.options[picked] === round.answer;

  return <section className="game-board rights-detective">
    <div className="game-progress"><span>Story {index + 1} of {rounds.length}</span><span>{score} solved</span></div>
    <div className="game-progress__bar"><i style={{ width: `${(index / rounds.length) * 100}%` }} /></div>
    <article className="game-scenario"><span className="game-scenario__icon"><Icon name="scale" size={22} /></span><p>{round.story}</p></article>
    <p className="game-prompt">Which right is most important in this story?</p>
    <div className="game-choices game-choices--text">
      {round.options.map((option, optionIndex) => <button key={option} type="button" aria-pressed={picked === optionIndex} className={`game-choice ${picked === optionIndex ? 'is-picked' : ''} ${picked !== null && option === round.answer ? 'is-answer' : ''}`} disabled={picked !== null} onClick={() => pick(optionIndex)}>
        <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
        {picked !== null && option === round.answer && <span className="game-choice__result"><Icon name="check" size={15} /> Correct answer</span>}
        {picked === optionIndex && !correct && <span className="game-choice__result"><Icon name="alert" size={15} /> Your answer</span>}
      </button>)}
    </div>
    {picked !== null && <aside className={`game-feedback ${correct ? 'good' : 'review'}`} role="status" aria-live="polite">
      <b>{correct ? 'Case solved' : "Let's look at this together"}</b>
      <p>{round.explain}</p>
      <button className="button" onClick={next}>{index === rounds.length - 1 ? 'See my score' : 'Next story'} <Icon name="arrowRight" size={16} /></button>
    </aside>}
  </section>;
}
