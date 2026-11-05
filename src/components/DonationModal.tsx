import React, { useState } from 'react';
import { X, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  money: number;
  totalDonated?: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
  onDonate: (amount: number) => void;
}

const PRESET_AMOUNTS = [
  { amount: 10000, labelVi: 'Học Bổng Trẻ', labelEn: 'Youth Scholarship', icon: '🌱' },
  { amount: 50000, labelVi: 'Trợ Cấp Đô Thị', labelEn: 'Transit Subsidy', icon: '🤝' },
  { amount: 100000, labelVi: 'Đại Gia Hảo Tâm', labelEn: 'Generous Philanthropist', icon: '💖' },
  { amount: 500000, labelVi: 'Tỷ Phú Giao Thông', labelEn: 'Transit Tycoon Patron', icon: '👑' }
];

export const DonationModal: React.FC<DonationModalProps> = ({
  isOpen,
  money,
  totalDonated = 0,
  theme,
  lang,
  onClose,
  onDonate
}) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  const [lastDonatedAmount, setLastDonatedAmount] = useState<number | null>(null);
  const [confirmingAmount, setConfirmingAmount] = useState<number | null>(null);
  const isDark = theme === 'dark';

  if (!isOpen) return null;

  const handleDonate = (amount: number) => {
    if (amount <= 0 || amount > money) return;
    onDonate(amount);
    setLastDonatedAmount(amount);
    setTimeout(() => {
      setLastDonatedAmount(null);
    }, 2500);
  };

  const requestDonate = (amount: number) => {
    if (amount <= 0 || amount > money) return;
    setConfirmingAmount(amount);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmount.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= money) {
      requestDonate(parsed);
      setCustomAmount('');
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-md max-h-[90dvh] overflow-y-auto my-auto rounded-2xl border p-4 sm:p-5 shadow-2xl transition-all scrollbar-thin ${
          isDark
            ? 'bg-neutral-900 border-neutral-700/80 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Donation Confirmation Prompt Overlay */}
        {confirmingAmount !== null && (
          <div className="absolute inset-0 bg-neutral-900/95 backdrop-blur-md rounded-2xl p-5 flex flex-col justify-center items-center text-center z-30 animate-in fade-in zoom-in-95">
            <div className="p-3 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/40 mb-3 animate-pulse">
              <Heart className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {lang === 'vi' ? 'Xác nhận Quyên Góp Từ Thiện' : 'Confirm Charity Donation'}
            </h3>
            <p className="text-xl font-mono font-black text-pink-400 mb-3">
              ${confirmingAmount.toLocaleString()}
            </p>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left mb-4 space-y-1">
              <p className="font-bold flex items-center gap-1 text-amber-400">
                <span>⚠️</span>
                <span>{lang === 'vi' ? 'Cảnh báo quan trọng:' : 'Important Warning:'}</span>
              </p>
              <p>
                {lang === 'vi'
                  ? `Số tiền $${confirmingAmount.toLocaleString()} sẽ bị trừ vĩnh viễn khỏi tài khoản và KHÔNG THỂ HOÀN LẠI!`
                  : `The amount of $${confirmingAmount.toLocaleString()} will be permanently deducted and CANNOT BE REFUNDED!`}
              </p>
            </div>
            <div className="flex gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setConfirmingAmount(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs transition cursor-pointer active:scale-95"
              >
                {lang === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const amt = confirmingAmount;
                  setConfirmingAmount(null);
                  handleDonate(amt);
                }}
                className="flex-1 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-400 text-white font-bold text-xs transition cursor-pointer shadow-lg active:scale-95"
              >
                {lang === 'vi' ? 'Xác nhận Quyên góp' : 'Confirm Donation'}
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-neutral-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-1.5">
                <span>{lang === 'vi' ? 'Quỹ Quyên Góp Từ Thiện' : 'Charity Donation Fund'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-[11px] text-neutral-400">
                {lang === 'vi' ? 'Dành cho các Đại gia thừa tiền - Cứu trợ & tăng uy tín' : 'For rich tycoons - Boost reputation & satisfaction'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Wealth & Total Donated */}
        <div className="grid grid-cols-2 gap-2.5 my-3.5">
          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-neutral-800/60 border-neutral-700' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <span className="text-[10px] font-semibold text-neutral-400 uppercase block">
              {lang === 'vi' ? 'Số dư hiện có' : 'Current Balance'}
            </span>
            <span className="text-base font-mono font-bold text-emerald-400">
              ${money.toLocaleString()}
            </span>
          </div>

          <div
            className={`p-2.5 rounded-xl border ${
              isDark ? 'bg-pink-950/20 border-pink-800/40' : 'bg-pink-50 border-pink-200'
            }`}
          >
            <span className="text-[10px] font-semibold text-pink-400 uppercase block">
              {lang === 'vi' ? 'Đã quyên góp' : 'Total Donated'}
            </span>
            <span className="text-base font-mono font-bold text-pink-400">
              ${totalDonated.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Thank You Toast */}
        {lastDonatedAmount !== null && (
          <div className="mb-3 p-2.5 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              {lang === 'vi'
                ? `Cảm ơn Đại gia! Đã quyên góp $${lastDonatedAmount.toLocaleString()} vào Quỹ Trợ Cấp!`
                : `Thank you! Donated $${lastDonatedAmount.toLocaleString()} to City Relief Fund!`}
            </span>
          </div>
        )}

        {/* Preset Donation Packs */}
        <div className="space-y-1.5 mb-3.5">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">
            {lang === 'vi' ? 'Chọn gói quyên góp nhanh' : 'Select Donation Pack'}
          </span>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_AMOUNTS.map((p) => {
              const canAfford = money >= p.amount;
              return (
                <button
                  key={p.amount}
                  disabled={!canAfford}
                  onClick={() => requestDonate(p.amount)}
                  className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer active:scale-95 ${
                    canAfford
                      ? isDark
                        ? 'bg-neutral-800/80 hover:bg-neutral-700/80 border-neutral-700 text-white'
                        : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-300 text-neutral-900'
                      : 'opacity-40 cursor-not-allowed border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="text-base">{p.icon}</span>
                    <span className="font-mono font-bold text-xs sm:text-sm text-pink-400">
                      ${p.amount.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold truncate">
                    {lang === 'vi' ? p.labelVi : p.labelEn}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-1.5 mb-3">
          <span className="text-[11px] font-semibold uppercase text-neutral-400">
            {lang === 'vi' ? 'Hoặc nhập số tiền tùy ý' : 'Or Custom Amount'}
          </span>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              max={money}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={lang === 'vi' ? 'Nhập số tiền ($)...' : 'Enter amount ($)...'}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono font-semibold border outline-none transition ${
                isDark
                  ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 focus:border-pink-500'
                  : 'bg-neutral-50 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-pink-500'
              }`}
            />
            <button
              type="submit"
              disabled={!customAmount || parseInt(customAmount, 10) <= 0 || parseInt(customAmount, 10) > money}
              className="px-3.5 py-2 rounded-xl font-bold text-xs bg-pink-500 hover:bg-pink-400 text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md"
            >
              {lang === 'vi' ? 'Quyên góp' : 'Donate'}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <p className="text-[10px] text-center text-neutral-500 italic">
          {lang === 'vi'
            ? '💡 Tiền quyên góp sẽ giúp tăng điểm Hài Lòng Cư Dân và mở khóa danh hiệu Đại Gia!'
            : '💡 Donations boost Citizen Satisfaction and earn Tycoon honors!'}
        </p>
      </div>
    </div>
  );
};
