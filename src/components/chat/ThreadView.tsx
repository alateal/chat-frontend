import MessageInput from "./MessageInput";
import { Message, User } from "../types";

interface ThreadViewProps {
  parentMessage: Message;
  replies: Message[];
  users: User[];
  onSendReply: (content: string, files?: FileMetadata[]) => void;
  onClose: () => void;
}

const ThreadView = ({
  parentMessage,
  replies,
  users,
  onSendReply,
  onClose,
}: ThreadViewProps) => {
  const getUserById = (userId: string) =>
    users.find((user) => user.id === userId);

  return (
    <div className="flex flex-col h-full border-l border-base-300">
      <div className="p-4 border-b border-base-300 flex justify-between items-center">
        <h3 className="font-semibold">Thread</h3>
        <button onClick={onClose} className="btn btn-ghost btn-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message */}
        <div className="chat chat-start">
          <div className="chat-image avatar">
            <div className="w-10 h-10 rounded-full">
              <img src={getUserById(parentMessage.created_by)?.imageUrl} />
            </div>
          </div>
          <div className="chat-header">
            {getUserById(parentMessage.created_by)?.username}
          </div>
          <div className="chat-bubble bg-white/90 text-base-content shadow-sm">
            {parentMessage.content}
          </div>
        </div>

        {/* Thread Replies */}
        {replies.map((reply) => (
          <div key={reply.id} className="chat chat-start ml-8">
            <div className="chat-image avatar">
              <div className="w-8 h-8 rounded-full">
                <img src={getUserById(reply.created_by)?.imageUrl} />
              </div>
            </div>
            <div className="chat-header">
              {getUserById(reply.created_by)?.username}
            </div>
            <div className="chat-bubble bg-white/90 text-base-content shadow-sm">
              {reply.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-base-300">
        <MessageInput
          parentMessageId={parentMessage.id}
          onSendMessage={onSendReply}
          placeholder="Reply in thread..."
          users={users}
          currentConversationId={currentConversationId}
          conversations={conversations}
        />
      </div>
    </div>
  );
};

export default ThreadView;
