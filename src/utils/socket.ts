import { io, Socket } from 'socket.io-client';
import type { ChatMessage, UserProfile, VoteBanSession } from '../types';

let socket: Socket | null = null;

export interface ServerToClientEvents {
  'user:list': (users: UserProfile[]) => void;
  'user:joined': (user: UserProfile) => void;
  'user:left': (userId: string) => void;
  'user:updated': (user: UserProfile) => void;
  'user:kicked': (data: { userId: string; reason: string }) => void;
  'user:banned': (data: { reason: string }) => void;
  'chat:message': (message: ChatMessage) => void;
  'chat:nudge': (data: { sender: UserProfile; recipientId?: string; isPrivate?: boolean }) => void;
  'chat:cleared': () => void;
  'chat:reaction_updated': (data: { messageId: string; reactions: Record<string, string[]> }) => void;
  'voteban:update': (session: VoteBanSession | null) => void;
  'init:state': (data: {
    users: UserProfile[];
    messages: ChatMessage[];
    activeVoteBan: VoteBanSession | null;
  }) => void;
  // WebRTC P2P Webcam Call Signaling
  'webrtc:incoming_call': (data: {
    caller: UserProfile;
    offer: any;
  }) => void;
  'webrtc:call_accepted': (data: {
    responder: UserProfile;
    answer: any;
  }) => void;
  'webrtc:ice_candidate': (data: {
    senderId: string;
    candidate: any;
  }) => void;
  'webrtc:call_ended': (data: { senderId: string }) => void;
  'webrtc:call_rejected': (data: { responderId: string; reason?: string }) => void;
}

export interface ClientToServerEvents {
  'user:join': (user: UserProfile) => void;
  'user:update': (user: UserProfile) => void;
  'user:leave': (userId: string) => void;
  'chat:send_message': (message: ChatMessage) => void;
  'chat:send_nudge': (data: { sender: UserProfile; recipientId?: string; isPrivate?: boolean }) => void;
  'chat:react': (data: { messageId: string; emoji: string; userId: string }) => void;
  'admin:clear_chat': () => void;
  'admin:announcement': (message: ChatMessage) => void;
  'admin:banner': (message: ChatMessage) => void;
  'admin:kick': (data: { targetUserId: string; reason: string }) => void;
  'admin:ban': (data: { targetUserId: string; reason: string }) => void;
  'voteban:start': (session: VoteBanSession) => void;
  'voteban:vote': (data: { sessionId: string; userId: string }) => void;
  'voteban:end': (sessionId: string) => void;
  // WebRTC P2P Webcam Call Signaling
  'webrtc:call_user': (data: {
    targetUserId: string;
    caller: UserProfile;
    offer: any;
  }) => void;
  'webrtc:answer_call': (data: {
    callerId: string;
    responder: UserProfile;
    answer: any;
  }) => void;
  'webrtc:ice_candidate': (data: {
    targetUserId: string;
    senderId: string;
    candidate: any;
  }) => void;
  'webrtc:end_call': (data: { targetUserId: string; senderId: string }) => void;
  'webrtc:reject_call': (data: { callerId: string; responderId: string; reason?: string }) => void;
}

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    // In browser, connect to current host origin
    socket = io(typeof window !== 'undefined' ? window.location.origin : '', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('⚡ Socket.io conectado com sucesso:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io desconectado:', reason);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Erro de conexão Socket.io:', error.message);
    });
  }

  return socket;
}
