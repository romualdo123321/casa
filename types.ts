export type UserStatus = 'online' | 'busy' | 'away' | 'invisible' | 'offline';

export interface UserProfile {
  id: string;
  nick: string;
  email: string;
  avatar: string; // Base64 Data URL, preset image path, or external URL
  status: UserStatus;
  subNick?: string; // Status message (ex: "Ouvindo Linkin Park - In The End")
  musicStatus?: string;
  userColor?: string; // MSN Nickname / text color
  registered?: boolean;
  isAdmin?: boolean;
  lastSeen?: number;
  joinedAt?: number;
  ip?: string;
}

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'file'
  | 'nudge'
  | 'system'
  | 'announcement'
  | 'banner';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  sender: UserProfile;
  recipientId?: string; // Defined for private 1-on-1 chats
  isPrivate?: boolean;
  fontColor?: string;
  fontSize?: 'small' | 'normal' | 'large';
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  audioData?: string; // Base64 audio/webm or wav
  audioDuration?: number; // In seconds
  bannerTitle?: string;
  bannerImage?: string;
  bannerLink?: string;
  bannerButtonLabel?: string;
  announcementColor?: string;
  reactions?: Record<string, string[]>; // emoji -> array of userIds
  timestamp: number;
  time: string;
}

export interface VoteBanSession {
  id: string;
  targetUser: UserProfile;
  initiatedBy: UserProfile;
  reason: string;
  votes: string[]; // List of userIds who voted
  requiredVotes: number; // Defaults to 5
  createdAt: number;
  expiresAt: number;
  durationSeconds: number; // 60 seconds (1 min)
  status: 'active' | 'passed' | 'expired';
}

export interface OfflineMemo {
  id: string;
  targetEmail: string;
  senderNick: string;
  senderEmail: string;
  senderAvatar: string;
  text?: string;
  audioData?: string;
  videoData?: string;
  fileUrl?: string;
  fileName?: string;
  type: 'text' | 'audio' | 'video' | 'file';
  read: boolean;
  timestamp: number;
  time: string;
}

export interface AutoBannerConfig {
  enabled: boolean;
  title: string;
  text: string;
  imageUrl?: string;
  linkUrl?: string;
  buttonLabel?: string;
  intervalMinutes: number;
  lastSentAt?: number;
}
