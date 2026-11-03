import React, { useState } from 'react';
import {
  X,
  Building2,
  Clock,
  Check,
  Train as TrainIcon,
  Sliders,
  AlertCircle,
  TrendingUp,
  Activity,
  Users,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  Pencil
} from 'lucide-react';
import { MetroLine, Station, Train } from '../types/game';

interface LineSettingsModalProps {
  line: MetroLine;
  stations: Station[];
  trains: Train[];
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
  onSave: (lineId: string, depotStationId: string, dispatchIntervalSeconds: number) => void;
  onRenameLine?: (lineId: string, newName: string) => void;
  onToggleCBTC?: (lineId: string) => void;
  onUpgradeStationSmartIC?: (stationId: string) => void;
}

const SHORT_DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SHORT_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const LineSettingsModal: React.FC<LineSettingsModalProps> = ({
  line,
  stations,
  trains,
  theme,
  lang,
  onClose,
  onSave,
  onRenameLine,
  onToggleCBTC,
  onUpgradeStationSmartIC
}) => {
  const isDark = theme === 'dark';
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(line.name);

  // Active tab state: 'settings' (Cài đặt) or 'performance' (Hiệu suất)
  const [activeTab, setActiveTab] = useState<'settings' | 'performance'>('settings');

  // Default depot to line's configured depot or first station in route
  const defaultDepotId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
    ? line.depotStationId
    : line.stationIds[0] || '';

  const [selectedDepotId, setSelectedDepotId] = useState<string>(defaultDepotId);
  const [dispatchInterval, setDispatchInterval] = useState<number>(line.dispatchIntervalSeconds || 10);

  const trainsOnLine = trains.filter(t => t.lineId === line.id);
  const dockedCount = trainsOnLine.filter(t => t.isDockedAtDepot).length;
  const runningCount = trainsOnLine.length - dockedCount;

  // -------------------------------------------------------------
  // Performance Analytics Calculations for this line
  // -------------------------------------------------------------
  const now = Date.now();
  const lineStations = line.stationIds.map(id => stationMap.get(id)).filter(Boolean) as Station[];

  // 1. Passengers metrics
  const todayPassengers = line.stats?.todayPassengers || 0;
  const totalPassengers = line.stats?.totalPassengers || todayPassengers;
  const dailyHistory = line.stats?.dailyPassengers || [];

  // Build 7-day display: pad with past entries or zeros
  const past7Days = Array.from({ length: 7 }).map((_, idx) => {
    // idx 6 is today, idx 0-5 are past days
    const histIdx = dailyHistory.length - (7 - idx);
    const count = histIdx >= 0 ? dailyHistory[histIdx] : (idx === 6 ? todayPassengers : 0);
    return {
      dayLabel: lang === 'vi' ? SHORT_DAYS_VI[idx] : SHORT_DAYS_EN[idx],
      count,
      isToday: idx === 6
    };
  });
  const maxDayCount = Math.max(1, ...past7Days.map(d => d.count));

  // 2. Average wait time calculation
  const stationWaitStats = lineStations.map(st => {
    const waitTimes = st.passengers.map(p => Math.max(0.5, (now - p.spawnTime) / 1000));
    const avgStationWait = waitTimes.length > 0
      ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length
      : 0;
    return {
      station: st,
      passengerCount: st.passengers.length,
      avgWaitSeconds: avgStationWait,
      isOvercrowded: st.isOvercrowded
    };
  });

  let avgWaitSeconds = 0;
  if (line.stats && line.stats.totalWaitTimeSamples > 0) {
    avgWaitSeconds = line.stats.totalWaitTimeSeconds / line.stats.totalWaitTimeSamples;
  } else {
    const activeWaitTimes = stationWaitStats.filter(s => s.avgWaitSeconds > 0).map(s => s.avgWaitSeconds);
    avgWaitSeconds = activeWaitTimes.length > 0
      ? activeWaitTimes.reduce((a, b) => a + b, 0) / activeWaitTimes.length
      : 8.5; // realistic nominal default
  }

  // Find the busiest station on this line
  const busiestStation = [...stationWaitStats].sort((a, b) => b.passengerCount - a.passengerCount)[0] || null;

  // 3. Congestion & Headway Holds
  const congestionStopsCount = line.stats?.congestionStopsCount || 0;
  const congestionRating = congestionStopsCount === 0
    ? 'good'
    : congestionStopsCount <= 6
    ? 'medium'
    : 'high';

  const handleSave = () => {
    onSave(line.id, selectedDepotId, dispatchInterval);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-lg max-h-[92dvh] flex flex-col rounded-3xl border shadow-2xl relative overflow-hidden transition-all ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-neutral-300 text-slate-900'
        }`}
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-linear-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: line.color, color: line.textColor }}
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-md shrink-0"
            >
              🏢
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={nameInput}
                      maxLength={30}
                      autoFocus
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const trimmed = nameInput.trim();
                          if (trimmed && onRenameLine) {
                            onRenameLine(line.id, trimmed);
                          }
                          setIsEditingName(false);
                        } else if (e.key === 'Escape') {
                          setNameInput(line.name);
                          setIsEditingName(false);
                        }
                      }}
                      onBlur={() => {
                        const trimmed = nameInput.trim();
                        if (trimmed && onRenameLine) {
                          onRenameLine(line.id, trimmed);
                        }
                        setIsEditingName(false);
                      }}
                      className="px-2 py-0.5 text-sm font-bold rounded bg-slate-900 border border-amber-400 text-white focus:outline-hidden w-40 shadow-inner"
                      placeholder={lang === 'vi' ? 'Tên tuyến...' : 'Line name...'}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = nameInput.trim();
                        if (trimmed && onRenameLine) {
                          onRenameLine(line.id, trimmed);
                        }
                        setIsEditingName(false);
                      }}
                      className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 group/modalname">
                    <span
                      className="cursor-pointer hover:text-amber-300 transition-colors"
                      title={lang === 'vi' ? 'Bấm để đổi tên tuyến' : 'Click to rename line'}
                      onClick={() => {
                        setNameInput(line.name);
                        setIsEditingName(true);
                      }}
                    >
                      {nameInput}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNameInput(line.name);
                        setIsEditingName(true);
                      }}
                      title={lang === 'vi' ? 'Đổi tên tuyến' : 'Rename line'}
                      className="p-1 rounded opacity-60 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-amber-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <span
                  style={{ backgroundColor: `${line.color}25`, color: line.color }}
                  className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold"
                >
                  {line.stationIds.length} {lang === 'vi' ? 'ga' : 'stations'}
                </span>
                {line.isLoop && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono">
                    Loop
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'vi'
                  ? 'Quản lý Depot, giãn cách xuất bến & phân tích hiệu suất'
                  : 'Manage Depot, headway dispatch & performance metrics'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: 1. Cài đặt & Depot | 2. Hiệu suất */}
        <div className="flex items-center gap-2 p-2 px-4 border-b border-slate-800/60 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? '1. Cài Đặt & Depot' : '1. Settings & Depot'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'performance'
                ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? '2. Hiệu Suất' : '2. Performance'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-950/40 text-emerald-300 text-[10px] font-mono font-bold">
              LIVE
            </span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 scrollbar-thin">
          {/* ========================================================= */}
          {/* TAB 1: SETTINGS & DEPOT                                    */}
          {/* ========================================================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Fleet Status Summary */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-neutral-100 border-neutral-200'
              }`}>
                <div className="flex items-center gap-2">
                  <TrainIcon className="w-4 h-4 text-cyan-400" />
                  <span className="font-semibold">{lang === 'vi' ? 'Đoàn tàu trên tuyến:' : 'Line fleet:'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[11px] border border-emerald-500/30">
                    {runningCount} {lang === 'vi' ? 'đang chạy' : 'running'}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-[11px] border border-amber-500/30">
                    {dockedCount} {lang === 'vi' ? 'ở Depot' : 'docked'}
                  </span>
                </div>
              </div>

              {/* Section 1: Choose Depot Station */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'vi' ? 'Chọn Ga Làm Depot Tuyến' : 'Designated Depot Station'}</span>
                </label>

                {line.stationIds.length === 0 ? (
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {lang === 'vi'
                        ? 'Tuyến chưa có ga nào. Hãy nối các ga trên bản đồ trước!'
                        : 'No stations on this line. Connect stations on map first!'}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
                    {line.stationIds.map((sId, idx) => {
                      const station = stationMap.get(sId);
                      const isDepot = selectedDepotId === sId;
                      const name = station?.name || sId;

                      return (
                        <button
                          key={sId}
                          type="button"
                          onClick={() => setSelectedDepotId(sId)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition flex items-center justify-between cursor-pointer ${
                            isDepot
                              ? 'border-amber-400 bg-amber-500/15 text-amber-300 font-bold ring-1 ring-amber-400/50'
                              : isDark
                              ? 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                              : 'bg-white border-neutral-200 hover:bg-neutral-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] bg-slate-700/60 text-slate-300 shrink-0">
                              {idx + 1}
                            </span>
                            <span className="truncate">{name}</span>
                            {idx === 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 shrink-0">
                                {lang === 'vi' ? 'Đầu tuyến' : 'Start'}
                              </span>
                            )}
                            {idx === line.stationIds.length - 1 && !line.isLoop && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 shrink-0">
                                {lang === 'vi' ? 'Cuối tuyến' : 'End'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {onUpgradeStationSmartIC && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpgradeStationSmartIC(sId);
                                }}
                                disabled={station?.hasSmartIC}
                                title={station?.hasSmartIC ? (lang === 'vi' ? 'Đã lắp thẻ thông minh' : 'Smart IC Installed') : (lang === 'vi' ? 'Nâng cấp cửa thẻ thông minh: Giảm 50% thời gian đón trả khách' : 'Upgrade Contactless Smart IC gate: Cuts dwell time by 50%')}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition ${
                                  station?.hasSmartIC
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                    : 'bg-slate-700/80 hover:bg-emerald-600 text-slate-200 hover:text-white cursor-pointer'
                                }`}
                              >
                                <span>💳</span>
                                <span>{station?.hasSmartIC ? 'IC ✓' : (lang === 'vi' ? 'Lắp IC ($1.2k)' : 'Install IC ($1.2k)')}</span>
                              </button>
                            )}
                            {isDepot && (
                              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 shrink-0">
                                <span>🏢 Depot</span>
                                <Check className="w-3.5 h-3.5" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Section 2: Dispatch Headway Interval */}
              <div className="pt-3 border-t border-slate-800/70">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === 'vi' ? 'Giãn Cách Xuất Bến (Headway)' : 'Dispatch Headway'}</span>
                  </label>
                  <span className="font-mono font-black text-sm text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-lg border border-cyan-500/20">
                    {dispatchInterval}s
                  </span>
                </div>

                <input
                  type="range"
                  min={5}
                  max={60}
                  step={1}
                  value={dispatchInterval}
                  onChange={(e) => setDispatchInterval(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-mono">
                  <span>5s (Dày đặc)</span>
                  <span>10s (Chuẩn)</span>
                  <span>25s (Thưa)</span>
                  <span>60s (Giãn rộng)</span>
                </div>

                <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  💡 {lang === 'vi'
                    ? `Khi bấm "Xuất Depot / Phục Vụ", các đoàn tàu sẽ lần lượt xuất bến cách nhau ${dispatchInterval}s để tránh dồn toa và giảm số lần tàu dừng chờ vì nghẽn.`
                    : `Trains leaving Depot will space ${dispatchInterval}s apart to prevent bunching and reduce headway congestion stops.`}
                </p>
              </div>

              {/* Section 3: CBTC Driverless Signal Automation (Feature 2) */}
              <div className="pt-3 border-t border-slate-800/70">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-sm">
                      📡
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">
                        {lang === 'vi' ? 'Tín Hiệu Tự Hành CBTC (Driverless)' : 'Driverless CBTC Telemetry'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'vi' ? 'Giãn cách an toàn giảm 50% (0.18x), tăng gấp đôi mật độ tàu' : 'Cuts safe buffer by 50% (0.18x), doubles train density'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleCBTC?.(line.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      line.hasCBTC ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {line.hasCBTC ? (lang === 'vi' ? 'Đang Bật ✓' : 'Enabled ✓') : (lang === 'vi' ? 'Nâng cấp ($3,500)' : 'Upgrade ($3,500)')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: PERFORMANCE (HIỆU SUẤT)                            */}
          {/* ========================================================= */}
          {activeTab === 'performance' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Metric 1: Số lượt hành khách vận chuyển theo ngày */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'vi' ? 'Hành Khách Vận Chuyển' : 'Passengers Transported'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'vi' ? 'Sản lượng hành khách do tuyến phục vụ' : 'Passenger volume handled by this line'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                      {todayPassengers.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">{lang === 'vi' ? 'hôm nay' : 'today'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {lang === 'vi' ? 'Tổng:' : 'Total:'} {totalPassengers.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* 7-Day Mini Bar Chart */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>{lang === 'vi' ? 'Lưu lượng theo các ngày trong tuần' : 'Daily Volume (Weekdays)'}</span>
                    <span className="font-mono text-emerald-400">Max: {maxDayCount}</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 pt-1">
                    {past7Days.map((d, i) => {
                      const heightPercent = Math.max(14, Math.round((d.count / maxDayCount) * 100));
                      return (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <div className="w-full h-16 bg-slate-800/40 rounded-lg p-0.5 flex flex-col justify-end items-center relative overflow-hidden">
                            <div
                              style={{ height: `${heightPercent}%`, backgroundColor: line.color }}
                              className="w-full rounded-md transition-all duration-500 opacity-90 hover:opacity-100"
                            />
                            <span className="absolute top-1 text-[9px] font-mono text-slate-300 font-bold">
                              {d.count}
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${
                            d.isToday ? 'text-emerald-400' : 'text-slate-400'
                          }`}>
                            {d.dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Metric 2: Thời gian chờ trung bình tại các ga trên tuyến */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'vi' ? 'Thời Gian Chờ Trung Bình' : 'Average Station Wait Time'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'vi' ? 'Đo lường tại tất cả các ga trên tuyến' : 'Calculated across stations on line'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-mono font-black text-cyan-400">
                      {avgWaitSeconds.toFixed(1)}s
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                      avgWaitSeconds < 15
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : avgWaitSeconds <= 30
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse'
                    }`}>
                      {avgWaitSeconds < 15
                        ? (lang === 'vi' ? '🟢 Nhanh (<15s)' : '🟢 Fast')
                        : avgWaitSeconds <= 30
                        ? (lang === 'vi' ? '🟡 Ổn định' : '🟡 Moderate')
                        : (lang === 'vi' ? '🔴 Chờ lâu (>30s)' : '🔴 High Wait')}
                    </span>
                  </div>
                </div>

                {/* Busiest Station Highlight */}
                {busiestStation && (
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📍</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {lang === 'vi' ? 'Ga tập trung đông khách nhất' : 'Highest demand station'}
                        </span>
                        <span className="font-bold text-white">{busiestStation.station.name}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-amber-400 text-xs">
                        {busiestStation.passengerCount} {lang === 'vi' ? 'khách đang đợi' : 'waiting'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        ~{busiestStation.avgWaitSeconds.toFixed(1)}s {lang === 'vi' ? 'chờ' : 'wait'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Metric 3: Số lần tàu phải dừng chờ vì nghẽn */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                      congestionRating === 'good'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : congestionRating === 'medium'
                        ? 'bg-amber-500/15 text-amber-400'
                        : 'bg-rose-500/15 text-rose-400 animate-pulse'
                    }`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {lang === 'vi' ? 'Dừng Chờ Do Nghẽn Tuyến' : 'Headway Congestion Stops'}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {lang === 'vi' ? 'Số lần tàu giảm tốc/dừng chờ cự ly an toàn' : 'Times trains braked for distance safety'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base sm:text-lg font-mono font-black text-amber-400">
                      {congestionStopsCount} {lang === 'vi' ? 'lần' : 'times'}
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                      congestionRating === 'good'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : congestionRating === 'medium'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}>
                      {congestionRating === 'good'
                        ? (lang === 'vi' ? '🟢 Lưu thông tốt' : '🟢 Smooth')
                        : congestionRating === 'medium'
                        ? (lang === 'vi' ? '🟡 Ùn ứ nhẹ' : '🟡 Mild Hold')
                        : (lang === 'vi' ? '🔴 Dồn toa thường xuyên' : '🔴 Congested')}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
                  💡 {congestionRating === 'good' ? (
                    lang === 'vi'
                      ? 'Tuyệt vời! Khoảng cách giữa các đoàn tàu đang được duy trì rất đều đặn, không bị nghẽn.'
                      : 'Great! Fleet spacing is well maintained without train bunching.'
                  ) : (
                    lang === 'vi'
                      ? 'Gợi ý tối ưu: Hãy sang tab "Cài Đặt & Depot" và tăng Giãn Cách Xuất Bến lên 15s-25s để các đoàn tàu không đuổi sát nhau.'
                      : 'Optimization tip: Switch to "Settings & Depot" tab and increase headway interval to 15s-25s to avoid train bunching.'
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 flex items-center justify-between gap-2 bg-slate-950/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{lang === 'vi' ? 'Tự động tính toán thời gian thực' : 'Real-time telemetry'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            >
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </button>

            {activeTab === 'settings' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={line.stationIds.length > 0 && !selectedDepotId}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Lưu Cài Đặt' : 'Save Settings'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
