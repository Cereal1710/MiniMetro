import React, { useState } from 'react';
import { Shield, Clock, CheckCircle2, AlertTriangle, X, ChevronDown, ChevronUp, UserCheck, ArrowRight, CornerDownRight, Sparkles } from 'lucide-react';
import { InspectorState, Station, Train, MetroLine } from '../types/game';

interface InspectorHUDProps {
  inspectorState: InspectorState;
  stations: Station[];
  trains: Train[];
  lines: MetroLine[];
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onStartSelecting: () => void;
  onAlightAtStation: () => void;
  onCancel: () => void;
}

export const InspectorHUD: React.FC<InspectorHUDProps> = ({
  inspectorState,
  stations,
  trains,
  lines,
  theme,
  lang,
  onStartSelecting,
  onAlightAtStation,
  onCancel
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const isDark = theme === 'dark';

  const {
    status,
    currentStationId,
    currentTrainId,
    visitedStationIds = [],
    plannedStationIds,
    dwellAtStationTimer = 0,
    timeRemaining = 90,
    cooldownRemaining = 0,
    targetCount = 5,
    rewardAmount = 1500,
    failureReason
  } = inspectorState;

  // Format MM:SS
  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // Station map
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  // Resolve current train and station names
  const currentStation = currentStationId ? stationMap.get(currentStationId) : null;
  const currentTrain = currentTrainId ? trains.find(t => t.id === currentTrainId) : null;
  const currentLine = currentTrain ? lines.find(l => l.id === currentTrain.lineId) : null;
  const endStationId = plannedStationIds && plannedStationIds.length > 0 ? plannedStationIds[plannedStationIds.length - 1] : null;
  const endStation = endStationId ? stationMap.get(endStationId) : null;

  // 1. Idle state: Clean canvas
  if (status === 'idle') {
    return null;
  }

  // 2. Selecting station state
  if (status === 'selecting_station') {
    return (
      <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 z-30 select-none w-[94vw] max-w-md animate-in slide-in-from-top-3">
        <div className={`p-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-2.5 ${
          isDark ? 'bg-slate-900/95 border-amber-500/60 text-white' : 'bg-white/95 border-amber-400 text-slate-900 shadow-xl'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center text-lg animate-bounce">
              👮
            </div>
            <div>
              <div className="text-xs font-bold text-amber-500 flex items-center gap-1">
                <span>{lang === 'vi' ? 'XUẤT PHÁT THANH TRA' : 'DEPLOY INSPECTOR'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[9px] font-mono">
                  +${rewardAmount.toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-medium text-slate-300">
                {lang === 'vi'
                  ? 'Chạm vào 1 ga bất kỳ trên bản đồ để bắt đầu!'
                  : 'Click any station on map to start patrol!'}
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer border border-slate-700 active:scale-95"
          >
            {lang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
        </div>
      </div>
    );
  }

  // 3. Completed state
  if (status === 'completed') {
    return (
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30 select-none max-w-xs animate-in zoom-in-95">
        <div className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${
          isDark ? 'bg-slate-900/95 border-emerald-500/60 text-white shadow-emerald-950/30' : 'bg-white/95 border-emerald-400 text-slate-900 shadow-xl'
        }`}>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
              🎉
            </div>
            <div>
              <div className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                {lang === 'vi' ? 'THANH TRA THÀNH CÔNG!' : 'INSPECTION COMPLETE!'}
              </div>
              <div className="text-xs font-black text-amber-400 font-mono">
                +${rewardAmount.toLocaleString()} {lang === 'vi' ? 'Đã cộng ngân sách' : 'Added to balance'}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-700/50">
            <span>{lang === 'vi' ? 'Đợt tiếp theo sau:' : 'Next patrol in:'}</span>
            <span className="font-mono font-bold text-slate-200">{Math.ceil(cooldownRemaining)}s</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Failed state
  if (status === 'failed') {
    return (
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-30 select-none max-w-xs animate-in zoom-in-95">
        <div className={`p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md ${
          isDark ? 'bg-slate-900/95 border-rose-500/60 text-white shadow-rose-950/30' : 'bg-white/95 border-rose-400 text-slate-900 shadow-xl'
        }`}>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
            </div>
            <div>
              <div className="text-xs font-black text-rose-400 uppercase tracking-wider">
                {lang === 'vi' ? 'THANH TRA THẤT BẠI' : 'INSPECTION FAILED'}
              </div>
              <div className="text-[11px] font-medium text-slate-300">
                {failureReason || (lang === 'vi' ? 'Hết thời gian tuần tra' : 'Patrol timed out')}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1.5 border-t border-slate-700/50">
            <span>{lang === 'vi' ? 'Hồi chiêu:' : 'Cooldown:'}</span>
            <span className="font-mono font-bold text-slate-200">{Math.ceil(cooldownRemaining)}s</span>
          </div>
        </div>
      </div>
    );
  }

  // 5. Active Patrolling state
  const visitedCount = visitedStationIds.length;
  const actualTargetCount = targetCount || plannedStationIds?.length || 5;
  const progressPercent = Math.min(100, Math.round((visitedCount / actualTargetCount) * 100));
  const isTimeUrgent = timeRemaining <= 20;

  // Itinerary stations: use plannedStationIds if provided
  const itineraryStations = plannedStationIds && plannedStationIds.length > 0
    ? plannedStationIds.map(sId => ({ id: sId, name: stationMap.get(sId)?.name || sId }))
    : Array.from({ length: actualTargetCount }).map((_, idx) => ({ id: `idx-${idx}`, name: `Ga ${idx + 1}` }));

  return (
    <div className={`absolute top-3 sm:top-4 left-3 sm:left-4 z-30 max-w-sm w-[92vw] sm:w-88 rounded-2xl border shadow-2xl backdrop-blur-md transition-all select-none overflow-hidden ${
      isDark ? 'bg-slate-900/95 border-amber-500/50 text-slate-100 shadow-amber-950/20' : 'bg-white/95 border-amber-400 text-slate-900 shadow-xl'
    }`}>
      {/* Top Header Bar */}
      <div className="p-2.5 sm:p-3 border-b border-amber-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            👮
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1">
              <span>{lang === 'vi' ? 'ĐANG THANH TRA' : 'PATROL IN PROGRESS'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-mono text-[9px] font-black shadow-xs">
                +${rewardAmount.toLocaleString()}
              </span>
            </div>
            <div className="text-xs font-bold line-clamp-1">
              {visitedCount}/{actualTargetCount} {lang === 'vi' ? 'ga đã kiểm tra' : 'stations checked'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Time Countdown Pill */}
          <div className={`px-2 py-1 rounded-lg font-mono font-bold text-xs flex items-center gap-1 border ${
            isTimeUrgent
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse'
              : 'bg-slate-800/80 border-slate-700 text-amber-400'
          }`}>
            <Clock className="w-3 h-3" />
            <span>{formatTime(timeRemaining)}</span>
          </div>

          <button
            onClick={() => setIsMinimized(v => !v)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            title={isMinimized ? 'Mở rộng' : 'Thu gọn'}
          >
            {isMinimized ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {!isMinimized && (
        <div className="p-3 space-y-2.5">
          {/* Station Itinerary Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>{lang === 'vi' ? 'Lộ trình ga kiểm tra' : 'Station itinerary'}</span>
              <span className="font-mono text-emerald-400 font-bold">{progressPercent}%</span>
            </div>

            {/* Scrollable / wrapped badges for chosen stations */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
              {itineraryStations.map((st, idx) => {
                const isVisited = visitedStationIds.includes(st.id);
                const isCurrentStation = currentStationId === st.id;
                return (
                  <div
                    key={st.id || idx}
                    className={`px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-bold border transition-all ${
                      isVisited
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : isCurrentStation
                        ? 'bg-amber-400 border-amber-300 text-slate-950 shadow-md font-black animate-pulse'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-400'
                    }`}
                  >
                    <span>{isVisited ? '✓' : `${idx + 1}.`}</span>
                    <span className="max-w-24 truncate">{st.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Inspector Location / Status */}
          <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-1.5">
            {currentTrain ? (
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base animate-pulse">🚆</span>
                  <div className="min-w-0">
                    <span className="text-slate-400 text-[10px] block font-medium">
                      {lang === 'vi' ? 'Trạng thái di chuyển:' : 'Movement status:'}
                    </span>
                    <span className="font-bold text-slate-200 line-clamp-1">
                      {lang === 'vi' ? 'Đang trên tàu ' : 'On train '}{currentLine?.name || ''}
                    </span>
                    <span className="text-[10px] text-amber-400/90 block">
                      {lang === 'vi'
                        ? `➔ Đi về hướng ${endStation ? `Ga ${endStation.name}` : 'ga cuối'}`
                        : `➔ Traveling towards ${endStation ? `Station ${endStation.name}` : 'terminus'}`}
                    </span>
                  </div>
                </div>

                {/* Option to alight at current station if train is dwelling */}
                {currentTrain.currentStationId && !visitedStationIds.includes(currentTrain.currentStationId) && (
                  <button
                    onClick={onAlightAtStation}
                    className="shrink-0 px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition cursor-pointer active:scale-95 flex items-center gap-1"
                    title={lang === 'vi' ? 'Xuống ga để kiểm tra' : 'Alight to inspect station'}
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>{lang === 'vi' ? 'Xuống ga' : 'Alight'}</span>
                  </button>
                )}
              </div>
            ) : currentStation ? (
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {dwellAtStationTimer > 0 ? '🔍' : '⏳'}
                </span>
                <div className="min-w-0">
                  <span className="text-slate-400 text-[10px] block font-medium">
                    {lang === 'vi' ? 'Tại ga:' : 'At station:'} <strong className="text-slate-200">{currentStation.name}</strong>
                  </span>
                  {dwellAtStationTimer > 0 ? (
                    <span className="font-bold text-amber-300 text-[11px] flex items-center gap-1">
                      <span>{lang === 'vi' ? 'Đang kiểm tra sân ga...' : 'Inspecting platform...'}</span>
                      <span className="font-mono text-amber-200">({dwellAtStationTimer.toFixed(1)}s)</span>
                    </span>
                  ) : (
                    <span className="font-bold text-cyan-300 text-[11px]">
                      {lang === 'vi'
                        ? `Đã xong — Chờ tàu hướng về ${endStation ? `Ga ${endStation.name}` : 'ga cuối'}...`
                        : `Done — Waiting for train heading to ${endStation ? `Station ${endStation.name}` : 'terminus'}...`}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-[11px]">
                {lang === 'vi' ? 'Đang tuần tra các tuyến tàu...' : 'Patrolling metro lines...'}
              </div>
            )}
          </div>

          {/* Rule note */}
          <div className="text-[10px] text-amber-400/90 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span>
              {lang === 'vi'
                ? 'Hủy nếu ga bị quá tải hoặc hết thời gian'
                : 'Fails if any station overcrowds or time expires'}
            </span>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-medium">
              {lang === 'vi' ? 'Thưởng (300$/ga):' : 'Target (300$/st.):'}{' '}
              <strong className="text-amber-400 font-mono">
                +${rewardAmount.toLocaleString()}
              </strong>
            </span>

            <button
              onClick={onCancel}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-900/30 text-slate-400 hover:text-rose-300 text-xs font-semibold transition cursor-pointer border border-slate-700/60 active:scale-95"
            >
              {lang === 'vi' ? 'Hủy đợt' : 'Cancel'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
