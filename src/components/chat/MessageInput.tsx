import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { Conversation, FileAttachment, User } from '../../types';

interface MessageInputProps {
  onSendMessage: (content: string, conversationId: string, files?: FileAttachment[], parentMessageId?: string) => void;
  currentConversationId: string;
  conversations: Conversation[];
  currentUserId: string;
  parentMessageId?: string;
  users: User[];
  placeholder?: string;
}


const MessageInput = ({ onSendMessage, users, conversations, currentConversationId, currentUserId, parentMessageId, placeholder }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);

  const otherUser = currentConversation && !currentConversation?.is_channel
    ? users.find(user => 
        currentConversation?.conversation_members?.includes(user.id) && 
        user.id !== currentUserId
      )
    : null;

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0) {
      onSendMessage(message, currentConversationId, attachedFiles, parentMessageId);
      setMessage('');
      setAttachedFiles([]);
    }
  };

  const handleFileUpload = (fileData: FileAttachment) => {
    setAttachedFiles(prev => [...prev, fileData]);
  };

  return (
    <div className="p-4 bg-white-50">
      <div className="flex items-center gap-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={placeholder || `Message ${currentConversation?.name || otherUser?.username || ''}`}
          className="input input-bordered flex-1"
        />
        <button 
          onClick={handleSend}
          className="p-4 bg-pink-400 hover:bg-pink-500 text-white"
        >
          Send
        </button>
      </div>
      {attachedFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {attachedFiles.map((file) => (
            <div 
              key={`file-${file.id}`} 
              className="badge badge-primary gap-1"
            >
              <span className="truncate max-w-[150px]">{file.file_name}</span>
              <button 
                onClick={() => setAttachedFiles(prev => 
                  prev.filter(f => f.id !== file.id)
                )}
                className="ml-1 hover:text-error"
                aria-label="Remove file"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageInput; 