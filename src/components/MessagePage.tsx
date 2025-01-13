import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import Sidebar from "./sidebar/Sidebar";
import ChatArea from "./chat/ChatArea";
import Pusher from "pusher-js";
import { Conversation, FileAttachment, Message, User } from "../types";
import SearchBar from "./chat/SearchBar";

const API_URL = import.meta.env.VITE_API_URL;

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ["ws", "wss"],
});

const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const token = await window.Clerk.session.getToken();
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};

const MessagePage = () => {
  const { getToken, userId } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No authentication token available");
        }

        const [conversationsRes, messagesRes, usersRes] = await Promise.all([
          fetchWithAuth(`${API_URL}/api/conversations/me`),
          fetchWithAuth(`${API_URL}/api/messages`),
          fetchWithAuth(`${API_URL}/api/users`),
        ]);

        const [conversationsData, messagesData, usersData] = await Promise.all([
          conversationsRes.json(),
          messagesRes.json(),
          usersRes.json(),
        ]);

        setConversations(conversationsData.conversations || []);
        setMessages(messagesData.messages || []);
        setUsers(usersData.users.data || []);

        if (conversationsData.conversations?.length > 0) {
          setCurrentConversationId(conversationsData.conversations[0].id);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [getToken]);

  useEffect(() => {
    const presenceChannel = pusher.subscribe('presence');
    presenceChannel.bind('user-created', (data: { user: User }) => {
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
        // Check if message already exists
        if (prevMessages.some(msg => msg.id === newMessage.id)) {
          return prevMessages;
        }
        return [...prevMessages, newMessage];
      });
    });

    // Add back reaction updates for direct messages
    conversationChannel.bind("message-updated", (updatedMessage: Message) => {
      setMessages((prevMessages) =>
        prevMessages.map((message) =>
          message.id === updatedMessage.id ? updatedMessage : message
        )
      );
    });

    return () => {
      conversationChannel.unbind_all();
      conversationChannel.unsubscribe();
    };
  }, [currentConversationId]);

  const handleSelectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleCreateConversation = async (isChannel: boolean, members: string[], name?: string) => {
    const conversation = await fetchWithAuth(`${API_URL}/api/conversations`, {
      method: "POST",
      body: JSON.stringify({ isChannel, name, members }),
    });
    setConversations((prevConversations) => [...prevConversations, conversation]);
    setCurrentConversationId(conversation.id);
  };   

  const handleSendMessage = async (content: string, conversationId: string, files?: FileAttachment[], parentMessageId?: string) => {
    try {
      const body = {
        content,
        conversation_id: conversationId,
        files,
        parent_message_id: parentMessageId,
      };

      const response = await fetchWithAuth(`${API_URL}/api/messages`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      await response.json();
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetchWithAuth(
        `${API_URL}/api/messages/${messageId}/reactions`,
        {
          method: "POST",
          body: JSON.stringify({ emoji }),
        }
      );

      if (!response.ok) {
        console.error("Error adding reaction:", response.statusText);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-base-200">
      <div className="p-3 bg-white border-b border-gray-200">
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
