import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Mail, Lock, Eye, EyeOff, Globe, ChevronDown, Check } from 'lucide-react';
import { AppLogo } from './AppLogo';
import { useI18n, languages } from '../lib/i18n';
import { LanguageCard, LanguageDropdown } from './LanguageSelectorModal';
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
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="absolute top-4 right-4 z-20" ref={langMenuRef}>
        <button 
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-full shadow-xs text-neutral-700 hover:text-neutral-900 hover:bg-[#faf8f5] transition-all border border-[#e2ddd5] text-xs font-semibold cursor-pointer"
        >
          <Globe size={16} className="text-[#FF4F00]" />
          <span>{languages.find(l => l.code === lang)?.flag} {lang.toUpperCase()}</span>
          <ChevronDown size={14} className={`text-neutral-400 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
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

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-[#e2ddd5] overflow-hidden grid grid-cols-1 md:grid-cols-12 my-auto animate-in fade-in zoom-in-95 duration-300">
        {/* Left Side: Product Hero Description for Launch Platforms (BetaList, ProductHunt, etc.) */}
        <div className="md:col-span-6 bg-linear-to-br from-[#131313] to-[#252525] text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-[#FF4F00]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-[#FF4F00] rounded-2xl flex items-center justify-center shadow-md shadow-[#FF4F00]/30">
                <AppLogo isDark={true} size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-white leading-none">
                  Lumina
                </h1>
                <p className="text-xs text-[#FF4F00] font-semibold tracking-wide uppercase mt-1">
                  {t('app.tagline') || 'AI Bookmark & Note Manager'}
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-300 leading-relaxed mb-6">
              {t('app.heroDesc') || 'Lumina is an ultra-minimalist, AI-powered smart bookmark and note manager. Auto-generate titles & tags, organize links into encrypted PIN folders, import HTML bookmarks, and sync seamlessly across devices.'}
            </p>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <p className="text-xs font-semibold text-white">{t('feature.aiTagging.title')}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t('feature.aiTagging.desc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <p className="text-xs font-semibold text-white">{t('feature.pinLock.title')}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t('feature.pinLock.desc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <p className="text-xs font-semibold text-white">{t('feature.htmlImport.title')}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t('feature.htmlImport.desc')}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
                <p className="text-xs font-semibold text-white">{t('feature.cloudSync.title')}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{t('feature.cloudSync.desc')}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
            <span>v1.0 Launch Edition</span>
            <span>https://tautanlumina.appwrite.network/</span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="md:col-span-6 p-8 sm:p-10 flex flex-col justify-center bg-white relative">
          <div className="flex flex-col text-left mb-6">
            <h2 className="text-2xl font-bold text-[#131313] tracking-tight">
              {getTitle()}
            </h2>
            <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed">
              {getDesc()}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3.5">
              {mode !== 'reset' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{t('login.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                      type="email"
                      name="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-b-2 border-[#e2ddd5] bg-[#faf8f5]/60 rounded-t-lg pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-all"
                      placeholder={t('login.emailPlaceholder')}
                    />
                  </div>
                </div>
              )}
              
              {mode !== 'forgot' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                    {mode === 'reset' ? t('login.newPassword') : t('login.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      autoComplete={mode === 'register' || mode === 'reset' ? 'new-password' : 'current-password'}
                      required
                      minLength={8}
                      value={pass}
                      onChange={(e) => setPass(e.target.value)}
                      className="w-full border-b-2 border-[#e2ddd5] bg-[#faf8f5]/60 rounded-t-lg pl-11 pr-11 py-2.5 text-sm focus:outline-none focus:border-[#FF4F00] focus:bg-white transition-all"
                      placeholder={t('login.min8') || 'Minimal 8 karakter'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
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
              className="w-full flex items-center justify-center gap-2 bg-[#FF4F00] hover:bg-[#E04500] text-white font-semibold py-3 px-4 rounded-xl disabled:opacity-60 text-sm transition-all active:scale-[0.98] mt-2 shadow-md shadow-[#FF4F00]/25 cursor-pointer"
            >
              {authLoading ? <Loader2 size={18} className="animate-spin" /> : null}
              {mode === 'login' ? (t('login.signIn') || 'Masuk') : 
               mode === 'register' ? (t('login.signUp') || 'Daftar') : 
               mode === 'forgot' ? t('login.sendLink') : t('login.savePassword')}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#e2ddd5]/60 flex flex-col items-center gap-2.5">
            {mode === 'login' && (
               <button
                onClick={() => setMode('forgot')}
                className="text-xs font-medium text-neutral-500 hover:text-[#FF4F00] transition-colors cursor-pointer"
               >
                 {t('login.forgotLink')}
               </button>
            )}

            {mode !== 'reset' && (
              <button
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                }}
                className="text-xs font-semibold text-neutral-600 hover:text-[#FF4F00] transition-colors cursor-pointer"
              >
                {mode === 'login' 
                  ? (t('login.noAccount') || 'Belum punya akun? Daftar') 
                  : (t('login.hasAccount') || 'Sudah punya akun? Masuk')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
