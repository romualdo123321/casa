import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, Volume2, X } from 'lucide-react';

interface AudioRecorderProps {
  onSendAudio: (audioDataUrl: string, durationSeconds: number) => void;
  onCancel: () => void;
}

export default function AudioRecorder({ onSendAudio, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Start microphone recording on mount
  useEffect(() => {
    startMicrophoneRecording();
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startMicrophoneRecording = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);

        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // 200ms slice
      setIsRecording(true);
      setRecordingSeconds(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMsg('Não foi possível acessar o microfone. Verifique as permissões do seu navegador.');
      setIsRecording(false);
    }
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleStopRecording = () => {
    stopTimer();
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const togglePreviewPlay = () => {
    if (!recordedAudioUrl) return;

    if (isPlayingPreview) {
      previewAudioRef.current?.pause();
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        previewAudioRef.current = new Audio(recordedAudioUrl);
        previewAudioRef.current.onended = () => setIsPlayingPreview(false);
      }
      previewAudioRef.current.currentTime = 0;
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const handleSend = () => {
    if (!recordedAudioUrl) return;
    onSendAudio(recordedAudioUrl, recordingSeconds || 1);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-3.5 bg-white/10 border border-white/20 rounded-2xl shadow-xl flex items-center justify-between gap-3 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
      {errorMsg ? (
        <div className="flex-1 flex items-center justify-between">
          <p className="text-xs text-rose-300 font-medium">{errorMsg}</p>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : isRecording ? (
        // Active recording view
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-rose-500 animate-ping" />
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-300">Gravando Mensagem de Voz...</span>
              <span className="font-mono text-xs font-bold text-white bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-400/40 backdrop-blur-md">
                {formatTimer(recordingSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-rose-300 transition cursor-pointer backdrop-blur-md"
              title="Cancelar Gravação"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleStopRecording}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 border border-white/20 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Concluir</span>
            </button>
          </div>
        </div>
      ) : (
        // Finished recording preview & send view
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePreviewPlay}
              className="w-9 h-9 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg border border-white/20 transition cursor-pointer"
            >
              {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div>
              <span className="text-xs font-bold text-emerald-300 block">Áudio Pronto</span>
              <span className="text-[10px] text-white/50 font-mono">Duração: {formatTimer(recordingSeconds)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/60 hover:text-rose-300 transition cursor-pointer backdrop-blur-md"
              title="Descartar Áudio"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleSend}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 border border-white/20 transition cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar Áudio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
