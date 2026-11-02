import React from 'react';
import { Trophy, Star, ArrowRight, RotateCcw, CheckCircle2, Sparkles, Home } from 'lucide-react';
import { CampaignState, GameStats } from '../types/game';
import { CAMPAIGN_SCENARIOS } from '../data/campaignScenarios';

interface VictoryModalProps {
  campaignState: CampaignState;
  stats: GameStats;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onNextScenario?: () => void;
  onRestartScenario: () => void;
  onExitToMenu: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  campaignState,
  stats,
  theme,
  lang,
  onNextScenario,
  onRestartScenario,
  onExitToMenu
}) => {
  const scenario = CAMPAIGN_SCENARIOS.find(s => s.id === campaignState.scenarioId);
  const stars = campaignState.starsEarned || 1;
  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-in fade-in duration-300 select-none">
      <div className={`w-full max-w-md max-h-[90dvh] overflow-hidden flex flex-col rounded-3xl border shadow-2xl text-center relative ${
        isDark ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-500/20' : 'bg-white/95 border-amber-400 text-slate-900 shadow-2xl'
      }`}>
        {/* Ambient Top Glow - strictly clipped */}
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="p-5 sm:p-8 overflow-y-auto overflow-x-hidden relative z-10 scrollbar-thin">
          {/* Big Trophy Badge */}
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-linear-to-tr from-amber-500 via-orange-500 to-yellow-400 text-slate-950 flex items-center justify-center shadow-xl animate-bounce">
            <Trophy className="w-10 h-10 fill-current" />
          </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{lang === 'vi' ? 'NHIỆM VỤ HOÀN THÀNH XUẤT SẮC' : 'MISSION ACCOMPLISHED!'}</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">
          {lang === 'vi' ? 'CHIẾN THẮNG KỊCH BẢN!' : 'VICTORY!'}
        </h2>

        <p className="text-xs text-slate-400 mb-5">
          {lang === 'vi' ? scenario?.titleVi : scenario?.titleEn}
        </p>

        {/* Star Rating Display */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3].map((starIdx) => {
            const isEarned = starIdx <= stars;
            return (
              <div
                key={starIdx}
                className={`p-2.5 rounded-2xl transition-all duration-300 ${
                  isEarned
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400 scale-110 shadow-lg'
                    : 'bg-slate-800/40 border border-slate-700/40 text-slate-600'
                }`}
              >
                <Star className={`w-7 h-7 ${isEarned ? 'fill-amber-400' : ''}`} />
              </div>
            );
          })}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2 mb-6 text-left">
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {lang === 'vi' ? 'Hành khách phục vụ' : 'Passengers'}
            </div>
            <div className="text-lg font-black font-mono text-emerald-400">
              {stats.totalPassengersDelivered}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
            <div className="text-[10px] text-slate-400 uppercase font-bold">
              {lang === 'vi' ? 'Thời gian hoàn tất' : 'Time Taken'}
            </div>
            <div className="text-lg font-black font-mono text-amber-400">
              {lang === 'vi' ? `${stats.totalDays} Ngày` : `${stats.totalDays} Days`}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {onNextScenario && (
            <button
              onClick={onNextScenario}
              className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm shadow-xl shadow-emerald-500/20 transition cursor-pointer flex items-center justify-center gap-2 active:scale-98"
            >
              <span>{lang === 'vi' ? 'Kịch bản Tiếp theo' : 'Next Scenario'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onRestartScenario}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Chơi lại màn này' : 'Play Again'}</span>
            </button>

            <button
              onClick={onExitToMenu}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? 'Về Menu chính' : 'Main Menu'}</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};
