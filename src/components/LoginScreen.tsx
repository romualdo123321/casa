import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Sparkles,
  Smile,
  Check,
  User,
  Music,
  ShieldCheck,
  Zap,
  Globe,
  RefreshCw,
  X,
  Volume2,
} from 'lucide-react';
import type { UserProfile, UserStatus } from '../types';
import { PRESET_AVATARS, MSN_COLORS, compressAndFormatAvatar, generateRandomAvatar } from '../data/presetAvatars';
import { playMsnLoginSound } from '../utils/audioEffects';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  serverOnlineCount?: number;
  onOpenAdmin?: () => void;
}

export default function LoginScreen({ onLogin, serverOnlineCount = 1, onOpenAdmin }: LoginScreenProps) {
  const [nick, setNick] = useState('');
  const [subNick, setSubNick] = useState('');
  const [avatar, setAvatar] = useState<string>(PRESET_AVATARS[0].url);
  const [selectedColor, setSelectedColor] = useState(MSN_COLORS[0].color);
  const [status, setStatus] = useState<UserStatus>('online');
  const [loginMode, setLoginMode] = useState<'guest' | 'account'>('guest');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState<'all' | 'msn_classic' | 'animals' | 'dicebear'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle custom image file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processImageFile(files[0]);
  };

  const processImageFile = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('Por favor selecione um arquivo de imagem válido (JPG, PNG, GIF ou WEBP).');
      return;
    }
    try {
      setIsUploading(true);
      const compressedDataUrl = await compressAndFormatAvatar(file);
      setAvatar(compressedDataUrl);
      setShowGallery(false);
    } catch (err: any) {
      setUploadError('Não foi possível processar a imagem. Tente outra foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRandomAvatar = () => {
    const randomUrl = generateRandomAvatar(nick || 'User');
    setAvatar(randomUrl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNick = nick.trim() || 'Amigo MSN';
    const finalEmail = email.trim() || `${finalNick.toLowerCase().replace(/\s+/g, '')}@msn.local`;
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    const userProfile: UserProfile = {
      id: userId,
      nick: finalNick,
      email: finalEmail,
      avatar: avatar || PRESET_AVATARS[0].url,
      status: status,
      subNick: subNick.trim() || 'Disponível para bater papo no MSN!',
      userColor: selectedColor,
      registered: loginMode === 'account',
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    };

    // Save recent user info in localStorage for convenience
    try {
      localStorage.setItem('msn_last_nick', finalNick);
      localStorage.setItem('msn_last_avatar', avatar);
      localStorage.setItem('msn_last_subnick', subNick);
      localStorage.setItem('msn_last_color', selectedColor);
    } catch {}

    playMsnLoginSound();
    onLogin(userProfile);
  };

  // Filter gallery presets
  const filteredPresets =
    galleryCategory === 'all'
      ? PRESET_AVATARS
      : PRESET_AVATARS.filter((p) => p.category === galleryCategory);

  return (
    <div className="min-h-screen w-full bg-[#0f172a] flex items-center justify-center p-3 sm:p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* Ambient background glow orbs */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] -top-20 -left-20 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-[120px] -bottom-20 -right-20 pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[100px] top-1/2 left-1/3 pointer-events-none" />

      {/* Hidden file input for custom profile photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="relative w-full max-w-4xl bg-white/10 border border-white/20 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left: Window Controls, MSN Brand & Live Profile Preview */}
        <div className="w-full md:w-5/12 bg-white/5 border-b md:border-b-0 md:border-r border-white/10 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div>
            {/* Window control dots + version label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-500/90 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/90 shadow-sm" />
              <div className="w-3 h-3 rounded-full bg-green-500/90 shadow-sm" />
              <span className="ml-2 text-white/40 text-[11px] font-medium tracking-widest uppercase">
                MSN Messenger v2.4
              </span>
            </div>

            {/* MSN Logo & Title */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md p-1 shadow-lg flex items-center justify-center">
                <span className="text-2xl">🦋</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Bate-Papo <span className="text-blue-400">MSN</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Live
                  </span>
                </h1>
                <p className="text-xs text-white/50">Mensageiro em Tempo Real & Rede Local</p>
              </div>
            </div>

            {/* Live Profile Card Preview */}
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-4 my-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center justify-between">
                <span>Prévia do seu Contato:</span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold lowercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  ao vivo
                </span>
              </div>

              <div className="flex items-center gap-3.5">
                {/* Avatar with Status Badge */}
                <div className="relative group shrink-0">
                  <div className="w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-md overflow-hidden border border-white/20">
                    <img
                      src={avatar}
                      alt="Foto de Perfil"
                      className="w-full h-full object-cover rounded-[14px] bg-slate-900"
                    />
                  </div>
                  {/* Status badge */}
                  <span
                    className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 shadow-sm ${
                      status === 'online'
                        ? 'bg-emerald-500'
                        : status === 'busy'
                        ? 'bg-rose-500'
                        : status === 'away'
                        ? 'bg-amber-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>

                {/* Nick & Subnick */}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-bold text-sm truncate flex items-center gap-1.5"
                    style={{ color: selectedColor }}
                  >
                    <span>{nick.trim() || 'Seu Apelido'}</span>
                    <span className="text-[11px] text-white/40 font-normal">
                      ({status === 'online' ? 'Online' : status === 'busy' ? 'Ocupado' : 'Ausente'})
                    </span>
                  </div>
                  <p className="text-xs text-white/70 truncate mt-0.5 flex items-center gap-1">
                    <span className="text-blue-300">💭</span>
                    <span>{subNick.trim() || 'Sua mensagem pessoal ou música...'}</span>
                  </p>
                  <p className="text-[10px] text-white/30 mt-1 font-mono">
                    {email ? email : `${(nick || 'usuario').toLowerCase().replace(/\s+/g, '')}@msn.local`}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Highlights info pill */}
            <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl mt-4">
              <p className="text-blue-200 text-xs leading-relaxed">
                Personalize sua presença com foto exclusiva, áudio e o clássico tremer a tela do MSN.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Rede Local & Online
            </span>
            <span className="bg-white/10 px-2.5 py-0.5 rounded-full text-[11px] text-white/80 border border-white/15">
              {serverOnlineCount} {serverOnlineCount === 1 ? 'pessoa' : 'pessoas'} na sala
            </span>
          </div>
        </div>

        {/* Right / Main: Form Configuration & Avatar Picker */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-between">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: PROFILE PICTURE SELECTION */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs uppercase font-bold tracking-widest text-white/50 flex items-center gap-1.5">
                  <span>1. Foto de Perfil</span>
                </label>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={handleRandomAvatar}
                    className="text-xs text-white/70 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                    title="Sortear novo avatar"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Aleatório
                  </button>
                </div>
              </div>

              {/* Avatar Upload Dropzone & Action Box */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col sm:flex-row items-center gap-4 ${
                  isDragging
                    ? 'border-emerald-400 bg-emerald-500/20'
                    : 'border-dashed border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                }`}
              >
                {/* Big Avatar Display with Camera badge */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="Clique para escolher uma foto do seu dispositivo"
                >
                  <div className="w-20 h-20 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-xl overflow-hidden border border-white/20">
                    <img
                      src={avatar}
                      alt="Avatar Atual"
                      className="w-full h-full object-cover rounded-[14px] bg-slate-900"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <Camera className="w-6 h-6 text-white" />
                    <span className="text-[10px] text-white font-semibold mt-0.5">Alterar</span>
                  </div>
                </div>

                {/* Upload & Gallery Action Buttons */}
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-xs font-semibold text-white/90 mb-2">
                    Escolha ou envie sua foto para os outros te reconhecerem:
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/30 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploading ? 'Processando...' : 'Carregar Minha Foto'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowGallery(!showGallery)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition cursor-pointer ${
                        showGallery
                          ? 'bg-emerald-600/80 text-white border-emerald-400/50'
                          : 'bg-white/10 hover:bg-white/15 text-white border-white/15'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Ícones MSN Clássicos
                    </button>
                  </div>
                  <p className="text-[10px] text-white/40 mt-2">
                    JPG, PNG, GIF, WEBP ou arraste uma foto aqui.
                  </p>
                </div>
              </div>

              {uploadError && (
                <p className="text-xs text-rose-400 mt-1.5 font-medium">{uploadError}</p>
              )}

              {/* Expandable MSN Classic Gallery */}
              {showGallery && (
                <div className="mt-3 p-3.5 bg-slate-900/90 border border-white/15 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-blue-300">Galeria de Avatares MSN:</span>
                    {/* Category tabs */}
                    <div className="flex items-center gap-1 text-[10px]">
                      {(
                        [
                          { id: 'all', label: 'Todos' },
                          { id: 'msn_classic', label: 'MSN Retrô' },
                          { id: 'animals', label: 'Animais' },
                          { id: 'dicebear', label: 'Avatares' },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setGalleryCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg transition ${
                            galleryCategory === cat.id
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-white/50 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preset Avatar Grid */}
                  <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                    {filteredPresets.map((preset) => {
                      const isSelected = avatar === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatar(preset.url);
                          }}
                          className={`relative rounded-xl overflow-hidden p-0.5 transition cursor-pointer group ${
                            isSelected
                              ? 'ring-2 ring-emerald-400 scale-105 shadow-md bg-emerald-500/50'
                              : 'hover:scale-105 bg-white/5 border border-white/10 opacity-70 hover:opacity-100'
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-10 h-10 object-cover rounded-[9px]"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center">
                              <Check className="w-4 h-4 text-emerald-300 drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: NICKNAME & SUB-NICK STATUS */}
            <div className="space-y-3">
              <label className="text-xs uppercase font-bold tracking-widest text-white/50 block">
                2. Identificação no Chat
              </label>

              {/* Nickname Field */}
              <div className="space-y-1">
                <label className="text-white/40 text-[10px] uppercase font-bold tracking-widest ml-1">
                  Seu Apelido / Nickname
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    placeholder="Digite seu nickname..."
                    maxLength={32}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all font-semibold"
                    style={{ color: selectedColor }}
                  />
                  <div className="absolute right-3.5 top-2.5 text-[11px] text-white/30">
                    {nick.length}/32
                  </div>
                </div>
              </div>

              {/* Sub-nick / Personal Message */}
              <div className="space-y-1">
                <label className="text-white/40 text-[10px] uppercase font-bold tracking-widest ml-1">
                  Mensagem Pessoal (Sub-nick)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={subNick}
                    onChange={(e) => setSubNick(e.target.value)}
                    placeholder="Ex: 🎵 Ouvindo Charlie Brown Jr | Disponível..."
                    maxLength={80}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  />
                </div>
              </div>

              {/* Color & Status Selector in a single row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Color Selector */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase font-bold tracking-widest block mb-1.5 ml-1">
                    Cor do seu Nick
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {MSN_COLORS.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.color)}
                        className={`w-6 h-6 rounded-full transition-transform cursor-pointer border border-white/20 ${c.bg} ${
                          selectedColor === c.color
                            ? 'ring-2 ring-white scale-110 shadow-lg'
                            : 'opacity-70 hover:opacity-100 hover:scale-105'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-white/40 text-[10px] uppercase font-bold tracking-widest block mb-1.5 ml-1">
                    Status Inicial
                  </label>
                  <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setStatus('online')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                        status === 'online'
                          ? 'bg-emerald-500 text-white shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-300" />
                      Online
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('busy')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                        status === 'busy'
                          ? 'bg-rose-500 text-white shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-rose-300" />
                      Ocupado
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('away')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                        status === 'away'
                          ? 'bg-amber-500 text-white shadow'
                          : 'text-white/50 hover:text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-300" />
                      Ausente
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] cursor-pointer"
              >
                <span>Entrar no Bate-Papo MSN</span>
                <span className="text-lg">🚀</span>
              </button>

              <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
                <span>MSN Messenger Classic</span>
                {onOpenAdmin && (
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-blue-300 hover:text-blue-200 hover:underline flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>Painel de Admin</span>
                    <span className="text-[10px] font-mono text-white/30">(?admin=true)</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
