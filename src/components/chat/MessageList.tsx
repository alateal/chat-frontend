interface Message {
  id: string;
  user: string;
  content: string;
  created_at: string;
  channel_id: string;
}

const MessageList = ({ messages, channelId }) => {
  const channelMessages = channelId 
    ? messages.filter(message => message.channel_id === channelId)
    : [];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {channelMessages.map((message) => (
        <div key={message.id} className="chat chat-start">
          <div className="chat-image avatar">
            <div className="w-10 rounded-full">
              <img src={`https://ui-avatars.com/api/?name=${message.user}`} alt={message.user} />
            </div>
          </div>
          <div className="chat-header">
            {message.user}
            <time className="text-xs opacity-50 ml-2">{message.created_at}</time>
          </div>
          <div className="chat-bubble">{message.content}</div>
        </div>
      ))}
    </div>
  );
};

export default MessageList; 