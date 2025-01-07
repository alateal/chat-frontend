const MessageList = () => {
  const messages = [
    { id: 1, user: 'John Doe', content: 'Hello everyone!', timestamp: '12:00 PM' },
    { id: 2, user: 'Jane Smith', content: 'Hi John!', timestamp: '12:01 PM' },
    { id: 3, user: 'Bob Johnson', content: 'How are you all doing?', timestamp: '12:02 PM' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="chat chat-start">
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <img src={`https://ui-avatars.com/api/?name=${message.user}`} alt={message.user} />
            </div>
          </div>
          <div className="chat-header">
            {message.user}
            <time className="text-xs opacity-50 ml-2">{message.timestamp}</time>
          </div>
          <div className="chat-bubble">{message.content}</div>
        </div>
      ))}
    </div>
  );
};

export default MessageList; 