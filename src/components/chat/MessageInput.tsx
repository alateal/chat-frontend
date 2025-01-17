import { useState, useRef, useCallback, useEffect } from "react";
import { FileUpload } from "./FileUpload";
import { fetchWithAuth } from "../MessagePage";
import { Conversation, FileAttachment, User } from "../../types";

const API_URL = import.meta.env.VITE_API_URL;

interface MessageInputProps {
  onSendMessage: (
    content: string,
    conversationId: string,
    files?: FileAttachment[],
    parentMessageId?: string
  ) => void;
  currentConversationId: string;
  conversations: Conversation[];
  currentUserId: string;
  parentMessageId?: string;
  users: User[];
  placeholder?: string;
}

const MessageInput = ({
  onSendMessage,
  users,
  conversations,
  currentConversationId,
  currentUserId,
  parentMessageId,
  placeholder,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach((file) => {
      // Create a temporary preview URL for images
      if (file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        const tempAttachment: FileAttachment = {
          id: `temp-${Date.now()}-${file.name}`,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          file_url: previewUrl,
          isTemp: true,
        };
        setAttachedFiles((prev) => [...prev, tempAttachment]);
      }
      // Trigger the actual file upload
      uploadFile(file);
    });
  }, []);

  const uploadFile = async (file: File) => {
    try {
      // Get presigned URL from backend
      const response = await fetchWithAuth(`${API_URL}/api/files/upload`, {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!response) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, fileUrl, fileId } = response;

      // Upload file to S3 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Create file attachment object with actual S3 URL
      const fileAttachment: FileAttachment = {
        id: fileId,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        file_url: fileUrl,
      };

      handleFileUpload(fileAttachment);
    } catch (error) {
      console.error("Error uploading file:", error);
      // Remove temporary preview on error
      setAttachedFiles((prev) => prev.filter((f) => f.file_name !== file.name));
    }
  };

  const handleFileUpload = (fileData: FileAttachment) => {
    setAttachedFiles((prev) => {
      // Replace temporary preview if it exists
      const tempIndex = prev.findIndex(
        (f) => f.file_name === fileData.file_name && f.isTemp
      );
      if (tempIndex >= 0) {
        const newFiles = [...prev];
        newFiles[tempIndex] = fileData;
        return newFiles;
      }
      // Otherwise add as new file
      return [...prev, fileData];
    });
  };

  const currentConversation = conversations.find(
    (conv) => conv.id === currentConversationId
  );

  const otherUser =
    currentConversation && !currentConversation?.is_channel
      ? users.find(
          (user) =>
            currentConversation?.conversation_members?.includes(user.id) &&
            user.id !== currentUserId
        )
      : null;

  const handleSend = () => {
    if (message.trim() || attachedFiles.length > 0) {
      console.log(attachedFiles);
      onSendMessage(
        message,
        currentConversationId,
        attachedFiles,
        parentMessageId
      );
      setMessage("");
      setAttachedFiles([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Log the files being sent
    console.log("Sending files:", attachedFiles);

    // Make sure files are properly formatted
    const formattedFiles = attachedFiles.map(file => ({
      name: file.file_name,
      type: file.file_type,
      url: file.file_url,
      size: file.file_size
    }));

    // Send message with files
    await onSendMessage(message, currentConversationId, formattedFiles, parentMessageId);
    
    // Clear files after sending
    setAttachedFiles([]);
    setMessage('');
  };

  return (
    <div
      ref={dropZoneRef}
      className={`p-4 bg-white-50 relative ${isDragging ? "bg-pink-50" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Preview Section */}
      {attachedFiles.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className={`relative group flex items-center gap-2 p-2 rounded-lg border
                ${
                  file.isTemp
                    ? "border-pink-300 bg-pink-50"
                    : "border-gray-200 bg-white"
                }
                hover:border-pink-400 transition-colors`}
            >
              {file.file_type.startsWith("image/") && (
                <div className="w-10 h-10 rounded overflow-hidden">
                  <img
                    src={file.file_url}
                    alt={file.file_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-gray-500">
                  {(file.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() =>
                  setAttachedFiles((prev) =>
                    prev.filter((f) => f.id !== file.id)
                  )
                }
                className="p-1 hover:bg-pink-100 rounded-full"
                title="Remove file"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-pink-100/50 border-2 border-dashed border-pink-300 rounded-lg flex items-center justify-center">
          <div className="text-pink-500 text-lg font-medium">
            Drop files here to upload
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="flex items-center gap-2">
        <FileUpload onFileUpload={handleFileUpload} />
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Message ${
            currentConversation?.name || otherUser?.username || ""
          }`}
          className={`flex-1 h-10 px-4 py-2 text-sm border rounded-lg resize-none bg-white focus:outline-none focus:border-blue-500`}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          onClick={handleSend}
          className="p-4 bg-pink-400 hover:bg-pink-500 text-white rounded-lg"
          disabled={!message.trim() && attachedFiles.length === 0}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
