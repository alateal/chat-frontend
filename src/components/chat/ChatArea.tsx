import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
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

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-4 border-b border-gray-200 bg-white">
        {!currentConversation ? (
          <h2 className="text-lg font-semibold text-gray-500">Select a conversation</h2>
        ) : currentConversation.is_channel ? (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-xl">#</span>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentConversation.name}
            </h2>
          </div>
        ) : otherUser ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img
                  src={otherUser.imageUrl}
                  alt={otherUser.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <div
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                  ${userStatuses[otherUser.id] ? "bg-green-500" : "bg-gray-300"}`}
              />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {otherUser.username}
            </h2>
          </div>
        ) : null}
      </div>

      <MessageList
        messages={messagesToDisplay}
        users={users}
        currentConversationId={currentConversationId}
        currentUserId={currentUserId}
        onAddReaction={onAddReaction}
        userStatuses={userStatuses}
      />
      <MessageInput
        conversations={conversations}
        currentConversationId={currentConversationId}
        currentUserId={currentUserId}
        onSendMessage={onSendMessage}
      />
    </div>
  );
};

export default ChatArea;
