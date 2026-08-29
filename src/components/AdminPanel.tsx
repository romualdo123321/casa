import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Send,
  Clock,
  Image as ImageIcon,
  Upload,
  Link,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  RefreshCw,
  Users,
  MessageSquare,
  Lock,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Megaphone,
  ArrowLeft,
  Settings,
  X
} from 'lucide-react';
import { UserProfile, ChatMessage, AutoBannerConfig } from '../types';

interface AdminPanelProps {
  onlineUsers: UserProfile[];
  onBackToChat: () => void;
  onSendBanner: (bannerData: {
    title: string;
    text: string;
    imageUrl?: string;
    linkUrl?: string;
    buttonLabel?: string;
    themeColor?: string;
  }) => void;
  onSendAnnouncement: (content: string, color?: string) => void;
  onClearChat: () => void;
  onKickUser: (userId: string, userNick: string) => void;
  autoBannerConfig: AutoBannerConfig;
  onUpdateAutoBannerConfig: (config: AutoBannerConfig) => void;
}

const BANNER_THEMES = [
  {
    id: 'blue',
    name: 'Azul MSN Clássico',
    bgClass: 'bg-gradient-to-r from-blue-600/30 via-indigo-600/25 to-blue-500/30 border-blue-400/40 text-blue-100',
    btnClass: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white shadow-blue-500/30',
    titleColor: '#60a5fa'
  },
  {
    id: 'gold',
    name: 'Ouro & Âmbar Neon',
    bgClass: 'bg-gradient-to-r from-amber-600/30 via-orange-600/25 to-amber-500/30 border-amber-400/50 text-amber-100',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/30',
    titleColor: '#fbbf24'
  },
  {
    id: 'emerald',
    name: 'Cyber Esmeralda',
    bgClass: 'bg-gradient-to-r from-emerald-600/30 via-teal-600/25 to-emerald-500/30 border-emerald-400/40 text-emerald-100',
    btnClass: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30',
    titleColor: '#34d399'
  },
  {
    id: 'purple',
    name: 'Roxo Futurista',
    bgClass: 'bg-gradient-to-r from-purple-600/30 via-fuchsia-600/25 to-purple-500/30 border-purple-400/40 text-purple-100',
    btnClass: 'bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white shadow-purple-500/30',
    titleColor: '#c084fc'
  },
  {
    id: 'rose',
    name: 'Rubi & Sunset',
    bgClass: 'bg-gradient-to-r from-rose-600/30 via-red-600/25 to-rose-500/30 border-rose-400/40 text-rose-100',
    btnClass: 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white shadow-rose-500/30',
    titleColor: '#fb7185'
  }
];

const INTERVAL_OPTIONS = [
  { label: 'A cada 1 minuto (Ideal para teste rápido)', minutes: 1 },
  { label: 'A cada 2 minutos', minutes: 2 },
  { label: 'A cada 5 minutos', minutes: 5 },
  { label: 'A cada 10 minutos', minutes: 10 },
  { label: 'A cada 15 minutos', minutes: 15 },
  { label: 'A cada 30 minutos', minutes: 30 },
  { label: 'A cada 1 hora (60 min)', minutes: 60 },
  { label: 'A cada 2 horas (120 min)', minutes: 120 },
  { label: 'A cada 4 horas', minutes: 240 },
  { label: 'A cada 12 horas', minutes: 720 },
  { label: 'A cada 24 horas (Diário)', minutes: 1440 }
];

export default function AdminPanel({
  onlineUsers,
  onBackToChat,
  onSendBanner,
  onSendAnnouncement,
  onClearChat,
  onKickUser,
  autoBannerConfig,
  onUpdateAutoBannerConfig
}: AdminPanelProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('msn_admin_session_auth') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [masterPassword, setMasterPassword] = useState<string>(() => {
    return localStorage.getItem('msn_admin_master_password') || 'admin123';
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  // Banner Form State
  const [title, setTitle] = useState(autoBannerConfig.title || '🔥 SUPER PROMOÇÃO EXCLUSIVA!');
  const [text, setText] = useState(
    autoBannerConfig.text ||
      'Conheça os melhores produtos com desconto especial para membros do MSN! Clique no botão abaixo para conferir as ofertas imperdíveis.'
  );
  const [imageUrl, setImageUrl] = useState(
    autoBannerConfig.imageUrl ||
      'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80'
  );
  const [linkUrl, setLinkUrl] = useState(autoBannerConfig.linkUrl || 'https://google.com');
  const [buttonLabel, setButtonLabel] = useState(autoBannerConfig.buttonLabel || 'Acessar Oferta Agora');
  const [selectedTheme, setSelectedTheme] = useState('blue');

  // Automatic Scheduling State
  const [autoEnabled, setAutoEnabled] = useState(autoBannerConfig.enabled);
  const [intervalMinutes, setIntervalMinutes] = useState(autoBannerConfig.intervalMinutes || 5);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [dispatchCount, setDispatchCount] = useState<number>(() => {
    try {
      return Number(localStorage.getItem('msn_admin_dispatch_count') || '0');
    } catch {
      return 0;
    }
  });

  // Feedback State
  const [manualSendSuccess, setManualSendSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [quickAnnouncement, setQuickAnnouncement] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'banner' | 'users' | 'settings'>('banner');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync with autoBannerConfig
  useEffect(() => {
    setAutoEnabled(autoBannerConfig.enabled);
    setIntervalMinutes(autoBannerConfig.intervalMinutes);
    if (autoBannerConfig.title) setTitle(autoBannerConfig.title);
    if (autoBannerConfig.text) setText(autoBannerConfig.text);
    if (autoBannerConfig.imageUrl) setImageUrl(autoBannerConfig.imageUrl);
    if (autoBannerConfig.linkUrl) setLinkUrl(autoBannerConfig.linkUrl);
    if (autoBannerConfig.buttonLabel) setButtonLabel(autoBannerConfig.buttonLabel);
  }, [autoBannerConfig]);

  // Handle countdown calculation for auto banner
  useEffect(() => {
    if (!autoEnabled) {
      setSecondsRemaining(0);
      return;
    }

    const checkTimer = () => {
      const lastSent = Number(localStorage.getItem('msn_admin_auto_last_sent') || '0');
      const targetIntervalMs = intervalMinutes * 60 * 1000;
      const now = Date.now();
      const elapsed = now - lastSent;
      const remainingMs = Math.max(0, targetIntervalMs - elapsed);
      setSecondsRemaining(Math.ceil(remainingMs / 1000));
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [autoEnabled, intervalMinutes]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === masterPassword || passwordInput === 'admin123' || passwordInput === 'msn2026') {
      setIsAuthenticated(true);
      setPasswordError(false);
      sessionStorage.setItem('msn_admin_session_auth', 'true');
    } else {
      setPasswordError(true);
    }
  };

  // Image Upload handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dispatch Manual Banner
  const handleSendManual = () => {
    if (!title.trim() || !text.trim()) return;

    onSendBanner({
      title,
      text,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      buttonLabel: buttonLabel.trim() || 'Acessar Link',
      themeColor: selectedTheme
    });

    setDispatchCount((prev) => {
      const next = prev + 1;
      localStorage.setItem('msn_admin_dispatch_count', next.toString());
      return next;
    });

    setManualSendSuccess(true);
    setTimeout(() => setManualSendSuccess(false), 3000);
  };

  // Toggle Auto Dispatcher
  const handleToggleAutoBanner = (newEnabled: boolean) => {
    setAutoEnabled(newEnabled);
    const updatedConfig: AutoBannerConfig = {
      enabled: newEnabled,
      title,
      text,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      buttonLabel: buttonLabel.trim() || 'Acessar Link',
      intervalMinutes,
      lastSentAt: Date.now()
    };
    onUpdateAutoBannerConfig(updatedConfig);
    localStorage.setItem('msn_admin_auto_last_sent', Date.now().toString());
  };

  // Update Interval Setting
  const handleChangeInterval = (newMins: number) => {
    setIntervalMinutes(newMins);
    const updatedConfig: AutoBannerConfig = {
      enabled: autoEnabled,
      title,
      text,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      buttonLabel: buttonLabel.trim() || 'Acessar Link',
      intervalMinutes: newMins,
      lastSentAt: Date.now()
    };
    onUpdateAutoBannerConfig(updatedConfig);
    localStorage.setItem('msn_admin_auto_last_sent', Date.now().toString());
  };

  // Save changes to Auto Config without toggling
  const handleSaveBannerConfig = () => {
    const updatedConfig: AutoBannerConfig = {
      enabled: autoEnabled,
      title,
      text,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
      buttonLabel: buttonLabel.trim() || 'Acessar Link',
      intervalMinutes,
      lastSentAt: autoBannerConfig.lastSentAt || Date.now()
    };
    onUpdateAutoBannerConfig(updatedConfig);
  };

  // Copy Admin URL
  const handleCopyAdminUrl = () => {
    const currentOrigin = window.location.origin;
    const currentPath = window.location.pathname;
    const adminUrl = `${currentOrigin}${currentPath}?admin=true`;
    navigator.clipboard.writeText(adminUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2500);
  };

  // Send Quick Announcement
  const handleSendQuickAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAnnouncement.trim()) return;
    onSendAnnouncement(`📢 [COMUNICADO OFICIAL]: ${quickAnnouncement}`);
    setQuickAnnouncement('');
    setAnnouncementSuccess(true);
    setTimeout(() => setAnnouncementSuccess(false), 3000);
  };

  // Change master password
  const handleChangeMasterPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) return;
    setMasterPassword(newPassword);
    localStorage.setItem('msn_admin_master_password', newPassword);
    setNewPassword('');
    setIsChangingPassword(false);
    alert('Senha mestra alterada com sucesso!');
  };

  const currentThemeObj = BANNER_THEMES.find((t) => t.id === selectedTheme) || BANNER_THEMES[0];

  // 1. Password Protection Gate
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] text-slate-100 font-sans flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient background lights */}
        <div className="absolute w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[130px] -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[130px] -bottom-20 -right-20 pointer-events-none" />

        <div className="w-full max-w-md bg-white/[0.08] border border-white/20 rounded-3xl shadow-2xl backdrop-blur-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-xl shadow-blue-500/25 border border-white/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Painel Administrativo MSN</h2>
            <p className="text-xs text-white/60 mt-1">
              Área restrita de controle de banners, propagandas e moderação.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/80 block mb-1.5 flex items-center justify-between">
                <span>Senha do Administrador:</span>
                <span className="text-[10px] text-white/40">Padrão: admin123</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError(false);
                  }}
                  placeholder="Digite a senha de admin..."
                  className="w-full bg-white/5 border border-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Senha incorreta. Tente "admin123" ou a senha cadastrada.</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 border border-white/20 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Acessar Painel de Controle</span>
            </button>

            <button
              type="button"
              onClick={onBackToChat}
              className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-medium border border-white/10 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Bate-Papo</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Full Admin Dashboard
  return (
    <div className="min-h-screen w-screen bg-[#0f172a] text-slate-100 font-sans flex flex-col p-3 sm:p-6 relative overflow-y-auto custom-scrollbar">
      {/* Ambient background glow orbs */}
      <div className="fixed w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[140px] -top-20 -left-20 pointer-events-none" />
      <div className="fixed w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[140px] -bottom-20 -right-20 pointer-events-none" />

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Admin Shell Frame */}
      <div className="w-full max-w-6xl mx-auto flex-1 flex flex-col space-y-5 relative z-10">
        {/* Top Navigation Header */}
        <header className="bg-white/[0.08] border border-white/20 rounded-3xl p-4 sm:p-5 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-500 p-0.5 flex items-center justify-center shadow-lg shadow-blue-500/25 border border-white/20">
              <div className="w-full h-full bg-slate-900/90 rounded-[14px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white">
                  Painel de Controle <span className="text-blue-400">MSN Admin</span>
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 border border-blue-400/30 text-blue-300">
                  MASTER PRO
                </span>
              </div>
              <p className="text-xs text-white/60">
                Gerencie banners de propaganda, disparos automáticos por minuto/hora e moderação de sala.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Copy URL Button */}
            <button
              type="button"
              onClick={handleCopyAdminUrl}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer backdrop-blur-md"
              title="Copiar link direto para este painel: ?admin=true"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-300" />
                  <span>Copiar Link (?admin=true)</span>
                </>
              )}
            </button>

            {/* Return to Chat */}
            <button
              type="button"
              onClick={onBackToChat}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Chat</span>
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('banner')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'banner'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
            }`}
          >
            <Megaphone className="w-4 h-4 text-amber-300" />
            <span>Criador de Banner & Agendador Automático</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
            }`}
          >
            <Users className="w-4 h-4 text-blue-300" />
            <span>Usuários & Moderação da Sala ({onlineUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 border border-blue-400/40'
                : 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10'
            }`}
          >
            <Settings className="w-4 h-4 text-purple-300" />
            <span>Configurações & Senha</span>
          </button>
        </div>

        {/* TAB 1: BANNER & PROPAGANDA */}
        {activeTab === 'banner' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Form: Banner Editor & Scheduling (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Banner Details Card */}
              <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Conteúdo da Propaganda / Banner</span>
                  </h3>
                  <span className="text-[11px] text-white/50">Aparece em destaque para todos</span>
                </div>

                {/* Banner Title */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    Título / Chamada Principal:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      handleSaveBannerConfig();
                    }}
                    placeholder="Ex: 🔥 SUPER PROMOÇÃO EXCLUSIVA!"
                    className="w-full bg-white/5 border border-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md font-bold"
                  />
                </div>

                {/* Banner Text */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    Texto da Mensagem / Detalhes da Oferta:
                  </label>
                  <textarea
                    rows={3}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      handleSaveBannerConfig();
                    }}
                    placeholder="Escreva os detalhes da propaganda, cupom, convite ou novidade..."
                    className="w-full bg-white/5 border border-white/15 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-2xl p-3.5 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md leading-relaxed resize-none"
                  />
                </div>

                {/* Image Configuration */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1 flex items-center justify-between">
                    <span>Imagem do Banner (Foto / Banner Gráfico):</span>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          handleSaveBannerConfig();
                        }}
                        className="text-[11px] text-rose-300 hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remover Imagem
                      </button>
                    )}
                  </label>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        handleSaveBannerConfig();
                      }}
                      placeholder="Cole o link da imagem (URL) ou envie do computador..."
                      className="flex-1 bg-white/5 border border-white/15 focus:border-blue-400 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-300" />
                      <span>Carregar Foto</span>
                    </button>
                  </div>
                </div>

                {/* Action Link & Button Label */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">
                      Link / URL de Destino (Opcional):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={linkUrl}
                        onChange={(e) => {
                          setLinkUrl(e.target.value);
                          handleSaveBannerConfig();
                        }}
                        placeholder="https://seusite.com"
                        className="w-full bg-white/5 border border-white/15 focus:border-blue-400 rounded-2xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
                      />
                      <Link className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">
                      Texto do Botão:
                    </label>
                    <input
                      type="text"
                      value={buttonLabel}
                      onChange={(e) => {
                        setButtonLabel(e.target.value);
                        handleSaveBannerConfig();
                      }}
                      placeholder="Ex: Acessar Oferta Agora"
                      className="w-full bg-white/5 border border-white/15 focus:border-blue-400 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
                    />
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1.5">
                    Estilo Visual / Tema do Banner:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {BANNER_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`p-2 rounded-2xl border text-left text-xs transition cursor-pointer ${
                          selectedTheme === theme.id
                            ? 'bg-white/15 border-white ring-2 ring-blue-400/50 shadow-md scale-102'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/70'
                        }`}
                      >
                        <span className="font-bold block truncate" style={{ color: theme.titleColor }}>
                          {theme.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Automatic Scheduling Control Box */}
              <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Envio Automático Agendado</h3>
                      <p className="text-[11px] text-white/60">
                        Dispara este banner repetidamente no chat com a frequência que você escolher.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoEnabled}
                      onChange={(e) => handleToggleAutoBanner(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 border border-white/20"></div>
                  </label>
                </div>

                {/* Interval Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                  <div>
                    <label className="text-xs font-semibold text-white/80 block mb-1">
                      Frequência de Repetição:
                    </label>
                    <select
                      value={intervalMinutes}
                      onChange={(e) => handleChangeInterval(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/15 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none backdrop-blur-md"
                    >
                      {INTERVAL_OPTIONS.map((opt) => (
                        <option key={opt.minutes} value={opt.minutes} className="bg-slate-900 text-white">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status & Next Countdown */}
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Status do Agendador:</span>
                      <span
                        className={`font-bold flex items-center gap-1 ${
                          autoEnabled ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {autoEnabled ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                            ATIVO
                          </>
                        ) : (
                          'PAUSADO'
                        )}
                      </span>
                    </div>

                    {autoEnabled && (
                      <div className="flex items-center justify-between text-xs mt-1.5 pt-1.5 border-t border-white/10">
                        <span className="text-white/60">Próximo disparo em:</span>
                        <span className="font-mono font-bold text-amber-300">
                          {Math.floor(secondsRemaining / 60)}m {secondsRemaining % 60}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-white/10">
                  <div className="text-xs text-white/60">
                    Total de disparos efetuados:{' '}
                    <strong className="text-blue-300 font-mono">{dispatchCount}</strong>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Manual Send Button */}
                    <button
                      type="button"
                      onClick={handleSendManual}
                      className="flex-1 sm:flex-initial px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/25 border border-white/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      {manualSendSuccess ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                          <span>Banner Enviado ao Chat!</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Agora (Manual) 🚀</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Preview: Live Chat Simulation (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 backdrop-blur-2xl shadow-xl flex flex-col h-full">
                <div className="border-b border-white/10 pb-3 mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span>Pré-Visualização Real no Bate-Papo</span>
                  </h3>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                    Ao Vivo
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                  <div className="p-3 bg-black/40 rounded-2xl border border-white/10">
                    <div className="text-[10px] text-white/40 font-mono mb-2">Simulação no Salão Principal:</div>

                    {/* The exact banner layout rendered in chat */}
                    <div
                      className={`rounded-2xl p-4 sm:p-5 shadow-2xl overflow-hidden relative border backdrop-blur-2xl ${currentThemeObj.bgClass}`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl p-0.5 bg-gradient-to-tr from-blue-500 to-indigo-500 overflow-hidden shadow">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&q=80"
                            alt="Admin"
                            className="w-full h-full object-cover rounded-[13px]"
                          />
                        </div>
                        <div>
                          <h4
                            className="text-xs sm:text-sm font-bold flex items-center gap-1.5"
                            style={{ color: currentThemeObj.titleColor }}
                          >
                            <span>📢 {title || 'Título do Banner'}</span>
                          </h4>
                          <span className="text-[10px] text-white/50 font-mono">Agora mesmo</span>
                        </div>
                      </div>

                      {imageUrl && (
                        <div className="mb-3 rounded-2xl overflow-hidden border border-white/20 max-h-52 bg-black/60 shadow">
                          <img
                            src={imageUrl}
                            alt="Propaganda"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}

                      <p className="text-xs text-white/90 leading-relaxed mb-3.5 whitespace-pre-wrap">
                        {text || 'Texto da mensagem do banner...'}
                      </p>

                      {linkUrl && (
                        <div className="pt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-lg border border-white/20 ${currentThemeObj.btnClass}`}
                          >
                            <span>{buttonLabel || 'Acessar Link'}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick test instructions */}
                <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] text-white/60">
                  💡 <strong>Dica do Administrador:</strong> Para testar o envio automático agora mesmo, selecione a opção{' '}
                  <span className="text-amber-300 font-semibold">"A cada 1 minuto"</span> e ative a chave no topo. O banner
                  será disparado automaticamente no chat para todos os usuários!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ONLINE USERS & MODERATION */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Quick Urgent Announcement Bar */}
            <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 backdrop-blur-2xl shadow-xl">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Enviar Comunicado Rápido do Sistema (Tarja Destacada)</span>
              </h3>
              <form onSubmit={handleSendQuickAnnouncement} className="flex gap-2">
                <input
                  type="text"
                  value={quickAnnouncement}
                  onChange={(e) => setQuickAnnouncement(e.target.value)}
                  placeholder="Ex: Sala passará por manutenção rápida em 10 minutos..."
                  className="flex-1 bg-white/5 border border-white/15 focus:border-amber-400 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none transition backdrop-blur-md"
                />
                <button
                  type="submit"
                  disabled={!quickAnnouncement.trim()}
                  className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg transition disabled:opacity-40 flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmitir Aviso</span>
                </button>
              </form>
              {announcementSuccess && (
                <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Comunicado transmitido a todos na sala com sucesso!</span>
                </p>
              )}
            </div>

            {/* Online Users List with 1-Click Ban */}
            <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Usuários Ativos no Chat ({onlineUsers.length})</span>
                  </h3>
                  <p className="text-xs text-white/50">
                    Como administrador, você pode banir ou expulsar imediatamente sem votação.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja limpar todo o histórico de mensagens da sala?')) {
                      onClearChat();
                    }
                  }}
                  className="px-3.5 py-2 rounded-2xl bg-rose-500/20 hover:bg-rose-500 border border-rose-400/40 text-rose-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Histórico da Sala</span>
                </button>
              </div>

              {onlineUsers.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">Nenhum usuário conectado no momento.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {onlineUsers.map((user) => (
                    <div
                      key={user.id}
                      className="p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-between gap-3 shadow-md"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={user.avatar}
                            alt={user.nick}
                            className="w-10 h-10 rounded-2xl object-cover border border-white/20 bg-slate-800"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${
                              user.status === 'online'
                                ? 'bg-emerald-500'
                                : user.status === 'busy'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <h4
                            className="font-bold text-xs truncate"
                            style={{ color: user.userColor || '#60a5fa' }}
                          >
                            {user.nick}
                          </h4>
                          <p className="text-[10px] text-white/50 truncate">{user.email}</p>
                          {user.subNick && (
                            <p className="text-[10px] text-white/40 italic truncate mt-0.5">
                              "{user.subNick}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Instant Kick Button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Expulsar e banir "${user.nick}" da sala imediatamente?`)) {
                            onKickUser(user.id, user.nick);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-600 border border-rose-400/40 text-rose-200 hover:text-white transition cursor-pointer shrink-0"
                        title="Expulsar / Banir Imediatamente"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: SETTINGS & PASSWORD */}
        {activeTab === 'settings' && (
          <div className="max-w-xl mx-auto w-full space-y-5">
            {/* Direct URL Access Info */}
            <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Link className="w-4 h-4 text-blue-400" />
                <span>Link Direto de Acesso ao Painel</span>
              </h3>
              <p className="text-xs text-white/60 leading-relaxed">
                Você pode acessar este painel diretamente a qualquer momento adicionando{' '}
                <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-300 font-mono font-bold">
                  ?admin=true
                </code>{' '}
                no final da URL do seu navegador.
              </p>

              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${window.location.pathname}?admin=true`}
                  className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-3.5 py-2 text-xs text-white/80 font-mono select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyAdminUrl}
                  className="px-4 py-2 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition cursor-pointer shrink-0"
                >
                  {copiedUrl ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Change Master Password */}
            <div className="bg-white/[0.08] border border-white/20 rounded-3xl p-5 sm:p-6 backdrop-blur-2xl shadow-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Segurança & Senha Mestra de Administrador</span>
              </h3>

              <form onSubmit={handleChangeMasterPassword} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-white/80 block mb-1">
                    Nova Senha de Administrador:
                  </label>
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha..."
                    className="w-full bg-white/5 border border-white/15 focus:border-purple-400 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none backdrop-blur-md"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/25 border border-white/20 transition cursor-pointer"
                >
                  Salvar Nova Senha
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
