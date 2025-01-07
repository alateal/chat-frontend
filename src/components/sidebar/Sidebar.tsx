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
}

const Sidebar = ({ channels, users }: SidebarProps) => {
  return (
    <div className="w-64 bg-base-300 h-full flex flex-col">
      <div className="p-4 border-b border-base-content/10">
        <h1 className="text-xl font-bold">Workspace Name</h1>
      </div>
      <div className="overflow-y-auto flex-1">
        <ChannelList channels={channels} />
        <DirectMessageList users={users} />
      </div>
      <div className="p-4 border-t border-base-content/10">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};

export default Sidebar; 