import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';

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
  onSendMessage: (content: string) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const ChatArea = ({ messages, users, currentChannel, onSendMessage, onAddReaction }: ChatAreaProps) => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-base-content/10 bg-base-200/50">
        <SearchBar />
      </div>
      <div className="p-4 border-b border-base-content/10">
        <h2 className="text-lg font-semibold">
          # {currentChannel?.name || 'Select a channel'}
        </h2>
      </div>
      <MessageList 
        messages={messages} 
        users={users}
        channelId={currentChannel?.id}
        onAddReaction={onAddReaction}
      />
      <MessageInput 
        onSendMessage={onSendMessage}
        channelName={currentChannel?.name}
      />
    </div>
  );
};

export default ChatArea; 