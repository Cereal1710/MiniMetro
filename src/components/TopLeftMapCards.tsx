import React, { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  TrendingUp,
  AlertTriangle,
  CloudSun,
  X
} from 'lucide-react';
import {
  Station,
  Train,
  MetroLine,
  GameStats,
  WeatherState,
  UrbanIncident,
  WeatherType
} from '../types/game';
import { PassengerAnalyticsCard } from './PassengerAnalyticsCard';

interface TopLeftMapCardsProps {
  stations: Station[];
  trains: Train[];
  lines: MetroLine[];
  stats?: GameStats;
  currentDayIndex?: number;
  weather?: WeatherState;
  activeIncident?: UrbanIncident | null;
  isRushHour?: boolean;
  money?: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onDismissIncident?: () => void;
  onRepairTrain?: (trainId: string) => void;
  onDeploySecurity?: (stationId: string) => void;
}

export const TopLeftMapCards: React.FC<TopLeftMapCardsProps> = ({
  stations,
  trains,
  lines,
  stats,
  currentDayIndex = 0,
  weather,
  activeIncident,
  isRushHour = false,
  money = 0,
  theme,
  lang,
  onDismissIncident,
  onRepairTrain,
  onDeploySecurity
}) => {
  const isDark = theme === 'dark';

  // Active expanded card tab: null | 'analytics' | 'weather'
  const [activeTab, setActiveTab] = useState<'analytics' | 'weather' | null>(() => {
    try {
      const saved = localStorage.getItem('mini_metro_map_hud_active_tab');
      if (saved === 'analytics' || saved === 'weather') return saved;
      return null;
    } catch {
      return null;
    }
  });

  const [isHudVisible, setIsHudVisible] = useState<boolean>(true);

  useEffect(() => {
    try {
      if (activeTab) {
        localStorage.setItem('mini_metro_map_hud_active_tab', activeTab);
      } else {
        localStorage.removeItem('mini_metro_map_hud_active_tab');
      }
    } catch {}
  }, [activeTab]);

  // Weather configuration
  const weatherType = weather?.current || weather?.type || 'sunny';
  const weatherIcons: Record<WeatherType, { icon: string; color: string; labelVi: string; labelEn: string }> = {
    sunny: { icon: '☀️', color: 'text-amber-400', labelVi: 'Nắng ráo', labelEn: 'Sunny' },
    rainy: { icon: '🌧️', color: 'text-sky-400', labelVi: 'Mưa rào (+35%)', labelEn: 'Rain (+35%)' },
    storm: { icon: '⛈️', color: 'text-indigo-400', labelVi: 'Giông bão (-20% tốc độ)', labelEn: 'Storm (-20% speed)' },
    flooded: { icon: '🌊', color: 'text-cyan-400', labelVi: 'Ngập úng', labelEn: 'Flooded' }
  };
  const currentWeatherInfo = weatherIcons[weatherType] || weatherIcons.sunny;

  const toggleTab = (tab: 'analytics' | 'weather') => {
    setActiveTab(prev => (prev === tab ? null : tab));
  };

  const expoStation = stations.find(s => s.isExpoCentre);

  return (
    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-30 flex flex-col gap-2 max-w-sm w-[92vw] sm:w-80 pointer-events-none select-none transition-all">
      {/* Sleek Floating Glass Pill Dock */}
      <div className={`pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-2xl shadow-xl border backdrop-blur-xl transition-all w-fit max-w-full overflow-x-auto scrollbar-none ${
        isDark
          ? 'bg-[#252528]/95 border-[#38383e] text-neutral-200'
          : 'bg-[#FAF9F6]/95 border-[#E2E0D8] text-neutral-800'
      }`}>
        {/* Toggle HUD visibility eye */}
        <button
          type="button"
          onClick={() => setIsHudVisible(v => !v)}
          className={`p-1.5 rounded-xl transition cursor-pointer shrink-0 ${
            isDark ? 'hover:bg-white/10 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
          }`}
          title={isHudVisible ? (lang === 'vi' ? 'Ẩn thanh tiện ích' : 'Hide HUD') : (lang === 'vi' ? 'Hiện thanh tiện ích' : 'Show HUD')}
        >
          {isHudVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {isHudVisible && (
          <>
            <div className={`h-4 w-px shrink-0 ${isDark ? 'bg-[#38383e]' : 'bg-[#E2E0D8]'}`} />

            {/* Chip 1: Passenger Analytics Tab */}
            <button
              type="button"
              onClick={() => toggleTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeTab === 'analytics'
                  ? isDark
                    ? 'bg-[#3b82f6]/20 text-[#38bdf8] border border-[#3b82f6]/40 shadow-xs'
                    : 'bg-[#3b82f6]/10 text-[#2563eb] border border-[#3b82f6]/30 shadow-xs'
                  : isDark
                  ? 'hover:bg-white/10 text-neutral-300 hover:text-white'
                  : 'hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900'
              }`}
              title={lang === 'vi' ? 'Biểu đồ hành khách' : 'Passenger Flow'}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-emerald-400">+{stats?.todayPassengers ?? 0}</span>
              {activeTab === 'analytics' ? (
                <ChevronUp className="w-3 h-3 opacity-60 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-40 shrink-0" />
              )}
            </button>

            {/* Chip 3: Weather & Incidents Tab */}
            <button
              type="button"
              onClick={() => toggleTab('weather')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                activeIncident
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                  : activeTab === 'weather'
                  ? isDark
                    ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/40 shadow-xs'
                    : 'bg-cyan-50 text-cyan-900 border border-cyan-300 shadow-xs'
                  : isDark
                  ? 'hover:bg-slate-800/70 text-slate-300 hover:text-white'
                  : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
              title={lang === 'vi' ? 'Thời tiết đô thị' : 'City Weather'}
            >
              {activeIncident ? (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              ) : (
                <span className="text-xs leading-none shrink-0">{currentWeatherInfo.icon}</span>
              )}
              <span className="font-mono">{weather?.temperature || 31}°C</span>
              {activeTab === 'weather' ? (
                <ChevronUp className="w-3 h-3 opacity-60 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-40 shrink-0" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Expo Week Active Banner (Feature 28) */}
      {isHudVisible && expoStation && (
        <div className={`pointer-events-auto p-2.5 rounded-xl border backdrop-blur-xl flex items-center justify-between gap-2 shadow-lg transition-all ${
          isDark
            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200 shadow-amber-950/30'
            : 'bg-amber-50/95 border-amber-300 text-amber-900 shadow-amber-100'
        }`}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">🌟</span>
            <div className="min-w-0">
              <div className="font-bold text-xs truncate flex items-center gap-1.5">
                <span>{lang === 'vi' ? 'Tuần Lễ Hội Chợ Triển Lãm' : 'Expo Week'}</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono font-bold">
                  {expoStation.expoRemainingDays || 7}d
                </span>
              </div>
              <div className="text-[10px] opacity-80 truncate">
                {expoStation.name} • {lang === 'vi' ? 'Thưởng $15,000 khi kết thúc' : '$15,000 completion reward'}
              </div>
            </div>
          </div>
          <span className="font-mono text-[11px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
            +220%
          </span>
        </div>
      )}

      {/* Expanded Floating Popover Card (Single-elevation, clean, uncluttered) */}
      {isHudVisible && activeTab && (
        <div className={`pointer-events-auto rounded-2xl border shadow-2xl backdrop-blur-xl p-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150 transition-all overflow-hidden ${
          isDark
            ? 'bg-slate-950/92 border-slate-800 text-slate-200 shadow-black/60'
            : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
        }`}>
          {/* Card Top Header with Close Button */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
            <div className="flex items-center gap-2">
              {activeTab === 'analytics' && (
                <>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs uppercase tracking-wide text-emerald-400">
                    {lang === 'vi' ? 'Lưu lượng hành khách' : 'Passenger Flow'}
                  </span>
                </>
              )}
              {activeTab === 'weather' && (
                <>
                  <CloudSun className="w-4 h-4 text-cyan-400" />
                  <span className="font-bold text-xs uppercase tracking-wide text-cyan-400">
                    {lang === 'vi' ? 'Thời tiết đô thị' : 'City Weather'}
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab(null)}
              className="p-1 rounded-lg hover:bg-slate-800/60 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TAB 1: PASSENGER ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-2">
              <PassengerAnalyticsCard
                stats={stats}
                currentDayIndex={currentDayIndex}
                theme={theme}
                lang={lang}
              />
            </div>
          )}

          {/* TAB 3: CITY WEATHER & INCIDENTS */}
          {activeTab === 'weather' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{lang === 'vi' ? 'Hiện trạng:' : 'Condition:'}</span>
                <span className="font-semibold text-slate-200">
                  {lang === 'vi' ? currentWeatherInfo.labelVi : currentWeatherInfo.labelEn}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {lang === 'vi' ? weather?.descriptionVi || 'Trời nắng ráo' : weather?.descriptionEn || 'Sunny & Clear'}
              </p>

              {/* Active Incident Resolution */}
              {activeIncident && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{lang === 'vi' ? activeIncident.titleVi : activeIncident.titleEn}</span>
                    </span>
                    <span className="font-mono text-[10px] text-amber-300">
                      {Math.ceil(activeIncident.remainingSeconds)}s
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-tight">
                    {lang === 'vi' ? activeIncident.descriptionVi : activeIncident.descriptionEn}
                  </p>

                  <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                    {activeIncident.affectedTrainId && onRepairTrain && (
                      <button
                        type="button"
                        onClick={() => onRepairTrain(activeIncident.affectedTrainId!)}
                        disabled={money < 400}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                          money >= 400
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <span>🛠️</span>
                        <span>{lang === 'vi' ? 'Sửa Tàu ($400)' : 'Repair ($400)'}</span>
                      </button>
                    )}

                    {activeIncident.affectedStationIds && activeIncident.affectedStationIds.length > 0 && onDeploySecurity && (
                      <button
                        type="button"
                        onClick={() => onDeploySecurity(activeIncident.affectedStationIds[0])}
                        disabled={money < 300}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border ${
                          money >= 300
                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-400'
                            : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                        }`}
                      >
                        <span>👮</span>
                        <span>{lang === 'vi' ? 'An Ninh ($300)' : 'Security ($300)'}</span>
                      </button>
                    )}

                    {onDismissIncident && (
                      <button
                        type="button"
                        onClick={onDismissIncident}
                        className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold transition cursor-pointer border border-amber-500/30"
                      >
                        {lang === 'vi' ? 'Khắc phục' : 'Dismiss'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
