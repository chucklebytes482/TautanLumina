import { ADMIN_EMAIL, formatDisplayEmail } from '../lib/appwrite';
import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Crown, 
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
  LayoutGrid,
  Search,
  Check,
  ChevronDown,
  Cpu,
  BookOpen
} from 'lucide-react';
import { SubscriptionCard } from './SubscriptionCard';
import { FileSystemItem } from '../Types';
import { toast } from 'sonner';

import { loadKey, loadModel, loadEndpoint, loadModelHistory, saveKey, saveModel, saveEndpoint, fetchAvailableModels } from '../lib/ai';
import { useI18n } from '../lib/i18n';
import { usePinState } from '../lib/pin';

interface Props {
  user: any;
  loading: boolean;
  syncing: boolean;
  logout: () => Promise<void>;
  onClose: () => void;
  onOpenPinMenu?: () => void;
  onResetPinPassword?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onOpenGuide?: () => void;
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
  onExport, 
  onImport, 
  onOpenGuide,
  initialTab
}: Props) => {
  const { t } = useI18n();
  const pinActive = usePinState();
  const isDeveloper = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const [activeTab, setActiveTab] = useState<TabType>(initialTab || null);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const getModelQualityScore = (m: string): number => {
    const lower = m.toLowerCase();
    let score = 0;

    // Top tier models ranking
    if (lower.includes('deepseek-r1')) score += 100;
    else if (lower.includes('deepseek-v3') || lower.includes('deepseek/deepseek-chat')) score += 95;
    else if (lower.includes('gemini-2.5') || lower.includes('gemini-2.0-flash-exp')) score += 92;
    else if (lower.includes('claude-3.7') || lower.includes('claude-3-7')) score += 90;
    else if (lower.includes('claude-3.5') || lower.includes('claude-3-5')) score += 88;
    else if (lower.includes('gpt-4o') || lower.includes('o3-mini') || lower.includes('o1-')) score += 85;
    else if (lower.includes('gemini-1.5-pro') || lower.includes('gemini-2.0')) score += 82;
    else if (lower.includes('llama-3.3-70b')) score += 80;
    else if (lower.includes('llama-3.1-405b') || lower.includes('llama-3.1-70b')) score += 78;
    else if (lower.includes('qwen-2.5-72b') || lower.includes('qwen-2.5-coder') || lower.includes('qwen2.5-72b')) score += 75;
    else if (lower.includes('mistral-large') || lower.includes('codestral')) score += 70;
    else if (lower.includes('nemotron-4') || lower.includes('nemotron-3-ultra')) score += 65;
    else if (lower.includes('llama-3') || lower.includes('qwen')) score += 50;
    else if (lower.includes('gemma')) score += 40;

    // Extra points for large parameter or instruct models
    if (lower.includes('instruct') || lower.includes('chat')) score += 2;
    if (lower.includes('free')) score += 1;

    return score;
  };

  const [modelFilter, setModelFilter] = useState<'free' | 'pro'>('free');
  const [modelSearch, setModelSearch] = useState('');
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const modelHistory = loadModelHistory();

  useEffect(() => {
    const loadedKey = loadKey();
    const loadedModel = loadModel();
    const loadedEndpoint = loadEndpoint();
    setApiKey(loadedKey);
    setModel(loadedModel);
    setEndpoint(loadedEndpoint);
  }, []);

  const handleFetchModels = async (ep?: string, key?: string, silent = false) => {
    const targetEp = ep !== undefined ? ep : endpoint;
    const targetKey = key !== undefined ? key : apiKey;

    setFetchingModels(true);
    try {
      const list = await fetchAvailableModels(targetEp, targetKey);
      if (list && list.length > 0) {
        setFetchedModels(list);
        if (!silent) {
          toast.success(t('modelPicker.fetchSuccess').replace('{count}', list.length.toString()));
        }
        if (!model) {
          setModel(list[0]);
        }
      } else if (!silent) {
        toast.error(t('modelPicker.fetchEmpty'));
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err.message || t('modelPicker.fetchError'));
      }
    } finally {
      setFetchingModels(false);
    }
  };

  const ensureModelsLoaded = () => {
    if (fetchedModels.length === 0 && !fetchingModels) {
      handleFetchModels(endpoint, apiKey, true);
    }
  };

  const handleSaveSettings = () => {
    saveKey(apiKey.trim());
    saveModel(model.trim());
    saveEndpoint(endpoint.trim());
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
          data-1p-ignore="true"
          data-lpignore="true"
          data-bwignore="true"
          data-form-type="other"
          name="no_autofill_endpoint"
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
            data-1p-ignore="true"
            data-lpignore="true"
            data-bwignore="true"
            data-form-type="other"
            name="no_autofill_key"
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
                  const pasted = text.trim();
                  setApiKey(pasted);
                  toast.success(t('settings.apiKeyPasted'));
                  handleFetchModels(endpoint, pasted);
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

        <button
          type="button"
          onClick={() => {
            setModelFilter('free');
            setIsModelPickerOpen(true);
            ensureModelsLoaded();
          }}
          className="w-full flex items-center justify-between border border-[#e2ddd5] hover:border-[#ff4f00] rounded-xl px-3.5 py-3 bg-[#faf8f5] hover:bg-white transition-all text-left group cursor-pointer shadow-2xs"
        >
          <div className="flex items-center gap-2 overflow-hidden mr-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shrink-0 uppercase tracking-wider ${
                model.toLowerCase().includes('free')
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}
            >
              {model.toLowerCase().includes('free') ? '🎁 Free' : '⚡ Pro'}
            </span>
            <span className="text-xs font-mono font-semibold text-neutral-800 truncate">
              {model || 'Pilih Model AI dari Sumber...'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-neutral-400 group-hover:text-[#ff4f00] shrink-0">
            <ChevronDown size={18} />
          </div>
        </button>
      </div>

      <button
        onClick={handleSaveSettings}
        className="w-full flex items-center justify-center gap-2 bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all mt-2 shadow-sm shadow-[#ff4f00]/25 cursor-pointer"
      >
        <Save size={18} /> {t('settings.api.save')}
      </button>

      {/* Jendela Modal Memuat Model dari Sumber */}
      {isModelPickerOpen && (
        <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-[#e2ddd5] dark:border-neutral-800 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-[#faf8f5] dark:bg-neutral-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#fff0eb] text-[#ff4f00] flex items-center justify-center shrink-0 border border-[#ff4f00]/20">
                  <Cpu size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">{t('modelPicker.title')}</h3>
                  <p className="text-[11px] text-neutral-500">
                    {fetchedModels.length > 0
                      ? t('modelPicker.modelsLoaded').replace('{count}', fetchedModels.length.toString())
                      : t('modelPicker.loadingProvider')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsModelPickerOpen(false)}
                  className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 border-b border-neutral-100 dark:border-neutral-800 space-y-2.5 bg-white dark:bg-neutral-900">
              {/* Filter Buttons */}
              <div className="flex items-center gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setModelFilter('free')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    modelFilter === 'free'
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'bg-emerald-100/70 text-emerald-800 hover:bg-emerald-200'
                  }`}
                >
                  <span>🎁</span> Free ({fetchedModels.filter((m) => m.toLowerCase().includes('free')).length})
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilter('pro')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    modelFilter === 'pro'
                      ? 'bg-purple-600 text-white shadow-xs font-bold'
                      : 'bg-purple-100/70 text-purple-800 hover:bg-purple-200'
                  }`}
                >
                  <span>⚡</span> Pro ({fetchedModels.filter((m) => !m.toLowerCase().includes('free')).length})
                </button>
              </div>

              {/* Search Field */}
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder={t('modelPicker.search')}
                  autoComplete="off"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                  name="no_autofill_model_search"
                  className="w-full pl-9 pr-8 py-2 text-xs border border-[#e2ddd5] dark:border-neutral-700 rounded-xl bg-[#faf8f5] dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#ff4f00]"
                />
                {modelSearch && (
                  <button
                    type="button"
                    onClick={() => setModelSearch('')}
                    className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Model List Items */}
            <div className="p-3 overflow-y-auto max-h-[50vh] space-y-1.5">
              {fetchingModels && fetchedModels.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
                  <RefreshCw size={24} className="animate-spin text-[#ff4f00] mx-auto" />
                  <p className="font-medium">{t('modelPicker.loadingProvider')}</p>
                </div>
              ) : (() => {
                let list = fetchedModels.length > 0 ? fetchedModels : modelHistory;
                if (fetchedModels.length > 0) {
                  if (modelFilter === 'free') {
                    list = list.filter((m) => m.toLowerCase().includes('free'));
                  } else if (modelFilter === 'pro') {
                    list = list.filter((m) => !m.toLowerCase().includes('free'));
                  }
                }
                if (modelSearch.trim()) {
                  const query = modelSearch.toLowerCase().trim();
                  list = list.filter((m) => m.toLowerCase().includes(query));
                }

                // Automatically sort by best quality score
                const sortedList = [...list].sort((a, b) => {
                  const scoreA = getModelQualityScore(a);
                  const scoreB = getModelQualityScore(b);
                  if (scoreB !== scoreA) return scoreB - scoreA;
                  return a.localeCompare(b);
                });

                if (sortedList.length === 0) {
                  return (
                    <div className="py-10 text-center text-xs text-neutral-500 space-y-2">
                      <p className="font-medium">{t('modelPicker.notFound')}</p>
                      <button
                        type="button"
                        onClick={() => handleFetchModels(endpoint, apiKey)}
                        className="px-3 py-1.5 bg-[#ff4f00] text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {t('modelPicker.reload')}
                      </button>
                    </div>
                  );
                }

                return sortedList.map((m) => {
                  const isSelected = model === m;
                  const isFree = m.toLowerCase().includes('free');

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setModel(m);
                        setIsModelPickerOpen(false);
                        toast.success(t('modelPicker.selected').replace('{model}', m));
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                        isSelected
                          ? 'border-[#ff4f00] bg-[#fff0eb]/80 dark:bg-[#ff4f00]/10 shadow-2xs font-semibold'
                          : 'border-transparent hover:border-[#e2ddd5] hover:bg-[#faf8f5] dark:hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md shrink-0 uppercase tracking-wider ${
                            isFree
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}
                        >
                          {isFree ? '🎁 Free' : '⚡ Pro'}
                        </span>
                        <span
                          className={`text-xs font-mono truncate ${
                            isSelected ? 'text-[#ff4f00]' : 'text-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {m}
                        </span>
                      </div>
                      {isSelected && <Check size={16} className="text-[#ff4f00] shrink-0" />}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-[#faf8f5] dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500">
              <span>{t('modelPicker.clickToSelect')}</span>
              <button
                type="button"
                onClick={() => setIsModelPickerOpen(false)}
                className="px-3 py-1 bg-white border border-[#e2ddd5] dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold hover:bg-neutral-100 cursor-pointer"
              >
                {t('modelPicker.close')}
              </button>
            </div>

          </div>
        </div>
      )}
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
    </div>
  );

  const renderSyncTab = () => (
    <div className="space-y-4">
      <div>
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
              <p className="font-medium text-sm text-neutral-900">{t('btn.importJSON') || 'Import JSON or HTML'}</p>
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
              {onOpenGuide && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenGuide();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 hover:bg-[#fff0eb] hover:text-[#ff4f00] transition-colors cursor-pointer"
                >
                  <BookOpen size={18} className="text-[#ff4f00]" />
                  {t('guide.title') || 'Panduan Penggunaan'}
                </button>
              )}
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold tracking-widest text-neutral-400 uppercase">{t('menu.personal')}</div>
            <div className="space-y-1">
              <NavItem id="wallet" icon={Crown} label={t('menu.wallet')} />
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
              alt="Tautan Lumina - Product Hunt"
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
