import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from './sidebar/Sidebar';
import ChatArea from './chat/ChatArea';

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
}

interface User {
  id: string;
}

const MessagePage = () => {
  const { getToken } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        };

        const [channelsRes, messagesRes, usersRes] = await Promise.all([
          fetch('http://localhost:3000/api/channels', { headers }),
          fetch('http://localhost:3000/api/messages', { headers }),
          fetch('http://localhost:3000/api/users', { headers })
        ]);
        
        const channelsData = await channelsRes.json();
        const messagesData = await messagesRes.json();
        const usersData = await usersRes.json();
        
        setChannels(channelsData.channels);
        setMessages(messagesData.messages);
        setUsers(usersData.users);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [getToken]);

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

      if (response.ok) {
        const newChannel = await response.json();
        setChannels(prevChannels => [...prevChannels, newChannel]);
      }
    } catch (error) {
      console.error('Error creating channel:', error);
    }
  };

  const handleSelectChannel = (channelId: string) => {
    setSelectedChannelId(channelId);
  };

  const currentChannel = channels.find(channel => channel.id === selectedChannelId);

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
        currentChannel={currentChannel}
      />
    </div>
  );
};

export default MessagePage;
