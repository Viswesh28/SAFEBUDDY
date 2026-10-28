import { useState } from 'react';
import Icon from '../components/Icon';
import rounds from './data/spotTheRedFlag.json';

export default function SpotTheRedFlag({ onFinish }) {
  const [index, setIndex] = useState(0); const [picked, setPicked] = useState(null); const [score, setScore] = useState(0);
  const round = rounds[index]; const correct = picked === round.answer;
  const pick = (choice) => { if (picked !== null) return; setPicked(choice); if (choice === round.answer) setScore((value) => value + 1); };
  const next = () => { if (index === rounds.length - 1) return onFinish({ score, total: rounds.length }); setIndex((value) => value + 1); setPicked(null); };
  return <section className="game-board red-flag">
    <div className="game-progress"><span>Chat {index + 1} of {rounds.length}</span><span>{score} spotted</span></div>
    <p className="game-prompt">Tap the message that is a red flag.</p>
    <div className="mock-chat" aria-label="Fictional chat messages">
      {round.messages.map((message, messageIndex) => <button type="button" key={message} disabled={picked !== null} className={`chat-message ${picked === messageIndex ? 'is-picked' : ''} ${picked !== null && messageIndex === round.answer ? 'is-answer' : ''}`} onClick={() => pick(messageIndex)}>{message}{picked !== null && messageIndex === round.answer && <span><Icon name="check" size={15} /> Red flag</span>}</button>)}
    </div>
    {picked !== null && <aside className={`game-feedback ${correct ? 'good' : 'review'}`} role="status" aria-live="polite"><b>{correct ? 'You spotted it' : 'Let’s look at this together'}</b><p>{round.explain}</p>{index === rounds.length - 1 && <p>Tell a trusted adult. For cybercrime help, an adult can contact 1930.</p>}<button type="button" className="button" onClick={next}>{index === rounds.length - 1 ? 'See my score' : 'Next chat'} <Icon name="arrowRight" size={16} /></button></aside>}
  </section>;
}
