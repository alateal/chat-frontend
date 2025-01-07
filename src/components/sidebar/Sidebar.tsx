import { UserButton } from '@clerk/clerk-react';
import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';

interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  status: 'online' | 'offline';
  avatar: string;
}

interface SidebarProps {
  channels: Channel[];
  users: User[];
  selectedChannelId?: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (name: string) => void;
}

const Sidebar = ({ 
  channels, 
  users, 
  selectedChannelId,
  onSelectChannel,
  onCreateChannel 
}: SidebarProps) => {
  return (
    <div className="w-64 bg-base-100 flex-none flex flex-col h-full">
      <div className="p-4 border-b border-base-content/10">
        <h1 className="text-xl font-bold">Workspace Name</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChannelList 
          channels={channels} 
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          onCreateChannel={onCreateChannel}
        />
        <DirectMessageList users={users} />
      </div>
      <div className="p-4 border-t border-base-content/10">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};

export default Sidebar; 