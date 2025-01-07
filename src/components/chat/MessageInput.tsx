const MessageInput = () => {
  return (
    <div className="p-4 border-t border-base-content/10">
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Message #general"
          className="input input-bordered flex-1"
        />
        <button className="btn btn-primary">Send</button>
      </div>
    </div>
  );
};

export default MessageInput; 