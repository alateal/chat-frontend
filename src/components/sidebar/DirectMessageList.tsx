interface User {
  id: string;
  username: string;
  imageUrl: string;
}

interface DirectMessageListProps {
  users: User[];
}

const DirectMessageList = ({ users = [] }: DirectMessageListProps) => {
  return (
    <div className="p-4 border-t border-base-content/10">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Direct Messages</h2>
        <button className="btn btn-ghost btn-xs">+</button>
      </div>
      <ul className="menu menu-sm">
        {users?.map((user) => (
          <li key={user.id}>
            <a className="hover:bg-base-100 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src={user.imageUrl || `https://ui-avatars.com/api/?name=${user.username}`}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              </div>
              <span>{user.username}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DirectMessageList; 