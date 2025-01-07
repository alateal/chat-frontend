const DirectMessageList = () => {
  const directMessages = [
    { id: 1, name: 'John Doe', status: 'online' },
    { id: 2, name: 'Jane Smith', status: 'offline' },
    { id: 3, name: 'Bob Johnson', status: 'online' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Direct Messages</h2>
        <button className="btn btn-ghost btn-xs">+</button>
      </div>
      <ul className="menu menu-sm">
        {directMessages.map((dm) => (
          <li key={dm.id}>
            <a className="hover:bg-base-100">
              <div className={`w-2 h-2 rounded-full ${
                dm.status === 'online' ? 'bg-success' : 'bg-base-content/30'
              }`} />
              {dm.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DirectMessageList; 