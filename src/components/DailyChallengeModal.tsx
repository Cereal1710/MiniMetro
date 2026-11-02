import React from 'react';
import { DailyChallenge } from '../types/game';
import { Target, Award, CheckCircle, Gift, Sparkles, X } from 'lucide-react';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenges: DailyChallenge[];
  onClaimReward: (challengeId: string) => void;
}

const MASTER_TITLES = [
  {
    title: 'Kiến Trúc Sư Đại Đô Thị',
    desc: 'Thiết kế mạng lưới tàu điện kết nối đồng bộ trên 15 nhà ga đô thị.',
    icon: '🏛️',
    status: 'Đã Đạt'
  },
  {
    title: 'Bậc Thầy Giao Thông Liên Vận',
    desc: 'Kết nối liên hoàn giữa tuyến Metro nội đô và Cảng hàng không Quốc tế.',
    icon: '✈️',
    status: 'Đang Thực Hiện'
  },
  {
    title: 'Thị Trưởng Vì Dân',
    desc: 'Duy trì chỉ số hài lòng của cư dân thành phố (CSI) ổn định trên 90%.',
    icon: '👑',
    status: 'Xuất Sắc'
  }
];

export const DailyChallengeModal: React.FC<DailyChallengeModalProps> = ({
  isOpen,
  onClose,
  challenges,
  onClaimReward
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ maxWidth: '42rem' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                Nhiệm Vụ & Thành Tựu Đô Thị
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Hàng Ngày
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Hoàn thành mục tiêu vận hành để nhận khoản tài trợ đặc biệt từ Hội đồng Thành phố
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto overflow-x-hidden p-6 space-y-6">
          {/* Active Challenges List */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Mục Tiêu Vận Hành Hôm Nay
            </h3>

            <div className="space-y-3">
              {challenges.map((challenge) => {
                const progressPct = Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100));
                return (
                  <div
                    key={challenge.id}
                    className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl select-none mt-0.5">{challenge.icon}</div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-2">
                            {challenge.titleVi}
                            {challenge.rewardClaimed && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-700 text-slate-300">
                                Đã Nhận
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">{challenge.descVi}</p>
                        </div>
                      </div>

                      {challenge.isCompleted && !challenge.rewardClaimed ? (
                        <button
                          onClick={() => onClaimReward(challenge.id)}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans tracking-wide transition-all shadow-md active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5 animate-pulse"
                        >
                          <Gift className="w-3.5 h-3.5" />
                          Nhận +${challenge.reward.toLocaleString()}
                        </button>
                      ) : (
                        <div className="text-xs font-bold text-emerald-400 shrink-0 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
                          +${challenge.reward.toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>Tiến độ</span>
                        <span>
                          {challenge.currentValue} / {challenge.targetValue} ({progressPct}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${
                            challenge.isCompleted ? 'bg-emerald-400' : 'bg-purple-500'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Master Titles Showcase */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Danh Hiệu Thị Trưởng Vận Hành
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {MASTER_TITLES.map((t, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/50 flex flex-col justify-between space-y-2"
                >
                  <div>
                    <div className="text-2xl mb-1.5">{t.icon}</div>
                    <div className="font-bold text-white text-xs leading-snug">{t.title}</div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{t.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-400 pt-1">
                    <CheckCircle className="w-3 h-3" /> {t.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
