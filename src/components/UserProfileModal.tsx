import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Check,
  MessageSquare,
  Bell,
  ShieldAlert,
  Save,
  User,
  Palette,
} from 'lucide-react';
import type { UserProfile, UserStatus } from '../types';
import { PRESET_AVATARS, MSN_COLORS, compressAndFormatAvatar, generateRandomAvatar } from '../data/presetAvatars';

interface UserProfileModalProps {
  user: UserProfile;
  isCurrentUser: boolean;
  onClose: () => void;
  onSaveProfile?: (updated: Partial<UserProfile>) => void;
  onOpenPrivateChat?: (user: UserProfile) => void;
  onNudgeUser?: (user: UserProfile) => void;
  onStartVoteBan?: (user: UserProfile) => void;
}

export default function UserProfileModal({
  user,
  isCurrentUser,
  onClose,
  onSaveProfile,
  onOpenPrivateChat,
  onNudgeUser,
  onStartVoteBan,
}: UserProfileModalProps) {
  const [nick, setNick] = useState(user.nick);
  const [subNick, setSubNick] = useState(user.subNick || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [selectedColor, setSelectedColor] = useState(user.userColor || MSN_COLORS[0].color);
  const [showGallery, setShowGallery] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressAndFormatAvatar(file);
      setAvatar(compressedDataUrl);
      setShowGallery(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRandomize = () => {
    const randomUrl = generateRandomAvatar(nick);
    setAvatar(randomUrl);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSaveProfile) return;

    onSaveProfile({
      nick: nick.trim() || user.nick,
      subNick: subNick.trim(),
      avatar,
      status,
      userColor: selectedColor,
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      <div className="w-full max-w-md bg-white/[0.08] border border-white/20 rounded-3xl shadow-2xl backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>{isCurrentUser ? '⚙️ Editar Seu Perfil & Foto' : '👤 Cartão de Contato MSN'}</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-4">
          {/* Avatar Display & Edit controls */}
          <div className="flex flex-col items-center text-center">
            <div className="relative group mb-3">
              <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 shadow-xl overflow-hidden border border-white/20">
                <img
                  src={avatar}
                  alt={nick}
                  className="w-full h-full object-cover rounded-[20px] bg-slate-900"
                />
              </div>

              {/* Status Indicator */}
              <span
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-slate-900 shadow-md ${
                  status === 'online'
                    ? 'bg-emerald-500'
                    : status === 'busy'
                    ? 'bg-rose-500'
                    : status === 'away'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`}
              />

              {isCurrentUser && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                  title="Carregar nova foto de perfil"
                >
                  <Camera className="w-7 h-7 text-white" />
                  <span className="text-[10px] text-white font-medium mt-1">Alterar Foto</span>
                </div>
              )}
            </div>

            {/* If Current User: Photo actions buttons */}
            {isCurrentUser && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 border border-white/20 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Carregando...' : 'Trocar Foto'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGallery(!showGallery)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 border border-white/15 transition cursor-pointer backdrop-blur-md"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Galeria</span>
                </button>

                <button
                  type="button"
                  onClick={handleRandomize}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-white/80 text-xs border border-white/15 transition cursor-pointer backdrop-blur-md"
                  title="Gerar avatar aleatório"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Gallery picker in edit mode */}
            {showGallery && isCurrentUser && (
              <div className="w-full p-3 my-2 bg-slate-900/90 border border-white/20 rounded-2xl backdrop-blur-xl">
                <span className="text-[11px] font-bold text-blue-400 block mb-2 text-left">
                  Escolha um Avatar Clássico:
                </span>
                <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setAvatar(preset.url)}
                      className={`rounded-xl overflow-hidden p-0.5 transition cursor-pointer ${
                        avatar === preset.url ? 'ring-2 ring-blue-400 scale-105' : 'hover:scale-105 opacity-80'
                      }`}
                    >
                      <img src={preset.url} alt={preset.name} className="w-8 h-8 object-cover rounded-lg" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form fields */}
          {isCurrentUser ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs text-white/80 font-medium block mb-1">Apelido (Nick):</label>
                <input
                  type="text"
                  required
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  maxLength={32}
                  className="w-full bg-white/5 border border-white/15 focus:border-blue-400 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none backdrop-blur-md"
                  style={{ color: selectedColor }}
                />
              </div>

              <div>
                <label className="text-xs text-white/80 font-medium block mb-1">
                  Mensagem de Status (Sub-nick):
                </label>
                <input
                  type="text"
                  value={subNick}
                  onChange={(e) => setSubNick(e.target.value)}
                  maxLength={80}
                  placeholder="Ex: 🎵 Ouvindo rock..."
                  className="w-full bg-white/5 border border-white/15 focus:border-blue-400 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none backdrop-blur-md"
                />
              </div>

              {/* Status and Color */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] text-white/60 block mb-1">Status:</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as UserStatus)}
                    className="w-full bg-slate-900/90 border border-white/15 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none backdrop-blur-md"
                  >
                    <option value="online">🟢 Disponível</option>
                    <option value="busy">🔴 Ocupado</option>
                    <option value="away">🟡 Ausente</option>
                    <option value="invisible">⚪ Invisível</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-white/60 block mb-1">Cor do Nome:</label>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {MSN_COLORS.slice(0, 6).map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => setSelectedColor(c.color)}
                        className={`w-5 h-5 rounded-full shadow ${c.bg} ${
                          selectedColor === c.color ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Save button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer mt-3"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Perfil Atualizado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Contact card view for other users
            <div className="space-y-4 text-center">
              <div>
                <h4 className="font-bold text-lg" style={{ color: user.userColor || '#60a5fa' }}>
                  {user.nick}
                </h4>
                <p className="text-xs text-white/70 mt-1 italic">
                  "{user.subNick || 'Sem mensagem de status'}"
                </p>
                <p className="text-[10px] text-white/40 font-mono mt-1">{user.email}</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-center gap-2.5">
                {onOpenPrivateChat && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenPrivateChat(user);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 border border-white/20 transition cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Conversa Privada</span>
                  </button>
                )}

                {onNudgeUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onNudgeUser(user);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-2xl bg-amber-500/20 hover:bg-amber-500 border border-amber-400/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow transition cursor-pointer backdrop-blur-md"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Chamar Atenção</span>
                  </button>
                )}

                {onStartVoteBan && (
                  <button
                    type="button"
                    onClick={() => {
                      onStartVoteBan(user);
                      onClose();
                    }}
                    className="p-2.5 rounded-2xl bg-rose-500/20 hover:bg-rose-500 border border-rose-400/40 text-rose-200 hover:text-white text-xs transition cursor-pointer backdrop-blur-md"
                    title="Iniciar votação para banir"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
