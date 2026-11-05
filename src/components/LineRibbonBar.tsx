import React from 'react';
import { MetroLine, Station, Train, StationShape } from '../types/game';
import { Zap, Bot, Plus, Minus, X, RotateCcw } from 'lucide-react';

interface LineRibbonBarProps {
  line: MetroLine;
  stations: Station[];
  trains: Train[];
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
  unassignedStock: number;
  onDeployTrain: (lineId: string) => void;
  onRemoveTrain: (lineId: string) => void;
  onRebalanceHeadway: (lineId: string) => void;
  onToggleAutoDispatch: (lineId: string) => void;
  onClose: () => void;
}

function getShapeGlyph(shape: StationShape): string {
  switch (shape) {
    case 'circle': return '●';
    case 'triangle': return '▲';
    case 'square': return '■';
    case 'diamond': return '◆';
    case 'star': return '★';
    case 'cross': return '✚';
    case 'pentagon': return '⬟';
    default: return '●';
  }
}

export const LineRibbonBar: React.FC<LineRibbonBarProps> = ({
  line,
  stations,
  trains,
  lang,
  theme,
  unassignedStock,
  onDeployTrain,
  onRemoveTrain,
  onRebalanceHeadway,
  onToggleAutoDispatch,
  onClose
}) => {
  const isDark = theme === 'dark';
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  const trainsOnLine = trains.filter(t => t.lineId === line.id && !t.isDockedAtDepot);
  const totalStations = line.stationIds.length;
  const totalSegments = line.isLoop ? totalStations : Math.max(1, totalStations - 1);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[94vw] sm:max-w-xl md:max-w-2xl px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-xl flex flex-col gap-2 select-none animate-in fade-in slide-in-from-bottom-3 duration-150 ${
        isDark
          ? 'bg-slate-950/92 border-slate-700/80 text-white shadow-black/80'
          : 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/40'
      }`}
      style={{
        boxShadow: `0 8px 32px -4px ${line.color}33`
      }}
    >
      {/* Top Header Row: Line Name, Train Count, Actions */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-3.5 h-3.5 rounded-full ring-2 ring-white/40 shrink-0"
            style={{ backgroundColor: line.color }}
          />
          <span className="font-bold truncate text-xs sm:text-sm">
            {line.name}
          </span>
          {line.isLoop && (
            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 flex items-center gap-0.5">
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Loop</span>
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Rebalance Headway Equalizer */}
          {trainsOnLine.length >= 2 && (
            <button
              type="button"
              onClick={() => onRebalanceHeadway(line.id)}
              title={lang === 'vi' ? 'Điều tiết cân bằng giãn cách giữa các tàu' : 'Equalize headway spacing'}
              className="px-2 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Giãn cách đều' : 'Equalize'}</span>
            </button>
          )}

          {/* Auto-Dispatch OCC Toggle */}
          <button
            type="button"
            onClick={() => onToggleAutoDispatch(line.id)}
            title={lang === 'vi' ? 'Tự động điều phối tàu theo lưu lượng (Auto-OCC)' : 'Auto-Dispatch by crowding'}
            className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 border ${
              line.autoDispatchEnabled
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border-slate-700'
            }`}
          >
            <Bot className="w-3 h-3" />
            <span>Auto-OCC</span>
          </button>

          {/* Train Count - / + */}
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700/80 p-0.5">
            <button
              disabled={trainsOnLine.length === 0}
              onClick={() => onRemoveTrain(line.id)}
              title={lang === 'vi' ? 'Thu hồi 1 tàu về kho' : 'Recall 1 train'}
              className={`p-1 rounded-lg transition ${
                trainsOnLine.length > 0
                  ? 'hover:bg-slate-700 text-amber-400 cursor-pointer active:scale-90'
                  : 'opacity-30 cursor-not-allowed text-neutral-500'
              }`}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-black text-xs px-2 text-cyan-400">
              {trainsOnLine.length}
            </span>
            <button
              disabled={unassignedStock <= 0}
              onClick={() => onDeployTrain(line.id)}
              title={
                unassignedStock > 0
                  ? (lang === 'vi' ? `Thêm 1 tàu (Kho còn ${unassignedStock})` : `Add 1 train (${unassignedStock} in stock)`)
                  : (lang === 'vi' ? 'Kho hết tàu!' : 'Depot empty!')
              }
              className={`p-1 rounded-lg transition ${
                unassignedStock > 0
                  ? 'hover:bg-slate-700 text-emerald-400 cursor-pointer active:scale-90'
                  : 'opacity-30 cursor-not-allowed text-neutral-500'
              }`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Close Ribbon Bar */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-slate-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Linear Route Ribbon Canvas / Track Strip */}
      <div className="relative w-full h-8 flex items-center px-2">
        {/* The Colored Track Line */}
        <div
          className="absolute left-2 right-2 h-1.5 rounded-full"
          style={{ backgroundColor: line.color }}
        />

        {/* Stations along the ribbon */}
        <div className="relative w-full flex items-center justify-between z-10 pointer-events-none">
          {line.stationIds.map((sId, idx) => {
            const st = stationMap.get(sId);
            const glyph = st ? getShapeGlyph(st.shape) : '●';
            const isCrowded = Boolean(st && st.passengers.length >= (st.maxCapacity || 6) * 0.75);

            return (
              <div
                key={`${sId}-${idx}`}
                className="relative flex flex-col items-center group/st pointer-events-auto"
                title={`${st?.name || 'Ga'} (${st?.passengers.length || 0} khách)`}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition shadow-xs ${
                    isCrowded
                      ? 'bg-rose-500 border-white text-white animate-pulse'
                      : st?.isInterchange || st?.isTodHub
                        ? 'bg-amber-400 border-slate-900 text-slate-950 font-black scale-110'
                        : isDark
                          ? 'bg-slate-900 border-white text-white'
                          : 'bg-white border-slate-900 text-slate-900'
                  }`}
                  style={{ borderColor: isCrowded ? '#EF4444' : '#FFFFFF' }}
                >
                  <span>{glyph}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Train Moving Beads along Ribbon */}
        {trainsOnLine.map(t => {
          // Normalize position along ribbon: 0 to 1
          const seg = Math.max(0, Math.min(t.segmentIndex || 0, totalSegments - 1));
          const prog = t.direction === 1 ? (t.progress || 0) : (1 - (t.progress || 0));
          const totalFraction = (seg + prog) / totalSegments;
          const leftPercent = Math.max(0, Math.min(100, totalFraction * 100));

          return (
            <div
              key={t.id}
              style={{ left: `${leftPercent}%` }}
              className={`absolute -translate-x-1/2 z-20 flex items-center justify-center transition-all duration-100 ${
                t.isHeldAtStation ? 'animate-pulse' : ''
              }`}
              title={`Tàu ${t.id} (${t.passengers.length}/${t.capacity} khách) ${t.isExpress ? '• Express' : ''}`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 shadow-md flex items-center justify-center text-[7px] font-black ${
                  t.isExpress
                    ? 'bg-amber-400 text-slate-950 border-white'
                    : 'bg-white text-slate-950 border-slate-900'
                }`}
              >
                {t.isExpress ? '⚡' : t.direction === 1 ? '▶' : '◀'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

