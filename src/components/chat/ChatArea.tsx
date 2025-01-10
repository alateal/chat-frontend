
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';

import { useUserStatus } from '../../contexts/UserStatusContext';


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

interface UserStatus {
  [key: string]: boolean;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  channel_id: string;
}

interface ChatAreaProps {
  messages: Message[];
  users: User[];
  currentChannel?: Channel;
  currentConversation?: { userId: string };
  onSendMessage: (content: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onLoadMore: () => void;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
}

const ChatArea = ({ 
  messages, 
  users, 
  currentChannel, 
  currentConversation,
  onSendMessage, 
  onAddReaction,
  onLoadMore,
  isLoadingMessages,
  hasMoreMessages
}: ChatAreaProps) => {
  const { userStatuses } = useUserStatus();
  const selectedUser = currentConversation 
    ? users.find(u => u.id === currentConversation.userId)
    : null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-base-content/10 bg-base-200/50">
        <SearchBar />
      </div>
      <div className="p-4 border-b border-base-content/10">
        {currentChannel ? (
          <h2 className="text-lg font-semibold">
            # {currentChannel.name}
          </h2>
        ) : selectedUser ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={selectedUser.imageUrl || `https://ui-avatars.com/api/?name=${selectedUser.username}`}
                  alt={selectedUser.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div 
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
                  transition-colors duration-300
                  ${userStatuses[selectedUser.id] ? 'bg-success' : 'bg-base-300'}`}
              />
            </div>
            <h2 className="text-lg font-semibold">{selectedUser.username}</h2>
          </div>
        ) : (
          <h2 className="text-lg font-semibold">Select a conversation</h2>
        )}
      </div>
      <MessageList 
        messages={messages} 
        users={users}
        channelId={currentChannel?.id}
        onAddReaction={onAddReaction}
        onLoadMore={onLoadMore}
        isLoadingMessages={isLoadingMessages}
        hasMoreMessages={hasMoreMessages}
        userStatuses={userStatuses}
      />
      <MessageInput 
        onSendMessage={onSendMessage}
        channelName={currentChannel?.name}
      />
    </div>
  );
};

export default ChatArea; 