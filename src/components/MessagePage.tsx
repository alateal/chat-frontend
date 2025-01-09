import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chat/ChatArea';
import Pusher from 'pusher-js';

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
          fetch('http://localhost:3000/api/channels', { headers }),
          fetch('http://localhost:3000/api/messages', { headers }),
          fetch('http://localhost:3000/api/users', { headers })
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

    // Handle new channels
    channelsChannel.bind('new-channel', (newChannel: Channel) => {
      setChannels(prevChannels => {
        if (prevChannels.some(channel => channel.id === newChannel.id)) {
          return prevChannels;
        }
        return [...prevChannels, newChannel];
      });
    });

    // Handle channel messages
    if (selectedChannelId) {
      messageChannel = pusher.subscribe(`channel-${selectedChannelId}`);
      
      messageChannel.bind('new-message', (newMessage: Message) => {
        console.log('Received channel message:', newMessage);
        setMessages(prevMessages => {
          if (prevMessages.some(message => message.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

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
        console.log('Received direct message:', newMessage);
        setDirectMessages(prevMessages => {
          if (prevMessages.some(msg => msg.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

      // Add handler for message updates (reactions)
      messageChannel.bind('message-updated', (updatedMessage: DirectMessage) => {
        console.log('Direct message updated:', updatedMessage);
        setDirectMessages(prevMessages => 
          prevMessages.map(message => 
            message.id === updatedMessage.id ? updatedMessage : message
          )
        );
      });
    }

    // Cleanup subscriptions
    return () => {
      console.log('Cleaning up Pusher subscriptions');
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
      const response = await fetch('http://localhost:3000/api/channels', {
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
      const response = await fetch('http://localhost:3000/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherUserId: userId }),
      });

      if (!response.ok) throw new Error('Failed to get/create conversation');
      
      const { conversation } = await response.json();
      setCurrentConversationId(conversation.id);

      const messagesResponse = await fetch(
        `http://localhost:3000/api/conversations/${conversation.id}/messages?page=0`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
      
      const { messages, hasMore } = await messagesResponse.json();
      setDirectMessages(messages);
      setHasMoreMessages(hasMore);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedChannelId && !currentConversationId) return;

    try {
      const token = await getToken();
      const endpoint = selectedChannelId 
        ? 'http://localhost:3000/api/messages'
        : `http://localhost:3000/api/conversations/${currentConversationId}/messages`;

      const body = selectedChannelId
        ? { content, channel_id: selectedChannelId }
        : { content };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('Error sending message:', response.statusText);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:3000/api/messages/${messageId}/reactions`, {
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
        `http://localhost:3000/api/conversations/${currentConversationId}/messages?page=${nextPage}`, 
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

