import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { ChatRoom } from '../types/database';

function ChatRoomList() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [password, setPassword] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Subscribe to chat rooms
    const subscription = supabase
      .channel('chat_rooms')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_rooms'
      }, () => {
        loadRooms();
      })
      .subscribe();

    // Initial load
    loadRooms();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, navigate]);

  const loadRooms = async () => {
    try {
      const { data, error: roomsError } = await supabase
        .from('chat_rooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (roomsError) throw roomsError;
      setRooms(data || []);
    } catch (err) {
      console.error("Error loading rooms:", err);
      setError('Error loading rooms');
    }
  };

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newRoomName.trim()) return;

    try {
      setIsLoading(true);
      setError('');

      const { error: insertError } = await supabase
        .from('chat_rooms')
        .insert([{
          name: newRoomName.trim(),
          created_by: user.id,
          password: password || null
        }]);

      if (insertError) throw insertError;
      
      setNewRoomName('');
      setPassword('');
    } catch (err) {
      console.error("Error creating room:", err);
      setError('Error creating room');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!user) return;

    try {
      setError('');
      
      // First delete all messages in the room
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', roomId);

      if (messagesError) throw messagesError;

      // Then delete the room itself
      const { error: roomError } = await supabase
        .from('chat_rooms')
        .delete()
        .eq('id', roomId)
        .eq('created_by', user.id); // Ensure only creator can delete

      if (roomError) throw roomError;
    } catch (err) {
      console.error("Error deleting room:", err);
      setError('Error deleting room');
    }
  };

  const joinRoom = async (roomId: string, password?: string) => {
    const room = rooms.find(r => r.id === roomId);
    
    if (room?.password && room.password !== password) {
      setError('Incorrect password');
      return;
    }

    navigate(`/chat/${roomId}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (err) {
      console.error('Error signing out:', err);
      setError('Error signing out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Chat Rooms</h2>
            <div className="space-x-4">
              <button
                onClick={() => navigate('/settings')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Settings
              </button>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Create New Room</h3>
              <form onSubmit={createRoom} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !newRoomName.trim()}
                  className={`w-full ${
                    isLoading || !newRoomName.trim() ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  } text-white px-4 py-2 rounded-md transition-colors`}
                >
                  {isLoading ? 'Creating...' : 'Create Room'}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Available Rooms</h3>
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className="border rounded-md p-4 hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{room.name}</h4>
                      <div className="flex space-x-2">
                        {room.password ? (
                          <>
                            <input
                              type="password"
                              placeholder="Enter password"
                              className="rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500"
                              onChange={(e) => setJoinPassword(e.target.value)}
                            />
                            <button
                              onClick={() => joinRoom(room.id, joinPassword)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                            >
                              Join
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => joinRoom(room.id)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            Join
                          </button>
                        )}
                        {user && room.created_by === user.id && (
                          <button
                            onClick={() => deleteRoom(room.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                            title="Delete Room"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatRoomList;