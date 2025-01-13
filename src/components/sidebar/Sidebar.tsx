import { useState } from 'react';
import { useUserStatus } from '../../contexts/UserStatusContext';
import { User, Conversation } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  users: User[];
  currentConversationId?: string;
  currentUserId: string;
  onSelectConversation: (conversationId: string) => void;
  onCreateConversation: (isChannel: boolean, members: string[], name?: string) => void;
  userStatuses: { [key: string]: boolean };
}

const Sidebar = ({
  conversations,
  users,
  currentConversationId,
  currentUserId,
  onSelectConversation,
  onCreateConversation,
}: SidebarProps) => {
  const { userStatuses } = useUserStatus();
  const [showNewChannelModal, setShowNewChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');

  const channels = conversations.filter(conv => conv.is_channel);

  const handleCreateChannel = async () => {
    await onCreateConversation(true, [currentUserId], newChannelName);
    setShowNewChannelModal(false);
    setNewChannelName('');
  };

  return (
    <div className="w-64 bg-white border-r border-base-200 flex flex-col">
      {/* Channels Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900">Channels</h2>
            <button
              onClick={() => setShowNewChannelModal(true)}
              className="btn btn-ghost btn-sm text-gray-600 hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Channels List */}
          <div className="space-y-1">
            {channels.map(channel => (
              <button
                key={channel.id}
                onClick={() => onSelectConversation(channel.id)}
                className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 transition-colors
                  ${currentConversationId === channel.id ? 'bg-gray-100' : ''}`}
              >
                <span className="text-gray-500">#</span> {channel.name}
              </button>
            ))}
          </div>
        </div>

        {/* Direct Messages Section */}
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-2 text-gray-900">Direct Messages</h2>
          <div className="space-y-1">
            {users
              .filter(user => user.id !== currentUserId)
              .map(user => {
                const dmConversation = conversations.find(
                  conv => !conv.is_channel && 
                  conv.conversation_members.length === 2 &&
                  conv.conversation_members.includes(user.id) &&
                  conv.conversation_members.includes(currentUserId)
                );

                const isActive = dmConversation?.id === currentConversationId;

                return (
                  <button
                    key={user.id}
                    onClick={() => onCreateConversation(false, [user.id, currentUserId])}
                    className={`w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 transition-colors
                      ${isActive ? 'bg-gray-100' : ''}`}
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full overflow-hidden">
                        <img
                          src={user.imageUrl}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white
                          ${userStatuses[user.id] ? 'bg-green-500' : 'bg-gray-300'}`}
                      />
                    </div>
                    <span className="text-gray-700">{user.username}</span>
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* New Channel Modal */}
      {showNewChannelModal && (
        <div className="modal modal-open">
          <div className="modal-box bg-white">
            <h3 className="font-bold text-lg text-gray-900">Create a new channel</h3>
            <div className="form-control">
              <label className="label">
                <span className="label-text text-gray-700">Channel name</span>
              </label>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                className="input input-bordered bg-white text-gray-900"
                placeholder="new-channel"
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-ghost text-gray-600 hover:bg-gray-100"
                onClick={() => setShowNewChannelModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn bg-blue-500 hover:bg-blue-600 text-white border-none"
                onClick={handleCreateChannel}
                disabled={!newChannelName.trim()}
              >
                Create Channel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 