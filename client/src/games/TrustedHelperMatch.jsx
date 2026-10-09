import { useState } from 'react';

// Each round pairs a worry with the best next step.
// Helplines: CHILDLINE 1098 (free, 24 hours, India) and 112 (emergency number, India).
const rounds = [
  { worry: 'Someone at school keeps hurting me on purpose and I do not know who to tell.', options: ['Keep it secret forever', 'Tell a class teacher or school counsellor', 'Reply angrily to the bully', 'Post about it online'], answer: 1, explain: 'A teacher or school counsellor can act on bullying. Telling a trusted adult is the right first step.' },
  { worry: 'Someone is hurt or in danger right now.', options: ['Wait and see if it passes', 'Call 112 and tell a grown-up near you', 'Send a message to a friend', 'Take a photo for later'], answer: 1, explain: '112 is the single emergency number in India. Get help from people nearby straight away.' },
  { worry: 'I feel unsafe at home and need someone to talk to, any time of day.', options: ['CHILDLINE 1098 (free, 24 hours)', 'Post about it on social media', 'Wait until tomorrow', 'Ask an online stranger for advice'], answer: 0, explain: 'CHILDLINE 1098 is a free, 24-hour helpline for children in India who need care, protection, or someone to talk to.' },
  { worry: 'An unknown adult online asked me to keep our chats a secret.', options: ['Keep chatting, it is a secret', 'Stop replying, keep the messages, and tell a parent or trusted adult', 'Send them a photo to be friendly', 'Delete everything and say nothing'], answer: 1, explain: 'Stop replying, keep the messages as evidence, and tell a trusted adult. Do not delete them.' }
];

export default function TrustedHelperMatch({ onFinish }) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const round = rounds[index];
  const pick = (option) => {
    if (picked !== null) return;
    setPicked(option);
    if (option === round.answer) setScore((current) => current + 1);
  };
  const next = () => {
    if (index === rounds.length - 1) return onFinish({ score, total: rounds.length });
    setPicked(null);
    setIndex((current) => current + 1);
  };
  const correct = picked === round.answer;

  return <section className="game-board trusted-match">
    <div className="game-progress"><span>Worry {index + 1} of {rounds.length}</span><span>⭐ {score} matched</span></div>
    <div className="game-progress__bar"><i style={{ width: `${(index / rounds.length) * 100}%` }} /></div>
    <article className="game-scenario"><span className="game-scenario__icon">💭</span><p>{round.worry}</p></article>
    <p className="game-prompt">Who or what can help?</p>
    <div className="game-choices game-choices--text">
      {round.options.map((option, optionIndex) => <button key={option} className={`game-choice ${picked === optionIndex ? 'is-picked' : ''} ${picked !== null && optionIndex === round.answer ? 'is-answer' : ''}`} disabled={picked !== null} onClick={() => pick(optionIndex)}>
        <span>{String.fromCharCode(65 + optionIndex)}</span>{option}
      </button>)}
    </div>
    {picked !== null && <aside className={`game-feedback ${correct ? 'good' : 'review'}`}>
      <b>{correct ? '✓ Perfect match!' : '↗ The best helper is highlighted'}</b>
      <p>{round.explain}</p>
      <button className="button" onClick={next}>{index === rounds.length - 1 ? 'See my score' : 'Next worry'} <span>→</span></button>
    </aside>}
  </section>;
}
