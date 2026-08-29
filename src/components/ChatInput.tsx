import React, { useState, useRef } from 'react';
import {
  Send,
  Smile,
  Mic,
  Image as ImageIcon,
  Bold,
  Italic,
  Palette,
  Bell,
  X,
  Volume2,
  Music,
  Radio,
  RadioTower,
  Sparkles,
} from 'lucide-react';
import { MSN_EMOTICONS } from '../utils/emoticons';
import { CLASSIC_COLORS, NEON_COLORS, MSN_COLORS } from '../data/presetAvatars';
import type { UserProfile, MessageType } from '../types';
import RadioPlayer from './RadioPlayer';

interface ChatInputProps {
  currentUser: UserProfile;
  onSendMessage: (data: {
    content: string;
    msgType?: MessageType;
    fontColor?: string;
    fontStyle?: 'normal' | 'bold' | 'italic' | 'bold-italic';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    audioData?: string;
    audioDuration?: number;
    videoUrl?: string;
  }) => void;
  onStartAudioRecording: () => void;
}

export default function ChatInput({
  currentUser,
  onSendMessage,
  onStartAudioRecording,
}: ChatInputProps) {
  const [text, setText] = useState('');
  const [showEmoticons, setShowEmoticons] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showAudioOptions, setShowAudioOptions] = useState(false);
  const [showRadioPlayer, setShowRadioPlayer] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [fontColor, setFontColor] = useState(currentUser.userColor || CLASSIC_COLORS[0].color);
  const [customColorHex, setCustomColorHex] = useState(fontColor);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let fontStyle: 'normal' | 'bold' | 'italic' | 'bold-italic' = 'normal';
    if (isBold && isItalic) fontStyle = 'bold-italic';
    else if (isBold) fontStyle = 'bold';
    else if (isItalic) fontStyle = 'italic';

    onSendMessage({
      content: trimmed,
      msgType: 'text',
      fontColor,
      fontStyle,
    });

    setText('');
    setShowEmoticons(false);
    setShowColorPicker(false);
    setShowAudioOptions(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInsertEmoticon = (code: string) => {
    setText((prev) => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + code + ' ');
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Upload handler for photos and audio/music in the salon
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'audio'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;

      if (type === 'image') {
        onSendMessage({
          content: '📷 Foto enviada',
          msgType: 'image',
          fileUrl: dataUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        });
      } else if (type === 'audio') {
        onSendMessage({
          content: `🎵 Música / Áudio: ${file.name}`,
          msgType: 'audio',
          audioData: dataUrl,
          fileUrl: dataUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          audioDuration: 0,
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset input
    e.target.value = '';
    setShowAudioOptions(false);
  };

  return (
    <div className="bg-slate-900/80 border-t border-white/10 p-3 sm:p-4 shrink-0 relative backdrop-blur-xl">
      {/* Hidden inputs for media attachments (Only Photo & Audio allowed in salon) */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => handleFileUpload(e, 'image')}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={audioFileInputRef}
        onChange={(e) => handleFileUpload(e, 'audio')}
        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
        className="hidden"
      />

      {/* Radio Player Modal / Popover */}
      <RadioPlayer isOpen={showRadioPlayer} onClose={() => setShowRadioPlayer(false)} />

      {/* Audio Options Modal Drawer */}
      {showAudioOptions && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowAudioOptions(false)} />
          <div className="absolute bottom-full right-16 sm:right-32 mb-3 w-64 bg-slate-900/95 border border-white/20 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <Volume2 className="w-4 h-4" /> Opções de Áudio
              </span>
              <button
                type="button"
                onClick={() => setShowAudioOptions(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setShowAudioOptions(false);
                  onStartAudioRecording();
                }}
                className="w-full p-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 flex items-center gap-2.5 text-xs font-semibold transition text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-500/30 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4 text-emerald-300" />
                </div>
                <div>
                  <p className="font-bold">Gravar Mensagem de Voz</p>
                  <p className="text-[10px] text-white/50">Usar microfone ao vivo</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => audioFileInputRef.current?.click()}
                className="w-full p-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-400/30 flex items-center gap-2.5 text-xs font-semibold transition text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-500/30 flex items-center justify-center shrink-0">
                  <Music className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <p className="font-bold">Enviar Música / Áudio</p>
                  <p className="text-[10px] text-white/50">MP3, WAV, M4A, OGG</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Emoticons Drawer */}
      {showEmoticons && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowEmoticons(false)} />
          <div className="absolute bottom-full left-3 sm:left-6 mb-3 w-72 sm:w-84 bg-slate-900/95 border border-white/20 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <span>😊</span> Emoticons Clássicos do MSN
              </span>
              <button
                type="button"
                onClick={() => setShowEmoticons(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
              {MSN_EMOTICONS.map((emoticon) => (
                <button
                  key={emoticon.code}
                  type="button"
                  onClick={() => handleInsertEmoticon(emoticon.code)}
                  className="p-2 rounded-xl hover:bg-white/15 hover:scale-125 transition text-lg flex items-center justify-center cursor-pointer"
                  title={`${emoticon.name} (${emoticon.code})`}
                >
                  {emoticon.emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Advanced Color Picker Drawer (Normais, Neon, e Criar Própria Cor) */}
      {showColorPicker && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowColorPicker(false)} />
          <div className="absolute bottom-full left-4 sm:left-16 mb-3 w-80 sm:w-88 bg-slate-900/95 border border-white/20 rounded-3xl p-4 shadow-2xl backdrop-blur-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-purple-400" /> Cor do Texto das Mensagens
              </span>
              <button
                type="button"
                onClick={() => setShowColorPicker(false)}
                className="text-white/50 hover:text-white p-1 rounded-lg"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. Cores Clássicas */}
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-1.5">
                Cores Normais / Clássicas:
              </span>
              <div className="grid grid-cols-6 gap-2">
                {CLASSIC_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setFontColor(c.color);
                      setCustomColorHex(c.color);
                    }}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center ${
                      fontColor === c.color ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                    title={c.name}
                  >
                    {fontColor === c.color && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Cores Neon */}
            <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3 h-3 text-cyan-300" /> Cores Neon / Vibrantes:
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {NEON_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => {
                      setFontColor(c.color);
                      setCustomColorHex(c.color);
                    }}
                    className={`w-7 h-7 rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center ${
                      fontColor === c.color
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-85 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: c.color,
                      boxShadow: fontColor === c.color ? `0 0 10px ${c.color}` : 'none',
                    }}
                    title={c.name}
                  >
                    {fontColor === c.color && <div className="w-1.5 h-1.5 rounded-full bg-black/80" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Criar Própria Cor (Personalizada) */}
            <div className="pt-2 border-t border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1.5">
                Criar Própria Cor (Personalizada):
              </span>
              <div className="flex items-center gap-2">
                {/* HTML5 Color Wheel Input */}
                <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/30 shrink-0 cursor-pointer shadow">
                  <input
                    type="color"
                    value={fontColor}
                    onChange={(e) => {
                      setFontColor(e.target.value);
                      setCustomColorHex(e.target.value);
                    }}
                    className="absolute -top-2 -left-2 w-14 h-14 cursor-pointer"
                    title="Escolha qualquer cor na paleta"
                  />
                </div>

                {/* Hex Text Input */}
                <input
                  type="text"
                  value={customColorHex}
                  onChange={(e) => {
                    setCustomColorHex(e.target.value);
                    if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                      setFontColor(e.target.value);
                    }
                  }}
                  placeholder="#000000"
                  maxLength={7}
                  className="w-24 bg-white/10 border border-white/20 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-400"
                />

                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition cursor-pointer text-center"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MSN Classic Formatting & Action Toolbar */}
      <div className="flex items-center justify-between gap-1 mb-2.5 px-1 text-white/80">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Bold Button */}
          <button
            type="button"
            onClick={() => setIsBold(!isBold)}
            className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer backdrop-blur-md ${
              isBold ? 'bg-blue-600 text-white shadow' : 'bg-white/10 hover:bg-white/15 text-white/70 border border-white/10'
            }`}
            title="Negrito (B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Button */}
          <button
            type="button"
            onClick={() => setIsItalic(!isItalic)}
            className={`p-1.5 rounded-xl text-xs font-bold transition cursor-pointer backdrop-blur-md ${
              isItalic ? 'bg-blue-600 text-white shadow' : 'bg-white/10 hover:bg-white/15 text-white/70 border border-white/10'
            }`}
            title="Itálico (I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Font Color Picker with Neon / Normal preview */}
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
            title="Escolher ou Criar Cor (Normais, Neon, Personalizada)"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
              style={{ backgroundColor: fontColor }}
            />
          </button>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {/* Emoticons Button */}
          <button
            type="button"
            onClick={() => setShowEmoticons(!showEmoticons)}
            className={`p-1.5 rounded-xl transition flex items-center gap-1 text-xs cursor-pointer backdrop-blur-md ${
              showEmoticons
                ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 hover:text-amber-300'
            }`}
            title="Inserir Emoticon"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Send Photo Button */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white/70 hover:text-emerald-400 transition cursor-pointer backdrop-blur-md flex items-center gap-1 text-xs"
            title="Enviar Foto"
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span className="text-[11px] font-medium">Foto</span>
          </button>

          {/* Radio Online Player Button (Replaces Vídeo and Arquivo in Salon as requested) */}
          <button
            type="button"
            onClick={() => setShowRadioPlayer(!showRadioPlayer)}
            className={`p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-semibold shadow-sm active:scale-95 ${
              showRadioPlayer
                ? 'bg-rose-500/30 border-rose-400/50 text-rose-200'
                : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border-amber-400/40 text-amber-200'
            }`}
            title="Ouvir Rádio Online (uk15freenew.listen2myradio.com)"
          >
            <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="font-bold">Rádio</span>
          </button>
        </div>

        {/* Audio Recording & Nudge Shortcuts */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Audio Recording & Music Button */}
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={onStartAudioRecording}
              className="px-3 py-1.5 rounded-l-xl bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-400/40 text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-emerald-500/20 cursor-pointer backdrop-blur-md active:scale-95"
              title="Gravar Mensagem de Voz com Microfone"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Gravar Áudio</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAudioOptions(!showAudioOptions)}
              className="px-2 py-1.5 rounded-r-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border-t border-r border-b border-emerald-400/40 text-xs transition cursor-pointer"
              title="Mais opções de áudio (Enviar música / arquivo)"
            >
              <Music className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Input Area (Neutral styling as explicitly requested: "AQUI A COR TEM QUE SER NEUTRA, O USUARIO NAO PODE ESCOLHER COR PARA ESSE INPUT") */}
      <div className="flex items-end gap-2.5">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem para o salão... (Enter para enviar, Shift+Enter para linha)"
            className="w-full bg-slate-900/60 border border-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-white/40 focus:outline-none transition resize-none custom-scrollbar backdrop-blur-md"
          />
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim()}
          className="h-11 px-5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 border border-white/20 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <span>Enviar</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
