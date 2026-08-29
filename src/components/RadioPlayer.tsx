import React, { useState, useRef, useEffect } from 'react';
import {
  Radio,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ExternalLink,
  Music,
  Activity,
  X,
  RadioTower,
} from 'lucide-react';

interface RadioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RadioPlayer({ isOpen, onClose }: RadioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [statusText, setStatusText] = useState<'Pronto' | 'Conectando...' | 'Ao Vivo' | 'Offline / Abra o link'>(
    'Pronto'
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Direct and proxy stream candidates for uk15freenew.listen2myradio.com
  const streamUrls = [
    'http://uk15freenew.listen2myradio.com:8000/stream',
    'http://uk15freenew.listen2myradio.com:8000/;',
    'http://uk15freenew.listen2myradio.com:8000/live',
    'https://uk15freenew.listen2myradio.com',
  ];

  const [streamIndex, setStreamIndex] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      setStatusText('Pronto');
    } else {
      setStatusText('Conectando...');
      audioRef.current.src = streamUrls[streamIndex];
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setStatusText('Ao Vivo');
        })
        .catch((err) => {
          console.warn('Erro ao conectar ao streaming de áudio:', err);
          // Try next fallback or prompt open
          if (streamIndex < streamUrls.length - 1) {
            setStreamIndex((prev) => prev + 1);
          } else {
            setStatusText('Offline / Abra o link');
          }
          setIsPlaying(false);
        });
    }
  };

  const handleOpenDirect = () => {
    window.open('http://uk15freenew.listen2myradio.com', '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs" onClick={onClose} />
      <div className="fixed bottom-24 sm:bottom-28 left-4 sm:left-8 z-50 w-80 sm:w-96 bg-slate-900/95 border border-white/20 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          preload="none"
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            if (isPlaying) {
              setStatusText('Offline / Abra o link');
              setIsPlaying(false);
            }
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white">
              <RadioTower className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Rádio MSN Ao Vivo
                {isPlaying && (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </h4>
              <p className="text-[10px] text-white/50 truncate font-mono">
                uk15freenew.listen2myradio.com
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Equalizer & Status Display */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Equalizer Bars */}
            <div className="flex items-end gap-1 h-6 px-1">
              {[60, 100, 40, 80, 50, 90, 30].map((h, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-emerald-500 to-cyan-400 animate-pulse'
                      : 'bg-white/20'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(20, (h * (i % 2 === 0 ? 0.9 : 1.1)) % 100)}%` : '20%',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>

            <div>
              <span className="text-[11px] font-bold text-white block">Status da Transmissão</span>
              <span
                className={`text-[10px] font-semibold ${
                  statusText === 'Ao Vivo'
                    ? 'text-emerald-400'
                    : statusText === 'Conectando...'
                    ? 'text-amber-400'
                    : 'text-white/60'
                }`}
              >
                {statusText}
              </span>
            </div>
          </div>

          {/* Direct Link Button */}
          <button
            type="button"
            onClick={handleOpenDirect}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] font-medium border border-white/15 flex items-center gap-1 transition cursor-pointer"
            title="Abrir página oficial da Rádio"
          >
            <span>Abrir Web</span>
            <ExternalLink className="w-3 h-3 text-blue-400" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            className={`flex-1 py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95 ${
              isPlaying
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-rose-500/20'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white border border-white/20 shadow-emerald-500/25'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pausar Rádio</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Ouvir Rádio Ao Vivo</span>
              </>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/60 hover:text-white transition cursor-pointer"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                setIsMuted(false);
              }}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>
        </div>
      </div>
    </>
  );
}
