import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Pusher from 'pusher-js';

// Initialize Pusher
const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ['ws', 'wss'],
});

interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface UserStatus {
  [key: string]: boolean;
}

interface DirectMessageListProps {
  users: User[];
  selectedUserId?: string;
  onSelectUser: (userId: string) => void;
  currentUserId: string;
}

const DirectMessageList = ({ 
  users = [], 
  selectedUserId,
  onSelectUser,
  currentUserId 
}: DirectMessageListProps) => {
  const { getToken } = useAuth();
  const [userStatuses, setUserStatuses] = useState<UserStatus>({});
  const sortedUsers = users.sort((a, b) => a.username.localeCompare(b.username));

  // Fetch initial user statuses
  useEffect(() => {
    const fetchUserStatuses = async () => {
      try {
        const token = await getToken();
        const response = await fetch('http://localhost:3000/api/users/status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user statuses');
        
        const { userStatuses } = await response.json();
        setUserStatuses(userStatuses);
      } catch (error) {
        console.error('Error fetching user statuses:', error);
      }
    };

    fetchUserStatuses();
  }, [getToken]);

  // Subscribe to status updates
  useEffect(() => {
    const presenceChannel = pusher.subscribe('presence');
    
    presenceChannel.bind('status-updated', (data: { userId: string; isOnline: boolean }) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.isOnline
      }));
    });

    return () => {
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
    };
  }, []);

  // Update user status when component mounts/unmounts
  useEffect(() => {
    const updateStatus = async (isOnline: boolean) => {
      try {
        const token = await getToken();
        await fetch('http://localhost:3000/api/users/status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOnline })
        });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    // Set online when component mounts
    updateStatus(true);

    // Set offline when component unmounts
    return () => {
      updateStatus(false);
    };
  }, [getToken]);

  return (
    <div className="p-4 border-t border-base-content/10">
      <h2 className="font-semibold text-sm mb-2">Direct Messages</h2>
      <ul className="menu menu-sm">
        {sortedUsers.map((user) => (
          <li key={user.id}>
            <a 
              className={`
                hover:bg-base-100 flex items-center gap-2 
                ${selectedUserId === user.id ? 'bg-base-200' : ''}
              `}
              onClick={() => onSelectUser(user.id)}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden">
                  <img 
                    src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.username}`}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div 
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-base-100
                    ${userStatuses[user.id] ? 'bg-success' : 'bg-base-300'}`}
                />
              </div>
              <span>{user.username}</span>
              {user.id === currentUserId && (
                <span className="text-xs opacity-50 ml-auto">(you)</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DirectMessageList; 