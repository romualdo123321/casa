import React from 'react';
import { Video, PhoneOff, Radio } from 'lucide-react';
import type { UserProfile } from '../types';

interface IncomingCallNotificationProps {
  caller: UserProfile;
  onAccept: () => void;
  onReject: () => void;
}

export default function IncomingCallNotification({
  caller,
  onAccept,
  onReject,
}: IncomingCallNotificationProps) {
  return (
    <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-6 duration-300">
      <div className="w-84 sm:w-96 bg-slate-900/95 border-2 border-blue-400/80 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl text-white flex flex-col gap-3 shadow-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-12 h-12 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md">
              <img
                src={caller.avatar}
                alt={caller.nick}
                className="w-full h-full object-cover rounded-[14px]"
              />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-slate-900 animate-ping" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-400" /> Webcam P2P
              </span>
            </div>
            <h4
              className="font-bold text-sm truncate mt-0.5"
              style={{ color: caller.userColor || '#60a5fa' }}
            >
              {caller.nick}
            </h4>
            <p className="text-[11px] text-white/70 truncate">
              Está te chamando para conversa com webcam!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            type="button"
            onClick={onReject}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Recusar</span>
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25 border border-white/20 transition cursor-pointer active:scale-95 animate-pulse"
          >
            <Video className="w-4 h-4" />
            <span>Atender Webcam</span>
          </button>
        </div>
      </div>
    </div>
  );
}
