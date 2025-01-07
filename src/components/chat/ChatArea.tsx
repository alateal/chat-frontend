import MessageList from './MessageList';
import MessageInput from './MessageInput';
import SearchBar from './SearchBar';

interface Message {
  id: string;
  user: string;
  content: string;
  created_at: string;
}

interface ChatAreaProps {
  messages: Message[];
  currentChannel?: Channel;
}

const ChatArea = ({ messages, currentChannel }: ChatAreaProps) => {
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
        channelId={currentChannel?.id}
      />
      <MessageInput />
    </div>
  );
};

export default ChatArea; 