import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  Bell,
  Mic,
  Image as ImageIcon,
  Smile,
  Film,
  Volume2,
  Video,
} from 'lucide-react';
import type { ChatMessage, UserProfile, MessageType } from '../types';
import { parseEmoticonsToEmoji, MSN_EMOTICONS } from '../utils/emoticons';

interface PrivateChatModalProps {
  recipient: UserProfile;
  currentUser: UserProfile;
  messages: ChatMessage[];
  onSendMessage: (data: {
    content: string;
    msgType?: MessageType;
    fileUrl?: string;
    fileName?: string;
    videoUrl?: string;
    audioData?: string;
  }) => void;
  onNudgeRecipient: () => void;
  onStartWebcamCall: () => void;
  onClose: () => void;
}

export default function PrivateChatModal({
  recipient,
  currentUser,
  messages,
  onSendMessage,
  onNudgeRecipient,
  onStartWebcamCall,
  onClose,
}: PrivateChatModalProps) {
  const [inputText, setInputText] = useState('');
  const [showEmoticons, setShowEmoticons] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const privateMessages = messages.filter(
    (m) =>
      m.isPrivate &&
      ((m.sender.id === currentUser.id && m.recipientId === recipient.id) ||
        (m.sender.id === recipient.id && m.recipientId === currentUser.id))
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage({
      content: trimmed,
      msgType: 'text',
    });
    setInputText('');
    setShowEmoticons(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (type === 'image') {
        onSendMessage({
          content: '📷 Foto enviada no privado',
          msgType: 'image',
          fileUrl: dataUrl,
          fileName: file.name,
        });
      } else if (type === 'video') {
        onSendMessage({
          content: `🎬 Vídeo enviado no privado: ${file.name}`,
          msgType: 'video',
          videoUrl: dataUrl,
          fileUrl: dataUrl,
          fileName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-slate-900/95 border border-white/20 rounded-3xl shadow-2xl backdrop-blur-2xl flex flex-col h-[560px] max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Hidden Inputs for Photo and Video in PV */}
        <input
          type="file"
          ref={imageInputRef}
          onChange={(e) => handleFileUpload(e, 'image')}
          accept="image/*"
          className="hidden"
        />
        <input
          type="file"
          ref={videoInputRef}
          onChange={(e) => handleFileUpload(e, 'video')}
          accept="video/*"
          className="hidden"
        />

        {/* Header with Recipient Display Picture */}
        <div className="p-3.5 bg-white/5 border-b border-white/10 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <div className="w-9 h-9 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 overflow-hidden shadow border border-white/20">
                <img
                  src={recipient.avatar}
                  alt={recipient.nick}
                  className="w-full h-full object-cover rounded-[13px] bg-slate-800"
                />
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                  recipient.status === 'online'
                    ? 'bg-emerald-500'
                    : recipient.status === 'busy'
                    ? 'bg-rose-500'
                    : 'bg-amber-500'
                }`}
              />
            </div>

            <div className="min-w-0">
              <h4
                className="font-bold text-xs sm:text-sm truncate"
                style={{ color: recipient.userColor || '#60a5fa' }}
              >
                {recipient.nick}
              </h4>
              <p className="text-[10px] text-white/50 truncate">
                {recipient.subNick || 'Conversa Privada Segura'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Webcam P2P Video Call Button */}
            <button
              type="button"
              onClick={onStartWebcamCall}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/40 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition cursor-pointer active:scale-95"
              title="Iniciar Transmissão de Webcam P2P"
            >
              <Video className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              <span className="hidden sm:inline">Webcam P2P</span>
            </button>

            {/* Nudge in PV */}
            <button
              type="button"
              onClick={onNudgeRecipient}
              className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-200 hover:text-white border border-amber-400/40 transition cursor-pointer"
              title="Chamar Atenção no Privado"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Fechar Janela"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Emoticons Drawer inside private chat */}
        {showEmoticons && (
          <div className="p-2.5 bg-slate-900/95 border-b border-white/10 grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto custom-scrollbar backdrop-blur-xl">
            {MSN_EMOTICONS.map((emoticon) => (
              <button
                key={emoticon.code}
                type="button"
                onClick={() => {
                  setInputText((prev) => prev + emoticon.code + ' ');
                  setShowEmoticons(false);
                }}
                className="p-1 hover:bg-white/10 rounded-lg text-base flex items-center justify-center cursor-pointer transition"
                title={emoticon.name}
              >
                {emoticon.emoji}
              </button>
            ))}
          </div>
        )}

        {/* Messages Window */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-white/[0.02] custom-scrollbar backdrop-blur-sm">
          {privateMessages.length === 0 ? (
            <div className="text-center py-12 text-white/40 text-xs">
              Esta é uma conversa privada com <strong className="text-blue-400">{recipient.nick}</strong>.
              <br />
              Diga um "Oi!" para começar.
            </div>
          ) : (
            privateMessages.map((msg, index) => {
              const isMe = msg.sender.id === currentUser.id;

              if (msg.type === 'nudge') {
                return (
                  <div
                    key={msg.id || index}
                    className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-2xl text-center text-xs font-bold text-amber-300 backdrop-blur-md animate-pulse my-1.5"
                  >
                    <Bell className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
                    {msg.content}
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.nick}
                    className="w-7 h-7 rounded-xl object-cover bg-slate-800 border border-white/20 mt-0.5 shrink-0"
                  />

                  <div className={`max-w-[78%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-3.5 py-2 text-xs shadow-md backdrop-blur-md ${
                        isMe
                          ? 'bg-blue-600/50 border border-blue-400/40 text-white rounded-tr-xs shadow-blue-950/20'
                          : 'bg-white/10 border border-white/15 text-white rounded-tl-xs shadow-black/20'
                      }`}
                    >
                      {/* Photo message */}
                      {msg.type === 'image' && msg.fileUrl && (
                        <div className="mb-1.5 rounded-xl overflow-hidden max-h-48 bg-black/60 border border-white/20">
                          <img src={msg.fileUrl} alt="Foto" className="w-full h-full object-cover" />
                        </div>
                      )}

                      {/* Video message in PV */}
                      {msg.type === 'video' && (msg.videoUrl || msg.fileUrl) && (
                        <div className="mb-1.5 rounded-xl overflow-hidden max-h-56 bg-black border border-white/20">
                          <video
                            src={msg.videoUrl || msg.fileUrl}
                            controls
                            playsInline
                            className="w-full h-full rounded-xl bg-black max-h-52 object-contain"
                          />
                        </div>
                      )}

                      {/* Audio message */}
                      {msg.type === 'audio' && (msg.audioData || msg.fileUrl) && (
                        <div className="mb-1.5">
                          <audio
                            src={msg.audioData || msg.fileUrl}
                            controls
                            className="h-8 max-w-full"
                          />
                        </div>
                      )}

                      <p className="whitespace-pre-wrap">{parseEmoticonsToEmoji(msg.content)}</p>
                    </div>
                    <span className="text-[9px] text-white/40 font-mono mt-0.5 px-1">{msg.time}</span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Toolbar */}
        <div className="p-2.5 bg-slate-900/90 border-t border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            {/* Emoticons Button */}
            <button
              type="button"
              onClick={() => setShowEmoticons(!showEmoticons)}
              className="p-2 rounded-xl text-white/60 hover:text-amber-300 hover:bg-white/10 transition cursor-pointer"
              title="Emoticons"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Send Photo Button */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-2 rounded-xl text-white/60 hover:text-emerald-300 hover:bg-white/10 transition cursor-pointer"
              title="Enviar Foto no Privado"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
            </button>

            {/* Send Video Button (Allowed in PV!) */}
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="p-2 rounded-xl text-white/60 hover:text-indigo-300 hover:bg-white/10 transition cursor-pointer"
              title="Enviar Vídeo no Privado"
            >
              <Film className="w-4 h-4 text-indigo-400" />
            </button>

            {/* Webcam P2P Call Button */}
            <button
              type="button"
              onClick={onStartWebcamCall}
              className="p-2 rounded-xl text-white/60 hover:text-cyan-300 hover:bg-white/10 transition cursor-pointer"
              title="Iniciar Chamada de Webcam P2P"
            >
              <Video className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mensagem privada..."
              className="flex-1 bg-white/5 border border-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
            />

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 border border-white/20 transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
