interface User {
  id: string;
  name: string;
  status: 'online' | 'offline';
  avatar: string;
}

interface DirectMessageListProps {
  users: User[];
}

const DirectMessageList = ({ users }: DirectMessageListProps) => {
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Direct Messages</h2>
        <button className="btn btn-ghost btn-xs">+</button>
      </div>
      <ul className="menu menu-sm">
        {users.map((user) => (
          <li key={user.id}>
            <a className="hover:bg-base-100">
              <div className={`w-2 h-2 rounded-full ${
                user.status === 'online' ? 'bg-success' : 'bg-base-content/30'
              }`} />
              {user.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DirectMessageList; 