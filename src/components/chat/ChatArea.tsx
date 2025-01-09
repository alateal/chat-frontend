import { useMemo } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';

import { useUserStatus } from '../../contexts/UserStatusContext';
import { format, isToday, isYesterday } from 'date-fns';


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

interface MessageGroup {
  date: string;
  messages: Message[];
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

  // Group messages by date in reverse chronological order
  const messageGroups = useMemo(() => {
    // Create a copy and reverse to show newest first
    const sortedMessages = [...messages].reverse();
    
    return sortedMessages.reduce((groups: MessageGroup[], message) => {
      const date = new Date(message.created_at);
      let dateString = format(date, 'MMMM d, yyyy');
      
      if (isToday(date)) {
        dateString = 'Today';
      } else if (isYesterday(date)) {
        dateString = 'Yesterday';
      }

      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.date === dateString) {
        lastGroup.messages.push(message);
      } else {
        groups.push({ date: dateString, messages: [message] });
      }
      
      return groups;
    }, []);
  }, [messages]);

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
      <div className="flex-1 overflow-y-auto flex flex-col-reverse">
        <div>
          {messageGroups.map((group, index) => (
            <div key={group.date + index}>
              <div className="relative text-center my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-base-content/10"></div>
                </div>
                <div className="relative flex justify-center">
                  <button className="btn btn-ghost btn-xs bg-base-100">
                    {group.date}
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {group.messages.map((message) => (
                  <div 
                    key={message.id}
                    className="px-4 py-2 hover:bg-base-200/50"
                  >
                    <MessageList 
                      messages={[message]}
                      users={users}
                      channelId={currentChannel?.id}
                      onAddReaction={onAddReaction}
                      userStatuses={userStatuses}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {hasMoreMessages && (
            <button 
              onClick={onLoadMore}
              className="btn btn-ghost btn-sm w-full mt-4"
            >
              Load More
            </button>
          )}

          {isLoadingMessages && (
            <div className="flex justify-center p-4">
              <span className="loading loading-spinner"></span>
            </div>
          )}
        </div>
      </div>

      <MessageInput 
        onSendMessage={onSendMessage}
        channelName={currentChannel?.name}
      />
    </div>
  );
};

export default ChatArea; 