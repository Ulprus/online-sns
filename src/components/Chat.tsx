import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import type { Message } from '../types/database';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';

function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [roomName, setRoomName] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!roomId || !user) return;

    console.log('Setting up real-time subscription for room:', roomId);

    // Set up real-time subscription first
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        async (payload) => {
          console.log('Real-time message received:', payload);
          
          // Fetch complete message with profile
          const { data: messageWithProfile } = await supabase
            .from('messages')
            .select(`
              *,
              profiles (
                id,
                username,
                avatar_url,
                updated_at
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithProfile) {
            const formattedMessage = {
              ...messageWithProfile,
              profile: messageWithProfile.profiles,
              profiles: undefined
            };

            setMessages(prevMessages => {
              // Check for duplicates
              const isDuplicate = prevMessages.some(msg => msg.id === formattedMessage.id);
              if (isDuplicate) return prevMessages;
              return [...prevMessages, formattedMessage];
            });

            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Then fetch initial data
    const fetchInitialData = async () => {
      try {
        // Fetch room details
        const { data: room, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;
        if (room) setRoomName(room.name);

        // Fetch initial messages
        const { data: initialMessages, error: messagesError } = await supabase
          .from('messages')
          .select(`
            *,
            profiles (
              id,
              username,
              avatar_url,
              updated_at
            )
          `)
          .eq('room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;

        if (initialMessages) {
          const formattedMessages = initialMessages.map(msg => ({
            ...msg,
            profile: msg.profiles,
            profiles: undefined
          }));
          setMessages(formattedMessages);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error('Error loading chat data:', err);
        setError('Failed to load chat data');
      }
    };

    if (roomId && user) {
      fetchInitialData();
    }

    // Cleanup subscription
    return () => {
      console.log('Cleaning up subscription');
      channel.unsubscribe();
    };
  }, [roomId, user]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !user || !roomId) return;

    try {
      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([{
          room_id: roomId,
          user_id: user.id,
          content: content.trim()
        }])
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url,
            updated_at
          )
        `)
        .single();

      if (insertError) throw insertError;

      if (newMessage) {
        const formattedMessage = {
          ...newMessage,
          profile: newMessage.profiles,
          profiles: undefined
        };

        // No need for optimistic update since real-time subscription will handle it
        console.log('Message sent successfully:', formattedMessage);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <ChatHeader roomName={roomName} navigate={navigate} />
      <MessageList 
        messages={messages} 
        currentUserId={user?.id} 
        messagesEndRef={messagesEndRef}
      />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
}

export default Chat;