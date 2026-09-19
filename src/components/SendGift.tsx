import React, { useState } from 'react';
import {
  Gift,
  Copy,
  Check,
  QrCode,
  X,
  Heart,
  ShieldCheck,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { DIRECT_GIFT_ACCOUNTS, GiftAccountConfig } from '../data/giftAccounts';

export const SendGift: React.FC = () => {
  // Suggested gift amount presets (strictly for guidance / transfer calculation, no API)
  const [selectedPreset, setSelectedPreset] = useState<number | null>(10000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  // Copy notification state ('opay' | 'ecobank' | null)
  const [copiedKey, setCopiedKey] = useState<'opay' | 'ecobank' | null>(null);

  // QR Code Lightbox Modal state
  const [activeQrModal, setActiveQrModal] = useState<'opay' | 'ecobank' | null>(null);

  // Track if a QR image failed to load so we can show the clean scan placeholder gracefully
  const [qrImageErrors, setQrImageErrors] = useState<Record<string, boolean>>({});

  // "Already sent a gift?" confirmation state
  const [hasSentConfirmation, setHasSentConfirmation] = useState(false);

  const presets = [
    { value: 5000, label: '₦5,000' },
    { value: 10000, label: '₦10,000' },
    { value: 20000, label: '₦20,000' },
    { value: 50000, label: '₦50,000' },
  ];

  const formatNaira = (val: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handlePresetSelect = (val: number) => {
    setIsCustom(false);
    setSelectedPreset(val);
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(raw);
    setIsCustom(true);
  };

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedPreset;

  /**
   * Robust clipboard copy with native API & graceful document fallback
   */
  const handleCopy = async (accountNumber: string, key: 'opay' | 'ecobank') => {
    const textToCopy = accountNumber.trim();
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 3000);
    } catch (err) {
      console.warn('Clipboard writeText failed, attempting secondary copy', err);
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 3000);
      } catch (fallbackErr) {
        console.error('All copy fallbacks failed:', fallbackErr);
      }
    }
  };

  const activeAccountModal: GiftAccountConfig | null = activeQrModal
    ? DIRECT_GIFT_ACCOUNTS[activeQrModal]
    : null;

  return (
    <section id="gift" className="py-20 max-w-7xl mx-auto px-5 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#c5a059]/30 text-xs font-semibold text-[#775a19] uppercase tracking-widest mb-4 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-[#775a19]" />
            <span>Monetary Tribute & Blessing</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1c1c19] font-semibold tracking-tight mb-4">
            Send Dad a Birthday Gift 🎁
          </h2>

          <p className="text-base sm:text-lg text-[#4e4639] leading-relaxed">
            Your presence and birthday wishes are already a wonderful gift. If you'd like to bless
            Dad with a monetary gift, you can send it directly through OPay or EcoBank.
          </p>
        </div>

        {/* Suggested Gift Amounts (Purely Guidance — No Payment API) */}
        <div className="bg-[#fcfaf6] rounded-3xl p-6 sm:p-8 border border-[#d1c5b4]/40 shadow-xs mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-semibold text-[#775a19] uppercase tracking-wider block">
                Suggested Gift Amount
              </span>
              <p className="text-xs text-[#7f7667]">
                Choose or customize an amount for your transfer
              </p>
            </div>
            {currentAmount && currentAmount > 0 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f3ede3] text-xs font-medium text-[#1c1c19]">
                <span>Selected gift:</span>
                <strong className="font-serif text-[#775a19] font-bold">
                  {formatNaira(currentAmount)}
                </strong>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
            {presets.map((p) => {
              const isSelected = !isCustom && selectedPreset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetSelect(p.value)}
                  className={`py-3 px-3 rounded-2xl text-center font-serif text-sm sm:text-base font-semibold transition-all cursor-pointer min-h-[44px] ${
                    isSelected
                      ? 'bg-[#775a19] text-white shadow-md ring-2 ring-[#775a19]/30'
                      : 'bg-white text-[#1c1c19] border border-[#d1c5b4]/50 hover:border-[#c5a059] hover:bg-[#faf7f2]'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}

            {/* Custom Amount Option */}
            <button
              type="button"
              onClick={handleCustomSelect}
              className={`py-3 px-3 rounded-2xl text-center text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] flex items-center justify-center ${
                isCustom
                  ? 'bg-[#775a19] text-white shadow-md ring-2 ring-[#775a19]/30'
                  : 'bg-white text-[#1c1c19] border border-[#d1c5b4]/50 hover:border-[#c5a059] hover:bg-[#faf7f2]'
              }`}
            >
              Custom Amount
            </button>
          </div>

          {/* Custom Input Field (shown if Custom Amount is selected) */}
          {isCustom && (
            <div className="mt-4 pt-4 border-t border-[#d1c5b4]/30 flex flex-col sm:flex-row items-center gap-3">
              <span className="text-xs text-[#4e4639] shrink-0 font-medium">
                Enter Custom Amount (₦):
              </span>
              <div className="relative flex-1 w-full">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-serif text-sm font-bold text-[#775a19]">
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customAmount}
                  onChange={handleCustomInput}
                  placeholder="e.g. 25000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-[#c5a059]/50 text-sm font-semibold text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#775a19]"
                />
              </div>
            </div>
          )}

          {/* Transfer Guidance Note */}
          {currentAmount && currentAmount > 0 ? (
            <p className="text-xs text-[#775a19] font-medium mt-4 bg-white/80 p-3 rounded-xl border border-[#c5a059]/20 flex items-center gap-2">
              <Smartphone className="w-4 h-4 shrink-0" />
              <span>
                Please transfer this amount to the <strong>OPay</strong> or{' '}
                <strong>EcoBank</strong> account below using your mobile banking app.
              </span>
            </p>
          ) : null}
        </div>

        {/* PAYMENT METHODS (OPay & EcoBank) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-10">
          {/* METHOD 1: OPAY */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c5a059]/35 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
            {/* Top Badge & Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f9f2] text-[#008753] text-[11px] font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#00B875] animate-pulse" />
                  <span>OPay Direct</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQrModal('opay')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#008753] bg-[#e8f9f2] hover:bg-[#d0f5e4] transition-colors cursor-pointer"
                  title="Scan OPay QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan OPay QR</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#00B875] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  O
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#1c1c19] font-bold">OPay</h3>
                  <p className="text-xs text-[#7f7667]">Instant Zero-Fee Mobile Transfer</p>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="bg-[#fcfaf6] rounded-2xl p-4 border border-[#d1c5b4]/40 space-y-3 mb-6">
                <div>
                  <span className="text-[11px] text-[#7f7667] uppercase font-semibold tracking-wider block">
                    Account Name
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-[#1c1c19] mt-0.5 break-words">
                    {DIRECT_GIFT_ACCOUNTS.opay.accountName}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#d1c5b4]/30">
                  <span className="text-[11px] text-[#7f7667] uppercase font-semibold tracking-wider block">
                    Account Number
                  </span>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-[#008753] tracking-wider mt-0.5 select-all">
                    {DIRECT_GIFT_ACCOUNTS.opay.accountNumber}
                  </p>
                </div>
              </div>

              {/* QR Code Preview Card */}
              <div className="mb-6 p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d1c5b4]/40 flex items-center gap-4">
                <div
                  onClick={() => setActiveQrModal('opay')}
                  className="w-16 h-16 rounded-xl bg-white border border-[#d1c5b4]/60 flex flex-col items-center justify-center cursor-pointer hover:border-[#00B875] transition-colors p-1 shrink-0 overflow-hidden shadow-2xs group"
                >
                  {DIRECT_GIFT_ACCOUNTS.opay.qrCodeUrl && !qrImageErrors['opay'] ? (
                    <img
                      src={DIRECT_GIFT_ACCOUNTS.opay.qrCodeUrl}
                      alt="OPay QR code"
                      onError={() => setQrImageErrors((prev) => ({ ...prev, opay: true }))}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-6 h-6 text-[#008753] mx-auto group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] text-[#7f7667] font-medium block mt-0.5">
                        QR Code
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[#1c1c19] block">
                    Prefer scanning to pay?
                  </span>
                  <p className="text-[#7f7667] text-[11px] mt-0.5">
                    Open your OPay app to scan Dad's account QR directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveQrModal('opay')}
                    className="text-[#008753] font-semibold text-[11px] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View QR Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button: Copy Account Number */}
            <div>
              <button
                type="button"
                onClick={() => handleCopy(DIRECT_GIFT_ACCOUNTS.opay.accountNumber, 'opay')}
                className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  copiedKey === 'opay'
                    ? 'bg-[#008753] text-white ring-2 ring-[#008753]/40'
                    : 'bg-[#00B875] hover:bg-[#009e64] text-white'
                }`}
              >
                {copiedKey === 'opay' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>OPay account number copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Account Number</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* METHOD 2: ECOBANK */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#c5a059]/35 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between">
            {/* Top Badge & Header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eaf4fa] text-[#005B94] text-[11px] font-bold tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-[#005B94] animate-pulse" />
                  <span>EcoBank Direct</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveQrModal('ecobank')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-[#005B94] bg-[#eaf4fa] hover:bg-[#d8eaf6] transition-colors cursor-pointer"
                  title="Scan EcoBank QR Code"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Scan EcoBank QR</span>
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-[#005B94] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  E
                </div>
                <div>
                  <h3 className="font-serif text-2xl text-[#1c1c19] font-bold">EcoBank</h3>
                  <p className="text-xs text-[#7f7667]">Direct Commercial Bank Transfer</p>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="bg-[#fcfaf6] rounded-2xl p-4 border border-[#d1c5b4]/40 space-y-3 mb-6">
                <div>
                  <span className="text-[11px] text-[#7f7667] uppercase font-semibold tracking-wider block">
                    Account Name
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-[#1c1c19] mt-0.5 break-words">
                    {DIRECT_GIFT_ACCOUNTS.ecobank.accountName}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#d1c5b4]/30">
                  <span className="text-[11px] text-[#7f7667] uppercase font-semibold tracking-wider block">
                    Account Number
                  </span>
                  <p className="text-xl sm:text-2xl font-mono font-bold text-[#005B94] tracking-wider mt-0.5 select-all">
                    {DIRECT_GIFT_ACCOUNTS.ecobank.accountNumber}
                  </p>
                </div>
              </div>

              {/* QR Code Preview Card */}
              <div className="mb-6 p-3.5 rounded-2xl bg-[#faf8f5] border border-[#d1c5b4]/40 flex items-center gap-4">
                <div
                  onClick={() => setActiveQrModal('ecobank')}
                  className="w-16 h-16 rounded-xl bg-white border border-[#d1c5b4]/60 flex flex-col items-center justify-center cursor-pointer hover:border-[#005B94] transition-colors p-1 shrink-0 overflow-hidden shadow-2xs group"
                >
                  {DIRECT_GIFT_ACCOUNTS.ecobank.qrCodeUrl && !qrImageErrors['ecobank'] ? (
                    <img
                      src={DIRECT_GIFT_ACCOUNTS.ecobank.qrCodeUrl}
                      alt="EcoBank QR code"
                      onError={() => setQrImageErrors((prev) => ({ ...prev, ecobank: true }))}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center">
                      <QrCode className="w-6 h-6 text-[#005B94] mx-auto group-hover:scale-110 transition-transform" />
                      <span className="text-[8px] text-[#7f7667] font-medium block mt-0.5">
                        QR Code
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs">
                  <span className="font-semibold text-[#1c1c19] block">
                    Prefer scanning to pay?
                  </span>
                  <p className="text-[#7f7667] text-[11px] mt-0.5">
                    Open your banking app to scan Dad's account QR directly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveQrModal('ecobank')}
                    className="text-[#005B94] font-semibold text-[11px] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View QR Code</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Button: Copy Account Number */}
            <div>
              <button
                type="button"
                onClick={() => handleCopy(DIRECT_GIFT_ACCOUNTS.ecobank.accountNumber, 'ecobank')}
                className={`w-full min-h-[48px] py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                  copiedKey === 'ecobank'
                    ? 'bg-[#004875] text-white ring-2 ring-[#004875]/40'
                    : 'bg-[#005B94] hover:bg-[#004d7c] text-white'
                }`}
              >
                {copiedKey === 'ecobank' ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>EcoBank account number copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Account Number</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security & Receipt Reminder Note */}
        <div className="bg-[#fcfaf6] rounded-2xl p-4 sm:p-5 border border-[#c5a059]/30 flex items-center justify-center gap-2.5 text-center text-xs sm:text-sm text-[#775a19] font-medium mb-8">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#775a19]" />
          <span>Please keep your transfer receipt after sending your gift.</span>
        </div>

        {/* OPTIONAL CONFIRMATION: "Already sent a gift?" */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#d1c5b4]/40 text-center max-w-2xl mx-auto shadow-xs">
          <p className="text-sm font-semibold text-[#1c1c19] mb-3">Already sent a gift?</p>

          {hasSentConfirmation ? (
            <div className="p-5 rounded-2xl bg-[#faf7f2] border border-[#c5a059]/40 text-center animate-fade-in">
              <div className="w-10 h-10 rounded-full bg-[#f3ede3] text-[#775a19] flex items-center justify-center mx-auto mb-3">
                <Heart className="w-5 h-5 fill-current text-[#775a19]" />
              </div>
              <h4 className="font-serif text-lg text-[#1c1c19] font-bold mb-2">
                Thank you for celebrating Dad! ❤️
              </h4>
              <p className="text-xs sm:text-sm text-[#4e4639] leading-relaxed max-w-md mx-auto">
                Your gift has been sent directly to the account provided. Please keep your transfer
                receipt for your records.
              </p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setHasSentConfirmation(true)}
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-[#775a19] text-white font-semibold text-sm hover:bg-[#c5a059] transition-colors cursor-pointer min-h-[44px] shadow-xs"
            >
              <Heart className="w-4 h-4 fill-current text-white/90" />
              <span>I've Sent My Gift ❤️</span>
            </button>
          )}
        </div>
      </div>

      {/* QR CODE LIGHTBOX / MODAL */}
      {activeAccountModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setActiveQrModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#c5a059]/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveQrModal(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#f6f3ee] text-[#4e4639] hover:bg-[#e8e4dc] flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close QR Modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-2 shadow-xs"
                style={{ backgroundColor: activeAccountModal.brandColor }}
              >
                {activeAccountModal.displayName[0]}
              </div>
              <h3 id="qr-modal-title" className="font-serif text-2xl text-[#1c1c19] font-bold">
                {activeAccountModal.displayName} QR Code
              </h3>
              <p className="text-xs text-[#7f7667] mt-0.5">
                Scan from your {activeAccountModal.displayName} or banking app
              </p>
            </div>

            {/* QR Code Viewport */}
            <div className="bg-[#fcfaf6] rounded-2xl p-5 border border-[#d1c5b4]/50 flex flex-col items-center justify-center mb-5">
              {activeAccountModal.qrCodeUrl && !qrImageErrors[activeAccountModal.displayName.toLowerCase()] ? (
                <div className="w-60 h-60 max-w-full bg-white rounded-xl p-3 border border-[#d1c5b4]/40 shadow-xs flex items-center justify-center overflow-hidden">
                  <img
                    src={activeAccountModal.qrCodeUrl}
                    alt={`${activeAccountModal.displayName} QR code`}
                    onError={() =>
                      setQrImageErrors((prev) => ({
                        ...prev,
                        [activeAccountModal.displayName.toLowerCase()]: true,
                      }))
                    }
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-60 h-60 max-w-full bg-white rounded-xl p-4 border border-dashed border-[#c5a059]/50 flex flex-col items-center justify-center text-center shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#faf7f2] flex items-center justify-center mb-3">
                    <QrCode
                      className="w-8 h-8"
                      style={{ color: activeAccountModal.brandColor }}
                    />
                  </div>
                  <span className="font-serif font-bold text-sm text-[#1c1c19] mb-1">
                    {activeAccountModal.displayName} QR Code
                  </span>
                  <p className="text-[11px] text-[#7f7667] leading-relaxed max-w-[190px]">
                    Place your QR image file at{' '}
                    <span className="font-mono text-[10px] text-[#775a19] font-semibold">
                      /public{activeAccountModal.qrCodeUrl}
                    </span>{' '}
                    to display here.
                  </p>
                </div>
              )}
            </div>

            {/* Account Details in Modal */}
            <div className="bg-[#f6f3ee] rounded-2xl p-3.5 space-y-1.5 text-center mb-5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[#7f7667]">
                  Account Name
                </span>
                <p className="font-semibold text-[#1c1c19] text-sm">
                  {activeAccountModal.accountName}
                </p>
              </div>
              <div className="pt-1.5 border-t border-[#d1c5b4]/30">
                <span className="text-[10px] uppercase font-semibold text-[#7f7667]">
                  Account Number
                </span>
                <p
                  className="font-mono font-bold text-lg tracking-wider"
                  style={{ color: activeAccountModal.brandColor }}
                >
                  {activeAccountModal.accountNumber}
                </p>
              </div>
            </div>

            {/* Copy Button in Modal */}
            <button
              type="button"
              onClick={() =>
                handleCopy(activeAccountModal.accountNumber, activeQrModal as 'opay' | 'ecobank')
              }
              className="w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs text-white"
              style={{ backgroundColor: activeAccountModal.brandColor }}
            >
              {copiedKey === activeQrModal ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{activeAccountModal.displayName} account number copied ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Account Number</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
