import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Palette,
  Settings2,
  DollarSign,
  Landmark,
  Sparkles,
  Route,
  MapPin,
  Building2,
  X,
  Zap,
  ShoppingBag,
  Pencil,
  Check
} from 'lucide-react';
import { MetroLine, GameInventory, Train, Station, MetroLineType, StationShape } from '../types/game';
import { calculateLineLengthKm } from '../utils/geometry';

interface MiniMetroDockProps {
  lines: MetroLine[];
  trains: Train[];
  stations?: Station[];
  inventory: GameInventory;
  selectedLineId: string | null;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  isUnlimitedMode?: boolean;
  isPlacingStation?: boolean;
  onSelectLine: (lineId: string | null) => void;
  onCreateNewLine: () => void;
  onDeleteLine: (lineId: string) => void;
  onDeployTrain: (lineId: string) => void;
  onRemoveTrain: (lineId: string) => void;
  onAddCarriage: (lineId: string) => void;
  onRemoveCarriage: (lineId: string) => void;
  onEditLineColor?: (line: MetroLine, idx: number) => void;
  onOpenLineSettings?: (line: MetroLine) => void;
  onChangeLineType?: (lineId: string, type: MetroLineType) => void;
  onToggleLineDepot?: (lineId: string) => void;
  onRemoveStationFromLine?: (lineId: string, stationId: string) => void;
  onStartPlacingStation?: () => void;
  onToggleRouteManager?: () => void;
  onOpenShop?: () => void;
  onOpenBank?: () => void;
  onToggleCreative?: () => void;
  onRenameLine?: (lineId: string, newName: string) => void;
}

function getShapeGlyph(shape?: StationShape): string {
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

export const MiniMetroDock: React.FC<MiniMetroDockProps> = ({
  lines,
  trains,
  stations = [],
  inventory,
  selectedLineId,
  theme,
  lang,
  isUnlimitedMode = false,
  isPlacingStation = false,
  onSelectLine,
  onCreateNewLine,
  onDeleteLine,
  onDeployTrain,
  onRemoveTrain,
  onAddCarriage,
  onRemoveCarriage,
  onEditLineColor,
  onOpenLineSettings,
  onChangeLineType,
  onToggleLineDepot,
  onRemoveStationFromLine,
  onStartPlacingStation,
  onToggleRouteManager,
  onOpenShop,
  onOpenBank,
  onToggleCreative,
  onRenameLine
}) => {
  const isDark = theme === 'dark';
  const [activePopupLineId, setActivePopupLineId] = useState<string | null>(null);
  const [isEditingLineName, setIsEditingLineName] = useState(false);
  const [lineNameInput, setLineNameInput] = useState('');

  const selectedLine = lines.find(l => l.id === (activePopupLineId || selectedLineId));
  const trainsOnSelected = selectedLine ? trains.filter(t => t.lineId === selectedLine.id) : [];
  const carriagesOnSelected = trainsOnSelected.reduce((sum, t) => sum + t.carriagesCount, 0);

  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));
  const lineLengthKm = selectedLine ? calculateLineLengthKm(selectedLine.stationIds, selectedLine.isLoop, stationMap) : 0;

  return (
    <div className="fixed bottom-5 left-5 z-40 pointer-events-auto flex flex-col items-start select-none max-w-[94vw]">
      {/* Comprehensive Line Management Popover directly above active line circle */}
      {selectedLine && (
        <div
          className={`mb-2 p-3 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-sm sm:max-w-md border-t-4 ${
            isDark
              ? 'bg-neutral-900/98 border-neutral-700/80 text-white'
              : 'bg-white/98 border-neutral-300 text-neutral-900'
          }`}
          style={{ borderTopColor: selectedLine.color }}
        >
          {/* Row 1: Line Identity (Left) & Quick Action Buttons (Right) */}
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-4 h-4 rounded-full inline-block shadow-xs shrink-0 ring-2 ring-black/10"
                style={{ backgroundColor: selectedLine.color }}
              />
              {/* Line Name (Editable) */}
              {isEditingLineName ? (
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={lineNameInput}
                    maxLength={30}
                    autoFocus
                    onChange={(e) => setLineNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = lineNameInput.trim();
                        if (trimmed && onRenameLine) {
                          onRenameLine(selectedLine.id, trimmed);
                        }
                        setIsEditingLineName(false);
                      } else if (e.key === 'Escape') {
                        setIsEditingLineName(false);
                      }
                    }}
                    onBlur={() => {
                      const trimmed = lineNameInput.trim();
                      if (trimmed && onRenameLine) {
                        onRenameLine(selectedLine.id, trimmed);
                      }
                      setIsEditingLineName(false);
                    }}
                    className={`px-2 py-0.5 text-xs font-bold rounded border ${
                      isDark ? 'bg-neutral-800 border-amber-400 text-white' : 'bg-neutral-100 border-amber-500 text-neutral-900'
                    } focus:outline-hidden w-28 sm:w-32`}
                    placeholder={lang === 'vi' ? 'Tên tuyến...' : 'Line name...'}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = lineNameInput.trim();
                      if (trimmed && onRenameLine) {
                        onRenameLine(selectedLine.id, trimmed);
                      }
                      setIsEditingLineName(false);
                    }}
                    className="p-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/40 cursor-pointer shrink-0"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 group/dockname min-w-0">
                  <span
                    className="font-black text-sm cursor-pointer hover:text-amber-400 transition-colors whitespace-nowrap truncate max-w-[130px]"
                    title={lang === 'vi' ? 'Bấm để đổi tên tuyến' : 'Click to rename line'}
                    onClick={() => {
                      setLineNameInput(selectedLine.name);
                      setIsEditingLineName(true);
                    }}
                  >
                    {selectedLine.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLineNameInput(selectedLine.name);
                      setIsEditingLineName(true);
                    }}
                    title={lang === 'vi' ? 'Đổi tên tuyến' : 'Rename line'}
                    className="p-0.5 rounded opacity-60 hover:opacity-100 hover:bg-neutral-700/50 transition cursor-pointer text-amber-400 shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              )}
              <span className={`text-[10px] font-mono whitespace-nowrap shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                ({selectedLine.stationIds.length} {lang === 'vi' ? 'ga' : 'stations'} • {lineLengthKm} km)
              </span>
            </div>

            {/* Actions: Color, Settings, Delete, Close */}
            <div className="flex items-center gap-1 shrink-0">
              {onEditLineColor && (
                <button
                  type="button"
                  onClick={() => onEditLineColor(selectedLine, lines.indexOf(selectedLine))}
                  title={lang === 'vi' ? 'Đổi màu tuyến' : 'Change Color'}
                  className={`p-1 rounded cursor-pointer transition ${
                    isDark ? 'hover:bg-neutral-800 text-neutral-300 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
              )}

              {onOpenLineSettings && (
                <button
                  type="button"
                  onClick={() => onOpenLineSettings(selectedLine)}
                  title={lang === 'vi' ? 'Cài đặt giãn cách & Depot' : 'Line Settings & Depot'}
                  className={`p-1 rounded cursor-pointer transition ${
                    isDark ? 'hover:bg-neutral-800 text-neutral-300 hover:text-white' : 'hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onDeleteLine(selectedLine.id);
                  setActivePopupLineId(null);
                  onSelectLine(null);
                }}
                title={lang === 'vi' ? 'Xóa tuyến này' : 'Delete Line'}
                className="p-1 rounded hover:bg-red-500/20 text-red-500 hover:text-red-400 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setActivePopupLineId(null);
                  onSelectLine(null);
                }}
                className={`p-1 cursor-pointer transition ml-0.5 ${
                  isDark ? 'text-neutral-400 hover:text-white' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Row 2: Steppers (Trains, Carriages) & Depot Controls */}
          <div className={`flex items-center justify-between gap-2 pt-1.5 border-t w-full ${
            isDark ? 'border-neutral-800/80' : 'border-neutral-200'
          }`}>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Trains Stepper */}
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                isDark ? 'bg-neutral-800/90 border-neutral-700' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
              }`}>
                <span className={`text-[10px] mr-0.5 font-semibold whitespace-nowrap ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  {lang === 'vi' ? 'Tàu:' : 'Trains:'}
                </span>
                <button
                  type="button"
                  disabled={trainsOnSelected.length === 0}
                  onClick={() => onRemoveTrain(selectedLine.id)}
                  title={lang === 'vi' ? 'Thu hồi 1 tàu' : 'Recall 1 train'}
                  className={`w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 cursor-pointer text-amber-500 transition ${
                    isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-200 hover:bg-neutral-300'
                  }`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-mono font-bold px-1">{trainsOnSelected.length}</span>
                <button
                  type="button"
                  disabled={!isUnlimitedMode && inventory.unassignedTrains <= 0}
                  onClick={() => onDeployTrain(selectedLine.id)}
                  title={selectedLine.type === 'feeder_bus' ? (lang === 'vi' ? 'Thêm 1 xe buýt (6 chỗ)' : 'Deploy 1 bus (6 cap)') : (lang === 'vi' ? 'Thêm 1 tàu' : 'Deploy 1 train')}
                  className={`w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 cursor-pointer text-emerald-500 transition ${
                    isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-200 hover:bg-neutral-300'
                  }`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Carriages Stepper / BRT Capacity Badge */}
              {selectedLine.type === 'feeder_bus' ? (
                <div
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                    isDark ? 'bg-neutral-800/40 border-neutral-700/60 text-amber-300/90' : 'bg-amber-50/80 border-amber-200 text-amber-800'
                  }`}
                  title={lang === 'vi' ? '1 xe buýt BRT chở tối đa 6 người' : '1 BRT bus carries up to 6 passengers'}
                >
                  <span className="text-[10px] font-bold whitespace-nowrap">
                    🚌 {lang === 'vi' ? '6 chỗ / Không gắn toa' : '6 Cap / No Carriages'}
                  </span>
                </div>
              ) : (
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border ${
                  isDark ? 'bg-neutral-800/90 border-neutral-700' : 'bg-neutral-100 border-neutral-300 text-neutral-900'
                }`}>
                  <span className={`text-[10px] mr-0.5 font-semibold whitespace-nowrap ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {lang === 'vi' ? 'Toa:' : 'Cars:'}
                  </span>
                  {(() => {
                    const isDouble = selectedLine.type === 'double_decker';
                    const availableCarriages = inventory.carriages;
                    const canAdd = isUnlimitedMode || availableCarriages > 0;
                    return (
                      <>
                        <button
                          type="button"
                          disabled={carriagesOnSelected === 0}
                          onClick={() => onRemoveCarriage(selectedLine.id)}
                          title={lang === 'vi' ? (isDouble ? 'Gỡ 1 toa 2 tầng về kho' : 'Gỡ 1 toa phụ') : (isDouble ? 'Remove 1 double-decker carriage' : 'Remove 1 carriage')}
                          className={`w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 cursor-pointer text-amber-500 transition ${
                            isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-200 hover:bg-neutral-300'
                          }`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-bold px-1">{carriagesOnSelected}</span>
                        <button
                          type="button"
                          disabled={(!canAdd) || trainsOnSelected.length === 0}
                          onClick={() => onAddCarriage(selectedLine.id)}
                          title={
                            lang === 'vi'
                              ? (isDouble
                                  ? `Thêm 1 toa 2 tầng (+8 chỗ, kho còn ${availableCarriages})`
                                  : `Thêm 1 toa phụ (+4 chỗ, kho còn ${availableCarriages})`)
                              : (isDouble
                                  ? `Add 1 double-decker carriage (+8 cap, stock: ${availableCarriages})`
                                  : `Add 1 carriage (+4 cap, stock: ${availableCarriages})`)
                          }
                          className={`w-5 h-5 flex items-center justify-center rounded disabled:opacity-30 cursor-pointer text-emerald-500 transition ${
                            isDark ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-neutral-200 hover:bg-neutral-300'
                          }`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Depot Status & Recall Button */}
            {onToggleLineDepot && (
              <button
                type="button"
                onClick={() => onToggleLineDepot(selectedLine.id)}
                title={lang === 'vi' ? 'Thu hồi toàn bộ đoàn tàu về Depot' : 'Recall all trains to Depot'}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 border shrink-0 ${
                  selectedLine.isDepotRecalled
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/40 hover:bg-amber-500/30'
                    : isDark
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span className="whitespace-nowrap">
                  {selectedLine.isDepotRecalled
                    ? (lang === 'vi' ? 'Đang ở Depot' : 'In Depot')
                    : (lang === 'vi' ? 'Về Depot' : 'Send to Depot')}
                </span>
              </button>
            )}
          </div>

          {/* Row 3: Train Type Selector */}
          {onChangeLineType && (
            <div className={`flex items-center gap-1 p-0.5 rounded-lg border w-fit overflow-x-auto scrollbar-none ${
              isDark ? 'bg-neutral-800/60 border-neutral-700/60' : 'bg-neutral-100 border-neutral-300'
            }`}>
              {(['metro', 'intercity', 'high_speed', 'double_decker', 'feeder_bus'] as MetroLineType[]).map((type) => {
                const currentType = selectedLine.type || 'metro';
                const isCur = currentType === type;
                const label = {
                  metro: { text: 'Metro', speed: '1.0x', descVi: 'Chuẩn 1.0x', icon: '🚇' },
                  intercity: { text: 'Intercity', speed: '+20%', descVi: 'Nhanh hơn 20%', icon: '🚆' },
                  high_speed: { text: 'H.Speed', speed: '+80%', descVi: 'Nhanh hơn 80%', icon: '🚅' },
                  double_decker: { text: '2-Tầng', speed: '+20%', descVi: 'Tàu 2 tầng (+20% tốc độ, x2 sức chứa)', icon: '🏢' },
                  feeder_bus: { text: 'BRT', speed: '-10%', descVi: 'Buýt BRT (6 chỗ/xe, -10% tốc độ, qua cầu miễn phí)', icon: '🚌' }
                }[type];

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onChangeLineType(selectedLine.id, type)}
                    title={`${label.descVi || label.text} (${lang === 'vi' ? 'Tốc độ' : 'Speed'}: ${label.speed})`}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 whitespace-nowrap ${
                      isCur
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isDark
                        ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{label.icon}</span>
                    <span>{label.text}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Row 3: Route Station Sequence List (With Remove 'X') */}
          {selectedLine.stationIds.length > 0 && (
            <div className={`flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none border-t ${
              isDark ? 'border-neutral-800/80' : 'border-neutral-200'
            }`}>
              <span className={`text-[10px] font-bold shrink-0 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                {lang === 'vi' ? 'Lộ trình:' : 'Route:'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {selectedLine.stationIds.map((sId, stIdx) => {
                  const st = stationMap.get(sId);
                  if (!st) return null;
                  return (
                    <div
                      key={`${sId}-${stIdx}`}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] border ${
                        isDark ? 'bg-neutral-800 border-neutral-700 text-neutral-200' : 'bg-neutral-100 border-neutral-300 text-neutral-800'
                      }`}
                    >
                      <span className="text-emerald-500 font-bold">{getShapeGlyph(st.shape)}</span>
                      <span className="max-w-[70px] truncate">{st.name}</span>
                      {onRemoveStationFromLine && selectedLine.stationIds.length > 2 && (
                        <button
                          type="button"
                          onClick={() => onRemoveStationFromLine(selectedLine.id, sId)}
                          title={lang === 'vi' ? `Gỡ ga ${st.name} khỏi tuyến` : `Remove ${st.name}`}
                          className="hover:text-red-500 text-neutral-400 cursor-pointer ml-0.5"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Authentic Mini Metro Dock Tray */}
      <div className={`flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
        isDark ? 'bg-[#202023]/95 border-[#323236] text-white' : 'bg-white/95 border-neutral-300 text-neutral-900 shadow-xl'
      }`}>
        {/* SECTION 1: Active Lines Discs */}
        <div className="flex items-center gap-2">
          {lines.map((line, idx) => {
            const isSelected = line.id === selectedLineId || line.id === activePopupLineId;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setActivePopupLineId(null);
                    onSelectLine(null);
                  } else {
                    setActivePopupLineId(line.id);
                    onSelectLine(line.id);
                  }
                }}
                title={`${line.name} (${line.stationIds.length} ${lang === 'vi' ? 'ga' : 'stations'})`}
                style={{ backgroundColor: line.color }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 ${
                  isSelected ? 'ring-3 ring-black/40 scale-110' : 'hover:scale-105 opacity-90 hover:opacity-100'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}

          {/* New Line Slot (Dashed / Plus) */}
          <button
            type="button"
            onClick={onCreateNewLine}
            title={lang === 'vi' ? 'Tạo tuyến metro mới' : 'Add new transit line'}
            className={`w-8 h-8 rounded-full border-2 border-dashed flex items-center justify-center transition cursor-pointer active:scale-95 ${
              isDark
                ? 'border-neutral-500 hover:border-blue-400 text-neutral-400 hover:text-blue-400'
                : 'border-neutral-400 hover:border-blue-600 text-neutral-500 hover:text-blue-600'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className={`h-6 w-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`} />

        {/* SECTION 2: Authentic Rolling Stock Inventory Icons */}
        <div className="flex items-center gap-2.5">
          {/* Locomotives (Spare Trains in Depot) */}
          <div
            onClick={onOpenShop}
            title={lang === 'vi' ? `Tàu dự phòng: ${inventory.unassignedTrains} (Bấm để mở Shop)` : `Spare Locomotives: ${inventory.unassignedTrains} (Click to open Shop)`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition active:scale-95 ${
              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-500">
              <rect x="4" y="3" width="16" height="16" rx="2" />
              <path d="M4 11h16" />
              <path d="M12 3v8" />
              <circle cx="8" cy="15" r="1" fill="currentColor" />
              <circle cx="16" cy="15" r="1" fill="currentColor" />
            </svg>
            <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {inventory.unassignedTrains}
            </span>
          </div>

          {/* Extra Carriages */}
          <div
            onClick={onOpenShop}
            title={lang === 'vi' ? `Toa xe tiêu chuẩn dự phòng: ${inventory.carriages} (Bấm để mở Shop)` : `Standard Carriages: ${inventory.carriages} (Click to open Shop)`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition active:scale-95 ${
              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-500">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="6" cy="18" r="1" fill="currentColor" />
              <circle cx="18" cy="18" r="1" fill="currentColor" />
            </svg>
            <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {inventory.carriages}
            </span>
          </div>



          {/* Tunnels / Bridges (Interactive & operational) */}
          <div
            onClick={onOpenShop}
            title={lang === 'vi' ? `Hầm vượt sông: ${inventory.tunnelTokens} (Bấm để mua thêm trong Shop)` : `River Tunnels: ${inventory.tunnelTokens} (Click to open Shop)`}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg cursor-pointer transition active:scale-95 ${
              isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sky-500">
              <path d="M2 12h4" strokeDasharray="2 2" />
              <path d="M10 12h4" strokeDasharray="2 2" />
              <path d="M18 12h4" strokeDasharray="2 2" />
              <path d="M4 6c4 4 12 4 16 0" strokeWidth="1.5" />
              <path d="M4 18c4-4 12-4 16 0" strokeWidth="1.5" />
            </svg>
            <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {inventory.tunnelTokens}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className={`h-6 w-px ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`} />

        {/* SECTION 3: Additional Tools (Place Station, Full Route Manager, Bank Loan & Creative) */}
        <div className="flex items-center gap-1.5">
          {/* Free Station Builder ($1,500) */}
          {onStartPlacingStation && (
            <button
              type="button"
              onClick={onStartPlacingStation}
              title={lang === 'vi' ? 'Xây ga mới tự do ($1,500/ga)' : 'Build Station ($1,500)'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 border ${
                isPlacingStation
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm animate-pulse'
                  : isDark
                  ? 'bg-neutral-800/80 hover:bg-neutral-700 text-amber-300 border-neutral-700'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-amber-700 border-neutral-300'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{lang === 'vi' ? '+ Xây ga' : '+ Station'}</span>
            </button>
          )}

          {/* Toggle Full Route Manager Sidebar */}
          {onToggleRouteManager && (
            <button
              type="button"
              onClick={onToggleRouteManager}
              title={lang === 'vi' ? 'Bảng quản lý tuyến chi tiết' : 'Route Manager Drawer'}
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isDark
                  ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white border-neutral-700'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-900 border-neutral-300'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-emerald-500" />
            </button>
          )}

          {/* Vay ngân hàng */}
          {onOpenBank && (
            <button
              type="button"
              onClick={onOpenBank}
              title={lang === 'vi' ? 'Vay vốn mở rộng mạng lưới' : 'Transit Bank Loan'}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'vi' ? 'Vay vốn' : 'Bank'}</span>
            </button>
          )}

          {/* Creative Toggle */}
          {onToggleCreative && (
            <button
              type="button"
              onClick={onToggleCreative}
              title={lang === 'vi' ? 'Công cụ sáng tạo & Địa hình' : 'Creative Mode'}
              className={`p-1.5 rounded-lg cursor-pointer transition ${
                isDark ? 'hover:bg-neutral-800 text-amber-400' : 'hover:bg-neutral-100 text-amber-600'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
