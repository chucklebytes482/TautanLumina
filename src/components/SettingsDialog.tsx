import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Wallet, 
  User, 
  LogOut, 
  RefreshCw, 
  Download, 
  Upload, 
  Loader2, 
  Save, 
  X, 
  Folder, 
  FileText, 
  RotateCcw, 
  Lock, 
  Shield, 
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { SubscriptionCard } from './SubscriptionCard';
import { FileSystemItem } from '../Types';
import { toast } from 'sonner';

import { loadKey, loadModel, loadEndpoint, loadModelHistory, saveKey, saveModel, saveEndpoint } from '../lib/ai';
import { useI18n } from '../lib/i18n';
import { hasPinSet } from '../lib/pin';

interface Props {
  user: any;
  loading: boolean;
  syncing: boolean;
  logout: () => Promise<void>;
  onClose: () => void;
  onOpenPinMenu?: () => void;
  onResetPinPassword?: () => void;
  onSmartSync?: () => Promise<void>;
  onExport?: () => void;
  onImport?: () => void;
  initialTab?: TabType;
}

type TabType = 'api' | 'wallet' | 'profile' | 'sync' | null;

export const SettingsDialog = ({ 
  user, 
  loading, 
  syncing, 
  logout, 
  onClose, 
  onOpenPinMenu, 
  onResetPinPassword,
  onSmartSync, 
  onExport, 
  onImport, 
  initialTab
}: Props) => {
  const { t } = useI18n();
  const isDeveloper = user?.email?.toLowerCase() === 'abdulkarim94786@gmail.com';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [gchatUrl, setGchatUrl] = useState('');
  const modelHistory = loadModelHistory();

  const getGchatStorageKey = () => {
    const email = localStorage.getItem('tautanlumina:current_user_email') || 'guest';
    return `tautanlumina:gchat_url:${email}`;
  };

  useEffect(() => {
    setApiKey(loadKey());
    setModel(loadModel());
    setEndpoint(loadEndpoint());
    setGchatUrl(localStorage.getItem(getGchatStorageKey()) || localStorage.getItem('tautanlumina:gchat_url') || 'https://chat.google.com/room/AAQA1VCBP28?cls=5');
  }, []);

  const handleSaveSettings = () => {
    saveKey(apiKey.trim());
    saveModel(model.trim());
    saveEndpoint(endpoint.trim());
    if (isDeveloper) {
      const gKey = getGchatStorageKey();
      if (gchatUrl.trim()) {
        localStorage.setItem(gKey, gchatUrl.trim());
        localStorage.setItem('tautanlumina:gchat_url', gchatUrl.trim());
      } else {
        localStorage.removeItem(gKey);
        localStorage.removeItem('tautanlumina:gchat_url');
      }
    }
    toast.success(t('toast.saved'));
    onClose();
  };

  const renderAiTab = () => (
    <div className="space-y-5">
      <div>
        <h4 className="text-sm font-semibold text-neutral-800 mb-1">{t('settings.aiConfig')}</h4>
        <p className="text-xs text-neutral-500 mb-4">{t('settings.api.desc')}</p>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{t('settings.endpoint')}</label>
        <input
          type="text"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="https://openrouter.ai/api/v1/chat/completions"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className="w-full border border-[#e2ddd5] rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ff4f00]/20 focus:border-[#ff4f00] transition-all bg-[#faf8f5] focus:bg-white"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{t('settings.aiKey')}</label>
        <div className="relative flex items-center">
          <input
            type="text"
            readOnly
            tabIndex={-1}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            value={apiKey ? (apiKey.length > 5 ? '••••••••••••••••' + apiKey.slice(-5) : apiKey) : ''}
            placeholder={t('settings.pasteApiKeyPlaceholder')}
            className="w-full border border-[#e2ddd5] rounded-xl px-3.5 py-2.5 pr-20 text-sm font-mono transition-all bg-[#faf8f5] pointer-events-none select-none text-neutral-600"
          />
          <button
            type="button"
            onClick={async () => {
              try {
                const text = await navigator.clipboard.readText();
                if (text && text.trim()) {
                  setApiKey(text.trim());
                  toast.success(t('settings.apiKeyPasted'));
                } else {
                  toast.error(t('settings.clipboardEmpty'));
                }
              } catch (err) {
                toast.error(t('settings.clipboardError'));
              }
            }}
            className="absolute right-2 bg-[#ff4f00] hover:bg-[#e04500] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            {t('action.paste') || 'Tempel'}
          </button>
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">{t('settings.model')}</label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="nvidia/nemotron-3-ultra-550b-a55b:free"
          list="settings-model-history"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck="false"
          className="w-full border border-[#e2ddd5] rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ff4f00]/20 focus:border-[#ff4f00] transition-all bg-[#faf8f5] focus:bg-white"
        />
        <datalist id="settings-model-history">
          {modelHistory.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>

      {isDeveloper && (
        <div className="space-y-1.5 pt-2 border-t border-neutral-200/80">
          <label className="text-sm font-medium text-neutral-700">{t('chat.title') || 'Chat Komunitas'}</label>
          <input
            type="text"
            value={gchatUrl}
            onChange={(e) => setGchatUrl(e.target.value)}
            placeholder="Tautan Chat Komunitas (WhatsApp, Telegram, dll)"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            className="w-full border border-[#e2ddd5] rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#ff4f00]/20 focus:border-[#ff4f00] transition-all bg-[#faf8f5] focus:bg-white"
          />
        </div>
      )}

      <button
        onClick={handleSaveSettings}
        className="w-full flex items-center justify-center gap-2 bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all mt-2 shadow-sm shadow-[#ff4f00]/25 cursor-pointer"
      >
        <Save size={18} /> {t('settings.api.save')}
      </button>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.profile.title')}</h4>
      {loading ? (
        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-neutral-400" /></div>
      ) : user ? (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs flex items-center gap-4 relative">
          <div className="w-12 h-12 bg-gradient-to-br from-[#FF4F00] to-amber-500 text-white rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-inner">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 pr-8">
            <p className="font-medium text-neutral-900 truncate">{user.email}</p>
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

      {/* PIN Security Option */}
      <div className="mt-6 pt-4 border-t border-neutral-200/80">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-semibold text-neutral-800 flex items-center gap-2">
            <Shield size={16} className="text-[#ff4f00]" />
            {t('settings.pinSecurity')}
          </h5>
          {hasPinSet() ? (
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
                {hasPinSet() ? t('settings.managePin') : t('settings.setNewPin')}
              </div>
              <div className="text-[11px] text-neutral-500">
                {hasPinSet() ? t('settings.managePinDesc') : t('pin.setupTitle')}
              </div>
            </div>
          </div>
          <ChevronRight size={16} className="text-neutral-400 group-hover:text-[#ff4f00] transition-colors" />
        </button>

        {hasPinSet() && user?.email && (
          <button
            onClick={() => {
              if (onResetPinPassword) onResetPinPassword();
            }}
            className="w-full flex items-center justify-between p-3.5 mt-2.5 bg-[#faf8f5] hover:bg-[#fff0eb] border border-[#e2ddd5] hover:border-[#ff4f00]/40 rounded-xl transition-all text-left cursor-pointer group"
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
        )}
      </div>
    </div>
  );

  const renderSyncTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('menu.sync') || 'Sync'}</h4>
      {user ? (
        <div className="space-y-3">
          <button
            onClick={onSmartSync}
            disabled={syncing}
            className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors disabled:opacity-50 text-left shadow-xs cursor-pointer"
          >
            <div className={`p-2 rounded-lg bg-blue-50 text-blue-600 ${syncing ? 'animate-pulse' : ''}`}>
              <RefreshCw size={20} className={syncing ? 'animate-spin' : ''} />
            </div>
            <div>
              <p className="font-medium text-sm text-neutral-900">{t('btn.smartSync') || 'Smart Sync'}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('sync.smart.desc') || 'Intelligently merge and sync local & cloud data'}</p>
            </div>
          </button>
        </div>
      ) : (
        <p className="text-sm text-neutral-500">{t('settings.profile.notLoggedIn')}</p>
      )}

      <div className="mt-6">
        <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('sync.offline.title') || 'Offline File'}</h4>
        <div className="space-y-3 mt-4">
          <button
            onClick={onExport}
            className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Download size={20} />
            </div>
            <div>
              <p className="font-medium text-sm text-neutral-900">{t('btn.exportJSON') || 'Export JSON'}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('sync.export.desc') || 'Download local data as JSON'}</p>
            </div>
          </button>
          <button
            onClick={onImport}
            className="w-full flex items-center gap-3 p-4 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors text-left shadow-xs cursor-pointer"
          >
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Upload size={20} />
            </div>
            <div>
              <p className="font-medium text-sm text-neutral-900">{t('btn.importJSON') || 'Import JSON'}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{t('sync.import.desc') || 'Restore data from JSON file'}</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  const renderWalletTab = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-neutral-800 border-b border-neutral-100 pb-2">{t('settings.wallet.title')}</h4>
      <SubscriptionCard user={user} />
    </div>
  );

  const renderTabContent = (tab: TabType) => {
    if (tab === 'profile') return renderProfileTab();
    if (tab === 'sync') return renderSyncTab();
    if (tab === 'api') return renderAiTab();
    if (tab === 'wallet') return renderWalletTab();

    // Default / "Semua" Settings view when activeTab is null
    return (
      <div className="space-y-12 pb-6 divide-y divide-neutral-100">
        <div className="space-y-4">
          {renderProfileTab()}
        </div>
        <div className="pt-8 space-y-4">
          {renderAiTab()}
        </div>
        <div className="pt-8 space-y-4">
          {renderSyncTab()}
        </div>
        <div className="pt-8 space-y-4">
          {renderWalletTab()}
        </div>
      </div>
    );
  };

  const NavItem = ({ id, icon: Icon, label }: { id: TabType, icon: any, label: string }) => {
    const isActive = activeTab === id;
    return (
      <button
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
      <div className="absolute inset-0 bg-black/20 backdrop-blur-xs transition-opacity"></div>
      
      {/* Drawer */}
      <div className="relative bg-[#faf8f5] w-full max-w-[280px] h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-4 duration-300 border-r border-[#e2ddd5]">
        <div className="flex-1 overflow-y-auto py-6 px-3">
          <div className="flex items-center justify-between px-2 mb-6">
            <h3 className="font-semibold text-lg text-neutral-800">{t('settings.menu')}</h3>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded-full transition-colors cursor-pointer">
              <X size={18} />
            </button>
          </div>

          <div className="mb-6">
            <div className="space-y-1">
              <NavItem id={null} icon={LayoutGrid} label={t('menu.all')} />
            </div>
          </div>

          <div className="mb-6">
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.general')}</div>
            <div className="space-y-1">
              <NavItem id="api" icon={Key} label={t('menu.api')} />
              <NavItem id="sync" icon={RefreshCw} label={t('menu.sync') || 'Sync'} />
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.personal')}</div>
            <div className="space-y-1">
              <NavItem id="wallet" icon={Wallet} label={t('menu.wallet')} />
              <NavItem id="profile" icon={User} label={t('menu.profile')} />
            </div>
          </div>
        </div>

        {/* Product Hunt Badge */}
        <div className="p-4 border-t border-[#e2ddd5] bg-white flex justify-center shrink-0">
          <a
            href="https://www.producthunt.com/products/tautanlumina/reviews/new?utm_source=badge-product_review&utm_medium=badge&utm_source=badge-tautanlumina"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-90 transition-opacity"
          >
            <img
              src="https://api.producthunt.com/widgets/embed-image/v1/product_review.svg?product_id=1277343&theme=light"
              alt="Lumina - Product Hunt"
              className="h-8 w-auto shrink-0"
              referrerPolicy="no-referrer"
            />
          </a>
        </div>
      </div>

      {/* Content Area Desktop */}
      <div className="relative flex-1 bg-white h-full shadow-2xl flex flex-col animate-in fade-in slide-in-from-left-8 duration-300 delay-100 max-w-md hidden sm:flex">
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold capitalize">{activeTab ? activeTab.replace('-', ' ') : t('menu.all')}</h2>
          <button onClick={onClose} className="sm:hidden p-2 text-neutral-400 hover:text-neutral-700 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent(activeTab)}
        </div>
      </div>

      {/* Mobile Content Area Overlay */}
      <div className={`sm:hidden fixed inset-0 z-50 bg-white transition-transform duration-300 ${activeTab ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-100 flex items-center bg-white gap-3">
            <button onClick={() => setActiveTab(null as any)} className="p-1.5 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-full cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h2 className="text-lg font-semibold capitalize flex-1">{activeTab ? activeTab.replace('-', ' ') : t('menu.all')}</h2>
            <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full cursor-pointer">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {renderTabContent(activeTab)}
          </div>
        </div>
      </div>
    </div>
  );
};
