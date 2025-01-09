import { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  channelName?: string;
}

const MessageInput = ({ onSendMessage, channelName }: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="p-4 border-t border-base-content/10">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message ${channelName ? `#${channelName}` : ''}`}
          className="input input-bordered flex-1"
        />
        <button type="submit" className="btn btn-primary">Send</button>
      </form>
    </div>
  );
};

export default MessageInput; 