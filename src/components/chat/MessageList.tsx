import { useEffect, useRef, useState, useCallback } from 'react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface UserStatus {
  [key: string]: boolean;
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
  file_attachments?: {
    files: {
      id: string;
      file_name: string;
      file_url: string;
    }[];
  };
}

interface MessageListProps {
  messages: Message[];
  users: User[];
  channelId?: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  onLoadMore: () => void;
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  userStatuses: UserStatus;
}

const FREQUENT_EMOJIS = ['👍🏻', '🙏🏼', '😄', '🎉']; // Default frequent emojis

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });
};

const groupMessagesByDate = (messages: Message[]) => {
  return messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});
};

const MessageList = ({ 
  messages,
  users,
  channelId,
  onAddReaction,
  onLoadMore,
  isLoadingMessages,
  hasMoreMessages,
  userStatuses
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<Message | null>(null);
  const [threadReplies, setThreadReplies] = useState<Message[]>([]);

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

  // Add scroll handler for infinite scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isLoadingMessages || !hasMoreMessages) return;

    const { scrollTop } = containerRef.current;
    if (scrollTop === 0) {
      onLoadMore();
    }
  }, [isLoadingMessages, hasMoreMessages, onLoadMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleOpenThread = async (message: Message) => {
    setSelectedThread(message);
    await fetchThreadReplies(message.id);
  };

  const fetchThreadReplies = async (messageId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/messages/${messageId}/replies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch replies');
      
      const { replies } = await response.json();
      setThreadReplies(replies);
    } catch (error) {
      console.error('Error fetching replies:', error);
    }
  };

  const handleSendReply = async (content: string, files?: FileMetadata[]) => {
    if (!selectedThread) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          files,
          parent_message_id: selectedThread.id,
          channel_id: selectedThread.channel_id,
          conversation_id: selectedThread.conversation_id,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reply');
      
      const reply = await response.json();
      setThreadReplies(prev => [...prev, reply]);
    } catch (error) {
      console.error('Error sending reply:', error);
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 relative"
    >
      {isLoadingMessages && (
        <div className="text-center py-2">
          <span className="loading loading-dots loading-md"></span>
        </div>
      )}
      {Object.entries(groupMessagesByDate(messages)).map(([date, dateMessages]) => (
        <div key={`date-group-${date}`} className="space-y-4">
          <div className="sticky top-0 z-10 flex justify-center py-2">
            <div className="bg-base-300 px-4 py-1 rounded-lg text-sm">
              {formatDate(new Date(date))}
            </div>
          </div>
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-base-content/10"></div>
            <span className="flex-shrink-0 mx-4 text-xs text-base-content/50">
              {formatDate(new Date(date))}
            </span>
            <div className="flex-grow border-t border-base-content/10"></div>
          </div>
          {dateMessages.map((message, index) => (
            <div 
              key={`${date}-message-${message.id}-${index}`} 
              className="chat chat-start group relative flex items-start pr-20"
            >
              <div className="chat-image avatar">
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 overflow-hidden rounded-lg">
                    <img 
                      src={getUserById(message.created_by)?.imageUrl || `https://ui-avatars.com/api/?name=${getUserById(message.created_by)?.username || 'User'}`} 
                      alt={getUserById(message.created_by)?.username || 'User'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {getUserById(message.created_by) && (
                    <div 
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
                        transition-colors duration-300
                        ${userStatuses[message.created_by] ? 'bg-success' : 'bg-base-300'}`}
                    />
                  )}
                </div>
              </div>
              <div className="relative flex-1">
                <div className="chat-header">
                  {getUserById(message.created_by)?.username || 'Unknown User'}
                  <time className="text-xs opacity-50 ml-2">
                    {formatTimestamp(message.created_at)}
                  </time>
                </div>
                <div className="chat-bubble bg-white/90 text-base-content shadow-sm">
                  {message.content}
                  
                  {/* File attachments inside chat bubble */}
                  {message.file_attachments?.files.map((file) => (
                    <div key={file.id} className="mt-3 first:mt-4">
                      <a 
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2.5 rounded-lg bg-base-100/50 hover:bg-base-100 
                          transition-all duration-200 border border-base-200 hover:border-base-300
                          hover:shadow-md group"
                      >
                        <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/5 
                          group-hover:bg-primary/10 transition-colors">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            strokeWidth={1.5} 
                            stroke="currentColor" 
                            className="w-4 h-4 text-primary"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="truncate font-medium text-base-content">{file.file_name}</div>
                          <div className="text-xs text-base-content/60">Click to download</div>
                        </div>
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          strokeWidth={1.5} 
                          stroke="currentColor" 
                          className="w-5 h-5 text-base-content/40 group-hover:text-base-content/70 transition-colors"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </a>
                    </div>
                  ))}
                  
                  {/* Thread Reply Button */}
                  <button
                    onClick={() => handleOpenThread(message)}
                    className="opacity-0 group-hover:opacity-100 absolute -right-24 top-0 p-2 rounded-lg hover:bg-base-300 transition-all duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Move reaction tooltip to the right of the entire message */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 
                  bg-base-300 rounded-lg p-2 shadow-lg transition-opacity duration-200 z-10
                  absolute right-2 top-2"
                >
                  {/* Quick Reaction Buttons */}
                  {FREQUENT_EMOJIS.map((emoji) => {
                    const existingReaction = message.reactions?.find(r => r.emoji === emoji);
                    const hasReacted = existingReaction && getUserById(message.created_by)?.id 
                      ? hasUserReacted(existingReaction, getUserById(message.created_by)?.id) 
                      : false;
                    
                    return (
                      <button
                        key={emoji}
                        className={`hover:bg-base-100 p-1.5 rounded-full transition-colors duration-200
                          ${hasReacted ? 'bg-base-100' : ''}`}
                        onClick={() => handleQuickReaction(message.id, emoji)}
                        title={hasReacted ? "Remove reaction" : "Add reaction"}
                      >
                        <span className="text-base">{emoji}</span>
                      </button>
                    );
                  })}
                  
                  {/* More Reactions Button */}
                  <button
                    className="hover:bg-base-100 p-1.5 rounded-full transition-colors duration-200 ml-1"
                    onClick={(e) => handleReactionClick(message.id, e)}
                    title="More reactions"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* Display existing reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => {
                      const hasReacted = getUserById(message.created_by)?.id ? hasUserReacted(reaction, getUserById(message.created_by)?.id) : false;
                      
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
          ))}
        </div>
      ))}
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