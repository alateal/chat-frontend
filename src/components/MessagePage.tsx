import Sidebar from './sidebar/Sidebar';
import ChatArea from './chat/ChatArea';

const MessagePage = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar />
      <ChatArea />
    </div>
  );
};

export default MessagePage;
