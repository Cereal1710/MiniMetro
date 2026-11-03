import React from 'react';
import { GameStats } from '../types/game';

interface GameOverModalProps {
  reason: string | null;
  stats: GameStats;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onRestart: () => void;
  onSwitchToEndless: () => void;
  onSwitchToCreative: () => void;
  onOpenMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  lang,
  onRestart,
  onSwitchToEndless,
  onSwitchToCreative,
  onOpenMenu
}) => {
  return (
    <div className="fixed inset-0 z-50 pointer-events-auto flex flex-col justify-between items-center p-6 sm:p-10 md:p-14 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300 select-none">
      {/* Top Header: Authentic Mini Metro Game Over Title & Stats */}
      <div className="text-center mt-6 sm:mt-10 max-w-2xl px-4 animate-in slide-in-from-top-4 duration-500">
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tight drop-shadow-lg">
          Game Over
        </h1>

        <div className="w-16 h-1 bg-[#3b82f6] mx-auto my-5 rounded-full" />

        <p className="text-base sm:text-lg md:text-xl text-neutral-200 font-medium leading-relaxed drop-shadow-sm">
          {lang === 'vi'
            ? 'Quá tải hành khách tại ga này đã buộc hệ thống metro phải dừng hoạt động.'
            : 'Overcrowding at this station has forced your metro to close.'}
        </p>

        <p className="mt-3 text-sm sm:text-base text-neutral-300 font-mono font-medium">
          {lang === 'vi'
            ? `${stats.totalPassengersDelivered.toLocaleString()} hành khách đã di chuyển trên mạng lưới của bạn trong ${stats.totalDays} ngày.`
            : `${stats.totalPassengersDelivered.toLocaleString()} passengers traveled on your metro over ${stats.totalDays} days.`}
        </p>
      </div>

      {/* Center/Bottom Action Buttons: Authentic Mini Metro Blue Rectangular Highlight Buttons */}
      <div className="flex flex-col items-center sm:items-start gap-3 w-full max-w-sm mb-6 sm:mb-10 animate-in slide-in-from-bottom-4 duration-500">
        {/* Restart Button */}
        <button
          type="button"
          onClick={onRestart}
          className="w-full flex items-center gap-3.5 px-6 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-98 text-white font-black text-base sm:text-lg tracking-wide shadow-xl transition-all cursor-pointer rounded-2xl"
        >
          <span className="text-xl sm:text-2xl font-mono leading-none">⬉</span>
          <span>{lang === 'vi' ? 'Chơi lại' : 'Restart'}</span>
        </button>

        {/* Continue in Endless Button */}
        <button
          type="button"
          onClick={onSwitchToEndless}
          className="w-full flex items-center gap-3.5 px-6 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-98 text-white font-black text-base sm:text-lg tracking-wide shadow-xl transition-all cursor-pointer rounded-2xl"
        >
          <span className="text-xl sm:text-2xl font-mono leading-none">➜</span>
          <span>{lang === 'vi' ? 'Chế độ Vô tận (Endless)' : 'Continue in Endless'}</span>
        </button>

        {/* Continue in Creative Mode Button */}
        <button
          type="button"
          onClick={onSwitchToCreative}
          className="w-full flex items-center gap-3.5 px-6 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-98 text-white font-black text-base sm:text-lg tracking-wide shadow-xl transition-all cursor-pointer rounded-2xl"
        >
          <span className="text-xl sm:text-2xl font-mono leading-none">➜</span>
          <span>{lang === 'vi' ? 'Chế độ Sáng tạo (Creative)' : 'Continue in Creative Mode'}</span>
        </button>

        {/* Menu Button */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="w-full flex items-center gap-3.5 px-6 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] active:scale-98 text-white font-black text-base sm:text-lg tracking-wide shadow-xl transition-all cursor-pointer rounded-2xl"
        >
          <span className="text-xl sm:text-2xl font-mono leading-none">⬅</span>
          <span>{lang === 'vi' ? 'Menu chính' : 'Main Menu'}</span>
        </button>
      </div>
    </div>
  );
};
