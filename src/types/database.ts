export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  updated_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  password?: string | null;
}

export interface Message {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
  profiles?: Profile;
}