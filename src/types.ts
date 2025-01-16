export interface User {
  id: string;
  username: string;
  imageUrl: string;
  email: string;
}

export interface Message {
  id: string;
  created_at: string;
  content: string;
  created_by: string;
  conversation_id: string;
  parent_message_id?: string;
  reactions?: Reaction[];
  file_attachments?: FileAttachment[];
}

export interface Conversation {
  id: string;
  created_at: string;
  name?: string;
  created_by: string;
  conversation_members: string[]; // Array of user IDs
  is_channel: boolean;
}

export interface Reaction {
  emoji: string;
  users: string[]; // Array of user IDs
}

export interface FileAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  isTemp?: boolean;
}

export interface UserStatus {
  id: string;
  is_online: boolean;
  user_id: string;
}

export interface ConversationMember {
  user_id: string;
  created_at: string;
  conversation_id: string;
}
