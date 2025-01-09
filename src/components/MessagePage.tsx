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

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ['ws', 'wss'],
  logToConsole: true
});

const MessagePage = () => {
  const { getToken } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

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
    channelsChannel.bind('new-channel', (newChannel: Channel) => {
      setChannels(prevChannels => {
        if (prevChannels.some(channel => channel.id === newChannel.id)) {
          return prevChannels;
        }
        return [...prevChannels, newChannel];
      });
    });

    let messageChannel: any;
    if (selectedChannelId) {
      messageChannel = pusher.subscribe(`channel-${selectedChannelId}`);
      
      messageChannel.bind('new-message', (newMessage: Message) => {
        console.log('Received new message:', newMessage);
        setMessages(prevMessages => {
          if (prevMessages.some(message => message.id === newMessage.id)) {
            return prevMessages;
          }
          return [...prevMessages, newMessage];
        });
      });

      messageChannel.bind('message-updated', (updatedMessage: Message) => {
        console.log('Message updated:', updatedMessage);
        setMessages(prevMessages => 
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
  }, [selectedChannelId]);

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

  const handleSendMessage = async (content: string) => {
    if (!selectedChannelId) return;

    try {
      const token = await getToken();
      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          channel_id: selectedChannelId
        }),
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

  if (error) {
    return <div className="p-4 text-error">Error: {error}</div>;
  }

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar 
        channels={channels} 
        users={users} 
        selectedChannelId={selectedChannelId}
        onSelectChannel={handleSelectChannel}
        onCreateChannel={handleCreateChannel}
      />
      <ChatArea 
        messages={messages} 
        users={users}
        currentChannel={currentChannel}
        onSendMessage={handleSendMessage}
        onAddReaction={handleAddReaction}
      />
    </div>
  );
};

export default MessagePage;

