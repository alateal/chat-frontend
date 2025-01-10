import { useState } from 'react';

interface Channel {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
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
            <button
              onClick={() => onSelectChannel(channel.id)}
              className={`
                w-full px-4 py-2 text-left transition-colors duration-200
                hover:bg-base-300 active:bg-base-300
                ${selectedChannelId === channel.id ? 'bg-base-300' : 'hover:bg-base-300/70'}
                rounded-lg
              `}
            >
              <span className="text-base-content"># {channel.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            className="modal-backdrop fixed inset-0"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="bg-base-100 p-6 rounded-lg w-80 shadow-xl relative">
            <button
              className="btn btn-sm btn-circle absolute right-2 top-2"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
            <h3 className="font-bold text-lg mb-4">Create New Channel</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="input input-bordered w-full mb-4"
                placeholder="Enter channel name"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button 
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelList; 