import React from 'react';
import { X, Star, Users, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Station, MetroLine, StationShape } from '../types/game';

interface StationDetailModalProps {
  station: Station | null;
  allStations?: Station[];
  lines: MetroLine[];
  hasInterchangeToken: boolean;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
  onUpgradeToInterchange: (stationId: string) => void;
  onRemoveStationFromLine?: (lineId: string, stationId: string) => void;
  onChangeShape?: (stationId: string, shape: StationShape) => void;
  onDeleteStation?: (stationId: string) => void;
  onRequestDeleteStation?: (stationId: string, stationName: string) => void;
}

const SHAPE_NAMES: Record<StationShape, { vi: string; en: string }> = {
  circle: { vi: 'Hình Tròn', en: 'Circle' },
  triangle: { vi: 'Hình Tam Giác', en: 'Triangle' },
  square: { vi: 'Hình Vuông', en: 'Square' },
  diamond: { vi: 'Hình Thoi', en: 'Diamond' },
  star: { vi: 'Hình Ngôi Sao', en: 'Star' },
  cross: { vi: 'Hình Chữ Thập', en: 'Cross' },
  pentagon: { vi: 'Hình Ngũ Giác', en: 'Pentagon' },
};

const SHAPE_ICONS: Record<StationShape, string> = {
  circle: '●',
  triangle: '▲',
  square: '■',
  diamond: '◆',
  star: '★',
  cross: '✚',
  pentagon: '⬠',
};

export const StationDetailModal: React.FC<StationDetailModalProps> = ({
  station,
  allStations = [],
  lines,
  hasInterchangeToken,
  theme,
  lang,
  onClose,
  onUpgradeToInterchange,
  onRemoveStationFromLine,
  onChangeShape,
  onDeleteStation,
  onRequestDeleteStation
}) => {
  if (!station) return null;
  const isDark = theme === 'dark';

  const linesServingStation = lines.filter(l => l.stationIds.includes(station.id));

  // Group waiting passengers by target station: <icon> <Tên ga> <số khách cần đến ga đó>
  interface StationPassengerDest {
    key: string;
    shape: StationShape;
    stationName: string;
    count: number;
  }

  const destinationMap = new Map<string, StationPassengerDest>();

  for (const p of station.passengers) {
    let targetName = p.targetStationName;
    let shape = p.targetShape;

    if (!targetName && p.targetStationId && allStations.length > 0) {
      const found = allStations.find(s => s.id === p.targetStationId);
      if (found) {
        targetName = found.name;
        shape = found.shape;
      }
    }

    if (!targetName) {
      const matching = allStations.filter(s => s.shape === p.targetShape && s.id !== station.id);
      if (matching.length > 0) {
        const hash = p.id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
        const st = matching[Math.abs(hash) % matching.length];
        targetName = st.name;
      } else {
        targetName = lang === 'vi' ? SHAPE_NAMES[p.targetShape]?.vi : SHAPE_NAMES[p.targetShape]?.en;
      }
    }

    const key = `${shape}___${targetName}`;
    const existing = destinationMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      destinationMap.set(key, {
        key,
        shape,
        stationName: targetName,
        count: 1
      });
    }
  }

  const destinationList = Array.from(destinationMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl p-4 sm:p-6 border shadow-2xl relative cursor-default scrollbar-thin ${
          isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Deselect Station Button */}
        <button
          onClick={onClose}
          title={lang === 'vi' ? 'Hủy ga đã chọn / Đóng bảng' : 'Deselect station / Close'}
          className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-neutral-700/60 bg-neutral-800/80 hover:bg-neutral-700 text-xs font-semibold text-neutral-300 hover:text-white transition cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-3.5 h-3.5" />
          <span>{lang === 'vi' ? 'Hủy chọn ga' : 'Deselect'}</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xl border border-emerald-500/20">
            {station.shape === 'circle' && '●'}
            {station.shape === 'triangle' && '▲'}
            {station.shape === 'square' && '■'}
            {station.shape === 'diamond' && '◆'}
            {station.shape === 'star' && '★'}
            {station.shape === 'cross' && '✚'}
            {station.shape === 'pentagon' && '⬠'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">{station.name}</h2>
              {station.isInterchange && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-500" />
                  Hub
                </span>
              )}
            </div>
            <p className="text-xs opacity-60">
              {lang === 'vi' ? SHAPE_NAMES[station.shape].vi : SHAPE_NAMES[station.shape].en} • {lang === 'vi' ? 'Nhà ga trung tâm' : 'Transit station'}
            </p>

            {/* Quick Shape Switcher */}
            {onChangeShape && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] font-semibold opacity-60 mr-1">
                  {lang === 'vi' ? 'Đổi dạng:' : 'Change:'}
                </span>
                {(['circle', 'triangle', 'square', 'diamond', 'star', 'cross', 'pentagon'] as StationShape[]).map(sh => (
                  <button
                    key={sh}
                    onClick={() => onChangeShape(station.id, sh)}
                    className={`w-6 h-6 rounded-md text-xs font-black flex items-center justify-center transition cursor-pointer ${
                      station.shape === sh
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                        : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                    }`}
                  >
                    {sh === 'circle' && '●'}
                    {sh === 'triangle' && '▲'}
                    {sh === 'square' && '■'}
                    {sh === 'diamond' && '◆'}
                    {sh === 'star' && '★'}
                    {sh === 'cross' && '✚'}
                    {sh === 'pentagon' && '⬠'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Capacity & Overcrowd Status */}
        <div className={`p-4 rounded-xl border mb-4 ${
          station.isOvercrowded
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : isDark
            ? 'bg-neutral-800/60 border-neutral-700'
            : 'bg-neutral-100 border-neutral-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase opacity-70">
              {lang === 'vi' ? 'Sức chứa hành khách' : 'Passenger Capacity'}
            </span>
            <span className="font-mono font-bold text-sm">
              {station.passengers.length} / {station.maxCapacity}
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-neutral-700/40 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                station.isOvercrowded ? 'bg-red-500' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (station.passengers.length / station.maxCapacity) * 100)}%`
              }}
            />
          </div>
          {station.isOvercrowded && (
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-500 animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {lang === 'vi'
                  ? `Cảnh báo: Ga quá đông! Mạng lưới có thể sụp đổ sau ${Math.max(1, Math.round(22 * (1 - station.overcrowdedTimer)))}s!`
                  : `Warning: Overcrowded! Network risk in ${Math.max(1, Math.round(22 * (1 - station.overcrowdedTimer)))}s!`}
              </span>
            </div>
          )}
        </div>

        {/* Waiting Passengers Breakdown */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase opacity-60">
              {lang === 'vi' ? 'Hành khách đang chờ theo ga đến' : 'Waiting Passengers by Destination Station'}
            </h3>
            {destinationList.length > 0 && (
              <span className="text-[11px] font-mono opacity-70">
                {station.passengers.length} {lang === 'vi' ? 'khách' : 'passengers'}
              </span>
            )}
          </div>
          {destinationList.length === 0 ? (
            <p className="text-xs opacity-50 italic">
              {lang === 'vi' ? 'Không có khách chờ. Ga thông thoáng!' : 'No passengers waiting. Station is clear!'}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {destinationList.map(dest => (
                <div
                  key={dest.key}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs transition ${
                    isDark ? 'bg-neutral-800/80 border-neutral-700/80 text-neutral-200' : 'bg-neutral-100 border-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <span className="font-bold text-sm text-emerald-400 shrink-0">
                      {SHAPE_ICONS[dest.shape] || '●'}
                    </span>
                    <span className="font-semibold truncate">
                      {dest.stationName}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-[11px] shrink-0 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    {dest.count} {lang === 'vi' ? 'khách' : 'pax'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lines Connected */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold uppercase opacity-60">
              {lang === 'vi' ? 'Tuyến tàu đi qua ga này' : 'Lines Serving This Station'}
            </h3>
            {linesServingStation.length > 0 && (
              <span className="text-[11px] text-amber-400 font-medium">
                {lang === 'vi' ? '💡 Nhấp 2 lần để hủy nhanh' : '💡 Double-click to quick cancel'}
              </span>
            )}
          </div>
          {linesServingStation.length === 0 ? (
            <p className="text-xs text-amber-500 font-medium">
              {lang === 'vi' ? 'Chưa có tuyến nào kết nối! Hãy kéo chuột nối tuyến đến ga này.' : 'No lines connected yet! Drag route to this station.'}
            </p>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {linesServingStation.map(l => (
                  <div
                    key={l.id}
                    className="flex items-center gap-2 pl-3 pr-1.5 py-1 rounded-full text-xs font-bold text-white shadow-sm"
                    style={{ backgroundColor: l.color }}
                  >
                    <span>{l.name}</span>
                    {onRemoveStationFromLine && (
                      <button
                        onClick={() => onRemoveStationFromLine(l.id, station.id)}
                        title={lang === 'vi' ? 'Bỏ ga này khỏi tuyến' : 'Remove station from this line'}
                        className="p-1 rounded-full bg-black/30 hover:bg-black/60 transition cursor-pointer text-[10px]"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {onRemoveStationFromLine && (
                <div className="pt-1 space-y-1.5">
                  {linesServingStation.map(l => (
                    <button
                      key={`btn-rm-${l.id}`}
                      onClick={() => onRemoveStationFromLine(l.id, station.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-between border transition hover:opacity-95 cursor-pointer active:scale-98 ${
                        isDark ? 'bg-neutral-800/80 border-neutral-700' : 'bg-neutral-50 border-neutral-300'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                        <span>{lang === 'vi' ? `Hủy ga khỏi ${l.name}` : `Remove from ${l.name}`}</span>
                      </span>
                      <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-[11px] font-bold">
                        {lang === 'vi' ? 'Hủy ga này ✕' : 'Cancel station ✕'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upgrade to Interchange Hub Button */}
        {!station.isInterchange ? (
          <div className="space-y-2">
            <button
              onClick={() => onUpgradeToInterchange(station.id)}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-md bg-amber-500 hover:bg-amber-400 text-neutral-900 cursor-pointer active:scale-98"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>
                {lang === 'vi' ? 'Nâng cấp Ga Trung Chuyển ($350 - Sức chứa 14)' : 'Upgrade to Interchange Hub ($350 - 14 Capacity)'}
              </span>
            </button>
          </div>
        ) : (
          <div className="w-full py-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/30 text-xs font-bold text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Đã là Ga Trung Chuyển tối ưu (Sức chứa 14 khách)' : 'Optimal Interchange Hub Active (14 Capacity)'}</span>
          </div>
        )}

        {/* Delete Station Button */}
        {(onDeleteStation || onRequestDeleteStation) && (
          <div className="mt-3">
            <button
              onClick={() => {
                if (onRequestDeleteStation) {
                  onRequestDeleteStation(station.id, station.name);
                } else if (onDeleteStation) {
                  onDeleteStation(station.id);
                  onClose();
                }
              }}
              className="w-full py-2 px-3 rounded-xl border border-red-500/30 hover:bg-red-500/15 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer active:scale-98"
            >
              <span>🗑️</span>
              <span>{lang === 'vi' ? 'Xóa nhà ga này khỏi bản đồ' : 'Delete this Station'}</span>
            </button>
          </div>
        )}

        {/* Cancel / Deselect Station Selection */}
        <div className="mt-3 pt-3 border-t border-neutral-700/30 text-center">
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
              isDark
                ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white bg-neutral-800/40'
                : 'border-neutral-300 hover:bg-neutral-100 text-neutral-700 hover:text-black bg-neutral-50'
            }`}
          >
            <X className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Hủy chọn ga (Bỏ chọn)' : 'Deselect Selected Station'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
