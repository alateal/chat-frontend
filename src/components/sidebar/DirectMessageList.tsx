import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useUserStatus } from '../../contexts/UserStatusContext';


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
  const { userStatuses } = useUserStatus();
  const [persistedUsers, setPersistedUsers] = useState<User[]>(users);

  // Keep users persisted even after logging out
  useEffect(() => {
    if (users.length > 0) {
      setPersistedUsers(users);
    }
  }, [users]);

  const sortedUsers = persistedUsers.sort((a, b) => {
    // Sort online users first, then by username
    const aOnline = userStatuses[a.id] || false;
    const bOnline = userStatuses[b.id] || false;
    if (aOnline !== bOnline) return bOnline ? 1 : -1;
    return a.username.localeCompare(b.username);
  });

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
                    transition-colors duration-300
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