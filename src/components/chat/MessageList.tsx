import { useEffect, useRef, useState } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface Reaction {
  emoji: string;
  users: string[];
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  channel_id: string;
  reactions?: Reaction[];
}

interface MessageListProps {
  messages: Message[];
  users: User[];
  channelId?: string;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const FREQUENT_EMOJIS = ['👍🏻', '🙏🏼', '😄', '🎉']; // Default frequent emojis

const MessageList = ({ messages = [], users = [], channelId, onAddReaction }: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const channelMessages = channelId 
    ? messages
        .filter(message => message.channel_id === channelId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const handleReactionClick = (messageId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPickerPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setCurrentMessageId(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (messageId: string, emojiData: any) => {
    onAddReaction(messageId, emojiData.native);
    setShowEmojiPicker(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (showEmojiPicker && !(event.target as Element).closest('.emoji-picker')) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleQuickReaction = (messageId: string, emoji: string) => {
    onAddReaction(messageId, emoji);
  };

  const hasUserReacted = (reaction: Reaction, userId: string) => {
    return reaction.users.includes(userId);
  };

  const getReactionCount = (reaction: Reaction) => {
    return reaction.users.length > 0 ? reaction.users.length : '';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {channelMessages.map((message) => {
        const user = getUserById(message.created_by);
        return (
          <div key={message.id} className="chat chat-start group">
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img 
                  src={user?.imageUrl || `https://ui-avatars.com/api/?name=${user?.username || 'User'}`} 
                  alt={user?.username || 'User'} 
                />
              </div>
            </div>
            <div className="relative">
              <div className="chat-header">
                {user?.username || 'Unknown User'}
                <time className="text-xs opacity-50 ml-2">
                  {formatTimestamp(message.created_at)}
                </time>
              </div>
              <div className="chat-bubble">{message.content}</div>
              
              {/* Updated Reaction Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute -right-40 top-1/2 transform -translate-y-1/2 flex items-center gap-1 bg-base-300 rounded-lg p-2 shadow-lg transition-opacity duration-200">
                {/* Quick Reaction Buttons */}
                {FREQUENT_EMOJIS.map((emoji) => {
                  const existingReaction = message.reactions?.find(r => r.emoji === emoji);
                  const hasReacted = existingReaction && user?.id ? hasUserReacted(existingReaction, user.id) : false;
                  
                  return (
                    <button
                      key={emoji}
                      className={`hover:bg-base-100 p-1 rounded-full transition-colors duration-200
                        ${hasReacted ? 'bg-base-100' : ''}`}
                      onClick={() => handleQuickReaction(message.id, emoji)}
                      title={hasReacted ? "Remove reaction" : "Add reaction"}
                    >
                      {emoji}
                    </button>
                  );
                })}
                
                {/* More Reactions Button */}
                <button
                  className="hover:bg-base-100 p-1 rounded-full transition-colors duration-200 ml-1"
                  onClick={(e) => handleReactionClick(message.id, e)}
                  title="More reactions"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              </div>

              {/* Display existing reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {message.reactions.map((reaction, index) => {
                    const hasReacted = user?.id ? hasUserReacted(reaction, user.id) : false;
                    
                    return (
                      <button
                        key={`${reaction.emoji}-${index}`}
                        className={`
                          btn btn-sm btn-ghost gap-1 px-2 h-8 min-h-0
                          hover:bg-base-300 transition-colors duration-200
                          ${hasReacted ? 'bg-base-300' : ''}
                        `}
                        onClick={() => handleQuickReaction(message.id, reaction.emoji)}
                        title={reaction.users
                          .map(userId => users.find(u => u.id === userId)?.username)
                          .filter(Boolean)
                          .join(', ')}
                      >
                        <span className="text-lg">{reaction.emoji}</span>
                        {getReactionCount(reaction) && (
                          <span className="text-xs font-normal opacity-70">
                            {getReactionCount(reaction)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />

      {/* Emoji Picker Modal */}
      {showEmojiPicker && currentMessageId && (
        <div 
          className="fixed emoji-picker"
          style={{ 
            top: pickerPosition.top, 
            left: pickerPosition.left,
            zIndex: 50 
          }}
        >
          <div className="bg-base-300 rounded-lg shadow-xl p-2">
            <Picker 
              data={data} 
              onEmojiSelect={(emoji: any) => handleEmojiSelect(currentMessageId, emoji)}
              theme="dark"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList; 