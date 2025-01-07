import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';

const Sidebar = () => {
  return (
    <div className="w-64 bg-base-300 h-full flex flex-col">
      <div className="p-4 border-b border-base-content/10">
        <h1 className="text-xl font-bold">Workspace Name</h1>
      </div>
      <div className="overflow-y-auto flex-1">
        <ChannelList />
        <DirectMessageList />
      </div>
    </div>
  );
};

export default Sidebar; 