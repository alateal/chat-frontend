import { Message, User, FileAttachment, Conversation } from "../../types";
import MessageInput from "./MessageInput";

interface ThreadViewProps {
  parentMessage: Message;
  messages: Message[];
  users: User[];
  currentUserId: string;
  currentConversationId: string;
  conversations: Conversation[];
  onClose: () => void;
  onSendMessage: (content: string, conversationId: string, files?: FileAttachment[], parentMessageId?: string) => void;
}

const ThreadView = ({
  parentMessage,
  messages,
  users,
  currentUserId,
  currentConversationId,
  conversations,
  onClose,
  onSendMessage,
}: ThreadViewProps) => {
  const getUserById = (userId: string) => 
    users.find(user => user.id === userId);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleSendReply = (content: string, files?: FileAttachment[]) => {
    onSendMessage(content, currentConversationId, files, parentMessage.id);
  };

  const replies = messages.filter(message => message.parent_message_id === parentMessage.id);

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Thread</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            <img 
              src={getUserById(parentMessage.created_by)?.imageUrl} 
              alt={getUserById(parentMessage.created_by)?.username}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-medium text-gray-900">
                {getUserById(parentMessage.created_by)?.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatTimestamp(parentMessage.created_at)}
              </span>
            </div>
            <div className="mt-1 text-gray-700">
              {parentMessage.content}
            </div>
          </div>
        </div>

        {/* Replies */}
        <div className="space-y-4 mt-6">
          {replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                <img 
                  src={getUserById(reply.created_by)?.imageUrl} 
                  alt={getUserById(reply.created_by)?.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-medium text-gray-900">
                    {getUserById(reply.created_by)?.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(reply.created_at)}
                  </span>
                </div>
                <div className="mt-1 text-gray-700">
                  {reply.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-pink-100 bg-white">
        <MessageInput
          currentConversationId={currentConversationId}
          conversations={conversations}
          parentMessageId={parentMessage.id}
          currentUserId={currentUserId}
          users={users}
          onSendMessage={handleSendReply}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
};

export default ThreadView; 