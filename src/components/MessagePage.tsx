import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Sidebar from "./sidebar/Sidebar";
import ChatArea from "./chat/ChatArea";
import Pusher from "pusher-js";
import { Conversation, FileAttachment, Message, User } from "../types";
import SearchBar from "./chat/SearchBar";

const API_URL = import.meta.env.VITE_API_URL;
Pusher.logToConsole = true;
const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ["ws", "wss"]
});

export const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = await window.Clerk.session.getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const MessagePage = () => {
  const { getToken, userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No authentication token available");
        }

        const [conversationsData, usersData] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/conversations/me`),
          fetchWithAuth(`${API_URL}/api/users`),
        ]);

        setConversations(conversationsData.conversations);
        setUsers(usersData.users.data.concat({ id: "user_ai", username: "AI", imageUrl: "/piggie.svg" }));

        if (conversationsData.conversations?.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const conversationId = params.get("conversationId");
          if (conversationId) {
            handleSelectConversation(conversationId);
          } else {
            handleSelectConversation(conversationsData.conversations[0].id);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [getToken]);

  useEffect(() => {
    const presenceChannel = pusher.subscribe("presence");
    presenceChannel.bind("user-created", (data: { user: User }) => {
      setUsers((prevUsers) => [...prevUsers, data.user]);
    });

    return () => {
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, [getToken]);

  useEffect(() => {
    const conversationChannel = pusher.subscribe(
      `conversation-${currentConversationId}`
    );

    conversationChannel.bind("new-message", (newMessage: Message) => {
      setMessages((prevMessages) => {
        console.log('New message received:', newMessage);
        // Check if message already exists
        if (prevMessages.some((msg) => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
    });

    conversationChannel.bind("message-updated", (updatedMessage: Message) => {
      console.log('Message updated received:', updatedMessage);
      setMessages((prevMessages) => {
        // Find and update the message
        const messageIndex = prevMessages.findIndex(msg => msg.id === updatedMessage.id);
        if (messageIndex === -1) {
          return prevMessages;
        }

        const newMessages = [...prevMessages];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          ...updatedMessage
        };
        return newMessages;
      });
    });

    return () => {
      console.log(`Unsubscribing from conversation-${currentConversationId}`);
      conversationChannel.unbind_all();
      conversationChannel.unsubscribe();
    };
  }, [currentConversationId]);

  useEffect(() => {
    // Get conversation ID from URL on initial load
    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get("conversation");
    if (conversationId) {
      handleSelectConversation(conversationId.toString());
    }
  }, []); // Empty dependency array for initial load only

  const handleSelectConversation = async (conversationId: string) => {
    setCurrentConversationId(Number(conversationId));
    const messages = await fetchWithAuth(
      `${API_URL}/api/conversations/${conversationId}/messages`
    );

    setMessages((prevMessages) => {
      const messageMap = new Map(
        [...prevMessages, ...messages].map((msg) => [msg.id, msg])
      );
      return Array.from(messageMap.values());
    });

    window.history.pushState({}, "", `?conversationId=${conversationId}`);
  };

  const handleCreateConversation = async (
    isChannel: boolean,
    members: string[],
    name?: string
  ) => {
    const response = await fetchWithAuth(`${API_URL}/api/conversations`, {
      method: "POST",
      body: JSON.stringify({ isChannel, name, members }),
    });
    const conversation = response.conversation;
    setConversations((prevConversations) => [
      ...prevConversations,
      conversation,
    ]);
    handleSelectConversation(conversation.id);
  };

  const handleSendMessage = async (
    content: string,
    conversationId: string,
    files?: FileAttachment[],
    parentMessageId?: string
  ) => {
    try {
      const body = {
        content,
        conversation_id: conversationId,
        files,
        parent_message_id: parentMessageId,
      };
      await fetchWithAuth(`${API_URL}/api/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await fetchWithAuth(
        `${API_URL}/api/messages/${messageId}/reactions`,
        {
          method: "POST",
          body: JSON.stringify({ emoji }),
        }
      );
      // No need to check response.ok since fetchWithAuth already handles errors
      // The message update will come through the Pusher event
    } catch (error) {
      console.error("Error adding reaction:", error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-pink-50">
      <div className="p-3 bg-white border-b border-pink-100 shadow-sm">
        <SearchBar />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          users={users}
          currentConversationId={currentConversationId}
          currentUserId={userId || ""}
          onSelectConversation={handleSelectConversation}
          onCreateConversation={handleCreateConversation}
        />
        <ChatArea
          conversations={conversations}
          messages={messages}
          users={users}
          currentConversationId={currentConversationId}
          currentUserId={userId}
          onSendMessage={handleSendMessage}
          onAddReaction={handleAddReaction}
        />
      </div>
    </div>
  );
};

export default MessagePage;
