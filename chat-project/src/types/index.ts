// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  createdAt: Date;
}

// Channel Types
export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  createdBy: string;
  createdAt: Date;
  memberCount?: number;
}

// Thread Types
export interface Thread {
  id: string;
  channelId: string;
  title: string;
  createdBy: string;
  createdAt: Date;
  messageCount?: number;
  lastMessageAt?: Date;
}

// Message Types
export interface Message {
  id: string;
  threadId: string;
  channelId: string;
  content: string;
  userId: string;
  user?: User;
  type: 'text' | 'file' | 'system';
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  moderationStatus?: 'pending' | 'approved' | 'flagged' | 'removed';
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
