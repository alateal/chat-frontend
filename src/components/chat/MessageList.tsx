import { useEffect, useRef, useState, useCallback } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import MessageInput from "./MessageInput";
import { UserStatus, Message, User, FileAttachment, Reaction, Conversation } from "../../types";
import ThreadView from "./ThreadView";

const API_URL = import.meta.env.VITE_API_URL;

interface MessageListProps {
  messages: Message[];
  users: User[];
  currentConversationId?: string;
  currentUserId: string;
  onAddReaction: (messageId: string, emoji: string) => void;
  userStatuses: UserStatus;
  onSendMessage: (content: string, conversationId: string, files?: FileAttachment[], parentMessageId?: string) => void;
  conversations: Conversation[];
}

const FREQUENT_EMOJIS = ["👍🏻", "🙏🏼", "😄", "🎉"]; // Default frequent emojis

const formatDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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

const getThreadSummary = (message: Message, messages: Message[], users: User[]) => {
  const replies = messages.filter(msg => msg.parent_message_id === message.id);
  if (replies.length === 0) return null;

  // Get unique repliers (up to 3)
  const uniqueRepliers = Array.from(new Set(replies.map(reply => reply.created_by)))
    .slice(0, 3)
    .map(userId => users.find(user => user.id === userId))
    .filter((user): user is User => user !== undefined);

  return {
    replyCount: replies.length,
    repliers: uniqueRepliers
  };
};

const MessageList = ({
  messages,
  users,
  currentUserId,
  currentConversationId,
  onAddReaction,
  userStatuses,
  onSendMessage,
  conversations,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [selectedParentMessageId, setSelectedParentMessageId] = useState<
    string | null
  >(null);
  const [threadParentMessage, setThreadParentMessage] = useState<Message | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getUserById = (userId: string) => {
    return users.find((user) => user.id === userId);
  };

  const handleReactionClick = (messageId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Standard dimensions of emoji picker
    const pickerWidth = 352;
    const pickerHeight = 435;

    // Calculate horizontal position
    let left = rect.left;
    if (left + pickerWidth > windowWidth) {
      left = windowWidth - pickerWidth - 20;
    }

    // Calculate vertical position
    let top = rect.bottom + window.scrollY + 5;
    if (top + pickerHeight > windowHeight + window.scrollY) {
      // Position above the button if not enough space below
      top = rect.top + window.scrollY - pickerHeight - 5;
    }

    setPickerPosition({
      top: Math.max(window.scrollY + 20, top),
      left: Math.max(20, left),
    });

    setCurrentMessageId(messageId);
    setShowEmojiPicker(true);
  };

  const handleEmojiSelect = (messageId: string, emojiData: any) => {
    onAddReaction(messageId, emojiData.native);
    setShowEmojiPicker(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      showEmojiPicker &&
      !(event.target as Element).closest(".emoji-picker")
    ) {
      setShowEmojiPicker(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleQuickReaction = (messageId: string, emoji: string) => {
    onAddReaction(messageId, emoji);
  };

  const hasUserReacted = (reaction: Reaction, userId: string) => {
    return reaction.users.includes(userId);
  };

  const getReactionCount = (reaction: Reaction) => {
    return reaction.users.length > 0 ? reaction.users.length : "";
  };

  const handleOpenThread = (message: Message) => {
    setThreadParentMessage(message);
    setShowThread(true);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 relative"
      >
        {Object.entries(
          groupMessagesByDate(messages.filter(msg => !msg.parent_message_id))
        ).map(([date, dateMessages]) => (
          <div key={`date-group-${date}`} className="space-y-4">
            <div className="sticky top-0 z-10 flex justify-center py-2">
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
                className="chat chat-start group relative hover:bg-base-300/40 active:bg-base-300/60 
                transition-all duration-200 rounded-lg px-4 py-2 -mx-4 cursor-pointer"
              >
                <div className="flex items-start gap-3 relative">
                  <div className="chat-image avatar self-start">
                    <div className="relative flex items-start justify-start">
                      <div className="w-10 h-10 overflow-hidden rounded-lg">
                        <img
                          src={
                            getUserById(message.created_by)?.imageUrl ||
                            `https://ui-avatars.com/api/?name=${
                              getUserById(message.created_by)?.username ||
                              "User"
                            }`
                          }
                          alt={
                            getUserById(message.created_by)?.username ||
                            "User"
                          }
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {getUserById(message.created_by) && (
                        <div
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
                          transition-colors duration-300
                          ${
                            userStatuses[message.created_by]
                              ? "bg-success"
                              : "bg-base-300"
                          }`}
                        />
                      )}
                    </div>
                  </div>
                  <div className="relative flex-1">
                    <div className="chat-header">
                      <span className="text-[15px] font-semibold text-gray-900">
                        {getUserById(message.created_by)?.username ||
                          "Unknown User"}
                      </span>
                      <time className="text-xs opacity-50 ml-2">
                        {formatTimestamp(message.created_at)}
                      </time>
                    </div>
                    <div
                      className={`chat-bubble ${
                        message.created_by === currentUserId
                          ? 'bg-pink-500 text-white' 
                          : 'bg-pink-50 text-gray-800 border border-pink-100'
                      } shadow-sm before:hidden`}
                    >
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
                            <div
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary/5 
                            group-hover:bg-primary/10 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-4 h-4 text-primary"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium text-base-content">
                                {file.file_name}
                              </div>
                              <div className="text-xs text-base-content/60">
                                Click to download
                              </div>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="w-5 h-5 text-base-content/40 group-hover:text-base-content/70 transition-colors"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Move reaction tooltip to the right of the entire message */}
                    <div
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 
                    bg-base-300 rounded-lg p-2 shadow-lg transition-opacity duration-200
                    absolute -right-60 top-0"
                    >
                      {/* Quick Reaction Buttons */}
                      {FREQUENT_EMOJIS.map((emoji) => {
                        const existingReaction = message.reactions?.find(
                          (r) => r.emoji === emoji
                        );
                        const hasReacted =
                          existingReaction && currentUserId // Get userId from props
                            ? hasUserReacted(existingReaction, currentUserId)
                            : false;

                        return (
                          <button
                            key={emoji}
                            className={`hover:bg-base-100 p-1.5 rounded-full transition-colors duration-200
                            ${hasReacted ? "bg-base-100" : ""}`}
                            onClick={() =>
                              handleQuickReaction(message.id, emoji)
                            }
                            title={
                              hasReacted ? "Remove reaction" : "Add reaction"
                            }
                          >
                            <span className="text-base">{emoji}</span>
                          </button>
                        );
                      })}

                      {/* More Reactions Button */}
                      <button
                        className="hover:bg-base-100 p-1.5 rounded-full transition-colors duration-200 ml-1 tooltip tooltip-top"
                        onClick={(e) => handleReactionClick(message.id, e)}
                        data-tip="Find another reactions"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 4.5v15m7.5-7.5h-15"
                          />
                        </svg>
                      </button>

                      {/* Add Reply in Thread Button */}
                      <button
                        className="hover:bg-base-100 p-1.5 rounded-full transition-colors duration-200 ml-1 tooltip tooltip-top"
                        onClick={() => handleOpenThread(message)}
                        data-tip="Reply in thread"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z"
                          />
                        </svg>
                      </button>
                    </div>

                    {/* Thread Summary */}
                    {(() => {
                      const summary = getThreadSummary(message, messages, users);
                      if (!summary) return null;

                      return (
                        <div 
                          onClick={() => handleOpenThread(message)}
                          className="mt-1 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
                        >
                          <div className="flex -space-x-2">
                            {summary.repliers.map(user => (
                              <div 
                                key={user.id} 
                                className="w-5 h-5 rounded-full overflow-hidden border-2 border-white"
                              >
                                <img
                                  src={user.imageUrl}
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                          <span>
                            {summary.replyCount} {summary.replyCount === 1 ? 'reply' : 'replies'}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Display existing reactions */}
                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {message.reactions.map((reaction, index) => {
                          const hasReacted = getUserById(message.created_by)
                            ?.id
                            ? hasUserReacted(
                                reaction,
                                getUserById(message.created_by)?.id
                              )
                            : false;

                          return (
                            <button
                              key={`${reaction.emoji}-${index}`}
                              className={`
                              btn btn-sm btn-ghost gap-1 px-2 h-8 min-h-0
                              hover:bg-pink-50 transition-colors duration-200
                              ${hasReacted ? "bg-pink-50" : ""}`}
                              onClick={() =>
                                handleQuickReaction(
                                  message.id,
                                  reaction.emoji
                                )
                              }
                              title={reaction.users
                                .map(
                                  (userId) =>
                                    users.find((u) => u.id === userId)
                                      ?.username
                                )
                                .filter(Boolean)
                                .join(", ")}
                            >
                              <span className="text-lg">
                                {reaction.emoji}
                              </span>
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
              zIndex: 50,
            }}
          >
            <div className="bg-base-300 rounded-lg shadow-xl p-2">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) =>
                  handleEmojiSelect(currentMessageId, emoji)
                }
                theme="dark"
              />
            </div>
          </div>
        )}

        {showThread && threadParentMessage && (
          <div className="fixed right-0 top-0 h-full">
            <ThreadView
              parentMessage={threadParentMessage}
              messages={messages}
              conversations={conversations}
              users={users}
              currentUserId={currentUserId}
              currentConversationId={currentConversationId || ''}
              onClose={() => setShowThread(false)}
              onSendMessage={onSendMessage}
            />
          </div>
        )}
      </div>

      {/* Add MessageInput at the bottom */}
      <div className="p-4 border-t border-pink-100 bg-white">
        <MessageInput
          users={users}
          conversations={conversations}
          currentConversationId={currentConversationId}
          currentUserId={currentUserId}
          onSendMessage={onSendMessage}
        />
      </div>
    </div>
  );
};

export default MessageList;
