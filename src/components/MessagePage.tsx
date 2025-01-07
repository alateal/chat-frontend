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

  return (
    <div className="flex h-screen bg-base-200">
      <Sidebar channels={channels} users={users} />
      <ChatArea messages={messages} />
    </div>
  );
};

export default MessagePage;
