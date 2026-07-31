import { ADMIN_EMAIL } from '../lib/appwrite';
import React, { useState } from 'react';
import { Crown, CheckCircle2, Clock, Upload, ShieldCheck, Zap, Copy, Tag, Ticket, Loader2 } from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { account } from '../lib/appwrite';
import { toast } from 'sonner';

export const SubscriptionCard = ({ user }: { user: any }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [pastedUrl, setPastedUrl] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [applyingPromo, setApplyingPromo] = useState(false);

  const prefs = user?.prefs || {};
  const proStatus = prefs.proStatus || 'free'; // 'free', 'pending', 'pro'
  const isDeveloper = user?.email?.toLowerCase() === ADMIN_EMAIL;

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    const usedPromos = Array.isArray(prefs.usedPromos) ? prefs.usedPromos : [];
    if (usedPromos.includes(code)) {
      toast.error(t('sub.promoAlreadyUsed') || 'Kode promo ini sudah pernah digunakan pada akun Anda.');
      return;
    }

    if (code === 'PH2026-7D-X92K' || code === 'PH10OFF') {
      setApplyingPromo(true);
      try {
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        await account.updatePrefs({
          ...prefs,
          proStatus: 'pro',
          promoApplied: code,
          proExpiresAt: expiresAt,
          usedPromos: [...usedPromos, code],
        });
        toast.success((t('sub.promoSuccess') || 'Kode promo {code} berhasil diterapkan! Anda mendapatkan 1 minggu Pro Tier gratis.').replace('{code}', code));
        window.location.reload();
      } catch (err: any) {
        toast.error('Gagal menerapkan kode promo: ' + (err.message || ''));
        setApplyingPromo(false);
      }
    } else {
      toast.error(t('sub.promoInvalid') || 'Kode promo tidak valid atau telah kedaluwarsa.');
    }
  };

  const handleDevSetStatus = async (status: 'pro' | 'free' | 'pending') => {
    setLoading(true);
    try {
      await account.updatePrefs({
        ...prefs,
        proStatus: status,
      });
      toast.success(`Mode tes Pro developer diubah ke: ${status.toUpperCase()}`);
      window.location.reload();
    } catch (err: any) {
      toast.error('Gagal mengubah status: ' + (err.message || ''));
      setLoading(false);
    }
  };
  
  const isValidUrl = (urlStr: string) => {
    if (!urlStr || !urlStr.trim()) return false;
    try {
      const parsed = new URL(urlStr.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const copyToClipboard = async (text: string, name: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('toast.addressCopied').replace('{name}', name));
    } catch {
      toast.error(t('toast.copyFailed'));
    }
  };

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error(t('toast.emptyClipboard'));
        return;
      }
      const url = text.trim();
      setPastedUrl(url);
      if (!isValidUrl(url)) {
        toast.error(t('toast.invalidUrl'));
      } else {
        toast.success(t('toast.urlPasted'));
      }
    } catch (err: any) {
      toast.error(t('toast.clipboardError'));
    }
  };

  const handleConfirmSubmit = async () => {
    if (!pastedUrl || !isValidUrl(pastedUrl)) {
      toast.error(t('toast.invalidUrl'));
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      await account.updatePrefs({
        ...prefs,
        proStatus: 'pending',
        paymentProof: pastedUrl,
        submittedAt: new Date().toISOString()
      });
      toast.success(t('toast.proofSubmitted'));
      window.location.reload();
    } catch (err: any) {
      toast.error(t('toast.proofError'));
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    setStep('payment');
  };

  const devPanel = isDeveloper ? (
    <div className="mb-4 bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs space-y-2.5 shadow-xs">
      <div className="font-bold text-amber-900 flex items-center gap-1.5">
        <Crown size={15} className="text-amber-600" />
        Panel Tes Pro Pengembang (Abdulkarim)
      </div>
      <p className="text-amber-700">Status saat ini: <span className="font-mono font-bold uppercase px-1.5 py-0.5 bg-amber-100 rounded text-amber-900">{proStatus}</span></p>
      <div className="flex gap-2">
        <button
          onClick={() => handleDevSetStatus('pro')}
          disabled={loading || proStatus === 'pro'}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded-xl transition-colors cursor-pointer text-center"
        >
          🚀 Ubah ke Pro
        </button>
        <button
          onClick={() => handleDevSetStatus('free')}
          disabled={loading || proStatus === 'free'}
          className="flex-1 bg-neutral-700 hover:bg-neutral-800 disabled:opacity-50 text-white font-bold py-2 px-2 rounded-xl transition-colors cursor-pointer text-center"
        >
          ⚪ Ubah ke Free
        </button>
        <button
          onClick={() => handleDevSetStatus('pending')}
          disabled={loading || proStatus === 'pending'}
          className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-2 px-2 rounded-xl transition-colors cursor-pointer text-center"
        >
          ⏳ Set Pending
        </button>
      </div>
    </div>
  ) : null;

  if (!user) {
    return (
      <div className="bg-[#faf8f5] text-neutral-500 p-6 rounded-2xl border border-[#e2ddd5] text-center font-medium text-sm">
        {t("sub.loginRequired")}
      </div>
    );
  }

  if (proStatus === 'pro') {
    return (
      <div className="space-y-4">
        {devPanel}
        <div className="bg-gradient-to-br from-[#fff0eb] to-orange-100 text-[#131313] p-6 rounded-2xl border border-[#ff4f00]/30 flex flex-col items-center text-center relative overflow-hidden shadow-xs">
          <div className="absolute -top-6 -right-6 text-[#ff4f00] opacity-10">
            <Crown size={120} />
          </div>
          <div className="bg-[#ff4f00] p-3 rounded-2xl mb-3 text-white relative z-10 shadow-md shadow-[#ff4f00]/30">
            <Crown size={32} />
          </div>
          <h3 className="font-bold text-xl mb-1 relative z-10 text-[#131313]">{t("sub.active")}</h3>
          <p className="text-sm text-neutral-600 relative z-10">
            {t("sub.activeDesc")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {devPanel}
      <div className="bg-white border border-[#e2ddd5] p-1 rounded-2xl shadow-xs">
      {step === 'info' ? (
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#fff0eb] p-2.5 rounded-xl text-[#ff4f00]">
              <Crown size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#131313] text-lg">{t("sub.upgrade")}</h3>
              <p className="text-sm text-neutral-500 font-medium">{t("sub.price")}</p>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/80 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{t("sub.freeCoreNote")}</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-[#ff4f00] shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t("sub.feat1") }}></span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-[#ff4f00] shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t("sub.feat2") }}></span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-[#ff4f00] shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t("sub.feat3") }}></span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-neutral-700">
              <CheckCircle2 size={18} className="text-[#ff4f00] shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t("sub.feat4") }}></span>
            </div>
          </div>
          
          <button
            onClick={handleUpgrade}
            className="w-full bg-[#ff4f00] hover:bg-[#e04500] text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-[#ff4f00]/25 flex items-center justify-center gap-2"
          >
            <Zap size={18} className="text-white fill-white" />
            {t("sub.btnNow")}
          </button>

          <div className="mt-4 pt-4 border-t border-[#e2ddd5]/60 space-y-2">
            <label className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
              <Tag size={14} className="text-[#ff4f00]" />
              {t('sub.promoTitle') || 'Gunakan Kode Promo'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder={t('sub.promoPlaceholder') || 'Masukkan kode promo (contoh: PH2026-7D-X92K)'}
                className="w-full sm:flex-1 text-xs font-mono px-3 py-2.5 bg-[#faf8f5] border border-[#e2ddd5] rounded-xl focus:outline-none focus:border-[#ff4f00] focus:ring-2 focus:ring-[#ff4f00]/20 text-neutral-800 uppercase min-w-0 placeholder:normal-case font-medium"
              />
              <button
                type="button"
                disabled={applyingPromo || !promoInput.trim()}
                onClick={handleApplyPromo}
                className="w-full sm:w-auto px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-200 text-white disabled:text-neutral-400 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed shadow-xs"
              >
                {applyingPromo ? <Loader2 size={13} className="animate-spin" /> : <Ticket size={13} />}
                <span>{t('sub.promoBtn') || 'Terapkan Kode'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-[#131313] text-base mb-3 border-b border-[#e2ddd5]/60 pb-2.5 flex items-center justify-between">
            <span>{t("sub.pay")}</span>
            <span className="text-xs font-bold text-[#ff4f00] bg-[#fff0eb] px-2.5 py-1 rounded-md border border-[#ff4f00]/20">{t("sub.price")}</span>
          </h3>
          
          <div className="bg-[#faf8f5] p-3.5 rounded-xl border border-[#e2ddd5] mb-3 space-y-3">
            <p className="text-xs sm:text-sm text-neutral-700 leading-snug" dangerouslySetInnerHTML={{ __html: t("sub.transfer") }}></p>
            
            {/* Tokens & Networks in compact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{t("sub.tokens")}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    USDT
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    USDC
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                    ETH
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{t("sub.networks")}</p>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="px-2 py-0.5 bg-white text-neutral-700 border border-[#e2ddd5] rounded">Base</span>
                  <span className="px-2 py-0.5 bg-white text-neutral-700 border border-[#e2ddd5] rounded">BSC</span>
                  <span className="px-2 py-0.5 bg-white text-neutral-700 border border-[#e2ddd5] rounded">Polygon</span>
                  <span className="px-2 py-0.5 bg-white text-neutral-700 border border-[#e2ddd5] rounded">Optimism</span>
                  <span className="px-2 py-0.5 bg-white text-neutral-700 border border-[#e2ddd5] rounded">Arbitrum</span>
                </div>
              </div>
            </div>

            {/* EVM Address Box */}
            <div>
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">{t("sub.addressLabel")}</p>
              <div className="flex items-center justify-between bg-white border border-[#e2ddd5] rounded-lg p-2 gap-2 shadow-2xs">
                <span className="text-xs text-[#131313] font-mono font-semibold break-all select-all leading-tight" title="0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825">
                  0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('0x0b90bCCf03A9cF051F6cCCeC6dFc45259752C825', 'EVM Crypto')}
                  className="px-2.5 py-1 bg-[#fff0eb] text-[#ff4f00] hover:bg-[#ff4f00] hover:text-white rounded-md transition-colors border border-[#ff4f00]/30 shrink-0 flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                  title={t("sub.copyEVM")}
                >
                  <Copy size={13} />
                  <span>{t("sub.copy")}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-neutral-500 flex items-center gap-1.5 leading-tight pt-0.5">
              <ShieldCheck size={13} className="shrink-0 text-[#ff4f00]" />
              {t("sub.evmNotice")}
            </p>
          </div>

          <div className="space-y-2.5">
            <p className="text-xs text-neutral-600 font-medium leading-snug">
              {t("sub.paste")}
            </p>

            <div className="relative flex items-center">
              <input
                type="url"
                value={pastedUrl}
                onChange={(e) => setPastedUrl(e.target.value)}
                placeholder="https://explorer.solana.com/tx/..."
                autoComplete="off"
                data-1p-ignore="true"
                data-lpignore="true"
                data-bwignore="true"
                data-form-type="other"
                name="no_autofill_sub_url"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className={`w-full text-xs font-mono px-3 py-2.5 pr-20 bg-white border rounded-xl focus:outline-none focus:ring-2 transition-all ${
                  pastedUrl && !isValidUrl(pastedUrl)
                    ? 'border-red-400 focus:ring-red-200 text-red-600 bg-red-50/20'
                    : pastedUrl && isValidUrl(pastedUrl)
                    ? 'border-emerald-500 focus:ring-emerald-200 text-emerald-800 bg-emerald-50/20'
                    : 'border-[#e2ddd5] focus:ring-[#ff4f00]/20 focus:border-[#ff4f00] text-neutral-800'
                }`}
              />
              <button
                type="button"
                onClick={handlePasteUrl}
                className="absolute right-1.5 px-2.5 py-1.5 bg-[#fff0eb] hover:bg-[#ff4f00] hover:text-white text-[#ff4f00] rounded-lg border border-[#ff4f00]/30 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                title={t("sub.pasteUrl")}
              >
                <Upload size={13} />
                <span>{t("sub.pasteUrl")}</span>
              </button>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep('info')}
                className="flex-1 bg-white border border-[#e2ddd5] text-neutral-700 font-semibold py-2.5 rounded-xl hover:bg-[#faf8f5] transition-colors text-xs sm:text-sm cursor-pointer"
              >
                {t("sub.back")}
              </button>
              <button
                type="button"
                disabled={loading || !pastedUrl || !isValidUrl(pastedUrl)}
                onClick={handleConfirmSubmit}
                className="flex-[2] bg-[#ff4f00] hover:bg-[#e04500] disabled:bg-neutral-300 disabled:border-neutral-300 disabled:cursor-not-allowed text-white font-semibold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs text-xs sm:text-sm cursor-pointer"
              >
                {loading ? <Upload className="animate-bounce" size={15} /> : <CheckCircle2 size={15} className="text-white" />}
                {t("sub.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#e2ddd5] space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <h4 className="font-bold text-[#131313] text-lg">{t("sub.modalTitle")}</h4>
            <p className="text-xs text-neutral-600 leading-relaxed font-medium">
              {t("sub.modalDesc")}
            </p>
            <div className="bg-[#faf8f5] p-3 rounded-xl border border-[#e2ddd5]">
              <span className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">URL:</span>
              <span className="text-xs font-mono text-[#ff4f00] break-all font-semibold">{pastedUrl}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 bg-white border border-[#e2ddd5] text-neutral-700 text-xs font-semibold py-2.5 rounded-xl hover:bg-[#faf8f5] transition-colors"
              >
                {t("modal.cancel")}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteSubmit}
                className="flex-1 bg-[#ff4f00] hover:bg-[#e04500] text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-[#ff4f00]/25"
              >
                {loading ? <Upload className="animate-bounce" size={14} /> : <CheckCircle2 size={14} className="text-white" />}
                {t("sub.yes")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
  );
};
