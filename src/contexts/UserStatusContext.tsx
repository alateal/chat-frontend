import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import Pusher from 'pusher-js';

const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
  cluster: import.meta.env.VITE_PUSHER_CLUSTER,
  enabledTransports: ['ws', 'wss'],
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UserStatus {
  [key: string]: boolean;
}

interface UserStatusContextType {
  userStatuses: UserStatus;
}

// Create and export the context
export const UserStatusContext = createContext<UserStatusContextType>({ userStatuses: {} });

// Export the hook separately
export function useUserStatus() {
  const context = useContext(UserStatusContext);
  if (!context) {
    throw new Error('useUserStatus must be used within a UserStatusProvider');
  }
  return context;
}

export const UserStatusProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, userId } = useAuth();
  const [userStatuses, setUserStatuses] = useState<UserStatus>({});

  // Update current user's status and handle real-time updates
  useEffect(() => {
    if (!userId) return;

    const updateStatus = async (isOnline: boolean) => {
      try {
        const token = await getToken();
        await fetch(`${API_URL}/api/users/status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOnline })
        });

        setUserStatuses(prev => ({
          ...prev,
          [userId]: isOnline
        }));
      } catch (error) {
        console.error('Error updating status:', error);
      }
    };

    // Set up Pusher subscription
    const presenceChannel = pusher.subscribe('presence');
    presenceChannel.bind('status-updated', (data: { userId: string; isOnline: boolean }) => {
      setUserStatuses(prev => ({
        ...prev,
        [data.userId]: data.isOnline
      }));
    });

    // Initial status update
    updateStatus(true);

    // Only handle window/tab close
    const handleBeforeUnload = () => {
      updateStatus(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Fetch all user statuses initially and periodically
    const fetchAllStatuses = async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/api/users/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch user statuses');
        
        const { userStatuses: newStatuses } = await response.json();
        setUserStatuses(prev => ({
          ...prev,
          ...newStatuses,
          [userId]: true // Ensure current user shows as online
        }));
      } catch (error) {
        console.error('Error fetching user statuses:', error);
      }
    };

    fetchAllStatuses();
    const intervalId = setInterval(fetchAllStatuses, 120000);

    return () => {
      updateStatus(false);
      clearInterval(intervalId);
      presenceChannel.unbind_all();
      presenceChannel.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [userId, getToken]);

  return (
    <UserStatusContext.Provider value={{ userStatuses }}>
      {children}
    </UserStatusContext.Provider>
  );
}; 