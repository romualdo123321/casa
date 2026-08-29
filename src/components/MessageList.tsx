import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Play,
  Pause,
  FileText,
  File,
  Sparkles,
  ExternalLink,
  Volume2,
  Bell,
  Heart,
  ThumbsUp,
  Smile,
  Flame,
  Info,
  Film,
  Video,
} from 'lucide-react';
import type { ChatMessage, UserProfile } from '../types';
import { parseEmoticonsToEmoji } from '../utils/emoticons';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  onOpenUserProfile: (user: UserProfile) => void;
  onOpenImageLightbox: (imageUrl: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onReplyUser?: (nick: string) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  onOpenUserProfile,
  onOpenImageLightbox,
  onToggleReaction,
  onReplyUser,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const togglePlayAudio = (msgId: string, audioDataUrl?: string) => {
    if (!audioDataUrl) return;

    if (playingAudioId === msgId) {
      const el = audioElementsRef.current[msgId];
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
      setPlayingAudioId(null);
    } else {
      // Pause any previous
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }

      if (!audioElementsRef.current[msgId]) {
        const audio = new Audio(audioDataUrl);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => setPlayingAudioId(null);
        audioElementsRef.current[msgId] = audio;
      }

      audioElementsRef.current[msgId].currentTime = 0;
      audioElementsRef.current[msgId].play().catch(() => setPlayingAudioId(null));
      setPlayingAudioId(msgId);
    }
  };

  const reactionEmojis = ['❤️', '👍', '😂', '😮', '🔥', '👏'];

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4.5 custom-scrollbar bg-white/[0.01] backdrop-blur-md select-text">
      {/* Welcome banner at the top of the chat */}
      <div className="text-center py-5 px-6 my-2 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl max-w-lg mx-auto shadow-xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
          <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center text-xl">
            🦋
          </div>
        </div>
        <h2 className="text-sm font-bold text-white tracking-wide">
          Salão Principal do <span className="text-blue-400 font-extrabold">Bate-Papo MSN</span>
        </h2>
        <p className="text-xs text-white/60 mt-1 max-w-sm mx-auto">
          Compartilhe mensagens, fotos, áudios e chame a atenção dos seus amigos online com visual Frosted Glass!
        </p>
      </div>

      {messages.length === 0 && (
        <div className="text-center py-12 text-white/40 text-xs">
          Nenhuma mensagem ainda. Seja o primeiro a dizer "Olá!" 👋
        </div>
      )}

      {/* Render messages */}
      {messages.map((msg, index) => {
        const isMe = msg.sender.id === currentUserId;
        const formattedContent = parseEmoticonsToEmoji(msg.content);

        // 1. NUDGE MESSAGE (CHAMAR ATENÇÃO)
        if (msg.type === 'nudge') {
          return (
            <div
              key={msg.id || index}
              className="my-3 mx-auto max-w-md p-3.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-400/50 backdrop-blur-xl rounded-2xl text-center shadow-xl animate-pulse"
            >
              <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
                <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
                <span>{msg.content}</span>
              </div>
              <span className="text-[10px] text-amber-300/80 block mt-1 font-mono">{msg.time}</span>
            </div>
          );
        }

        // 2. PROMOTIONAL / BANNER MESSAGE
        if (msg.type === 'banner') {
          return (
            <div
              key={msg.id || index}
              className={`my-4 mx-auto max-w-xl backdrop-blur-2xl rounded-3xl p-5 sm:p-6 shadow-2xl overflow-hidden relative border ${
                msg.announcementColor || 'bg-white/10 border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.nick}
                  className="w-10 h-10 rounded-2xl object-cover border border-white/30 shadow"
                />
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <span>{msg.bannerTitle || '📢 Comunicado Oficial'}</span>
                  </h3>
                  <span className="text-[10px] text-white/60 font-mono">{msg.time}</span>
                </div>
              </div>

              {msg.bannerImage && (
                <div
                  onClick={() => onOpenImageLightbox(msg.bannerImage!)}
                  className="mb-3.5 rounded-2xl overflow-hidden border border-white/20 cursor-pointer max-h-72 bg-black/60 shadow-md group"
                >
                  <img
                    src={msg.bannerImage}
                    alt="Banner Promo"
                    className="w-full h-full object-cover group-hover:scale-102 transition duration-300"
                  />
                </div>
              )}

              <p className="text-xs sm:text-sm text-white/90 leading-relaxed mb-3.5 whitespace-pre-wrap font-medium">
                {msg.content}
              </p>

              {msg.bannerLink && (
                <a
                  href={msg.bannerLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 border border-white/20 transition hover:scale-102 cursor-pointer"
                >
                  <span>{msg.bannerButtonLabel || 'Acessar Link'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          );
        }

        // 3. ANNOUNCEMENT / SYSTEM MESSAGE
        if (msg.type === 'system' || msg.type === 'announcement') {
          return (
            <div
              key={msg.id || index}
              className={`my-2 mx-auto max-w-lg p-3 rounded-2xl border text-xs text-center backdrop-blur-xl shadow-lg ${
                msg.announcementColor || 'bg-white/5 border-white/10 text-white/80'
              }`}
            >
              <p className="font-medium">{msg.content}</p>
              <span className="text-[10px] text-white/40 block mt-0.5 font-mono">{msg.time}</span>
            </div>
          );
        }

        // 4. REGULAR CHAT MESSAGE (Text, Image, Audio, File) WITH USER PROFILE PHOTO
        return (
          <div
            key={msg.id || index}
            className={`flex gap-3 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Sender's Profile Picture (Clickable to view full profile) */}
            <div
              onClick={() => onOpenUserProfile(msg.sender)}
              className="relative shrink-0 cursor-pointer group/avatar mt-0.5"
              title={`Ver perfil de ${msg.sender.nick}`}
            >
              <div className="w-10 h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md overflow-hidden border border-white/20">
                <img
                  src={msg.sender.avatar}
                  alt={msg.sender.nick}
                  className="w-full h-full object-cover rounded-[13px] bg-slate-900"
                />
              </div>

              {/* Status indicator badge */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                  msg.sender.status === 'online'
                    ? 'bg-emerald-500'
                    : msg.sender.status === 'busy'
                    ? 'bg-rose-500'
                    : msg.sender.status === 'away'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />
            </div>

            {/* Message Bubble Container */}
            <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {/* Sender Name + Time */}
              <div className="flex items-center gap-1.5 mb-1 text-[11px] px-1">
                <span
                  onClick={() => onOpenUserProfile(msg.sender)}
                  className="font-bold cursor-pointer hover:underline"
                  style={{ color: msg.sender.userColor || msg.fontColor || '#60a5fa' }}
                >
                  {msg.sender.nick}
                </span>

                {msg.sender.subNick && (
                  <span className="text-[10px] text-white/40 font-normal hidden sm:inline truncate max-w-[140px]">
                    • {msg.sender.subNick}
                  </span>
                )}

                <span className="text-[10px] text-white/40 font-mono ml-1">{msg.time}</span>
              </div>

              {/* Message Bubble Content */}
              <div
                className={`rounded-2xl px-4 py-3 shadow-lg backdrop-blur-xl relative group/bubble ${
                  isMe
                    ? 'bg-blue-600/50 border border-blue-400/40 text-white rounded-tr-xs shadow-blue-950/30'
                    : 'bg-white/10 border border-white/15 text-white rounded-tl-xs shadow-black/20'
                }`}
              >
                {/* 4a. IMAGE MESSAGE */}
                {msg.type === 'image' && msg.fileUrl && (
                  <div className="mb-2">
                    <div
                      onClick={() => onOpenImageLightbox(msg.fileUrl!)}
                      className="rounded-2xl overflow-hidden border border-white/20 cursor-pointer max-h-72 bg-black/50 max-w-sm hover:opacity-95 transition shadow"
                    >
                      <img
                        src={msg.fileUrl}
                        alt="Foto enviada"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {msg.fileName && (
                      <p className="text-[11px] text-white/60 mt-1 truncate">{msg.fileName}</p>
                    )}
                  </div>
                )}

                {/* 4a2. VIDEO MESSAGE */}
                {msg.type === 'video' && (msg.fileUrl || msg.videoUrl) && (
                  <div className="mb-2 max-w-md">
                    <div className="rounded-2xl overflow-hidden border border-white/20 bg-black/80 shadow-xl relative">
                      <video
                        src={msg.videoUrl || msg.fileUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full max-h-80 object-contain rounded-2xl bg-black"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-white/60 px-1">
                      <span className="flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-blue-400" />
                        {msg.fileName || 'Vídeo compartilhado'}
                      </span>
                      {msg.fileSize && (
                        <span className="font-mono text-[10px]">
                          {(msg.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* 4b. AUDIO / VOICE NOTE MESSAGE */}
                {msg.type === 'audio' && (msg.audioData || msg.fileUrl) && (
                  <div className="flex items-center gap-3 py-1 px-1 min-w-[200px] sm:min-w-[240px]">
                    <button
                      type="button"
                      onClick={() => togglePlayAudio(msg.id, msg.audioData || msg.fileUrl)}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition cursor-pointer shrink-0 border border-white/20 ${
                        playingAudioId === msg.id
                          ? 'bg-rose-500 text-white animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                      }`}
                    >
                      {playingAudioId === msg.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Volume2 className="w-3.5 h-3.5" />
                          Mensagem de Voz
                        </span>
                        <span className="text-[10px] text-white/50 font-mono">
                          {msg.audioDuration ? `${msg.audioDuration}s` : 'Áudio'}
                        </span>
                      </div>

                      {/* Fake audio waveform bars */}
                      <div className="flex items-center gap-0.5 h-4">
                        {[40, 75, 55, 90, 60, 100, 80, 45, 70, 95, 50, 85, 65, 40].map((h, i) => (
                          <div
                            key={i}
                            className={`flex-1 rounded-full transition-all ${
                              playingAudioId === msg.id ? 'bg-emerald-400 animate-pulse' : 'bg-white/20'
                            }`}
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4c. FILE DOWNLOAD MESSAGE */}
                {msg.type === 'file' && msg.fileUrl && (
                  <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 min-w-[200px] backdrop-blur-md">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{msg.fileName || 'Arquivo'}</p>
                      {msg.fileSize && (
                        <p className="text-[10px] text-white/50 font-mono">
                          {(msg.fileSize / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <a
                      href={msg.fileUrl}
                      download={msg.fileName || 'download'}
                      className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow transition shrink-0"
                      title="Baixar arquivo"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* 4d. TEXT CONTENT */}
                {msg.content && msg.type !== 'image' && msg.type !== 'audio' && (
                  <p
                    className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words"
                    style={{
                      color: msg.fontColor || (isMe ? '#ffffff' : '#f8fafc'),
                      fontWeight: msg.fontStyle?.includes('bold') ? 'bold' : 'normal',
                      fontStyle: msg.fontStyle?.includes('italic') ? 'italic' : 'normal',
                    }}
                  >
                    {formattedContent}
                  </p>
                )}

                {/* Emoji Reactions Toolbar (Hover pill) */}
                <div
                  className={`absolute -bottom-3.5 ${
                    isMe ? 'right-2' : 'left-2'
                  } opacity-0 group-hover/bubble:opacity-100 transition-opacity bg-slate-900/95 border border-white/20 backdrop-blur-xl rounded-full px-2.5 py-0.5 shadow-xl flex items-center gap-1.5 z-10`}
                >
                  {reactionEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onToggleReaction(msg.id, emoji)}
                      className="text-xs hover:scale-125 transition p-0.5 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Reactions Pills */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5 px-1">
                  {Object.entries(msg.reactions).map(([emoji, users]) => {
                    const hasVoted = users.includes(currentUserId);
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => onToggleReaction(msg.id, emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border transition cursor-pointer backdrop-blur-md ${
                          hasVoted
                            ? 'bg-blue-600/40 border-blue-400 text-blue-200 shadow-sm'
                            : 'bg-white/10 border-white/15 text-white/80 hover:border-white/30'
                        }`}
                        title={`${users.length} pessoa(s)`}
                      >
                        <span>{emoji}</span>
                        <span className="font-mono font-bold">{users.length}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
