import { useState } from 'react';
import Icon from '../components/Icon';

// Original scenarios written for children aged 8 to 14, reflecting common child-safety guidance.
const scenarios = [
  { text: 'A stranger you met online asks for your school name and where you live.', answer: 'unsafe', explain: 'Never share your school or home address with someone you only know online. Tell a trusted adult.' },
  { text: 'A grown-up you know well will pick you up from school today, and your parent has already said yes.', answer: 'safe', explain: 'A known adult, with a parent’s permission, is a planned and safe arrangement.' },
  { text: 'Someone you do not know offers you sweets and asks you to come and see their puppy.', answer: 'unsafe', explain: 'Never go anywhere with a stranger or leave your place without telling a trusted adult.' },
  { text: 'A friend asks you to keep a secret that makes you feel scared or uncomfortable.', answer: 'ask', explain: 'Secrets that make you feel unsafe should always be shared with a trusted adult, even if you promised.' },
  { text: 'A message says you won a free prize and asks for your password to claim it.', answer: 'unsafe', explain: 'Real companies and games never need your password. Do not share it, and show the message to a parent.' },
  { text: 'You feel unwell at school and are not sure whom to tell.', answer: 'ask', explain: 'Tell your class teacher or the school nurse straight away. Asking for help is a strong step.' }
];

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
      {choices.map((choice) => <button key={choice.id} className={`game-choice ${picked === choice.id ? 'is-picked' : ''} ${picked && choice.id === scenario.answer ? 'is-answer' : ''}`} disabled={Boolean(picked)} onClick={() => pick(choice.id)}>
        <span className={`tone-dot tone-dot--${choice.tone}`} aria-hidden="true" />{choice.label}
      </button>)}
    </div>
    {picked && <aside className={`game-feedback ${correct ? 'good' : 'review'}`}>
      <b>{correct ? 'Great call' : 'Good to learn this one'}</b>
      <p>{scenario.explain}</p>
      <button className="button" onClick={next}>{index === scenarios.length - 1 ? 'See my score' : 'Next situation'} <Icon name="arrowRight" size={16} /></button>
    </aside>}
  </section>;
}
