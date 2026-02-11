export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type LoginResponse = AuthResponse

// Type for MUI Select events
export type SelectChangeEvent<T = string> = React.ChangeEvent<{ value: T }>;

// Helper type for HTML elements  
export type HTMLElementRef = HTMLElement | null;

// WhatsApp Chat Types
export interface Contact {
  id: string;
  waId: string;
  name: string | null;
  customName: string | null;
  profilePic: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contact: Contact;
  lastMessageAt: string;
  unreadCount: number;
  messages: Message[];
  isWithin24Hours?: boolean;
  lastRelevantMessageTime?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  contactId: string;
  contact: Contact;
  type: MessageType;
  direction: 'INBOUND' | 'OUTBOUND';
  timestamp: string;
  textBody: string | null;
  caption: string | null;
  templateHeader: string | null;
  templateFooter: string | null;
  mediaId: string | null;
  mediaLocalPath: string | null;
  mediaFilename: string | null;
  mediaMimeType: string | null;
  isVoice: boolean | null;
  isAnimated: boolean | null;
  latitude: number | null;
  longitude: number | null;
  reactionEmoji: string | null;
  status: MessageStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  replyTo: Message | null;
  createdAt: string;
  updatedAt: string;
}

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'STICKER'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'REACTION'
  | 'UNSUPPORTED';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
