import React, { useState, useEffect, useRef } from 'react';
import type { ChatMessage, UserProfile, UserStatus, VoteBanSession } from './types';
import LoginScreen from './components/LoginScreen';
import ChatHeader from './components/ChatHeader';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import AudioRecorder from './components/AudioRecorder';
import UserListSidebar from './components/UserListSidebar';
import UserProfileModal from './components/UserProfileModal';
import PrivateChatModal from './components/PrivateChatModal';
import VoteBanBanner from './components/VoteBanBanner';
import VoteBanModal from './components/VoteBanModal';
import PhotoLightboxModal from './components/PhotoLightboxModal';
import { PRESET_AVATARS } from './data/presetAvatars';
import {
  playMsnLoginSound,
  playMsnMessageSound,
  playMsnNudgeSound,
  playMsnSendSound,
} from './utils/audioEffects';

// Simulated initial contacts & initial public messages for an authentic MSN experience
const SAMPLE_CONTACTS: UserProfile[] = [
  {
    id: 'usr_bot_msn',
    nick: '🦋 MSN Messenger Bot',
    email: 'sistema@msn.local',
    avatar: 'https://images.unsplash.com/photo-1557008075-7f2c5efa4cfd?w=200&h=200&fit=crop&crop=faces&q=80',
    status: 'online',
    subNick: 'Bem-vindo ao Bate-Papo MSN! Digite e chame atenção!',
    userColor: '#0284c7',
    isAdmin: true,
  },
  {
    id: 'usr_vanessa',
    nick: 'Vanessa_90 ✨',
    email: 'vanessa90@msn.local',
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=200&h=200&fit=crop&crop=faces&q=80',
    status: 'online',
    subNick: '🎵 Ouvindo Avril Lavigne - Complicated',
    userColor: '#db2777',
  },
  {
    id: 'usr_paulinho',
    nick: 'Paulinho_Gamer 🎮',
    email: 'paulinho_cs@msn.local',
    avatar: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?w=200&h=200&fit=crop&crop=faces&q=80',
    status: 'away',
    subNick: 'Jogando CS 1.6 na Lan House... volto já!',
    userColor: '#16a34a',
  },
  {
    id: 'usr_marcelo',
    nick: 'Marcelo_Rock 🎸',
    email: 'marcelo_rock@msn.local',
    avatar: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&h=200&fit=crop&crop=faces&q=80',
    status: 'online',
    subNick: 'Tocando guitarra 🤘 (L)',
    userColor: '#ea580c',
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_welcome_1',
    type: 'system',
    content: '🎉 Bem-vindo ao Bate-Papo MSN Classic! Você pode definir sua foto de perfil, gravar áudios, enviar fotos e chamar a atenção!',
    sender: SAMPLE_CONTACTS[0],
    timestamp: Date.now() - 60000,
    time: '12:00',
  },
  {
    id: 'msg_vanessa_1',
    type: 'text',
    content: 'Oii gente! Que saudade desse visual do MSN com foto de perfil e emoticons! (L) :)',
    sender: SAMPLE_CONTACTS[1],
    fontColor: '#db2777',
    fontStyle: 'normal',
    timestamp: Date.now() - 40000,
    time: '12:01',
  },
  {
    id: 'msg_marcelo_1',
    type: 'text',
    content: 'E aí galera! Quem mais lembra de mandar aquele tremer a tela clássico? haha :D',
    sender: SAMPLE_CONTACTS[3],
    fontColor: '#ea580c',
    fontStyle: 'normal',
    timestamp: Date.now() - 20000,
    time: '12:02',
  },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('msn_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_MESSAGES;
  });

  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('msn_online_users');
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_CONTACTS;
  });

  const [activePrivateRecipient, setActivePrivateRecipient] = useState<UserProfile | null>(null);
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

  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  // Persist messages in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('msn_chat_messages', JSON.stringify(messages.slice(-100)));
    } catch {}
  }, [messages]);

  // Setup BroadcastChannel for real-time cross-tab synchronization
  useEffect(() => {
    if (typeof window === 'undefined' || !window.BroadcastChannel) return;

    const channel = new BroadcastChannel('msn_chat_channel');
    broadcastChannelRef.current = channel;

    channel.onmessage = (event) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (data.type === 'NEW_MESSAGE') {
        setMessages((prev) => [...prev, data.message]);
        if (data.message.sender.id !== currentUser?.id) {
          if (data.message.type === 'nudge') {
            triggerScreenShake();
            playMsnNudgeSound();
          } else {
            playMsnMessageSound();
          }
        }
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
        // Also update existing messages from this user to reflect their new avatar/nick
        setMessages((prev) =>
          prev.map((m) =>
            m.sender.id === data.user.id ? { ...m, sender: { ...m.sender, ...data.user } } : m
          )
        );
      } else if (data.type === 'USER_LEFT') {
        setOnlineUsers((prev) => prev.filter((u) => u.id !== data.userId));
      } else if (data.type === 'VOTE_BAN_STARTED') {
        setCurrentVoteBan(data.voteBan);
      } else if (data.type === 'VOTE_BAN_UPDATED') {
        setCurrentVoteBan(data.voteBan);
      } else if (data.type === 'VOTE_BAN_COMPLETED') {
        setCurrentVoteBan(null);
        if (data.result === 'passed' && data.targetUserId) {
          setOnlineUsers((prev) => prev.filter((u) => u.id !== data.targetUserId));
        }
      }
    };

    return () => {
      channel.close();
    };
  }, [currentUser]);

  // Nudge cooldown timer
  useEffect(() => {
    if (nudgeCooldown <= 0) return;
    const timer = setInterval(() => {
      setNudgeCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [nudgeCooldown]);

  // Vote ban expiration check (1 minute timer)
  useEffect(() => {
    if (!currentVoteBan || currentVoteBan.status !== 'active') return;

    const interval = setInterval(() => {
      if (Date.now() >= currentVoteBan.expiresAt) {
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const expireMsg: ChatMessage = {
          id: 'sys_' + Date.now(),
          type: 'system',
          content: `🗳️ Votação de banimento contra "${currentVoteBan.targetUser.nick}" encerrou sem atingir os 5 votos necessários.`,
          sender: SAMPLE_CONTACTS[0],
          timestamp: Date.now(),
          time: timeStr,
        };
        setMessages((prev) => [...prev, expireMsg]);
        setCurrentVoteBan(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentVoteBan]);

  const triggerScreenShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 800);
  };

  // Handle Login
  const handleLogin = (userProfile: UserProfile) => {
    setCurrentUser(userProfile);
    setOnlineUsers((prev) => {
      const filtered = prev.filter((u) => u.id !== userProfile.id);
      return [userProfile, ...filtered];
    });

    // Notify other tabs
    broadcastChannelRef.current?.postMessage({
      type: 'USER_JOINED',
      user: userProfile,
    });

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
  };

  // Handle Logout
  const handleLogout = () => {
    if (currentUser) {
      broadcastChannelRef.current?.postMessage({
        type: 'USER_LEFT',
        userId: currentUser.id,
      });
      setOnlineUsers((prev) => prev.filter((u) => u.id !== currentUser.id));
    }
    setCurrentUser(null);
  };

  // Handle Public Message Send
  const handleSendMessage = (data: {
    content: string;
    msgType?: 'text' | 'image' | 'file';
    fontColor?: string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
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
      timestamp: Date.now(),
      time: timeStr,
    };

    setMessages((prev) => [...prev, newMsg]);
    playMsnSendSound();

    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      message: newMsg,
    });
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

    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      message: audioMsg,
    });
  };

  // Handle Nudge / Chamar Atenção Trigger
  const handleTriggerNudge = (targetUser?: UserProfile) => {
    if (!currentUser || nudgeCooldown > 0) return;

    setNudgeCooldown(15); // 15s cooldown for smooth usage
    triggerScreenShake();
    playMsnNudgeSound();

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nudgeMsg: ChatMessage = {
      id: 'ndg_' + Date.now(),
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

    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      message: nudgeMsg,
    });
  };

  // Handle Profile Update (Change photo, nick, subnick, status)
  const handleSaveProfile = (updated: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProfile: UserProfile = {
      ...currentUser,
      ...updated,
    };
    setCurrentUser(newProfile);

    // Update in user list
    setOnlineUsers((prev) =>
      prev.map((u) => (u.id === newProfile.id ? newProfile : u))
    );

    // Update in existing messages from me
    setMessages((prev) =>
      prev.map((m) => (m.sender.id === newProfile.id ? { ...m, sender: newProfile } : m))
    );

    // Broadcast to other tabs
    broadcastChannelRef.current?.postMessage({
      type: 'USER_UPDATED',
      user: newProfile,
    });
  };

  // Handle Status Update
  const handleUpdateStatus = (newStatus: UserStatus) => {
    handleSaveProfile({ status: newStatus });
  };

  // Handle Emoji Reaction
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentUser) return;

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

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const startMsg: ChatMessage = {
      id: 'sys_' + Date.now(),
      type: 'announcement',
      content: `🗳️ VOTAÇÃO DE BANIMENTO: ${currentUser.nick} abriu votação para banir "${target.nick}" por 30 minutos! (1/5 votos). A votação encerra em 1 minuto.`,
      announcementColor: 'bg-amber-950/80 border-amber-500 text-amber-200',
      sender: SAMPLE_CONTACTS[0],
      timestamp: Date.now(),
      time: timeStr,
    };
    setMessages((prev) => [...prev, startMsg]);

    broadcastChannelRef.current?.postMessage({
      type: 'VOTE_BAN_STARTED',
      voteBan: newVoteBan,
    });
    broadcastChannelRef.current?.postMessage({
      type: 'NEW_MESSAGE',
      message: startMsg,
    });
  };

  // Handle Community Vote-Ban: Cast Vote
  const handleCastVoteBan = (voteBanId: string) => {
    if (!currentUser || !currentVoteBan || currentVoteBan.id !== voteBanId) return;
    if (currentVoteBan.votes.includes(currentUser.id)) return;

    const updatedVotes = [...currentVoteBan.votes, currentUser.id];
    const totalVotes = updatedVotes.length;

    if (totalVotes >= currentVoteBan.requiredVotes) {
      // Ban passed!
      const targetUser = currentVoteBan.targetUser;
      setCurrentVoteBan(null);
      setOnlineUsers((prev) => prev.filter((u) => u.id !== targetUser.id));

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const passedMsg: ChatMessage = {
        id: 'sys_' + Date.now(),
        type: 'announcement',
        content: `⛔ VOTAÇÃO ENCERRADA: O usuário "${targetUser.nick}" atingiu os 5 votos e foi BANIDO da sala por 30 minutos!`,
        announcementColor: 'bg-rose-950/90 border-rose-500 text-rose-100',
        sender: SAMPLE_CONTACTS[0],
        timestamp: Date.now(),
        time: timeStr,
      };
      setMessages((prev) => [...prev, passedMsg]);

      broadcastChannelRef.current?.postMessage({
        type: 'VOTE_BAN_COMPLETED',
        result: 'passed',
        targetUserId: targetUser.id,
      });
      broadcastChannelRef.current?.postMessage({
        type: 'NEW_MESSAGE',
        message: passedMsg,
      });
    } else {
      const updatedSession: VoteBanSession = {
        ...currentVoteBan,
        votes: updatedVotes,
      };
      setCurrentVoteBan(updatedSession);
      broadcastChannelRef.current?.postMessage({
        type: 'VOTE_BAN_UPDATED',
        voteBan: updatedSession,
      });
    }
  };

  // 1. If not logged in, show Login / Profile Picture Setup Screen
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        serverOnlineCount={onlineUsers.length}
      />
    );
  }

  // 2. Main MSN Messenger Chat Interface
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
          onTriggerNudge={() => handleTriggerNudge()}
          nudgeCooldownRemaining={nudgeCooldown}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
          onLogout={handleLogout}
          onOpenVoteBanModal={() => {
            setVoteBanPreTarget(null);
            setIsVoteBanModalOpen(true);
          }}
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
              /* Standard MSN Input Bar */
              <ChatInput
                currentUser={currentUser}
                onSendMessage={handleSendMessage}
                onStartAudioRecording={() => setIsRecordingAudio(true)}
                onTriggerNudge={() => handleTriggerNudge()}
                nudgeCooldownRemaining={nudgeCooldown}
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
      </div>

      {/* Modals & Floating Windows */}

      {/* 1. Private 1-on-1 Chat Window Tab */}
      {activePrivateRecipient && (
        <PrivateChatModal
          recipient={activePrivateRecipient}
          currentUser={currentUser}
          messages={messages}
          onSendMessage={(content, msgType, fileUrl, fileName) => {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const privMsg: ChatMessage = {
              id: 'priv_' + Date.now(),
              type: msgType || 'text',
              content,
              sender: currentUser,
              recipientId: activePrivateRecipient.id,
              isPrivate: true,
              fileUrl,
              fileName,
              timestamp: Date.now(),
              time: timeStr,
            };
            setMessages((prev) => [...prev, privMsg]);
            playMsnSendSound();
            broadcastChannelRef.current?.postMessage({
              type: 'NEW_MESSAGE',
              message: privMsg,
            });
          }}
          onNudgeRecipient={() => handleTriggerNudge(activePrivateRecipient)}
          onClose={() => setActivePrivateRecipient(null)}
        />
      )}

      {/* 2. User Profile Card & Photo Editor Modal */}
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

      {/* 3. Community Vote-Ban Initiator Modal */}
      {isVoteBanModalOpen && (
        <VoteBanModal
          users={onlineUsers}
          currentUserId={currentUser.id}
          preSelectedTarget={voteBanPreTarget}
          onStartVote={handleStartVoteBan}
          onClose={() => setIsVoteBanModalOpen(false)}
        />
      )}

      {/* 4. Full Photo Lightbox */}
      {lightboxImage && (
        <PhotoLightboxModal
          imageUrl={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
