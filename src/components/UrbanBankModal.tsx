import React from 'react';
import { BankLoan } from '../types/game';
import { Landmark, TrendingUp, DollarSign, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface UrbanBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMoney: number;
  activeLoans: BankLoan[];
  onTakeLoan: (amount: 3000 | 10000 | 25000) => void;
  onRepayLoan: (loanId: string) => void;
  theme?: 'dark' | 'light';
  lang?: 'vi' | 'en';
}

const LOAN_PACKAGES: {
  amount: 3000 | 10000 | 25000;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  rate: number;
  weeklyInterest: number;
  tagVi: string;
  tagEn: string;
  tagColor: string;
}[] = [
  {
    amount: 3000,
    nameVi: 'Khoản Vay Cứu Trợ Khẩn Cấp',
    nameEn: 'Emergency Short-term Relief',
    descVi: 'Bổ sung vốn tức thì để mua khẩn cấp tàu điện hoặc toa xe giải cứu trạm ùn tắc.',
    descEn: 'Instant capital injection to quickly purchase trains or carriages to rescue overcrowded stations.',
    rate: 0.04,
    weeklyInterest: 120,
    tagVi: 'Cứu Nguy Gấp',
    tagEn: 'Emergency Relief',
    tagColor: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
  },
  {
    amount: 10000,
    nameVi: 'Gói Tín Dụng Mở Rộng Mạng Lưới',
    nameEn: 'Network Expansion Credit',
    descVi: 'Nguồn vốn dồi dào để thiết lập thêm tuyến metro mới, cầu vượt sông và hầm ngầm.',
    descEn: 'Robust financing to establish new metro lines, river bridges, and underwater tunnels.',
    rate: 0.06,
    weeklyInterest: 600,
    tagVi: 'Phổ Biến Nhất',
    tagEn: 'Most Popular',
    tagColor: 'bg-blue-500/20 text-blue-500 border-blue-500/30'
  },
  {
    amount: 25000,
    nameVi: 'Trái Phiếu Đại Đô Thị Cấp Quốc Gia',
    nameEn: 'Metropolitan Development Bond',
    descVi: 'Đại dự án hiện đại hóa quy mô toàn thành phố, nâng cấp đội tàu tốc hành cao tốc.',
    descEn: 'Large-scale city modernization bond to deploy extensive high-speed rolling stock.',
    rate: 0.08,
    weeklyInterest: 2000,
    tagVi: 'Dự Án Trọng Điểm',
    tagEn: 'Major Project',
    tagColor: 'bg-amber-500/20 text-amber-500 border-amber-500/30'
  }
];

export const UrbanBankModal: React.FC<UrbanBankModalProps> = ({
  isOpen,
  onClose,
  currentMoney,
  activeLoans,
  onTakeLoan,
  onRepayLoan,
  theme = 'dark',
  lang = 'vi'
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const totalWeeklyInterest = activeLoans.reduce((sum, l) => sum + l.weeklyInterestAmount, 0);
  const totalDebt = activeLoans.reduce((sum, l) => sum + l.remainingPrincipal, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div 
        className={`relative w-full max-w-2xl border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
        style={{ maxWidth: '42rem' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-neutral-800 bg-neutral-950/60' : 'border-neutral-200 bg-neutral-50/80'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-inner">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-lg font-bold tracking-wide flex items-center gap-2 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                {lang === 'vi' ? 'Ngân Hàng Tín Dụng Đô Thị' : 'Urban Transit Bank'}
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-500 border border-amber-500/30">
                  {lang === 'vi' ? 'Cấp Vốn Khẩn Cấp' : 'Emergency Loans'}
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {lang === 'vi'
                  ? 'Huy động nguồn vốn cứu trợ hoặc mở rộng mạng lưới • Lãi suất trừ vào nửa đêm Chủ Nhật'
                  : 'Raise capital to rescue or expand your transit network • Interest deducted Sunday midnight'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {/* Top Status Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-neutral-800/50 border-neutral-700/60' : 'bg-neutral-50 border-neutral-200 shadow-xs'
            }`}>
              <div className={`text-xs font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'vi' ? 'Ngân Sách Khả Dụng' : 'Current Balance'}</span>
              </div>
              <div className="text-lg font-bold text-emerald-500">
                ${currentMoney.toLocaleString()}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-neutral-800/50 border-neutral-700/60' : 'bg-neutral-50 border-neutral-200 shadow-xs'
            }`}>
              <div className={`text-xs font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'vi' ? 'Tổng Dư Nợ' : 'Total Debt'}</span>
              </div>
              <div className="text-lg font-bold text-amber-500">
                ${totalDebt.toLocaleString()}
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${
              isDark ? 'bg-neutral-800/50 border-neutral-700/60' : 'bg-neutral-50 border-neutral-200 shadow-xs'
            }`}>
              <div className={`text-xs font-medium flex items-center gap-1.5 mb-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === 'vi' ? 'Lãi Suất Hàng Tuần' : 'Weekly Interest'}</span>
              </div>
              <div className="text-lg font-bold text-rose-500">
                -${totalWeeklyInterest.toLocaleString()}{lang === 'vi' ? ' / tuần' : ' / wk'}
              </div>
            </div>
          </div>

          {/* Active Loans Section */}
          {activeLoans.length > 0 && (
            <div className="space-y-3">
              <h3 className={`text-sm font-semibold flex items-center justify-between ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                <span>{lang === 'vi' ? `Khoản Vay Đang Hoạt Động (${activeLoans.length})` : `Active Loans (${activeLoans.length})`}</span>
                <span className={`text-xs font-normal ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                  {lang === 'vi' ? 'Lãi trừ vào lúc chuyển tuần mới' : 'Interest charged each week'}
                </span>
              </h3>
              <div className="space-y-2">
                {activeLoans.map((loan) => {
                  const canRepay = currentMoney >= loan.remainingPrincipal;
                  return (
                    <div
                      key={loan.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 ${
                        isDark ? 'bg-neutral-800/70 border-neutral-700/80' : 'bg-neutral-50 border-neutral-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{loan.nameVi}</div>
                        <div className={`text-xs mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                          {lang === 'vi' ? 'Dư nợ gốc: ' : 'Principal: '}<span className={`font-medium ${isDark ? 'text-white' : 'text-neutral-900'}`}>${loan.remainingPrincipal.toLocaleString()}</span> • {lang === 'vi' ? 'Lãi tuần: ' : 'Weekly interest: '}<span className="text-rose-500 font-medium">-${loan.weeklyInterestAmount.toLocaleString()}</span> ({(loan.weeklyInterestRate * 100).toFixed(0)}%)
                        </div>
                      </div>
                      <button
                        onClick={() => onRepayLoan(loan.id)}
                        disabled={!canRepay}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 ${
                          canRepay
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                            : isDark ? 'bg-neutral-800 text-neutral-500 border border-neutral-700/50 cursor-not-allowed' : 'bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {lang === 'vi' ? `Tất Toán ($${loan.remainingPrincipal.toLocaleString()})` : `Repay ($${loan.remainingPrincipal.toLocaleString()})`}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Loan Packages */}
          <div className="space-y-3">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
              {lang === 'vi' ? 'Chọn Gói Tín Dụng Cần Giải Ngân' : 'Available Loan Packages'}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {LOAN_PACKAGES.map((pkg) => (
                <div
                  key={pkg.amount}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                    isDark ? 'bg-neutral-800/40 border-neutral-700/60 hover:border-neutral-600' : 'bg-neutral-50 border-neutral-200 hover:border-neutral-300 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{lang === 'vi' ? pkg.nameVi : pkg.nameEn}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${pkg.tagColor}`}>
                        {lang === 'vi' ? pkg.tagVi : pkg.tagEn}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed max-w-md ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {lang === 'vi' ? pkg.descVi : pkg.descEn}
                    </p>
                    <div className="text-xs text-amber-500 font-medium pt-0.5">
                      {lang === 'vi' ? 'Lãi suất: ' : 'Interest rate: '}<span className="font-bold">{(pkg.rate * 100).toFixed(0)}%{lang === 'vi' ? '/tuần' : '/wk'}</span> (${pkg.weeklyInterest.toLocaleString()}{lang === 'vi' ? '/tuần' : '/wk'})
                    </div>
                  </div>

                  <button
                    onClick={() => onTakeLoan(pkg.amount)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 font-sans tracking-wide transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    {lang === 'vi' ? `Vay +$${pkg.amount.toLocaleString()}` : `Borrow +$${pkg.amount.toLocaleString()}`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy Tip */}
          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-2.5 ${
            isDark ? 'bg-blue-950/30 border-blue-800/40 text-blue-300/90' : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            <AlertCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">{lang === 'vi' ? 'Chiến lược tài chính:' : 'Financial Strategy:'}</span>{' '}
              {lang === 'vi'
                ? 'Khoản vay là công cụ đắc lực khi các ga trọng điểm có nguy cơ quá tải trong khi bạn đang thiếu kinh phí mua tàu hoặc mở tuyến. Khi giải quyết xong đợt cao điểm và thu về tiền vé dồi dào, hãy chủ động tất toán sớm để tránh bị trừ lãi mỗi tuần!'
                : 'Loans provide essential liquidity when vital stations risk overcrowding and funds are short. Once peak passenger flow is managed and ticket revenues accumulate, repay early to avoid weekly interest charges!'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex justify-end ${
          isDark ? 'border-neutral-800 bg-neutral-950/40' : 'border-neutral-200 bg-neutral-50'
        }`}>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              isDark ? 'text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700' : 'text-neutral-700 hover:text-neutral-900 bg-neutral-200 hover:bg-neutral-300'
            }`}
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
