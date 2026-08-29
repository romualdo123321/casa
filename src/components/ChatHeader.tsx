import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Bell,
  Users,
  LogOut,
  Sparkles,
  Camera,
  ChevronDown,
  Shield,
  MessageSquare,
  Radio,
  Timer,
  Clock,
} from 'lucide-react';
import type { UserProfile, UserStatus } from '../types';
import { setSoundMuted, getSoundMuted, playMsnNudgeSound } from '../utils/audioEffects';

interface ChatHeaderProps {
  currentUser: UserProfile;
  onlineCount: number;
  onOpenProfile: () => void;
  onUpdateStatus: (newStatus: UserStatus) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onLogout: () => void;
  onOpenVoteBanModal: () => void;
  onOpenAdmin?: () => void;
}

export default function ChatHeader({
  currentUser,
  onlineCount,
  onOpenProfile,
  onUpdateStatus,
  onToggleSidebar,
  isSidebarOpen,
  onLogout,
  onOpenVoteBanModal,
  onOpenAdmin,
}: ChatHeaderProps) {
  const [isMuted, setIsMuted] = useState(getSoundMuted());
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    setSoundMuted(next);
  };

  const statusColors: Record<UserStatus, { bg: string; text: string; label: string }> = {
    online: { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Disponível' },
    busy: { bg: 'bg-rose-500', text: 'text-rose-400', label: 'Ocupado' },
    away: { bg: 'bg-amber-500', text: 'text-amber-400', label: 'Ausente' },
    invisible: { bg: 'bg-slate-400', text: 'text-slate-400', label: 'Invisível' },
    offline: { bg: 'bg-slate-600', text: 'text-slate-500', label: 'Desconectado' },
  };

  return (
    <header className="bg-white/5 border-b border-white/10 backdrop-blur-xl px-3 sm:px-6 py-3 flex items-center justify-between shadow-sm shrink-0 select-none">
      {/* Left: Window Dots + User Profile Bar */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Window control dots (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 mr-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-sm" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80 shadow-sm" />
        </div>

        {/* User Avatar with Edit Camera Overlay & Status Dot */}
        <div className="relative group cursor-pointer" onClick={onOpenProfile} title="Ver / Alterar sua foto de perfil">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md overflow-hidden border border-white/20">
            <img
              src={currentUser.avatar}
              alt={currentUser.nick}
              className="w-full h-full object-cover rounded-[13px] bg-slate-900"
            />
          </div>

          {/* Camera edit overlay on hover */}
          <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150">
            <Camera className="w-4 h-4 text-white" />
          </div>

          {/* Status Indicator Dot */}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
              statusColors[currentUser.status]?.bg || 'bg-emerald-500'
            }`}
          />
        </div>

        {/* User Info (Nick + Sub-nick + Status selector) */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-sm sm:text-base truncate max-w-[140px] sm:max-w-[220px]"
              style={{ color: currentUser.userColor || '#60a5fa' }}
              title={currentUser.nick}
            >
              {currentUser.nick}
            </span>

            {/* Status Dropdown Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/15 text-white/90 border border-white/15 transition cursor-pointer backdrop-blur-md"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[currentUser.status]?.bg}`} />
                <span className="hidden sm:inline">{statusColors[currentUser.status]?.label}</span>
                <ChevronDown className="w-3 h-3 text-white/50" />
              </button>

              {/* Status Dropdown Menu */}
              {statusMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setStatusMenuOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-1.5 w-36 bg-slate-900/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-2xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                    {(['online', 'busy', 'away', 'invisible'] as UserStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => {
                          onUpdateStatus(st);
                          setStatusMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-xl flex items-center gap-2 transition cursor-pointer ${
                          currentUser.status === st
                            ? 'text-blue-300 font-semibold bg-blue-600/30 border border-blue-400/30'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${statusColors[st].bg}`} />
                        <span>{statusColors[st].label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sub-nick / Personal status */}
          <div
            onClick={onOpenProfile}
            className="text-[11px] text-white/60 truncate max-w-[160px] sm:max-w-[260px] cursor-pointer hover:text-white transition flex items-center gap-1 mt-0.5"
            title="Clique para editar status pessoal"
          >
            <span className="text-blue-300">💭</span>
            <span className="truncate">{currentUser.subNick || 'Clique para definir sua mensagem...'}</span>
          </div>
        </div>
      </div>

      {/* Right: MSN Action Toolbar */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Auto-cleanup 3h badge indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[11px] backdrop-blur-md"
          title="Auto-limpeza ativa: Mensagens de texto, vídeos e áudios do salão são excluídos automaticamente a cada 3 horas para manter a sala limpa e veloz."
        >
          <Timer className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-mono">Auto-limpeza: 3h</span>
        </div>

        {/* Community Moderation / Vote Ban Trigger */}
        <button
          type="button"
          onClick={onOpenVoteBanModal}
          className="p-2 sm:px-3 sm:py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
          title="Votação Comunitária de Banimento (1 min / 5 votos)"
        >
          <Shield className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden lg:inline">Moderação</span>
        </button>

        {/* Admin Master Panel */}
        {onOpenAdmin && (
          <button
            type="button"
            onClick={onOpenAdmin}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 text-blue-200 border border-blue-400/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
            title="Acessar Painel de Admin (?admin=true)"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span className="hidden xl:inline">Painel Admin</span>
          </button>
        )}

        {/* Sound Toggle (Mute/Unmute) */}
        <button
          type="button"
          onClick={toggleSound}
          className={`p-2 sm:p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer backdrop-blur-md ${
            isMuted
              ? 'bg-rose-500/20 border-rose-400/40 text-rose-300 hover:bg-rose-500/30'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
          }`}
          title={isMuted ? 'Sons desativados (Clique para ativar sons do MSN)' : 'Sons ativados'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>

        {/* Contacts Sidebar Toggle */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 border transition cursor-pointer backdrop-blur-md ${
            isSidebarOpen
              ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-900/30'
              : 'bg-white/10 hover:bg-white/15 border-white/15 text-white'
          }`}
          title="Ver Lista de Contatos Conectados"
        >
          <Users className="w-4 h-4" />
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-[11px] font-bold text-white">
            {onlineCount}
          </span>
        </button>

        {/* Logout / Trocar de Foto */}
        <button
          type="button"
          onClick={onLogout}
          className="p-2 sm:p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-400/40 text-white/50 hover:text-rose-300 transition cursor-pointer backdrop-blur-md"
          title="Sair / Conectar com outro perfil"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
