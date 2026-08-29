import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Users } from 'lucide-react';
import type { UserProfile } from '../types';

interface VoteBanModalProps {
  users: UserProfile[];
  currentUserId: string;
  preSelectedTarget?: UserProfile | null;
  onStartVote: (targetUserId: string, reason: string) => void;
  onClose: () => void;
}

export default function VoteBanModal({
  users,
  currentUserId,
  preSelectedTarget,
  onStartVote,
  onClose,
}: VoteBanModalProps) {
  const availableTargets = users.filter((u) => u.id !== currentUserId && !u.isAdmin);
  const [targetUserId, setTargetUserId] = useState(
    preSelectedTarget ? preSelectedTarget.id : availableTargets[0]?.id || ''
  );
  const [reason, setReason] = useState('Bagunça ou comportamento inadequado no chat');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId) return;
    onStartVote(targetUserId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md bg-white/[0.08] border border-rose-500/40 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-rose-950/40 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Votação Comunitária de Banimento</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          <div className="p-3.5 bg-rose-500/10 border border-rose-400/30 rounded-2xl text-xs text-rose-200 leading-relaxed flex items-start gap-2.5 backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Ao iniciar uma votação, todos na sala terão <strong>1 minuto</strong> para votar. Se atingir{' '}
              <strong>5 votos</strong>, o usuário será banido por <strong>30 minutos</strong>.
            </p>
          </div>

          {availableTargets.length === 0 ? (
            <p className="text-xs text-white/50 text-center py-4">
              Não há outros usuários disponíveis para votar no momento.
            </p>
          ) : (
            <>
              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1.5">
                  Selecione o usuário para abrir votação:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableTargets.map((user) => (
                    <label
                      key={user.id}
                      className={`p-2.5 rounded-2xl border flex items-center justify-between cursor-pointer transition backdrop-blur-md ${
                        targetUserId === user.id
                          ? 'bg-rose-500/20 border-rose-400 text-white shadow-md'
                          : 'bg-white/5 border-white/10 text-white/80 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="targetUser"
                          value={user.id}
                          checked={targetUserId === user.id}
                          onChange={(e) => setTargetUserId(e.target.value)}
                          className="text-rose-500 focus:ring-rose-400"
                        />
                        <img
                          src={user.avatar}
                          alt={user.nick}
                          className="w-8 h-8 rounded-xl object-cover bg-slate-800 border border-white/20"
                        />
                        <span className="font-bold text-xs" style={{ color: user.userColor || '#60a5fa' }}>
                          {user.nick}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">{user.email}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/80 block mb-1">
                  Motivo da Votação:
                </label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Ofensas, spam, brincadeiras indevidas..."
                  className="w-full bg-white/5 border border-white/15 focus:border-rose-400 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none backdrop-blur-md"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white/80 text-xs font-medium backdrop-blur-md transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white text-xs font-bold shadow-lg shadow-rose-600/30 border border-white/20 transition cursor-pointer"
                >
                  Iniciar Votação (1 min)
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
