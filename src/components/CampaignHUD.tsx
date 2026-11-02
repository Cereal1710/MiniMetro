import React, { useState } from 'react';
import { Target, Flag, Clock, Award, Info, AlertTriangle, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { CampaignState } from '../types/game';
import { CAMPAIGN_SCENARIOS } from '../data/campaignScenarios';

interface CampaignHUDProps {
  campaignState: CampaignState;
  money: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onRestartScenario: () => void;
  onExitCampaign: () => void;
}

export const CampaignHUD: React.FC<CampaignHUDProps> = ({
  campaignState,
  money,
  theme,
  lang,
  onRestartScenario,
  onExitCampaign
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const scenario = CAMPAIGN_SCENARIOS.find(s => s.id === campaignState.scenarioId) || CAMPAIGN_SCENARIOS[0];
  const isDark = theme === 'dark';

  const progressPercent = Math.min(100, Math.round((campaignState.currentDelivered / campaignState.targetPassengers) * 100));
  const isBudgetScenario = campaignState.scenarioId === 'budget_master';
  const budgetTarget = 3500;
  const budgetProgress = Math.min(100, Math.round((money / budgetTarget) * 100));

  const daysLeft = Math.max(0, campaignState.timeLimitDays - campaignState.currentDay + 1);

  return (
    <div className={`fixed top-15 sm:top-18 right-2 sm:right-4 z-30 max-w-sm w-[92vw] sm:w-88 rounded-2xl border shadow-2xl backdrop-blur-md transition-all select-none ${
      isDark ? 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/20' : 'bg-white/95 border-amber-400 text-slate-900 shadow-xl'
    }`}>
      {/* Header with Title and Minimize */}
      <div className="p-3 border-b border-amber-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <span>{lang === 'vi' ? 'MỤC TIÊU CHIẾN DỊCH' : 'CAMPAIGN MISSION'}</span>
            </div>
            <div className="text-xs font-bold line-clamp-1">
              {lang === 'vi' ? scenario.titleVi : scenario.titleEn}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(v => !v)}
            className="p-1.5 rounded-lg hover:bg-neutral-800/40 text-neutral-400 hover:text-white transition cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Progress Bar & Counters */}
      <div className="p-3 space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <span className="flex items-center gap-1.5">
              <span>👥</span>
              <span>{lang === 'vi' ? 'Hành khách vận chuyển:' : 'Pax Delivered:'}</span>
            </span>
            <span className="font-mono text-amber-400 font-black">
              {campaignState.currentDelivered} / {campaignState.targetPassengers} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full h-2.5 rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden relative">
            <div
              className="h-full bg-linear-to-r from-amber-500 via-orange-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Optional Budget Requirement */}
        {isBudgetScenario && (
          <div>
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <span>💰</span>
                <span>{lang === 'vi' ? 'Ngân sách tích lũy:' : 'Budget Target:'}</span>
              </span>
              <span className="font-mono text-emerald-400 font-black">
                ${money.toLocaleString()} / ${budgetTarget.toLocaleString()} ({budgetProgress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 border border-slate-700/60 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: `${budgetProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Time Limit Badge */}
        <div className="flex items-center justify-between text-[11px] font-semibold pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'vi' ? 'Thời hạn hoàn thành:' : 'Deadline:'}</span>
          </span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${
            daysLeft <= 1 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800 text-amber-300'
          }`}>
            {lang === 'vi' ? `Ngày ${campaignState.currentDay}/${campaignState.timeLimitDays}` : `Day ${campaignState.currentDay}/${campaignState.timeLimitDays}`}
          </span>
        </div>

        {/* Collapsible Details */}
        {isExpanded && (
          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-[11px] animate-in fade-in duration-150">
            <div className="text-slate-300 italic">
              {lang === 'vi' ? scenario.descriptionVi : scenario.descriptionEn}
            </div>

            <div className="space-y-1 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
              <div className="font-bold text-amber-400 flex items-center gap-1 text-[10px] uppercase">
                <Info className="w-3 h-3" />
                <span>{lang === 'vi' ? 'Quy tắc đặc biệt:' : 'Special Rules:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300 text-[10px]">
                {(lang === 'vi' ? scenario.specialRulesVi : scenario.specialRulesEn).map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onRestartScenario}
                className="flex-1 py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Thử lại màn này' : 'Restart'}</span>
              </button>

              <button
                onClick={onExitCampaign}
                className="py-1.5 px-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 text-xs font-semibold border border-red-500/30 transition cursor-pointer"
              >
                {lang === 'vi' ? 'Thoát' : 'Exit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
