import { useMemo, useState } from 'react';
import Icon from '../components/Icon';

export default function BranchingStory({ graph, onFinish }) {
  const nodes = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);
  const [nodeId, setNodeId] = useState(graph.startId);
  const node = nodes.get(nodeId);

  const restart = () => setNodeId(graph.startId);
  const finish = () => onFinish({ score: node.outcome === 'great' ? 1 : 0, total: 1 });

  if (node.outcome) return <section className="game-board branching-story">
    <div className={`game-feedback ${node.outcome === 'great' ? 'good' : 'review'}`} role="status" aria-live="polite">
      <b>{node.outcome === 'great' ? 'Great path' : node.outcome === 'okay' ? 'You can get support' : 'Try another path'}</b>
      <p>{node.text}</p>
      <p>{node.message}</p>
      <div className="result-actions">
        <button className="button" onClick={finish}>See my score <Icon name="arrowRight" size={16} /></button>
        <button className="secondary-button" onClick={restart}>Try another path</button>
      </div>
    </div>
  </section>;

  return <section className="game-board branching-story">
    <div className="game-progress"><span>Choose your next step</span><span>Online safety story</span></div>
    <article className="game-scenario"><span className="game-scenario__icon"><Icon name="message" size={22} /></span><p>{node.text}</p></article>
    <p className="game-prompt">What would you like to do?</p>
    <div className="game-choices game-choices--text">
      {node.choices.map((choice) => <button key={choice.label} type="button" className="game-choice" onClick={() => setNodeId(choice.next)}>{choice.label}</button>)}
    </div>
  </section>;
}
