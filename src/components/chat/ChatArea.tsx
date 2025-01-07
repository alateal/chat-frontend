import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatArea = () => {
  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-base-content/10">
        <h2 className="text-lg font-semibold"># general</h2>
      </div>
      <MessageList />
      <MessageInput />
    </div>
  );
};

export default ChatArea; 