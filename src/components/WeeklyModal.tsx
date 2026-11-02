import React from 'react';
import { Award, Plus, Train, Layers, Star, DollarSign, Check } from 'lucide-react';

interface WeeklyModalProps {
  weekNumber: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onSelectReward: (choiceIndex: number) => void;
}

export const WeeklyModal: React.FC<WeeklyModalProps> = ({
  weekNumber,
  theme,
  lang,
  onSelectReward
}) => {
  const isDark = theme === 'dark';

  const choices = [
    {
      titleVi: 'Gói Mở Rộng Tuyến',
      titleEn: 'Line Expansion Package',
      descVi: '+1 Tuyến đường mới và +1 Đoàn tàu hiện đại',
      descEn: '+1 New Metro Line and +1 Modern Train',
      icons: [<Plus className="w-5 h-5 text-emerald-400" />, <Train className="w-5 h-5 text-purple-400" />],
      color: 'border-emerald-500/40 hover:border-emerald-500'
    },
    {
      titleVi: 'Gói Đội Tàu & Ngân Sách',
      titleEn: 'Fleet Expansion & Funding',
      descVi: '+2 Đoàn tàu mới và +$500 ngân sách thành phố',
      descEn: '+2 New Trains and +$500 city grant budget',
      icons: [<Train className="w-5 h-5 text-purple-400" />, <DollarSign className="w-5 h-5 text-emerald-400" />],
      color: 'border-amber-500/40 hover:border-amber-500'
    },
    {
      titleVi: 'Gói Toa Xe & Tài Trợ',
      titleEn: 'Carriages & Transit Grant',
      descVi: '+1 Đoàn tàu, +1 Toa xe mở rộng sức chứa và +$400 ngân sách',
      descEn: '+1 Train, +1 Extended Carriage and +$400 city grant',
      icons: [<Layers className="w-5 h-5 text-blue-400" />, <DollarSign className="w-5 h-5 text-emerald-400" />],
      color: 'border-blue-500/40 hover:border-blue-500'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
      <div className={`w-full max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl p-5 sm:p-6 md:p-8 border shadow-2xl relative scrollbar-thin ${
        isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Banner icon */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3 shadow-lg">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-xs font-bold tracking-widest text-amber-500 uppercase">
            {lang === 'vi' ? `KẾT THÚC TUẦN ${weekNumber - 1}` : `WEEK ${weekNumber - 1} COMPLETED`}
          </span>
          <h2 className="text-2xl font-black mt-1">
            {lang === 'vi' ? 'Viện Trợ Giao Thông Đô Thị' : 'Urban Transit Investment'}
          </h2>
          <p className="text-xs md:text-sm opacity-70 mt-1 max-w-md">
            {lang === 'vi'
              ? 'Hội đồng thành phố phê duyệt ngân sách tuần mới. Hãy chọn 1 gói trang bị để tối ưu hóa mạng lưới của bạn!'
              : 'The city council approved the new weekly budget. Select 1 equipment package to expand your metro network!'}
          </p>
        </div>

        {/* 3 Choices Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {choices.map((c, idx) => (
            <button
              key={idx}
              onClick={() => onSelectReward(idx)}
              className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:scale-102 ${
                isDark ? 'bg-neutral-800/60' : 'bg-neutral-50'
              } ${c.color}`}
            >
              <div>
                <div className="flex items-center gap-2 mb-3">
                  {c.icons.map((ic, i) => (
                    <div key={i} className="p-1.5 rounded-lg bg-neutral-700/40">
                      {ic}
                    </div>
                  ))}
                </div>
                <h3 className="font-bold text-sm mb-1 group-hover:text-amber-400 transition-colors">
                  {lang === 'vi' ? c.titleVi : c.titleEn}
                </h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  {lang === 'vi' ? c.descVi : c.descEn}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-700/30 flex items-center justify-between text-xs font-bold text-emerald-500">
                <span>{lang === 'vi' ? 'Chọn gói này' : 'Select'}</span>
                <Check className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
