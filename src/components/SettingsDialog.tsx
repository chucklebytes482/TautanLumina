import { formatDisplayEmail } from '../lib/appwrite';
import React, { useState } from 'react';
import { 
  User, 
  LogOut, 
  Loader2, 
  X, 
  Lock, 
  Shield, 
  ChevronRight,
  Laptop
} from 'lucide-react';

import { useI18n } from '../lib/i18n';
import { usePinState } from '../lib/pin';
import { useDialog } from '../context/DialogContext';

interface Props {
  user: any;
  loading: boolean;
  logout: () => Promise<void>;
  onClose: () => void;
  onOpenPinMenu?: () => void;
  onResetPinPassword?: () => void;
  onLogoutOtherDevices?: () => Promise<boolean | void>;
  initialTab?: TabType;
}

type TabType = 'profile' | null;

export const SettingsDialog = ({ 
  user, 
  loading, 
  logout, 
  onClose, 
  onOpenPinMenu, 
  onResetPinPassword,
  onLogoutOtherDevices,
  initialTab
}: Props) => {
  const { t } = useI18n();
  const pinActive = usePinState();
  const { confirm: customConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || null);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  const handleLogoutOtherDevices = async () => {
    if (!onLogoutOtherDevices || loggingOutOthers) return;
    const ok = await customConfirm(
      'Apakah Anda yakin ingin keluar dari semua perangkat lain? Anda akan tetap masuk di perangkat saat ini.'
    );
    if (!ok) return;

    setLoggingOutOthers(true);
    try {
      await onLogoutOtherDevices();
    } finally {
      setLoggingOutOthers(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.profile.title')}</h4>
      {loading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
      ) : user ? (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center gap-4 relative">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF4F00] to-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
            {formatDisplayEmail(user.email).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <p className="font-medium text-neutral-900 truncate">{formatDisplayEmail(user.email)}</p>
            <p className="text-xs text-neutral-500 font-mono truncate mt-0.5">ID: {user.$id}</p>
          </div>
          <button
            onClick={logout}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
            title={t('settings.logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
      )}

      {/* PIN Security Section */}
      <div className="mt-6 pt-4 border-t border-neutral-200/80">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <Shield size={16} className="text-[#ff4f00]" />
            {t('settings.pinSecurity')}
          </h5>
          {pinActive ? (
            <span className="px-2 py-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
              {t('settings.pinActive')}
            </span>
          ) : (
            <span className="px-2 py-0.5 text-[11px] font-bold text-neutral-500 bg-neutral-100 rounded-full">
              {t('settings.pinNotSet')}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mb-3">
          {t('settings.pinDesc')}
        </p>

        {pinActive ? (
          user?.email && (
            <button
              onClick={() => {
                if (onResetPinPassword) onResetPinPassword();
              }}
              className="w-full flex items-center justify-between p-3.5 bg-[#faf8f5] hover:bg-[#fff0eb] border border-[#e2ddd5] hover:border-[#ff4f00]/40 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#fff0eb] text-[#ff4f00] group-hover:scale-105 transition-transform">
                  <Lock size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-900">
                    {t('pin.verifyResetPin') || 'Reset PIN dengan Password'}
                  </div>
                  <div className="text-[11px] text-neutral-500">
                    {t('pin.resetPinDesc') || 'Masukkan password akun untuk mereset PIN keamanan'}
                  </div>
                </div>
              </div>
              <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#ff4f00] transition-colors" />
            </button>
          )
        ) : (
          <button
            onClick={() => {
              if (onOpenPinMenu) onOpenPinMenu();
            }}
            className="w-full flex items-center justify-between p-3.5 bg-[#faf8f5] hover:bg-[#fff0eb] border border-[#e2ddd5] hover:border-[#ff4f00]/40 rounded-xl transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#fff0eb] text-[#ff4f00] group-hover:scale-105 transition-transform">
                <Lock size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">
                  {t('settings.setNewPin') || 'Atur PIN Keamanan'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {t('pin.setupTitle') || 'Buat PIN 4 digit baru'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#ff4f00] transition-colors" />
          </button>
        )}
      </div>

      {/* Sesi Perangkat / Keluar dari Semua Perangkat Lain */}
      {user && (
        <div className="mt-6 pt-4 border-t border-neutral-200/80">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
              <Laptop size={16} className="text-[#ff4f00]" />
              {t('settings.devices') || 'Sesi Perangkat'}
            </h5>
          </div>
          <p className="text-xs text-neutral-500 mb-3">
            {t('settings.devicesDesc') || 'Kelola sesi login akun Anda di perangkat lain.'}
          </p>

          <button
            onClick={handleLogoutOtherDevices}
            disabled={loggingOutOthers}
            className="w-full flex items-center justify-between p-3.5 bg-[#faf8f5] hover:bg-[#fff0eb] border border-[#e2ddd5] hover:border-[#ff4f00]/40 rounded-xl transition-all text-left cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#fff0eb] text-[#ff4f00] group-hover:scale-105 transition-transform">
                {loggingOutOthers ? (
                  <Loader2 size={18} className="animate-spin text-[#ff4f00]" />
                ) : (
                  <LogOut size={18} />
                )}
              </div>
              <div>
                <div className="text-xs font-bold text-neutral-900">
                  {t('settings.logoutOtherDevices') || 'Keluar dari Semua Perangkat'}
                </div>
                <div className="text-[11px] text-neutral-500">
                  {t('settings.logoutOtherDevicesDesc') || 'Kecuali perangkat saat ini'}
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#ff4f00] transition-colors" />
          </button>
        </div>
      )}
    </div>
  );

  const renderTabContent = (tab: TabType) => {
    if (tab === 'profile') return renderProfileTab();
    return null;
  };

  const renderNavItem = (id: TabType, Icon: any, label: string) => {
    const isActive = activeTab === id;
    return (
      <button
        key={id ?? 'all'}
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
          isActive 
            ? 'bg-[#fff0eb] text-[#ff4f00]' 
            : 'text-neutral-700 hover:bg-[#faf8f5]'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-[#ff4f00]' : 'text-neutral-500'} />
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div onClick={onClose} className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity cursor-pointer"></div>
      
      {/* Drawer */}
      <div className="relative bg-[#faf8f5] w-full max-w-[280px] h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 border-r border-[#e2ddd5] z-10">
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="flex items-center justify-between px-2 mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">{t('settings.menu')}</h3>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.personal')}</div>
            <div className="space-y-1">
              {renderNavItem('profile', User, t('menu.profile'))}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area Desktop */}
      {activeTab && (
        <div className="relative flex-1 bg-[#faf8f5] dark:bg-[#161618] h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-8 duration-300 delay-100 max-w-md hidden sm:flex border-r border-[#e2ddd5] z-10">
          <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab(null)}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer mr-1"
                title="Tutup menu"
              >
                <ChevronRight size={18} className="rotate-180" />
              </button>
              <h2 className="text-xl font-semibold capitalize">{t('menu.profile')}</h2>
            </div>
            <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-700 cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            {renderTabContent(activeTab)}
          </div>
        </div>
      )}

      {/* Mobile Content Area Overlay */}
      <div className={`sm:hidden fixed inset-0 z-50 bg-[#faf8f5] dark:bg-[#161618] transition-transform duration-300 ${activeTab ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-100 flex items-center bg-transparent gap-3">
            <button onClick={() => setActiveTab(null)} className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="text-lg font-semibold capitalize flex-1">{t('menu.profile')}</h2>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-transparent">
            {renderTabContent(activeTab)}
          </div>
        </div>
      </div>
    </div>
  );
};
