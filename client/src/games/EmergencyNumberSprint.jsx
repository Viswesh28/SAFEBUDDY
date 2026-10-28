import { useState } from 'react';
import Icon from '../components/Icon';
import rounds from './data/emergencyNumberSprint.json';

const choices = ['112', '1098', '1930', '14416', 'A trusted adult'];
const help = { 112: '112 is for emergencies needing urgent help.', 1098: '1098 is CHILDLINE support for children.', 1930: '1930 helps report cyber financial fraud.', 14416: '14416 is Tele-MANAS mental-health support.', 'A trusted adult': 'A trusted adult can help make a safe next step.' };
export default function EmergencyNumberSprint({ onFinish }) {
  const [index, setIndex] = useState(0); const [picked, setPicked] = useState(null); const [score, setScore] = useState(0); const round = rounds[index]; const correct = picked === round.answer;
  const pick = (choice) => { if (picked) return; setPicked(choice); if (choice === round.answer) setScore((value) => value + 1); };
  const next = () => { if (index === rounds.length - 1) return onFinish({ score, total: rounds.length }); setIndex((value) => value + 1); setPicked(null); };
  return <section className="game-board emergency-sprint"><div className="game-progress"><span>Situation {index + 1} of {rounds.length}</span><span>{score} matched</span></div><article className="game-scenario"><span className="game-scenario__icon"><Icon name="message" size={22} /></span><p>{round.situation}</p></article><p className="game-prompt">Who can help?</p><div className="game-choices game-choices--text">{choices.map((choice) => <button type="button" key={choice} disabled={picked !== null} className={`game-choice ${picked === choice ? 'is-picked' : ''} ${picked && choice === round.answer ? 'is-answer' : ''}`} onClick={() => pick(choice)}>{choice}{picked && choice === round.answer && <span className="game-choice__result"><Icon name="check" size={15} /> Best match</span>}</button>)}</div>{picked && <aside className={`game-feedback ${correct ? 'good' : 'review'}`} role="status" aria-live="polite"><b>{correct ? 'Good match' : 'Let’s look at this together'}</b><p>{help[round.answer]}</p><button type="button" className="button" onClick={next}>{index === rounds.length - 1 ? 'See my score' : 'Next situation'} <Icon name="arrowRight" size={16} /></button></aside>}</section>;
}
