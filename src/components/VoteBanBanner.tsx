import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock, CheckCircle2, UserX } from 'lucide-react';
import type { VoteBanSession } from '../types';

interface VoteBanBannerProps {
  voteBan: VoteBanSession;
  currentUserId: string;
  onCastVote: (voteBanId: string) => void;
}

export default function VoteBanBanner({
  voteBan,
  currentUserId,
  onCastVote,
}: VoteBanBannerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(60);

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((voteBan.expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [voteBan.expiresAt]);

  const hasVoted = voteBan.votes.includes(currentUserId);
  const isTarget = voteBan.targetUser.id === currentUserId;
  const progressPercent = Math.min(100, (voteBan.votes.length / voteBan.requiredVotes) * 100);

  return (
    <div className="bg-rose-950/40 border-b border-rose-500/30 p-3.5 shadow-xl shrink-0 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Info & Target Avatar */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative shrink-0">
            <img
              src={voteBan.targetUser.avatar}
              alt={voteBan.targetUser.nick}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-rose-400 shadow-md"
            />
            <span className="absolute -top-1 -right-1 bg-rose-600 text-white rounded-full p-0.5 shadow">
              <ShieldAlert className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                Votação de Banimento (30min)
              </span>
              <span className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/40 backdrop-blur-md">
                <Clock className="w-3 h-3" />
                {remainingSeconds}s restantes
              </span>
            </div>
            <p className="text-xs text-white/90 mt-0.5">
              Banir <strong className="text-rose-400">{voteBan.targetUser.nick}</strong>? Motivo: "
              {voteBan.reason}"
            </p>
          </div>
        </div>

        {/* Right: Vote Progress Bar & Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Progress bar */}
          <div className="flex flex-col gap-1 w-32">
            <div className="flex justify-between text-[11px] font-bold text-white/80">
              <span>Votos:</span>
              <span className="text-rose-400 font-mono">
                {voteBan.votes.length}/{voteBan.requiredVotes}
              </span>
            </div>
            <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-amber-400 to-rose-500 h-full rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Vote Action */}
          {!isTarget && (
            <button
              type="button"
              onClick={() => onCastVote(voteBan.id)}
              disabled={hasVoted || remainingSeconds <= 0}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg cursor-pointer backdrop-blur-md ${
                hasVoted
                  ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 cursor-default'
                  : 'bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-rose-600/30 border border-white/20 active:scale-95'
              }`}
            >
              {hasVoted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Você já Votou</span>
                </>
              ) : (
                <>
                  <UserX className="w-4 h-4" />
                  <span>Votar SIM para Banir</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
