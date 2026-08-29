import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, UserProfile, UserStatus, VoteBanSession, AutoBannerConfig, MessageType, WebRTCCallSession } from './types';
import LoginScreen from './components/LoginScreen';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import AudioRecorder from './components/AudioRecorder';
import UserListSidebar from './components/UserListSidebar';
import UserProfileModal from './components/UserProfileModal';
import PrivateChatModal from './components/PrivateChatModal';
import WebcamCallModal from './components/WebcamCallModal';
import IncomingCallNotification from './components/IncomingCallNotification';
import VoteBanBanner from './components/VoteBanBanner';
import VoteBanModal from './components/VoteBanModal';
import PhotoLightboxModal from './components/PhotoLightboxModal';
import AdminPanel from './components/AdminPanel';
import { PRESET_AVATARS } from './data/presetAvatars';
import {
  playMsnLoginSound,
  playMsnMessageSound,
  playMsnNudgeSound,
  playMsnSendSound,
} from './utils/audioEffects';
import { getSocket } from './utils/socket';

// Default welcome messages in salon
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_init_1',
    type: 'system',
    content: '🎉 Bem-vindo ao Salão Principal do Bate-Papo MSN! Respeite as regras e divirta-se.',
    sender: {
      id: 'usr_bot_msn',
      nick: '🦋 MSN Messenger Bot',
      email: 'sistema@msn.local',
      avatar: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
      status: 'online',
      subNick: 'Bate-Papo Oficial Conectado',
      userColor: '#0284c7',
      isAdmin: true,
    },
    timestamp: Date.now() - 1000 * 60 * 5,
    time: '18:30',
  },
];

const DEFAULT_AUTO_BANNER: AutoBannerConfig = {
  enabled: false,
  title: 'Mega Promoção MSN',
  text: 'Conheça os melhores produtos com desconto especial para membros do MSN! Clique no botão abaixo para conferir as ofertas imperdíveis.',
  imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=400&fit=crop&q=80',
  linkUrl: 'https://google.com',
  buttonLabel: 'Acessar Oferta Agora',
  intervalMinutes: 5,
  lastSentAt: 0,
};

const checkIsAdminRoute = () => {
  if (typeof window === 'undefined') return false;
  const search = window.location.search || '';
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';
  return search.includes('admin') || hash.includes('admin') || pathname.endsWith('/admin');
};

const MESSAGE_LIFETIME_MS = 3 * 60 * 60 * 1000; // 3 hours message retention in chat salon

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('msn_current_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => checkIsAdminRoute());
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('msn_chat_messages');
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        const now = Date.now();
        return parsed.filter((m) => now - m.timestamp < MESSAGE_LIFETIME_MS);
      }
    } catch {}
    return INITIAL_MESSAGES;
  });

  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);

  const [autoBannerConfig, setAutoBannerConfig] = useState<AutoBannerConfig>(() => {
    try {
      const saved = localStorage.getItem('msn_admin_auto_banner_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_AUTO_BANNER;
  });

  const [activePrivateRecipient, setActivePrivateRecipient] = useState<UserProfile | null>(null);
  const [activeWebcamSession, setActiveWebcamSession] = useState<WebRTCCallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<{ caller: UserProfile; offer: any } | null>(null);
  const [viewingProfileUser, setViewingProfileUser] = useState<UserProfile | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState(0);

  // Active Community Vote-Ban Session
  const [currentVoteBan, setCurrentVoteBan] = useState<VoteBanSession | null>(null);
  const [isVoteBanModalOpen, setIsVoteBanModalOpen] = useState(false);
  const [voteBanPreTarget, setVoteBanPreTarget] = useState<UserProfile | null>(null);

  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Listen to browser URL changes for ?admin=true
  useEffect(() => {
    const handleLocationChange = () => {
      setIsAdminRoute(checkIsAdminRoute());
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('msn_chat_messages', JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages]);

  // Persist current user in localStorage
  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('msn_current_user', JSON.stringify(currentUser));
      } catch {}
    } else {
      localStorage.removeItem('msn_current_user');
    }
  }, [currentUser]);

  // Persist auto banner config in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('msn_admin_auto_banner_config', JSON.stringify(autoBannerConfig));
    } catch {}
  }, [autoBannerConfig]);

  // Socket.io Real-time setup
  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    setIsSocketConnected(socket.connected);

    socket.on('connect', () => {
      setIsSocketConnected(true);
      if (currentUser) {
        socket.emit('user:join', currentUser);
      }
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    // Initial state sent by the server upon joining
    socket.on('init:state', (data) => {
      if (data.users && data.users.length > 0) {
        setOnlineUsers(data.users);
      }
      if (data.messages && data.messages.length > 0) {
        setMessages((prev) => {
          const combined = [...data.messages];
          // Ensure no duplicate IDs
          const map = new Map<string, ChatMessage>();
          for (const m of combined) {
            map.set(m.id, m);
          }
          for (const m of prev) {
            if (!map.has(m.id)) map.set(m.id, m);
          }
          const now = Date.now();
          return Array.from(map.values()).filter((m) => now - m.timestamp < MESSAGE_LIFETIME_MS);
        });
      }
      if (data.activeVoteBan) {
        setCurrentVoteBan(data.activeVoteBan);
      }
    });

    // User list update broadcasted from server
    socket.on('user:list', (users) => {
      setOnlineUsers(users);
    });

    // User joined
    socket.on('user:joined', (user) => {
      if (user.id !== currentUser?.id) {
        playMsnLoginSound();
      }
    });

    // User left
    socket.on('user:left', (userId) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    // User updated
    socket.on('user:updated', (updatedUser) => {
      setOnlineUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
      setMessages((prev) =>
        prev.map((m) =>
          m.sender.id === updatedUser.id ? { ...m, sender: { ...m.sender, ...updatedUser } } : m
        )
      );
    });

    // New chat message received from server
    socket.on('chat:message', (newMsg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      if (newMsg.sender.id !== currentUser?.id) {
        if (newMsg.type === 'nudge') {
          triggerScreenShake();
          playMsnNudgeSound();
        } else {
          playMsnMessageSound();
        }
      }
    });

    // Nudge event
    socket.on('chat:nudge', (data) => {
      if (!data.recipientId || data.recipientId === currentUser?.id) {
        triggerScreenShake();
        playMsnNudgeSound();
      }
    });

    // Chat cleared by admin
    socket.on('chat:cleared', () => {
      setMessages([]);
      localStorage.removeItem('msn_chat_messages');
    });

    // Reaction update
    socket.on('chat:reaction_updated', ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    });

    // Vote ban update
    socket.on('voteban:update', (session) => {
      setCurrentVoteBan(session);
    });

    // Kicked / Banned
    socket.on('user:kicked', ({ userId, reason }) => {
      if (userId === currentUser?.id) {
        alert(reason || 'Você foi expulso do chat pelo moderador.');
        handleLogout();
      }
    });

    socket.on('user:banned', ({ reason }) => {
      alert(reason || 'Você foi banido do chat.');
      handleLogout();
    });

    // Incoming WebRTC P2P Webcam Call
    socket.on('webrtc:incoming_call', ({ caller, offer }) => {
      console.log('📹 Chamada de vídeo P2P recebida de:', caller.nick);
      setIncomingCall({ caller, offer });
      playMsnNudgeSound();
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('init:state');
      socket.off('user:list');
      socket.off('user:joined');
      socket.off('user:left');
      socket.off('user:updated');
      socket.off('chat:message');
      socket.off('chat:nudge');
      socket.off('chat:cleared');
      socket.off('chat:reaction_updated');
      socket.off('voteban:update');
      socket.off('user:kicked');
      socket.off('user:banned');
      socket.off('webrtc:incoming_call');
    };
  }, [currentUser?.id]);

  // Setup BroadcastChannel for additional local tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    const channel = new BroadcastChannel('msn_chat_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'NEW_MESSAGE') {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      } else if (data.type === 'USER_JOINED') {
        setOnlineUsers((prev) => {
          const exists = prev.some((u) => u.id === data.user.id);
          if (exists) {
            return prev.map((u) => (u.id === data.user.id ? data.user : u));
          }
          return [...prev, data.user];
        });
      } else if (data.type === 'USER_UPDATED') {
        setOnlineUsers((prev) =>
          prev.map((u) => (u.id === data.user.id ? { ...u, ...data.user } : u))
        );
      } else if (data.type === 'USER_LEFT') {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
      } else if (data.type === 'CLEAR_CHAT') {
        setMessages([]);
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  // Auto-Cleanup: Purge messages older than 3 hours
  useEffect(() => {
    const purgeExpiredMessages = () => {
      const now = Date.now();
      setMessages((prev) => {
        const hasExpired = prev.some((m) => now - m.timestamp >= MESSAGE_LIFETIME_MS);
        if (!hasExpired) return prev;
        return prev.filter((m) => now - m.timestamp < MESSAGE_LIFETIME_MS);
      });
    };

    purgeExpiredMessages();
    const interval = setInterval(purgeExpiredMessages, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Nudge cooldown timer
  useEffect(() => {
    if (nudgeCooldown <= 0) return;
    const timer = setInterval(() => {
      setNudgeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [nudgeCooldown]);

  // Auto-Banner Dispatcher Timer
  useEffect(() => {
    if (!autoBannerConfig.enabled) return;

    const checkAutoBanner = () => {
      const lastSent = Number(localStorage.getItem('msn_admin_auto_last_sent') || '0');
      const targetIntervalMs = (autoBannerConfig.intervalMinutes || 5) * 60 * 1000;
      const now = Date.now();

      if (now - lastSent >= targetIntervalMs) {
        localStorage.setItem('msn_admin_auto_last_sent', now.toString());

        handleAdminSendBanner({
          title: autoBannerConfig.title,
          text: autoBannerConfig.text,
          imageUrl: autoBannerConfig.imageUrl,
          linkUrl: autoBannerConfig.linkUrl,
          buttonLabel: autoBannerConfig.buttonLabel,
        });

        const count = Number(localStorage.getItem('msn_admin_dispatch_count') || '0') + 1;
        localStorage.setItem('msn_admin_dispatch_count', count.toString());
      }
    };

    const interval = setInterval(checkAutoBanner, 3000);
    return () => clearInterval(interval);
  }, [autoBannerConfig]);

  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 800);
  };

  // URL Navigation Helpers
  const navigateToAdmin = () => {
    setIsAdminRoute(true);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('admin', 'true');
      window.history.pushState({}, '', url.toString());
    } catch {}
  };

  const navigateBackToChat = () => {
    setIsAdminRoute(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('admin');
      window.history.pushState({}, '', url.pathname + (url.search ? url.search : ''));
    } catch {}
  };

  // Admin Actions
  const handleAdminSendBanner = (bannerData: {
    title: string;
    text: string;
    imageUrl?: string;
    linkUrl?: string;
    buttonLabel?: string;
    themeColor?: string;
  }) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const themeClasses: Record<string, string> = {
      blue: 'bg-gradient-to-r from-blue-600/30 via-indigo-600/25 to-blue-500/30 border-blue-400/40 text-blue-100',
      gold: 'bg-gradient-to-r from-amber-600/30 via-orange-600/25 to-amber-500/30 border-amber-400/50 text-amber-100',
      emerald: 'bg-gradient-to-r from-emerald-600/30 via-teal-600/25 to-emerald-500/30 border-emerald-400/40 text-emerald-100',
      purple: 'bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-purple-500/30 border-purple-400/40 text-purple-100',
      rose: 'bg-gradient-to-r from-rose-600/30 via-red-600/25 to-rose-500/30 border-rose-400/40 text-rose-100',
    };

    const bannerMsg: ChatMessage = {
      id: 'banner_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'banner',
      content: bannerData.text,
      bannerTitle: bannerData.title,
      bannerImage: bannerData.imageUrl,
      bannerLink: bannerData.linkUrl,
      bannerButtonLabel: bannerData.buttonLabel || 'Acessar Link',
      announcementColor: bannerData.themeColor ? themeClasses[bannerData.themeColor] : themeClasses.blue,
      sender: {
        id: 'usr_msn_admin',
        nick: '📢 MSN Promo & Comunicados',
        email: 'admin@msn.local',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
        status: 'online',
        userColor: '#38bdf8',
        isAdmin: true,
      },
      timestamp: Date.now(),
      time: timeStr,
    };

    socketRef.current?.emit('admin:banner', bannerMsg);
    setMessages((prev) => [...prev, bannerMsg]);
    playMsnMessageSound();
  };

  const handleAdminSendAnnouncement = (content: string, color?: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const annMsg: ChatMessage = {
      id: 'ann_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'announcement',
      content,
      announcementColor: color || 'bg-amber-950/85 border-amber-500/80 text-amber-200',
      sender: {
        id: 'usr_admin_sys',
        nick: '🛡️ Moderação MSN',
        email: 'admin@msn.local',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80',
        status: 'online',
        userColor: '#fbbf24',
        isAdmin: true,
      },
      timestamp: Date.now(),
      time: timeStr,
    };

    socketRef.current?.emit('admin:announcement', annMsg);
    setMessages((prev) => [...prev, annMsg]);
    playMsnMessageSound();
  };

  const handleAdminClearChat = () => {
    socketRef.current?.emit('admin:clear_chat');
    setMessages([]);
    localStorage.removeItem('msn_chat_messages');
  };

  const handleAdminKickUser = (userId: string, userNick: string) => {
    socketRef.current?.emit('admin:kick', { targetUserId: userId, reason: 'Expulso pelo Administrador' });
    setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  // Handle Login
  const handleLogin = (userProfile: UserProfile) => {
    setCurrentUser(userProfile);
    socketRef.current?.emit('user:join', userProfile);

    // Broadcast a friendly login message to the public room
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const joinMsg: ChatMessage = {
      id: 'sys_join_' + Date.now(),
      type: 'system',
      content: `🟢 ${userProfile.nick} acabou de entrar no bate-papo!`,
      sender: userProfile,
      timestamp: Date.now(),
      time: timeStr,
    };
    setMessages((prev) => [...prev, joinMsg]);
    socketRef.current?.emit('chat:send_message', joinMsg);
  };

  // Handle Logout
  const handleLogout = () => {
    if (currentUser) {
      socketRef.current?.emit('user:leave', currentUser.id);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== currentUser.id));
    }
    setCurrentUser(null);
  };

  // Handle Public Message Send
  const handleSendMessage = (data: {
    content: string;
    msgType?: MessageType;
    fontColor?: string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    audioData?: string;
    audioDuration?: number;
    videoUrl?: string;
  }) => {
    if (!currentUser) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: data.msgType || 'text',
      content: data.content,
      sender: currentUser,
      fontColor: data.fontColor || currentUser.userColor || '#38bdf8',
      fontStyle: data.fontStyle || 'normal',
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      audioData: data.audioData,
      audioDuration: data.audioDuration,
      videoUrl: data.videoUrl,
      timestamp: Date.now(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    playMsnSendSound();
    socketRef.current?.emit('chat:send_message', newMsg);
  };

  // Handle Audio Note Send
  const handleSendAudio = (audioDataUrl: string, durationSeconds: number) => {
    if (!currentUser) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const audioMsg: ChatMessage = {
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'audio',
      content: '🎤 Mensagem de Voz',
      sender: currentUser,
      audioData: audioDataUrl,
      audioDuration: durationSeconds,
      timestamp: Date.now(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, audioMsg]);
    setIsRecordingAudio(false);
    playMsnSendSound();
    socketRef.current?.emit('chat:send_message', audioMsg);
  };

  // Handle Nudge / Chamar Atenção Trigger
  const handleTriggerNudge = (targetUser?: UserProfile) => {
    if (!currentUser || nudgeCooldown > 0) return;

    setNudgeCooldown(15);
    triggerScreenShake();
    playMsnNudgeSound();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nudgeMsg: ChatMessage = {
      id: 'ndg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: 'nudge',
      content: targetUser
        ? `${currentUser.nick} chamou a atenção de ${targetUser.nick}!`
        : `${currentUser.nick} acabou de chamar a atenção de todos na sala!`,
      sender: currentUser,
      recipientId: targetUser?.id,
      isPrivate: !!targetUser,
      timestamp: Date.now(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, nudgeMsg]);
    socketRef.current?.emit('chat:send_nudge', {
      sender: currentUser,
      recipientId: targetUser?.id,
      isPrivate: !!targetUser,
    });
    socketRef.current?.emit('chat:send_message', nudgeMsg);
  };

  // Handle Profile Update
  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProfile: UserProfile = {
      ...currentUser,
      ...updated,
    };
    setCurrentUser(newProfile);

    setOnlineUsers((prev) =>
      prev.map((u) => (u.id === newProfile.id ? newProfile : u))
    );

    setMessages((prev) =>
      prev.map((m) => (m.sender.id === newProfile.id ? { ...m, sender: newProfile } : m))
    );

    socketRef.current?.emit('user:update', newProfile);
  };

  // Handle Status Update
  const handleUpdateStatus = (newStatus: UserStatus) => {
    handleSaveProfile({ status: newStatus });
  };

  // Handle Emoji Reaction
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

    socketRef.current?.emit('chat:react', {
      messageId,
      emoji,
      userId: currentUser.id,
    });

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId) return msg;

        const currentReactions = { ...(msg.reactions || {}) };
        const userList = currentReactions[emoji] ? [...currentReactions[emoji]] : [];
        const index = userList.indexOf(currentUser.id);

        if (index > -1) {
          userList.splice(index, 1);
          if (userList.length === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = userList;
          }
        } else {
          userList.push(currentUser.id);
          currentReactions[emoji] = userList;
        }

        return { ...msg, reactions: currentReactions };
      })
    );
  };

  // Handle Community Vote-Ban: Start
  const handleStartVoteBan = (targetUserId: string, reason: string) => {
    if (!currentUser) return;
    const target = onlineUsers.find((u) => u.id === targetUserId);
    if (!target) return;

    const newVoteBan: VoteBanSession = {
      id: 'vb_' + Date.now(),
      targetUser: target,
      initiatedBy: currentUser,
      reason,
      votes: [currentUser.id],
      requiredVotes: 5,
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 1000,
      durationSeconds: 60,
      status: 'active',
    };

    setCurrentVoteBan(newVoteBan);
    socketRef.current?.emit('voteban:start', newVoteBan);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const startMsg: ChatMessage = {
      id: 'sys_' + Date.now(),
      type: 'announcement',
      content: `🗳️ VOTAÇÃO DE BANIMENTO: ${currentUser.nick} abriu votação para banir "${target.nick}" por 30 minutos! (1/5 votos). A votação encerra em 1 minuto.`,
      announcementColor: 'bg-amber-950/80 border-amber-500 text-amber-200',
      sender: {
        id: 'usr_mod',
        nick: '🛡️ Sistema de Moderação',
        email: 'mod@msn.local',
        avatar: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
        status: 'online',
        userColor: '#fbbf24',
      },
      timestamp: Date.now(),
      time: timeStr,
    };
    setMessages((prev) => [...prev, startMsg]);
    socketRef.current?.emit('chat:send_message', startMsg);
  };

  // Handle Community Vote-Ban: Cast Vote
  const handleCastVoteBan = (voteBanId: string) => {
    if (!currentUser || !currentVoteBan || currentVoteBan.id !== voteBanId) return;
    if (currentVoteBan.votes.includes(currentUser.id)) return;

    socketRef.current?.emit('voteban:vote', { sessionId: voteBanId, userId: currentUser.id });

    const updatedVotes = [...currentVoteBan.votes, currentUser.id];
    const totalVotes = updatedVotes.length;

    if (totalVotes >= currentVoteBan.requiredVotes) {
      const targetUser = currentVoteBan.targetUser;
      setCurrentVoteBan(null);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== targetUser.id));

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const passedMsg: ChatMessage = {
        id: 'sys_' + Date.now(),
        type: 'announcement',
        content: `⛔ VOTAÇÃO ENCERRADA: O usuário "${targetUser.nick}" atingiu os 5 votos e foi BANIDO da sala por 30 minutos!`,
        announcementColor: 'bg-rose-950/90 border-rose-500 text-rose-100',
        sender: {
          id: 'usr_mod',
          nick: '🛡️ Sistema de Moderação',
          email: 'mod@msn.local',
          avatar: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
          status: 'online',
          userColor: '#fbbf24',
        },
        timestamp: Date.now(),
        time: timeStr,
      };
      setMessages((prev) => [...prev, passedMsg]);
      socketRef.current?.emit('chat:send_message', passedMsg);
    } else {
      const updatedSession: VoteBanSession = {
        ...currentVoteBan,
        votes: updatedVotes,
      };
      setCurrentVoteBan(updatedSession);
    }
  };

  // Handle WebRTC P2P Webcam Calls
  const handleStartWebcamCall = (peer: UserProfile) => {
    setActiveWebcamSession({
      peerUser: peer,
      isCaller: true,
    });
  };

  const handleAcceptIncomingCall = () => {
    if (!incomingCall) return;
    setActiveWebcamSession({
      peerUser: incomingCall.caller,
      isCaller: false,
      offer: incomingCall.offer,
    });
    setIncomingCall(null);
  };

  const handleRejectIncomingCall = () => {
    if (!incomingCall) return;
    socketRef.current?.emit('webrtc:reject_call', {
      callerId: incomingCall.caller.id,
      responderId: currentUser?.id || '',
      reason: 'Chamada de vídeo recusada pelo usuário.',
    });
    setIncomingCall(null);
  };

  const handleEndWebcamCall = () => {
    setActiveWebcamSession(null);
  };

  // 1. If URL has ?admin=true, show Admin Panel
  if (isAdminRoute) {
    return (
      <AdminPanel
        onBackToChat={navigateBackToChat}
        onSendBanner={handleAdminSendBanner}
        onSendAnnouncement={handleAdminSendAnnouncement}
        onClearChat={handleAdminClearChat}
        onKickUser={handleAdminKickUser}
        onlineUsers={onlineUsers}
        autoBannerConfig={autoBannerConfig}
        onUpdateAutoBannerConfig={setAutoBannerConfig}
      />
    );
  }

  // 2. If not logged in, show Login / Profile Picture Setup Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        serverOnlineCount={onlineUsers.length}
        onOpenAdmin={navigateToAdmin}
      />
    );
  }

  // 3. Main MSN Messenger Chat Interface
  return (
    <div
      className={`h-screen w-screen bg-[#0f172a] text-slate-100 font-sans flex items-center justify-center p-0 md:p-3 lg:p-4 relative overflow-hidden transition-transform duration-75 ${
        isShaking ? 'animate-[shake_0.4s_ease-in-out_infinite]' : ''
      }`}
    >
      {/* Ambient background glow orbs */}
      <div className="absolute w-[600px] h-[600px] bg-purple-600/25 rounded-full blur-[130px] -top-24 -left-24 pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[130px] -bottom-24 -right-24 pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[110px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Frosted Glass Window Frame */}
      <div className="relative w-full h-full max-w-7xl md:h-[96vh] max-h-[960px] bg-white/[0.08] border border-white/20 backdrop-blur-2xl md:rounded-[32px] shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
        {/* Top Header */}
        <ChatHeader
          currentUser={currentUser}
          onlineCount={onlineUsers.length}
          onOpenProfile={() => setViewingProfileUser(currentUser)}
          onUpdateStatus={handleUpdateStatus}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onLogout={handleLogout}
          onOpenVoteBanModal={() => {
            setVoteBanPreTarget(null);
            setIsVoteBanModalOpen(true);
          }}
          onOpenAdmin={navigateToAdmin}
        />

        {/* Active Community Vote-Ban Banner */}
        {currentVoteBan && currentVoteBan.status === 'active' && (
          <VoteBanBanner
            voteBan={currentVoteBan}
            currentUserId={currentUser.id}
            onCastVote={handleCastVoteBan}
          />
        )}

        {/* Main Body (Chat Message Stream + Contacts Sidebar) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Left: Chat Message Stream + Input Toolbar */}
          <div className="flex-1 flex flex-col h-full min-w-0 bg-white/[0.02]">
            {/* Message Stream */}
            <MessageList
              messages={messages}
              currentUserId={currentUser.id}
              onOpenUserProfile={(user) => setViewingProfileUser(user)}
              onOpenImageLightbox={(url) => setLightboxImage(url)}
              onToggleReaction={handleToggleReaction}
            />

            {/* Audio Recorder Bar if active */}
            {isRecordingAudio ? (
              <div className="p-3 bg-white/5 border-t border-white/10 backdrop-blur-xl">
                <AudioRecorder
                  onSendAudio={handleSendAudio}
                  onCancel={() => setIsRecordingAudio(false)}
                />
              </div>
            ) : (
              /* Standard MSN Salon Input Bar */
              <ChatInput
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onStartAudioRecording={() => setIsRecordingAudio(true)}
              />
            )}
          </div>

          {/* Right: MSN Contacts Sidebar (Desktop persistent, mobile drawer) */}
          <div
            className={`${
              isSidebarOpen ? 'block absolute inset-0 z-30 sm:relative sm:z-0 sm:block' : 'hidden sm:block'
            }`}
          >
            <UserListSidebar
              users={onlineUsers}
              currentUserId={currentUser.id}
              onOpenPrivateChat={(user) => setActivePrivateRecipient(user)}
              onOpenUserProfile={(user) => setViewingProfileUser(user)}
              onNudgeUser={(user) => handleTriggerNudge(user)}
              onStartVoteBan={(user) => {
                setVoteBanPreTarget(user);
                setIsVoteBanModalOpen(true);
              }}
              onCloseMobile={() => setIsSidebarOpen(false)}
            />
          </div>
        </div>

        {/* Connection status mini footer */}
        <div className="px-4 py-1.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[11px] text-white/50">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono">
              {isSocketConnected ? 'Servidor Conectado (Socket.io)' : 'Conectando ao Servidor...'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>{onlineUsers.length} usuários online na sala</span>
            <span className="font-mono">MSN v8.5</span>
          </div>
        </div>
      </div>

      {/* Modals & Floating Windows */}

      {/* 1. Private 1-on-1 Chat Window Tab (Allows video sending & Webcam P2P call!) */}
      {activePrivateRecipient && (
        <PrivateChatModal
          recipient={activePrivateRecipient}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={(data) => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const privMsg: ChatMessage = {
              id: 'priv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              type: data.msgType || 'text',
              content: data.content,
              sender: currentUser,
              recipientId: activePrivateRecipient.id,
              isPrivate: true,
              fileUrl: data.fileUrl,
              fileName: data.fileName,
              videoUrl: data.videoUrl,
              audioData: data.audioData,
              timestamp: Date.now(),
              time: timeStr,
            };

            setMessages((prev) => [...prev, privMsg]);
            playMsnSendSound();
            socketRef.current?.emit('chat:send_message', privMsg);
          }}
          onNudgeRecipient={() => handleTriggerNudge(activePrivateRecipient)}
          onStartWebcamCall={() => handleStartWebcamCall(activePrivateRecipient)}
          onClose={() => setActivePrivateRecipient(null)}
        />
      )}

      {/* 2. Incoming Webcam Video Call Notification */}
      {incomingCall && !activeWebcamSession && (
        <IncomingCallNotification
          caller={incomingCall.caller}
          onAccept={handleAcceptIncomingCall}
          onReject={handleRejectIncomingCall}
        />
      )}

      {/* 3. Active P2P Webcam Call Modal */}
      {activeWebcamSession && currentUser && (
        <WebcamCallModal
          currentUser={currentUser}
          peerUser={activeWebcamSession.peerUser}
          isCaller={activeWebcamSession.isCaller}
          incomingOffer={activeWebcamSession.offer}
          onEndCall={handleEndWebcamCall}
        />
      )}

      {/* 4. User Profile Card & Photo Editor Modal */}
      {viewingProfileUser && (
        <UserProfileModal
          user={viewingProfileUser}
          isCurrentUser={viewingProfileUser.id === currentUser.id}
          onClose={() => setViewingProfileUser(null)}
          onSaveProfile={handleSaveProfile}
          onOpenPrivateChat={(u) => setActivePrivateRecipient(u)}
          onNudgeUser={(u) => handleTriggerNudge(u)}
          onStartVoteBan={(u) => {
            setVoteBanPreTarget(u);
            setIsVoteBanModalOpen(true);
          }}
        />
      )}

      {/* 5. Community Vote-Ban Initiator Modal */}
      {isVoteBanModalOpen && (
        <VoteBanModal
          users={onlineUsers}
          currentUserId={currentUser.id}
          preSelectedTarget={voteBanPreTarget}
          onStartVote={handleStartVoteBan}
          onClose={() => setIsVoteBanModalOpen(false)}
        />
      )}

      {/* 6. Full Photo Lightbox */}
      {lightboxImage && (
        <PhotoLightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
