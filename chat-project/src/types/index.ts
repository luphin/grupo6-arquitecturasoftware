// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  is_active: boolean;
  status: 'online' | 'offline' | 'away';
  createdAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  channel_type: 'public' | 'private';
  created_at: number;
  user_count: number;
}

export interface ChannelMember {
  id: string;
  joined_at: number;
  status: 'normal' | 'banned' | 'muted';
}

// Thread Types
export interface Thread {
  thread_id: string;
  thread_name: string;
  channel_id?: string;
}

// Message Types
export interface Message {
  id: string;
  thread_id: string;
  user_id: string;
  type: 'text' | 'file' | 'system';
  content: string;
  paths?: string[];
  created_at: string;
  updated_at: string;
}

// Messages Response
export interface MessagesResponse {
  items: Message[];
  next_cursor: string | null;
  has_more: boolean;
}

// Attachment Types
export interface Attachment {
  id: string;
  messageId: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: Date;
}

// Presence Types
export interface PresenceStatus {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

// Moderation Types
export interface ModerationEvent {
  id: string;
  messageId: string;
  type: 'warning' | 'block' | 'remove';
  reason: string;
  moderatedAt: Date;
}
