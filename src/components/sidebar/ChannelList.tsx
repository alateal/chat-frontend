const ChannelList = () => {
  const channels = [
    { id: 1, name: 'general' },
    { id: 2, name: 'random' },
    { id: 3, name: 'announcements' },
  ];

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Channels</h2>
        <button className="btn btn-ghost btn-xs">+</button>
      </div>
      <ul className="menu menu-sm">
        {channels.map((channel) => (
          <li key={channel.id}>
            <a className="hover:bg-base-100">
              <span className="text-base-content/70">#</span> {channel.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChannelList; 