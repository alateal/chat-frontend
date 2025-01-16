import { useState, useRef, useEffect } from 'react';
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
  isAiResponding?: boolean;
}

const MessageInput = ({ onSendMessage, users, conversations, currentConversationId, currentUserId, parentMessageId, placeholder, isAiResponding }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const [dots, setDots] = useState('');
  useEffect(() => {
    if (isAiResponding) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isAiResponding]);

  return (
    <div className="p-4 bg-white-50">
      <div className="flex items-center gap-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            isAiResponding 
              ? `One moment please. Piggy is eating some bacons${dots}`
              : `Message ${currentConversation?.name || otherUser?.username || ''}`
          }
          disabled={isAiResponding}
          className={`flex-1 h-10 px-4 py-2 text-sm border rounded-lg resize-none
            ${isAiResponding ? 'bg-gray-100 italic text-gray-600' : 'bg-white'}
            focus:outline-none focus:border-blue-500`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button 
          onClick={handleSend}
          className="p-4 bg-pink-400 hover:bg-pink-500 text-white"
          disabled={!message.trim() || isAiResponding}
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