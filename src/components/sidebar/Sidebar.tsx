import { UserButton } from '@clerk/clerk-react';
import ChannelList from './ChannelList';
import DirectMessageList from './DirectMessageList';

interface Channel {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface SidebarProps {
  channels: Channel[];
  users: User[];
  selectedChannelId?: string;
  selectedUserId?: string;
  currentUserId: string;
  onSelectChannel: (channelId: string) => void;
  onCreateChannel: (name: string) => void;
  onSelectUser: (userId: string) => void;
}

const Sidebar = ({ 
  channels, 
  users, 
  selectedChannelId,
  selectedUserId,
  currentUserId,
  onSelectChannel,
  onCreateChannel,
  onSelectUser 
}: SidebarProps) => {
  return (
    <div className="w-64 bg-base-100 flex-none flex flex-col h-full">
      <div className="p-4 border-b border-base-content/10">
        <h1 className="text-xl font-bold">Chat Genius</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <ChannelList 
          channels={channels} 
          selectedChannelId={selectedChannelId}
          onSelectChannel={onSelectChannel}
          onCreateChannel={onCreateChannel}
        />
        <DirectMessageList 
          users={users}
          selectedUserId={selectedUserId}
          onSelectUser={onSelectUser}
          currentUserId={currentUserId}
        />
      </div>

      <div className="p-4 border-t border-base-content/10">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  );
};

export default Sidebar; 