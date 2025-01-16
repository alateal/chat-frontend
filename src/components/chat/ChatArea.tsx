import MessageList from "./MessageList";
import { Conversation, FileAttachment, Message, User } from "../../types";
import { useUserStatus } from "../../contexts/UserStatusContext";

interface ChatAreaProps {
  messages: Message[];
  users: User[];
  conversations: Conversation[];
  currentConversationId: string;
  currentUserId: string;
  onSendMessage: (
    content: string,
    conversationId: string,
    files?: FileAttachment[],
    parentMessageId?: string
  ) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const ChatArea = ({
  messages,
  users,
  conversations,
  currentConversationId,
  currentUserId,
  onSendMessage,
  onAddReaction,
}: ChatAreaProps) => {
  const { userStatuses } = useUserStatus();

  const messagesToDisplay = messages.filter(message => message.conversation_id === currentConversationId);
  const currentConversation = conversations.find(conv => conv.id === currentConversationId);
  
  // Get the other user in case of DM
  const otherUser = currentConversation && !currentConversation.is_channel
    ? users.find(user => 
        currentConversation?.conversation_members?.includes(user.id) && 
        user.id !== currentUserId
      )
    : null;

  const isUserOnline = (userId: string) => {
    if (userId === "user_ai") return true; // AI is always online
    return userStatuses[userId] || false;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {currentConversation && (
        <div className="px-4 py-2 border-b border-pink-100 bg-gradient-to-r from-white to-pink-50">
          <div className="flex items-center gap-2">
            {!currentConversation.is_channel && (
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img
                    src={otherUser?.imageUrl}
                    alt={otherUser?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white
                    ${isUserOnline(otherUser?.id || '') ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">
                {currentConversation.is_channel
                  ? `#${currentConversation.name}`
                  : otherUser?.username}
              </h2>
              {!currentConversation.is_channel && (
                <p className="text-xs text-gray-500">
                  {isUserOnline(otherUser?.id || '') ? 'Online' : 'Offline'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <MessageList
        messages={messagesToDisplay}
        users={users}
        currentConversationId={currentConversationId}
        currentUserId={currentUserId}
        onAddReaction={onAddReaction}
        userStatuses={userStatuses}
        onSendMessage={onSendMessage}
        conversations={conversations}
      />
    </div>
  );
};

export default ChatArea;
