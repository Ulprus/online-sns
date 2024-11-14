interface ChatHeaderProps {
  roomName: string;
  navigate: (path: string) => void;
}

function ChatHeader({ roomName, navigate }: ChatHeaderProps) {
  const handleSignOut = async () => {
    try {
      await navigate('/');
    } catch (err) {
      console.error('Error navigating:', err);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold">{roomName}</h1>
      </div>
      <div className="space-x-4">
        <button
          onClick={() => navigate('/settings')}
          className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
        >
          Settings
        </button>
        <button
          onClick={() => navigate('/chat')}
          className="px-4 py-2 bg-blue-700 rounded hover:bg-blue-800"
        >
          All Rooms
        </button>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;