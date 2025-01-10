import { useState } from 'react';
import { FileUpload } from './FileUpload';

interface MessageInputProps {
  onSendMessage: (content: string, files?: FileMetadata[]) => void;
  channelName?: string;
}

interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

const MessageInput = ({ onSendMessage, channelName }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileMetadata[]>([]);

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0) {
      onSendMessage(message, attachedFiles);
      setMessage('');
      setAttachedFiles([]);
    }
  };

  const handleFileUpload = (fileData: FileMetadata) => {
    setAttachedFiles(prev => [...prev, fileData]);
  };

  return (
    <div className="p-4 bg-base-200">
      <div className="flex items-center gap-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Message ${channelName || ''}`}
          className="input input-bordered flex-1"
        />
        <button 
          onClick={handleSend}
          className="btn btn-primary"
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