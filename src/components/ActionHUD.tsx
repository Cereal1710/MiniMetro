import React from 'react';
import { Zap, Rocket, Crown, Flame } from 'lucide-react';
import { VipQuestInfo } from '../types/game';

interface ActionHUDProps {
  isFrenzyActive?: boolean;
  frenzyTimer?: number;
  frenzyCombo?: number;
  activeVipQuest?: VipQuestInfo | null;
  onTriggerFrenzy: () => void;
  onBoostAllTrains: () => void;
  onFocusStation?: (stationId: string) => void;
  trainsCount: number;
}

export const ActionHUD: React.FC<ActionHUDProps> = ({
  isFrenzyActive,
  frenzyTimer = 0,
  frenzyCombo = 0,
  activeVipQuest,
  onTriggerFrenzy,
  onBoostAllTrains,
  onFocusStation,
  trainsCount
}) => {
  return (
    <>
      {/* 1. VIP Quest Banner (Top-Center Floating Notification) */}
      {activeVipQuest && (
        <div 
          onClick={() => onFocusStation && onFocusStation(activeVipQuest.stationId)}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-900/90 via-slate-900/95 to-amber-900/90 border-2 border-amber-400 shadow-2xl backdrop-blur-md cursor-pointer hover:scale-105 active:scale-95 transition-all select-none animate-in fade-in slide-in-from-top-4"
          title="Bấm để xem vị trí ga có VIP!"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-xl shrink-0 animate-bounce">
            {activeVipQuest.vipIcon || '👑'}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Khách Quý VIP Đang Chờ
              </span>
              <span className="text-[11px] font-mono font-bold bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md">
                +{activeVipQuest.reward ? `$${activeVipQuest.reward.toLocaleString()}` : '$5,000'}
              </span>
            </div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
              <span>{activeVipQuest.vipName}</span>
              <span className="text-slate-400 font-normal">tại</span>
              <span className="text-amber-200 underline decoration-amber-400/50">Ga {activeVipQuest.stationName}</span>
            </div>
          </div>
          <div className="pl-2 border-l border-amber-500/40 flex flex-col items-center">
            <span className="text-[10px] text-amber-300/80 uppercase font-semibold">Thời hạn</span>
            <span className={`text-base font-mono font-black ${activeVipQuest.timeLeft <= 15 ? 'text-rose-400 animate-pulse' : 'text-amber-300'}`}>
              {Math.ceil(activeVipQuest.timeLeft)}s
            </span>
          </div>
        </div>
      )}

      {/* 2. Floating High-Octane Action Bar (Bottom Center) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 pointer-events-auto select-none">
        {/* Frenzy Rush Button */}
        {isFrenzyActive ? (
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-black shadow-2xl border-2 border-amber-300 animate-pulse">
            <Flame className="w-5 h-5 fill-slate-950 animate-bounce" />
            <div className="flex flex-col text-left leading-tight">
              <span className="text-xs tracking-wider">⚡ FRENZY RUSH: {Math.ceil(frenzyTimer)}s</span>
              <span className="text-[10px] opacity-90">Vé x5 • Combo: x{frenzyCombo} 🔥</span>
            </div>
          </div>
        ) : (
          <button
            onClick={onTriggerFrenzy}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 hover:from-amber-400 to-orange-500 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl border border-amber-300/60 hover:shadow-amber-500/30 transition-all active:scale-95 cursor-pointer"
            title="Kích hoạt 45 giây cao điểm điên cuồng: Lượng khách x4, giá vé x5!"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Kích Hoạt Frenzy (x5 Vé)</span>
          </button>
        )}

        {/* Turbo All Trains Button */}
        <button
          onClick={onBoostAllTrains}
          disabled={trainsCount === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl border transition-all active:scale-95 ${
            trainsCount > 0
              ? 'bg-gradient-to-r from-cyan-600 hover:from-cyan-500 to-blue-600 hover:to-blue-500 text-white border-cyan-400/50 hover:shadow-cyan-500/30 cursor-pointer'
              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
          }`}
          title="Tăng tốc 300% cho toàn bộ đoàn tàu trên bản đồ trong 8 giây (hoặc bấm chuột trực tiếp vào bất kỳ đoàn tàu nào để hú còi và boost riêng lẻ)!"
        >
          <Rocket className="w-4 h-4" />
          <span>Turbo Toàn Tuyến ({trainsCount})</span>
        </button>
      </div>
    </>
  );
};
