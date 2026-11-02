import React from 'react';
import { X, MousePointer, Train, AlertTriangle, Award, CheckCircle2 } from 'lucide-react';

interface TutorialModalProps {
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  theme,
  lang,
  onClose
}) => {
  const isDark = theme === 'dark';

  const steps = [
    {
      step: '01',
      titleVi: 'Kéo Chuột Xây Tuyến Đường',
      titleEn: 'Drag to Connect Stations',
      descVi: 'Nhấp hoặc kéo chuột giữa các nhà ga để kết nối thành tuyến tàu điện ngầm. Tuyến có thể tạo thành vòng tròn khép kín.',
      descEn: 'Click or drag between stations to connect them into a metro route. Lines can also form closed loops.',
      icon: <MousePointer className="w-5 h-5 text-emerald-400" />
    },
    {
      step: '02',
      titleVi: 'Vận Chuyển Theo Biểu Tượng',
      titleEn: 'Transport by Shape Match',
      descVi: 'Mỗi hành khách có hình dạng mong muốn (●, ▲, ■, ◆, ★). Tàu tự động đón khách và thả tại ga có hình dạng tương ứng.',
      descEn: 'Each commuter has a destination shape (●, ▲, ■, ◆, ★). Trains automatically pick them up and drop them off at matching stations.',
      icon: <Train className="w-5 h-5 text-purple-400" />
    },
    {
      step: '03',
      titleVi: 'Chuyển Tuyến & Trung Chuyển',
      titleEn: 'Line Transfers & Hubs',
      descVi: 'Nếu một tuyến không đi qua ga mục tiêu, khách sẽ tự động xuống ga chung để chuyển sang tuyến khác. Nhấp vào ga để nâng cấp thành Ga Trung Chuyển (sức chứa 14 khách).',
      descEn: 'Commuters automatically transfer between lines at shared stations. Click a station to upgrade it to an Interchange Hub (14 capacity).',
      icon: <CheckCircle2 className="w-5 h-5 text-blue-400" />
    },
    {
      step: '04',
      titleVi: 'Chống Ùn Tắc & Nhận Thưởng',
      titleEn: 'Prevent Overcrowding & Upgrade',
      descVi: 'Đừng để ga bị đầy khách quá lâu (vòng đỏ sẽ đếm ngược!). Cuối mỗi tuần (Chủ Nhật), bạn sẽ được chọn gói viện trợ gồm tàu, tuyến mới và nâng cấp!',
      descEn: 'Do not let stations stay overcrowded too long (red timer counts down!). Every Sunday, claim weekly grants with new trains and lines!',
      icon: <AlertTriangle className="w-5 h-5 text-amber-400" />
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`w-full max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl p-5 sm:p-6 md:p-8 border shadow-2xl relative scrollbar-thin ${
        isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-neutral-500/20 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest text-emerald-500 uppercase">
            {lang === 'vi' ? 'HƯỚNG DẪN QUẢN LÝ GIAO THÔNG' : 'METRO OPERATIONS GUIDE'}
          </span>
          <h2 className="text-2xl font-black mt-1">
            {lang === 'vi' ? 'Cách Vận Hành Mạng Lưới' : 'How to Run Your Network'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isDark ? 'bg-neutral-800/40 border-neutral-700/70' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-emerald-500">{st.step}</span>
                  <div className="p-1.5 rounded-lg bg-neutral-700/30">
                    {st.icon}
                  </div>
                </div>
                <h3 className="font-bold text-sm mb-1">
                  {lang === 'vi' ? st.titleVi : st.titleEn}
                </h3>
                <p className="text-xs opacity-70 leading-relaxed">
                  {lang === 'vi' ? st.descVi : st.descEn}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Shortcuts */}
        <div className={`p-3 rounded-xl border mb-6 text-xs flex items-center justify-around opacity-80 ${
          isDark ? 'bg-neutral-800/30 border-neutral-700/50' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-700 font-mono text-white text-[10px]">Space</kbd> {lang === 'vi' ? 'Tạm dừng/Chạy' : 'Pause/Play'}</div>
          <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-700 font-mono text-white text-[10px]">1-3</kbd> {lang === 'vi' ? 'Đổi tốc độ' : 'Speed 1x-3x'}</div>
          <div><kbd className="px-1.5 py-0.5 rounded bg-neutral-700 font-mono text-white text-[10px]">Esc</kbd> {lang === 'vi' ? 'Đóng cửa sổ' : 'Close'}</div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow transition cursor-pointer"
        >
          {lang === 'vi' ? 'Đã Hiểu, Bắt Đầu Điều Hành!' : 'Got it, Let’s Build!'}
        </button>
      </div>
    </div>
  );
};
