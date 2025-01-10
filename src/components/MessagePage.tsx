import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chat/ChatArea';
import Pusher from 'pusher-js';

const API_URL = import.meta.env.VITE_API_URL;

interface Channel {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  created_by: string;
  channel_id: string;
  user: User;
}

interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface DirectMessage extends Message {
  conversation_id: string;
}

interface FileMetadata {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string;
}

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ['ws', 'wss'],
  logToConsole: true
});

const MessagePage = () => {
  const { getToken, userId } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>();
  const [currentConversationId, setCurrentConversationId] = useState<string>();
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const selectedConversation = selectedUserId ? { userId: selectedUserId } : undefined;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('No authentication token available');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [channelsRes, messagesRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/api/channels`, { headers }),
          fetch(`${API_URL}/api/messages`, { headers }),
          fetch(`${API_URL}/api/users`, { headers })
        ]);
        
        if (!channelsRes.ok || !messagesRes.ok || !usersRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const channelsData = await channelsRes.json();
        const messagesData = await messagesRes.json();
        const usersData = await usersRes.json();
        
        setChannels(channelsData.channels || []);
        setMessages(messagesData.messages || []);
        setUsers(usersData.users.data || []);

        if (channelsData.channels?.length > 0) {
          setSelectedChannelId(channelsData.channels[0].id);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    };

    fetchData();
  }, [getToken]);

  useEffect(() => {
    const channelsChannel = pusher.subscribe('channels');
    let messageChannel: any;

    // Handle channel messages
    if (selectedChannelId) {
      messageChannel = pusher.subscribe(`channel-${selectedChannelId}`);
      
      messageChannel.bind('new-message', (newMessage: Message) => {
        setMessages(prevMessages => {
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

      // Add back reaction updates for channel messages
      messageChannel.bind('message-updated', (updatedMessage: Message) => {
        setMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === updatedMessage.id ? updatedMessage : message
          )
        );
      });
    }

    // Handle direct messages
    if (currentConversationId) {
      messageChannel = pusher.subscribe(`conversation-${currentConversationId}`);
      
      messageChannel.bind('new-message', (newMessage: DirectMessage) => {
        setDirectMessages(prevMessages => {
          const isDuplicate = prevMessages.some(msg => msg.id === newMessage.id);
          if (isDuplicate) return prevMessages;
          
          if (newMessage.conversation_id === currentConversationId) {
            return [...prevMessages, newMessage].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
          }
          return prevMessages;
        });
      });

      // Add back reaction updates for direct messages
      messageChannel.bind('message-updated', (updatedMessage: DirectMessage) => {
        setDirectMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === updatedMessage.id ? updatedMessage : message
          )
        );
      });
    }

    return () => {
      channelsChannel.unbind_all();
      channelsChannel.unsubscribe();
      if (messageChannel) {
        messageChannel.unbind_all();
        messageChannel.unsubscribe();
      }
    };
  }, [selectedChannelId, currentConversationId]);

  const handleCreateChannel = async (name: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/channels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        console.error('Error creating channel:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const currentChannel = channels.find(channel => channel.id === selectedChannelId);

  const handleSelectUser = async (userId: string) => {
    setSelectedUserId(userId);
    setSelectedChannelId(undefined);
    setCurrentPage(0);
    setHasMoreMessages(false);
    setDirectMessages([]);

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherUserId: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get/create conversation');
      }
      
      const { conversation } = await response.json();
      setCurrentConversationId(conversation.id);

      const messagesResponse = await fetch(
        `${API_URL}/api/conversations/${conversation.id}/messages?page=0`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
      
      const { messages, hasMore } = await messagesResponse.json();
      setDirectMessages(messages);
      setHasMoreMessages(hasMore);
    } catch (error) {
      console.error('Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load conversation');
    }
  };

  const handleSendMessage = async (content: string, files?: FileMetadata[]) => {
    try {
      if (!selectedChannelId && !currentConversationId) {
        throw new Error('No channel or conversation selected');
      }

      const token = await getToken();
      const endpoint = selectedChannelId 
        ? `${API_URL}/api/messages`
        : `${API_URL}/api/conversations/${currentConversationId}/messages`;

      const body = {
        content,
        ...(selectedChannelId && { channel_id: selectedChannelId }),
        ...(files?.length && { files })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      // No need to update state here - Pusher will handle it
      await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) {
        console.error('Error adding reaction:', response.statusText);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (!currentConversationId || isLoadingMessages || !hasMoreMessages) return;

    try {
      setIsLoadingMessages(true);
      const token = await getToken();
      const nextPage = currentPage + 1;
      
      const response = await fetch(
        `${API_URL}/api/conversations/${currentConversationId}/messages?page=${nextPage}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const { messages, hasMore } = await response.json();
      setDirectMessages(prevMessages => [...messages, ...prevMessages]);
      setHasMoreMessages(hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  if (error) {
    return <div className="p-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar 
        channels={channels} 
        users={users} 
        selectedChannelId={selectedChannelId}
        selectedUserId={selectedUserId}
        currentUserId={userId || ''}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={handleCreateChannel}
        onSelectUser={handleSelectUser}
      />
      <ChatArea 
        messages={selectedChannelId ? messages : directMessages} 
        users={users}
        currentChannel={currentChannel}
        currentConversation={selectedUserId ? { userId: selectedUserId } : undefined}
        onSendMessage={handleSendMessage}
        onAddReaction={handleAddReaction}
        onLoadMore={loadMoreMessages}
        isLoadingMessages={isLoadingMessages}
        hasMoreMessages={hasMoreMessages}
      />
    </div>
  );
};

export default MessagePage;

