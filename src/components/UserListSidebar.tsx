import React, { useState } from 'react';
import {
  Users,
  Search,
  MessageSquare,
  Bell,
  User,
  ShieldAlert,
  Radio,
  X,
} from 'lucide-react';
import type { UserProfile, UserStatus } from '../types';

interface UserListSidebarProps {
  users: UserProfile[];
  currentUserId: string;
  onOpenPrivateChat: (user: UserProfile) => void;
  onOpenUserProfile: (user: UserProfile) => void;
  onNudgeUser: (user: UserProfile) => void;
  onStartVoteBan: (user: UserProfile) => void;
  onCloseMobile: () => void;
}

export default function UserListSidebar({
  users,
  currentUserId,
  onOpenPrivateChat,
  onOpenUserProfile,
  onNudgeUser,
  onStartVoteBan,
  onCloseMobile,
}: UserListSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const statusColors: Record<UserStatus, { bg: string; border: string }> = {
    online: { bg: 'bg-emerald-500', border: 'border-emerald-400' },
    busy: { bg: 'bg-rose-500', border: 'border-rose-400' },
    away: { bg: 'bg-amber-500', border: 'border-amber-400' },
    invisible: { bg: 'bg-slate-400', border: 'border-slate-400' },
    offline: { bg: 'bg-slate-600', border: 'border-slate-500' },
  };

  const filteredUsers = users.filter((u) =>
    u.nick.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.subNick && u.subNick.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const onlineUsers = filteredUsers.filter((u) => u.status !== 'offline');

  return (
    <aside className="w-full sm:w-72 md:w-80 bg-white/[0.04] border-l border-white/10 flex flex-col h-full shrink-0 select-none backdrop-blur-xl shadow-xl">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            Contatos Online ({onlineUsers.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="p-1 rounded-xl text-white/50 hover:text-white sm:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar contato..."
            className="w-full bg-white/5 border border-white/10 focus:border-blue-400/60 rounded-2xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
          />
        </div>
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 custom-scrollbar">
        {onlineUsers.length === 0 ? (
          <div className="p-4 text-center text-xs text-white/40">
            Nenhum contato encontrado.
          </div>
        ) : (
          onlineUsers.map((user) => {
            const isMe = user.id === currentUserId;

            return (
              <div
                key={user.id}
                className={`p-2.5 rounded-2xl transition-all flex items-center justify-between gap-2.5 group backdrop-blur-md ${
                  isMe
                    ? 'bg-blue-500/20 border border-blue-400/30 shadow-sm'
                    : 'hover:bg-white/10 border border-white/5'
                }`}
              >
                {/* User Info (Avatar + Nick + Sub-nick) */}
                <div
                  onClick={() => onOpenUserProfile(user)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                  title="Clique para ver perfil completo"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 rounded-xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 overflow-hidden shadow border border-white/20">
                      <img
                        src={user.avatar}
                        alt={user.nick}
                        className="w-full h-full object-cover rounded-[9px] bg-slate-900"
                      />
                    </div>
                    {/* Status Dot */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                        statusColors[user.status]?.bg || 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  {/* Nick & Sub-nick */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="font-bold text-xs truncate"
                        style={{ color: user.userColor || '#60a5fa' }}
                      >
                        {user.nick}
                      </span>
                      {isMe && (
                        <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded-full border border-blue-400/30">
                          Você
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-white/50 truncate mt-0.5">
                      {user.subNick || (user.status === 'online' ? 'Disponível' : 'Ausente')}
                    </p>
                  </div>
                </div>

                {/* Action buttons (Private Chat, Nudge, Vote Ban) */}
                {!isMe && (
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                    <button
                      type="button"
                      onClick={() => onOpenPrivateChat(user)}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-blue-600 border border-white/15 text-white/90 hover:text-white transition cursor-pointer"
                      title="Abrir Conversa Privada"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onNudgeUser(user)}
                      className="p-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500 border border-amber-400/30 text-amber-200 hover:text-white transition cursor-pointer"
                      title="Chamar Atenção no Privado"
                    >
                      <Bell className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onStartVoteBan(user)}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500 border border-rose-400/30 text-rose-200 hover:text-white transition cursor-pointer"
                      title="Iniciar Votação para Banir (1 min)"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-white/10 text-[11px] text-white/50 bg-white/[0.02] backdrop-blur-md flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Servidor Conectado
        </span>
        <span className="text-[10px] text-white/40">MSN v8.5</span>
      </div>
    </aside>
  );
}
