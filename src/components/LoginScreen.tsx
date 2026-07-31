import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Globe, ChevronDown, Sparkles, ShieldCheck, Mic, Move, Cloud, FileUp, BookOpen, Check } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useI18n, languages } from '../lib/i18n';
import { LanguageCard, LanguageDropdown } from './LanguageSelectorModal';
import { FullscreenGuideModal } from './FullscreenGuideModal';
import { toast } from 'sonner';
import { isAliasedEmail, isDisposableEmail } from '../lib/emailPolicies';

interface Props {
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean>;
  resetPassword?: (email: string) => Promise<boolean>;
  updatePasswordRecovery?: (userId: string, secret: string, newPass: string) => Promise<boolean>;
  verifyEmail?: (userId: string, secret: string) => Promise<boolean>;
  loading: boolean;
}

export const LoginScreen = ({ login, register, resetPassword, updatePasswordRecovery, verifyEmail, loading }: Props) => {
  const { t, lang, setLang } = useI18n();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isHeroExpanded, setIsHeroExpanded] = useState(false);
  const [userId, setUserId] = useState('');
  const [secret, setSecret] = useState('');
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('userId');
    const sec = params.get('secret');
    const action = params.get('action');
    
    if (uid && sec) {
      if (action === 'verify' && verifyEmail) {
        verifyEmail(uid, sec).then((res) => {
          if (res) setMode('login');
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setUserId(uid);
        setSecret(sec);
        setMode('reset');
        // clear URL safely
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [verifyEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    
    const cleanEmail = email.trim().toLowerCase();

    if (mode === 'login') {
      await login(cleanEmail, pass);
    } else if (mode === 'register') {
      // Validate Email Security Policies for user creation
      if (isAliasedEmail(cleanEmail)) {
        toast.dismiss();
        toast.error(t('login.errorAlias') || 'Email alias tidak diperbolehkan (tidak boleh mengandung karakter "+")');
        setAuthLoading(false);
        return;
      }
      if (isDisposableEmail(cleanEmail)) {
        toast.dismiss();
        toast.error(t('login.errorDisposable') || 'Email sementara/disposable tidak diperbolehkan');
        setAuthLoading(false);
        return;
      }

      // Basic security check for password strength
      if (pass.length < 8) {
        toast.dismiss();
        toast.error(t('login.min8Alert'));
        setAuthLoading(false);
        return;
      }
      await register(cleanEmail, pass);
    } else if (mode === 'forgot' && resetPassword) {
      const res = await resetPassword(cleanEmail);
      if (res) {
        setMode('login');
      }
    } else if (mode === 'reset' && updatePasswordRecovery) {
       if (pass.length < 8) {
        toast.dismiss();
        toast.error(t('login.min8Alert'));
        setAuthLoading(false);
        return;
      }
      const res = await updatePasswordRecovery(userId, secret, pass);
      if (res) {
        setMode('login');
        setPass('');
      }
    }
    
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FF4F00]" size={32} />
      </div>
    );
  }

  const getTitle = () => {
    if (mode === 'login') return t('login.welcome') || 'Selamat Datang';
    if (mode === 'register') return t('login.createAccount') || 'Buat Akun';
    if (mode === 'forgot') return t('login.forgotTitle');
    return t('login.resetTitle');
  };

  const getDesc = () => {
    if (mode === 'login') return t('login.signInDesc') || 'Masuk untuk melanjutkan';
    if (mode === 'register') return t('login.signUpDesc') || 'Daftar untuk melindungi data Anda';
    if (mode === 'forgot') return t('login.forgotDesc');
    return t('login.resetDesc');
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#161618] bg-doodle text-neutral-900 dark:text-neutral-100 flex flex-col items-center justify-between p-3 sm:p-5 lg:p-8 relative overflow-x-hidden">
      {/* Top Header Actions */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-2 z-20 mb-3 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#FF4F00] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md shadow-[#FF4F00]/25 shrink-0 transition-transform hover:scale-105">
            <AppLogo isDark={true} size={22} />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-extrabold text-sm sm:text-xl tracking-tight text-neutral-900 dark:text-white truncate">
              TautanLumina
            </span>
            <span className="text-[10px] font-bold text-[#FF4F00] bg-[#FF4F00]/10 dark:bg-[#FF4F00]/20 px-1.5 py-0.5 rounded-full border border-[#FF4F00]/20 shrink-0">
              v1.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Guide Modal Trigger */}
          <button
            onClick={() => setShowGuideModal(true)}
            title={t('guide.title') || 'Panduan'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white dark:bg-[#25252a] rounded-full shadow-2xs text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-[#faf8f5] dark:hover:bg-[#2d2d35] transition-all border border-[#e2ddd5] dark:border-[#383842] text-xs font-semibold cursor-pointer active:scale-95"
          >
            <BookOpen size={14} className="text-[#FF4F00]" />
            <span className="text-xs">{t('guide.title') || 'Panduan'}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative" ref={langMenuRef}>
            <button 
              onClick={() => setShowLangMenu(!showLangMenu)}
              title="Pilih Bahasa / Language"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 bg-white dark:bg-[#25252a] rounded-full shadow-2xs text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-[#faf8f5] dark:hover:bg-[#2d2d35] transition-all border border-[#e2ddd5] dark:border-[#383842] text-xs font-semibold cursor-pointer active:scale-95"
            >
              <Globe size={14} className="text-[#FF4F00]" />
              <span>{languages.find(l => l.code === lang)?.flag} {lang.toUpperCase()}</span>
              <ChevronDown size={13} className={`text-neutral-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
            </button>
            <LanguageDropdown isOpen={showLangMenu} onClose={() => setShowLangMenu(false)} align="right">
              <LanguageCard
                currentLang={lang}
                onSelectLang={(code) => {
                  setLang(code);
                  setShowLangMenu(false);
                }}
              />
            </LanguageDropdown>
          </div>
        </div>
      </header>

      {/* Main Landing Card */}
      <main className="w-full max-w-5xl bg-white/95 dark:bg-[#1e1e22]/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.45)] border border-[#e2ddd5] dark:border-[#2d2d35] overflow-hidden grid grid-cols-1 md:grid-cols-12 my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Hero Information & Showcase (Collapsible & Scrollable on mobile so login fits in 1 screen view) */}
        <div className="md:col-span-6 bg-gradient-to-br from-[#121214] via-[#1a1a1e] to-[#25252b] text-white p-4 sm:p-7 lg:p-9 flex flex-col justify-between relative overflow-hidden order-1">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#FF4F00]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 bg-[#FF4F00]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-2 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#FF4F00] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF4F00]/30 shrink-0">
                  <AppLogo isDark={true} size={22} />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-none truncate">
                    TautanLumina
                  </h1>
                  <p className="text-[10px] sm:text-xs text-[#FF4F00] font-bold tracking-wide uppercase mt-0.5 sm:mt-1 truncate">
                    {t('app.tagline') || 'Tautan Anda, Cerdas & Bercahaya.'}
                  </p>
                </div>
              </div>

              {/* Mobile Toggle Button for Collapsing / Expanding Feature Details */}
              <button
                type="button"
                onClick={() => setIsHeroExpanded(!isHeroExpanded)}
                className="md:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FF4F00]/20 hover:bg-[#FF4F00]/30 text-[#FF4F00] font-bold text-xs border border-[#FF4F00]/30 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                <span>{isHeroExpanded ? (t('login.collapseFeatures') || 'Ciutkan') : (t('login.expandFeatures') || 'Fitur App')}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isHeroExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Collapsed mobile summary line */}
            {!isHeroExpanded && (
              <p className="md:hidden text-[11px] text-neutral-400 truncate mt-1">
                AI Title • 4-Digit PIN • Voice Chat ≤30s • Appwrite Cloud
              </p>
            )}

            {/* Collapsible & Scrollable Hero Body */}
            <div className={`transition-all duration-300 pr-0.5 ${isHeroExpanded ? 'block max-h-72 overflow-y-auto mt-3 custom-scrollbar' : 'hidden md:block'}`}>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-4 sm:mb-6">
                {t('app.heroDesc') || 'Aplikasi pengelola bookmark dan catatan cerdas berbasis AI. Penamaan otomatis maks 15 karakter, kunci PIN 4-digit, obrolan suara 30 detik dengan pratinjau audio, sinkronisasi cloud Appwrite, serta impor/ekspor data instan.'}
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1">
                <div className="bg-white/10 backdrop-blur-xs rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col gap-0.5 sm:gap-1 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 text-[#FF4F00]">
                    <Sparkles size={15} />
                    <span className="text-xs font-bold text-white">{t('feature.aiTagging.title') || 'Judul AI Otomatis'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-300 leading-tight">{t('feature.aiTagging.desc') || 'Generate judul ringkas maks 15 karakter'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col gap-0.5 sm:gap-1 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <ShieldCheck size={15} />
                    <span className="text-xs font-bold text-white">{t('feature.pinLock.title') || 'Kunci PIN 4-Digit'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-300 leading-tight">{t('feature.pinLock.desc') || 'Lindungi folder sensitif dengan PIN'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col gap-0.5 sm:gap-1 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 text-amber-400">
                    <Mic size={15} />
                    <span className="text-xs font-bold text-white">{t('feature.voiceChat.title') || 'Voice Chat ≤30s'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-300 leading-tight">{t('feature.voiceChat.desc') || 'Pratinjau audio sebelum pesan dikirim'}</p>
                </div>

                <div className="bg-white/10 backdrop-blur-xs rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-white/10 flex flex-col gap-0.5 sm:gap-1 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-1.5 text-sky-400">
                    <Cloud size={15} />
                    <span className="text-xs font-bold text-white">{t('feature.cloudSync.title') || 'Sinkronisasi Awan'}</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-neutral-300 leading-tight">{t('feature.cloudSync.desc') || 'Penyimpanan lokal & Awan Appwrite'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`relative z-10 pt-3 sm:pt-6 mt-3 sm:mt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 ${!isHeroExpanded ? 'hidden md:flex' : 'flex'}`}>
            <span className="flex items-center gap-1">
              <Check size={13} className="text-[#FF4F00]" /> 100% Bebas Pengiklanan
            </span>
            <span className="font-mono text-[10px] text-neutral-400">sgp.cloud.appwrite.io</span>
          </div>
        </div>

        {/* Auth Form Column */}
        <div className="md:col-span-6 p-5 sm:p-8 lg:p-9 flex flex-col justify-center bg-white dark:bg-[#1e1e22] relative order-2">
          
          {/* Segmented Mode Switcher (Masuk / Daftar) for instant toggling */}
          {(mode === 'login' || mode === 'register') && (
            <div className="flex bg-[#faf8f5] dark:bg-[#161618] p-1 rounded-2xl border border-[#e2ddd5] dark:border-[#2d2d35] mb-5 sm:mb-6">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#25252a] text-[#FF4F00] shadow-2xs border border-[#e2ddd5]/60 dark:border-[#383842]'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t('login.signIn') || 'Masuk'}
              </button>
              <button
                type="button"
                onClick={() => setMode('register')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#25252a] text-[#FF4F00] shadow-2xs border border-[#e2ddd5]/60 dark:border-[#383842]'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {t('login.signUp') || 'Daftar'}
              </button>
            </div>
          )}

          <div className="flex flex-col text-left mb-5">
            <h2 className="text-xl sm:text-2xl font-bold text-[#131313] dark:text-white tracking-tight">
              {getTitle()}
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {getDesc()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              {mode !== 'reset' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('login.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#faf8f5]/80 dark:bg-[#25252a] border border-[#e2ddd5] dark:border-[#383842] rounded-xl pl-11 pr-4 py-2.5 sm:py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/25 focus:border-[#FF4F00] dark:focus:border-[#FF4F00] focus:bg-white dark:focus:bg-[#25252a] transition-all"
                      placeholder={t('login.emailPlaceholder')}
                    />
                  </div>
                </div>
              )}
              
              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {mode === 'reset' ? t('login.newPassword') : t('login.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" size={18} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                      required
                      minLength={8}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="w-full bg-[#faf8f5]/80 dark:bg-[#25252a] border border-[#e2ddd5] dark:border-[#383842] rounded-xl pl-11 pr-11 py-2.5 sm:py-3 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF4F00]/25 focus:border-[#FF4F00] dark:focus:border-[#FF4F00] focus:bg-white dark:focus:bg-[#25252a] transition-all"
                      placeholder={t('login.min8') || 'Minimal 8 karakter'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      title={showPass ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors cursor-pointer p-1"
                    >
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={authLoading || (mode !== 'reset' && email.length < 5) || (mode !== 'forgot' && pass.length < 8)}
              className="w-full flex items-center justify-center gap-2 bg-[#FF4F00] hover:bg-[#E04500] text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-60 text-sm transition-all active:scale-[0.98] mt-3 shadow-md shadow-[#FF4F00]/25 cursor-pointer"
            >
              {authLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? (t('login.signIn') || 'Masuk') : 
               mode === 'register' ? (t('login.signUp') || 'Daftar') : 
               mode === 'forgot' ? t('login.sendLink') : t('login.savePassword')}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[#e2ddd5]/60 dark:border-neutral-800 flex flex-col items-center gap-2">
            {mode === 'login' && (
               <button
                onClick={() => setMode('forgot')}
                className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-[#FF4F00] dark:hover:text-[#FF4F00] transition-colors cursor-pointer"
               >
                 {t('login.forgotLink')}
               </button>
            )}

            {(mode === 'forgot' || mode === 'reset') && (
              <button
                onClick={() => setMode('login')}
                className="text-xs font-semibold text-[#FF4F00] hover:underline cursor-pointer"
              >
                &larr; {t('login.hasAccount') || 'Kembali ke Masuk'}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="w-full max-w-5xl text-center pt-3 pb-1 text-[11px] text-neutral-500 dark:text-neutral-400">
        <p>© 2026 TautanLumina • Ultra-Minimalist AI Bookmark & Note Manager</p>
      </footer>

      {/* Fullscreen Guide Modal */}
      <FullscreenGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
};
