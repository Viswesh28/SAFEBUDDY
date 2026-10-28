import BranchingStory from './BranchingStory';
import graph from './data/chooseYourPath.json';

export default function ChooseYourPath({ onFinish }) {
  return <BranchingStory graph={graph} onFinish={onFinish} />;
}
