import { format } from 'date-fns';
import type { Message } from '../types/database';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | undefined;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

function MessageList({ messages, currentUserId, messagesEndRef }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.user_id === currentUserId ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-xs md:max-w-md p-3 rounded-lg ${
              message.user_id === currentUserId
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.profile?.avatar_url && (
                <img
                  src={message.profile.avatar_url}
                  alt={message.profile.username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="font-bold text-sm">
                {message.profile?.username || 'Unknown User'}
              </div>
            </div>
            <div className="mt-1">{message.content}</div>
            <div className="text-xs mt-1 opacity-75">
              {format(new Date(message.created_at), 'HH:mm')}
            </div>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default MessageList;