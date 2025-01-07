import { useState } from 'react';

interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface ChannelListProps {
  channels: Channel[];
  selectedChannelId?: string;
  onCreateChannel: (name: string) => void;
  onSelectChannel: (channelId: string) => void;
}

const ChannelList = ({ 
  channels, 
  selectedChannelId,
  onCreateChannel, 
  onSelectChannel 
}: ChannelListProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const handleSubmit = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim());
      setNewChannelName('');
      setIsModalOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-sm">Channels</h2>
        <button 
          className="btn btn-ghost btn-xs"
          onClick={() => setIsModalOpen(true)}
        >
          +
        </button>
      </div>
      <ul className="menu menu-sm">
        {channels.map((channel) => (
          <li key={channel.id}>
            <a 
              className={`hover:bg-base-100 ${selectedChannelId === channel.id ? 'bg-base-200' : ''}`}
              onClick={() => onSelectChannel(channel.id)}
            >
              <span className="text-base-content/70">#</span> {channel.name}
            </a>
          </li>
        ))}
      </ul>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-base-100 p-6 rounded-lg w-80">
            <h3 className="font-bold text-lg mb-4">Channel Name</h3>
            <input
              type="text"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="input input-bordered w-full mb-4"
              placeholder="Enter channel name"
            />
            <div className="flex justify-between">
              <button 
                className="btn btn-primary"
                onClick={handleSubmit}
              >
                Create
              </button>
              <button 
                className="btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList; 