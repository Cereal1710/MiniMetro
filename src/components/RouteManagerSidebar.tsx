import React from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Train as TrainIcon,
  Layers,
  Star,
  ShoppingBag,
  RotateCcw,
  Route,
  ChevronLeft,
  ChevronRight,
  Info,
  Palette,
  MapPin,
  Eraser,
  TrendingUp,
  Settings,
  Building2,
  Play,
  Pause,
  Pencil,
  Check,
  X
} from 'lucide-react';
import { MetroLine, GameInventory, Train, Station, StationShape, GameStats, MetroLineType, isBusLineType } from '../types/game';
import { calculateLineLengthKm } from '../utils/geometry';

interface RouteManagerSidebarProps {
  lines: MetroLine[];
  trains: Train[];
  stations: Station[];
  inventory: GameInventory;
  stats?: GameStats;
  currentDayIndex?: number;
  selectedLineId: string | null;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  isCollapsed: boolean;
  isPlacingStation?: boolean;
  money?: number;
  onToggleCollapse: () => void;
  onSelectLine: (lineId: string | null) => void;
  onCreateNewLine: () => void;
  onCreateNewBusLine?: () => void;
  onBuyBus?: () => void;
  onBuyBusLineSlot?: () => void;
  onDeleteLine: (lineId: string) => void;
  onRequestDeleteLine?: (lineId: string, lineName: string) => void;
  onChangeLineType?: (lineId: string, type: MetroLineType) => void;
  onDeployTrain: (lineId: string) => void;
  onRemoveTrain: (lineId: string) => void;
  onAddCarriage: (lineId: string) => void;
  onRemoveCarriage: (lineId: string) => void;
  onRemoveStationFromLine?: (lineId: string, stationId: string) => void;
  onEditLineColor: (line: MetroLine, index: number) => void;
  onStartPlacingStation: () => void;
  onClearAllStations: () => void;
  onOpenShop: () => void;
  onOpenInspector?: () => void;
  onOpenLineSettings?: (line: MetroLine) => void;
  onToggleLineDepot?: (lineId: string) => void;
  onRenameLine?: (lineId: string, newName: string, newCode?: string) => void;
  onRebalanceHeadway?: (lineId: string) => void;
  onBuyRailGrinder?: () => void;
  railGrinderBoostUntil?: number;
}

// Station shape icon glyph for the route sequence
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

function getCircleBadgeTextClass(len: number): string {
  if (len <= 2) return 'text-xs font-black';
  if (len === 3) return 'text-[10px] font-black tracking-tight leading-none';
  if (len === 4) return 'text-[8.5px] font-black tracking-tighter leading-none';
  return 'text-[7.5px] font-black tracking-tighter leading-none';
}

export const RouteManagerSidebar: React.FC<RouteManagerSidebarProps> = ({
  lines,
  trains,
  stations,
  inventory,
  stats,
  currentDayIndex: _currentDayIndex = 0,
  selectedLineId,
  theme,
  lang,
  isCollapsed,
  isPlacingStation = false,
  money = 0,
  onToggleCollapse,
  onSelectLine,
  onCreateNewLine,
  onCreateNewBusLine,
  onBuyBus,
  onBuyBusLineSlot,
  onDeleteLine,
  onRequestDeleteLine,
  onChangeLineType,
  onDeployTrain,
  onRemoveTrain,
  onAddCarriage,
  onRemoveCarriage,
  onRemoveStationFromLine,
  onEditLineColor,
  onStartPlacingStation,
  onClearAllStations,
  onOpenShop,
  onOpenInspector,
  onOpenLineSettings,
  onToggleLineDepot,
  onRenameLine,
  onRebalanceHeadway,
  onBuyRailGrinder,
  railGrinderBoostUntil
}) => {
  const isDark = theme === 'dark';
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  const [editingLineId, setEditingLineId] = React.useState<string | null>(null);
  const [editingLineName, setEditingLineName] = React.useState<string>('');
  const [editingLineCode, setEditingLineCode] = React.useState<string>('');
  const [networkTab, setNetworkTab] = React.useState<'metro' | 'bus'>('metro');

  // Tự động chuyển tab khi người chơi nhấp chọn tuyến trên bản đồ
  React.useEffect(() => {
    if (selectedLineId) {
      const line = lines.find(l => l.id === selectedLineId);
      if (line) {
        if (isBusLineType(line.type)) {
          setNetworkTab('bus');
        } else {
          setNetworkTab('metro');
        }
      }
    }
  }, [selectedLineId, lines]);

  const metroLines = lines.filter(l => !isBusLineType(l.type));
  const busLines = lines.filter(l => isBusLineType(l.type));
  const availableBusLines = inventory.availableBusLines ?? 6;
  const standardLinesCount = metroLines.length;
  const displayedLines = networkTab === 'metro' ? metroLines : busLines;

  const busesActive = trains.filter(t => {
    const l = lines.find(line => line.id === t.lineId);
    return isBusLineType(l?.type) || t.vehicleType === 'bus';
  }).length;
  const busCost = 150;
  const busSlotCost = 500 + (availableBusLines - 4) * 150;

  // When collapsed: render an ultra-sleek compact dock rail on the left
  if (isCollapsed) {
    return (
      <aside
        className={`w-12 sm:w-14 shrink-0 h-full flex flex-col items-center justify-between py-2.5 sm:py-3 border-r z-20 transition-all select-none ${isDark
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white/95 border-neutral-200 text-slate-800 backdrop-blur-md'
          }`}
      >
        {/* Top: Expand Toggle & Route Icon */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleCollapse}
            title={lang === 'vi' ? 'Mở rộng Quản lý Tuyến' : 'Expand Route Manager'}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-95 ${isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'bg-neutral-100 hover:bg-neutral-200 text-slate-800'
              }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Quick Tab Switcher in Mini Mode */}
          <div className="flex flex-col items-center gap-1 p-0.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <button
              onClick={() => setNetworkTab('metro')}
              title={lang === 'vi' ? `Mạng Đường Sắt (${metroLines.length}/${inventory.availableLines})` : `Metro Rail (${metroLines.length}/${inventory.availableLines})`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer ${
                networkTab === 'metro' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚇
            </button>
            <button
              onClick={() => setNetworkTab('bus')}
              title={lang === 'vi' ? `Mạng Lưới Xe Buýt (${busLines.length}/${availableBusLines})` : `Bus Network (${busLines.length}/${availableBusLines})`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition cursor-pointer ${
                networkTab === 'bus' ? 'bg-amber-500 text-neutral-900 font-bold shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              🚌
            </button>
          </div>
        </div>

        {/* Middle: Lines vertical dot list for active tab */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-2.5 w-full scrollbar-none">
          {displayedLines.map((line, idx) => {
            const isSelected = selectedLineId === line.id;
            const vehiclesCount = trains.filter(t => t.lineId === line.id).length;
            const isBusLine = isBusLineType(line.type);
            const lineBadge = line.code || (isBusLine ? `B${idx + 1}` : `${idx + 1}`);

            return (
              <button
                key={line.id}
                onClick={() => onSelectLine(isSelected ? null : line.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onEditLineColor(line, lines.indexOf(line));
                }}
                title={`${lineBadge} - ${line.name} (${line.stationIds.length} ga, ${vehiclesCount} ${isBusLine ? 'xe buýt' : 'tàu'}) - Chuột phải để đổi màu HEX`}
                style={{
                  backgroundColor: line.color,
                  color: line.textColor
                }}
                className={`w-8 h-8 min-w-8 min-h-8 aspect-square rounded-full flex items-center justify-center font-bold shadow-md transition-transform relative cursor-pointer overflow-hidden ${
                  isSelected ? 'ring-3 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                }`}
              >
                <span className={`truncate text-center select-none block max-w-[92%] px-0.5 ${getCircleBadgeTextClass(lineBadge.length)}`}>
                  {lineBadge}
                </span>
                {vehiclesCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white/20">
                    {vehiclesCount}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={networkTab === 'metro' ? onCreateNewLine : (onCreateNewBusLine || onCreateNewLine)}
            title={networkTab === 'metro'
              ? (lang === 'vi' ? 'Tạo tuyến Metro mới' : 'Create new metro line')
              : (lang === 'vi' ? 'Tạo tuyến Xe Buýt mới' : 'Create new bus line')}
            className={`w-8 h-8 rounded-full border border-dashed flex items-center justify-center transition cursor-pointer ${
              networkTab === 'bus'
                ? 'border-amber-500/60 hover:border-amber-400 hover:text-amber-400 text-amber-500 bg-amber-500/10'
                : isDark
                ? 'border-slate-600 hover:border-emerald-500 hover:text-emerald-400'
                : 'border-neutral-400 hover:border-emerald-600 hover:text-emerald-600'
              }`}
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Station builder trigger icon */}
          <button
            onClick={onStartPlacingStation}
            title={lang === 'vi' ? 'Xây ga tự do ($1,500/ga)' : 'Build custom station ($1,500)'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${isPlacingStation
              ? 'bg-amber-500 text-white shadow-md animate-pulse'
              : isDark
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'bg-neutral-100 text-slate-700 hover:bg-neutral-200'
              }`}
          >
            <MapPin className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom: Daily passengers & Shop quick button */}
        <div className="flex flex-col items-center gap-2">
          {stats && (
            <button
              onClick={onToggleCollapse}
              title={`${lang === 'vi' ? 'Hành khách hôm nay' : 'Today passengers'}: ${stats.todayPassengers || 0} - ${lang === 'vi' ? 'Nhấp để xem biểu đồ chi tiết' : 'Click to view analytics chart'}`}
              className="w-9 h-9 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex flex-col items-center justify-center transition cursor-pointer text-[9px] font-mono font-bold"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats.todayPassengers || 0}</span>
            </button>
          )}
          <button
            onClick={onOpenShop}
            title={lang === 'vi' ? 'Cửa hàng thiết bị' : 'Equipment Shop'}
            className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition cursor-pointer shadow-md"
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Full Expanded Sidebar
  return (
    <>
      {/* Mobile/Tablet Backdrop Overlay when expanded */}
      <div
        onClick={onToggleCollapse}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-35 md:hidden animate-in fade-in duration-200"
        aria-hidden="true"
      />

      <aside
        className={`fixed md:relative inset-y-0 left-0 z-40 md:z-20 w-[85vw] max-w-sm md:w-84 shrink-0 h-full flex flex-col border-r transition-all select-none shadow-2xl md:shadow-none ${isDark
          ? 'bg-slate-900/98 border-slate-800 text-slate-100 backdrop-blur-md'
          : 'bg-white/98 border-neutral-200 text-slate-800 backdrop-blur-md'
          }`}
      >
        {/* 1. Header: Title, Line Count & Collapse Button */}
        <div className={`p-3.5 border-b flex items-center justify-between ${isDark ? 'border-slate-800 bg-slate-900/60' : 'border-neutral-200 bg-neutral-50/80'
          }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shadow-xs">
              <Route className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-extrabold uppercase tracking-wider">
                  {lang === 'vi' ? 'Quản lý tuyến' : 'Route Manager'}
                </h2>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-neutral-200 text-emerald-700'
                  }`}>
                  {standardLinesCount}/{inventory.availableLines}
                </span>
              </div>
              <p className="text-[10px] opacity-60">
                {lang === 'vi' ? 'Ấn vào số tuyến để đổi màu HEX' : 'Click line number to change HEX color'}
              </p>
            </div>
          </div>

          <button
            onClick={onToggleCollapse}
            title={lang === 'vi' ? 'Thu gọn thanh quản lý' : 'Collapse Sidebar'}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${isDark
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
              : 'bg-white border-neutral-300 hover:bg-neutral-100 text-slate-600'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Station Tools: Xây ga ($1,500) & Xóa ga */}
        <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-neutral-200/80 bg-neutral-50/60'
          }`}>
          <button
            onClick={onStartPlacingStation}
            title={lang === 'vi' ? 'Xây ga mới tự do trên bản đồ (1,500$)' : 'Place station ($1,500)'}
            className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${isPlacingStation
              ? 'bg-amber-500 text-neutral-900 border-amber-400 ring-2 ring-amber-400/50'
              : isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-amber-400 hover:text-white'
                : 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700'
              }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="truncate">{lang === 'vi' ? '+ Xây ga ($1,500)' : '+ Station ($1,500)'}</span>
          </button>

          <button
            onClick={onClearAllStations}
            title={lang === 'vi' ? 'Xóa toàn bộ nhà ga và thu hồi tàu xe' : 'Delete all stations'}
            className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition cursor-pointer active:scale-95 shrink-0"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>

          {/* Feature 6: Xe Cứu Hộ Đường Ray Khẩn Cấp */}
          {onBuyRailGrinder && (
            <button
              onClick={onBuyRailGrinder}
              title={lang === 'vi' ? 'Xe cứu hộ đường ray khẩn cấp ($2,000): Xóa mọi sự cố hỏng tàu/ngập lụt & tăng +25% tốc độ toàn mạng lưới!' : 'Emergency Rail Grinder ($2,000): Boost +25% speed & fix track incidents!'}
              className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 ${
                railGrinderBoostUntil && railGrinderBoostUntil > Date.now()
                  ? 'bg-amber-500 text-neutral-900 border-amber-400 font-bold animate-pulse'
                  : 'border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
              }`}
            >
              <span>🛠️</span>
              {railGrinderBoostUntil && railGrinderBoostUntil > Date.now() && (
                <span className="text-[10px] font-mono font-bold">+25%</span>
              )}
            </button>
          )}
        </div>

        {/* 3. Network Mode Switcher Tabs: 🚇 Đường Sắt vs 🚌 Mạng Lưới Buýt */}
        <div className="grid grid-cols-2 gap-1.5 p-1 mx-3.5 mt-2.5 mb-1 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setNetworkTab('metro')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              networkTab === 'metro'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-sm">🚇</span>
            <span>{lang === 'vi' ? 'Đường Sắt' : 'Metro'}</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
              networkTab === 'metro' ? 'bg-black/30 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {metroLines.length}/{inventory.availableLines}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setNetworkTab('bus')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              networkTab === 'bus'
                ? 'bg-amber-500 text-neutral-900 shadow-md ring-1 ring-amber-400'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span className="text-sm">🚌</span>
            <span>{lang === 'vi' ? 'Tuyến Buýt' : 'Bus Net'}</span>
            <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
              networkTab === 'bus' ? 'bg-black/20 text-neutral-900' : 'bg-slate-800 text-slate-400'
            }`}>
              {busLines.length}/{availableBusLines}
            </span>
          </button>
        </div>

        {/* 4. Top Action: Network-specific Creator Banner */}
        {networkTab === 'metro' ? (
          <div className="px-3.5 pt-2 pb-1">
            <button
              onClick={onCreateNewLine}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === 'vi' ? '+ Tạo Tuyến Metro Mới' : '+ Create New Metro Line'}</span>
            </button>
          </div>
        ) : (
          <div className="px-3.5 pt-2 pb-1 space-y-2">
            {/* Bus Fleet Status & Quick Purchase Card */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <span>🚌</span>
                  <span>{lang === 'vi' ? 'Đội Xe Buýt Đô Thị' : 'City Bus Fleet'}</span>
                </span>
                <span className="text-[11px] font-mono text-amber-300">
                  {busesActive} {lang === 'vi' ? 'đang chạy' : 'active'} • {inventory.unassignedBuses ?? 0} {lang === 'vi' ? 'kho' : 'spare'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-500/20 text-[10px]">
                <span className="text-amber-200/80">
                  {lang === 'vi' ? 'Giá vé xe buýt:' : 'Bus Fare:'}
                </span>
                <span className="font-bold text-emerald-400 font-mono">
                  {lang === 'vi' ? '<25km: $1 • ≥25km: $2' : '<25km: $1 • ≥25km: $2'}
                </span>
              </div>

              {/* Quick Actions for Bus: Buy bus & Buy bus line slot */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {onBuyBus && (
                  <button
                    type="button"
                    onClick={onBuyBus}
                    className="py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                    title={lang === 'vi' ? `Mua thêm 1 xe buýt vào kho ($${busCost})` : `Buy 1 bus ($${busCost})`}
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>{lang === 'vi' ? `+ Xe ($${busCost})` : `+ Bus ($${busCost})`}</span>
                  </button>
                )}

                {onBuyBusLineSlot && (
                  <button
                    type="button"
                    onClick={onBuyBusLineSlot}
                    disabled={availableBusLines >= 12}
                    className="py-1 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
                    title={lang === 'vi' ? `Mở thêm 1 slot tuyến buýt ($${busSlotCost})` : `Add 1 bus route slot ($${busSlotCost})`}
                  >
                    <Plus className="w-3 h-3 text-amber-400" />
                    <span>{availableBusLines >= 12 ? (lang === 'vi' ? 'Đầy slot (12)' : 'Max (12)') : `+ Slot ($${busSlotCost})`}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Button to create new bus line */}
            <button
              onClick={onCreateNewBusLine || onCreateNewLine}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-98 text-neutral-900 font-extrabold text-xs shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-neutral-950" />
              <span>{lang === 'vi' ? '+ Tạo Tuyến Buýt Mới' : '+ Create New Bus Line'}</span>
            </button>
          </div>
        )}

        {/* 5. Scrollable Lines List (Filtered by active tab) */}
        <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700">
          {displayedLines.length === 0 ? (
            networkTab === 'bus' ? (
              <div className={`p-4 rounded-2xl border text-center my-4 ${isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto mb-2 text-2xl">
                  🚌
                </div>
                <p className="text-xs font-bold text-amber-400 mb-1">
                  {lang === 'vi' ? 'Chưa có tuyến xe buýt nào' : 'No bus routes yet'}
                </p>
                <p className="text-[11px] opacity-75 mb-3 leading-relaxed">
                  {lang === 'vi'
                    ? 'Tuyến xe buýt chạy qua mọi cây cầu đường bộ miễn phí (không tốn hầm qua sông), gom khách từ khu dân cư về ga Metro và nhận thưởng liên tuyến +$5/lượt!'
                    : 'Bus lines cross bridges for free without river tunnel tokens, feed passengers into Metro and earn +$5 transfer bonus!'}
                </p>
                <button
                  onClick={onCreateNewBusLine || onCreateNewLine}
                  className="py-1.5 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-900 font-extrabold text-xs transition cursor-pointer active:scale-95 shadow-md"
                >
                  {lang === 'vi' ? 'Mở Tuyến Buýt Đầu Tiên' : 'Open First Bus Line'}
                </button>
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border text-center my-4 ${isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'}`}>
                <Route className="w-8 h-8 mx-auto mb-2 text-emerald-500/70 opacity-60" />
                <p className="text-xs font-bold text-white mb-1">
                  {lang === 'vi' ? 'Chưa có tuyến đường sắt nào' : 'No metro lines yet'}
                </p>
                <p className="text-[11px] opacity-75 mb-2 leading-relaxed">
                  {lang === 'vi'
                    ? 'Nhấp hoặc kéo chuột giữa các nhà ga trên bản đồ để bắt đầu xây tuyến metro đầu tiên!'
                    : 'Click or drag between stations on the map to build your first metro line!'}
                </p>
              </div>
            )
          ) : (
            displayedLines.map((line, idx) => {
              const trainsOnThisLine = trains.filter(t => t.lineId === line.id);
              const dockedTrainsCount = trainsOnThisLine.filter(t => t.isDockedAtDepot).length;
              const carriagesOnThisLine = trainsOnThisLine.reduce((sum, t) => sum + t.carriagesCount, 0);
              const maxCarriagesOnLine = trainsOnThisLine.length * 2;
              const depotStationId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
                ? line.depotStationId
                : line.stationIds[0];
              const depotStation = depotStationId ? stationMap.get(depotStationId) : null;
              const depotName = depotStation ? depotStation.name : (lang === 'vi' ? 'Chưa đặt' : 'Not set');
              const isSelected = selectedLineId === line.id;

              return (
                <div
                  key={line.id}
                  onClick={() => onSelectLine(isSelected ? null : line.id)}
                  style={{
                    borderColor: isSelected ? line.color : undefined
                  }}
                  className={`rounded-2xl border p-3 transition-all cursor-pointer shadow-sm relative ${isSelected
                    ? 'ring-2 ring-emerald-500/80 shadow-md ' +
                    (isDark ? 'bg-slate-800/90' : 'bg-emerald-50/40 border-emerald-400')
                    : isDark
                      ? 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/80'
                      : 'bg-neutral-50/80 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                    }`}
                >
                  {/* Line Header: Color Pill with Click to Change Color, Name, Loop Badge & Delete */}
                  <div className="flex items-center justify-between mb-2 gap-1.5 min-w-0 overflow-hidden">
                    {editingLineId === line.id ? (
                      /* Editing Line Code & Name */
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        {/* Line Code Input (100% Circle NO MATTER WHAT, max 5 chars) */}
                        <input
                          type="text"
                          value={editingLineCode}
                          maxLength={5}
                          onChange={(e) => setEditingLineCode(e.target.value.toUpperCase().slice(0, 5))}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const trimmedName = editingLineName.trim();
                              const trimmedCode = editingLineCode.trim().toUpperCase().slice(0, 5);
                              if (trimmedName && onRenameLine) {
                                onRenameLine(line.id, trimmedName, trimmedCode || undefined);
                              }
                              setEditingLineId(null);
                            } else if (e.key === 'Escape') {
                              setEditingLineId(null);
                            }
                          }}
                          style={{ backgroundColor: line.color, color: line.textColor }}
                          className={`w-[30px] h-[30px] min-w-[30px] min-h-[30px] aspect-square rounded-full text-center p-0 font-black uppercase shadow-inner border border-white/40 focus:outline-hidden focus:ring-2 focus:ring-amber-400 shrink-0 placeholder:text-white/60 overflow-hidden ${getCircleBadgeTextClass(editingLineCode.length || 2)}`}
                          title={lang === 'vi' ? 'Kí hiệu tuyến (tối đa 5 ký tự)' : 'Line code (max 5 chars)'}
                          placeholder={isBusLineType(line.type) ? `B${idx + 1}` : `${idx + 1}`}
                        />

                        {/* Line Name Input */}
                        <input
                          type="text"
                          value={editingLineName}
                          maxLength={25}
                          autoFocus
                          onChange={(e) => setEditingLineName(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') {
                              const trimmedName = editingLineName.trim();
                              const trimmedCode = editingLineCode.trim().toUpperCase().slice(0, 5);
                              if (trimmedName && onRenameLine) {
                                onRenameLine(line.id, trimmedName, trimmedCode || undefined);
                              }
                              setEditingLineId(null);
                            } else if (e.key === 'Escape') {
                              setEditingLineId(null);
                            }
                          }}
                          className="px-2 py-0.5 text-xs font-bold rounded bg-slate-900 border border-amber-400 text-white focus:outline-hidden flex-1 min-w-0 shadow-inner"
                          placeholder={lang === 'vi' ? 'Tên tuyến...' : 'Line name...'}
                        />

                        {/* Save Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const trimmedName = editingLineName.trim();
                            const trimmedCode = editingLineCode.trim().toUpperCase().slice(0, 5);
                            if (trimmedName && onRenameLine) {
                              onRenameLine(line.id, trimmedName, trimmedCode || undefined);
                            }
                            setEditingLineId(null);
                          }}
                          className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 cursor-pointer shrink-0"
                          title={lang === 'vi' ? 'Lưu' : 'Save'}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        {/* Cancel Button */}
                        <button
                          type="button"
                          onClick={() => setEditingLineId(null)}
                          className="p-1 rounded bg-slate-700/40 text-slate-400 hover:text-white cursor-pointer shrink-0"
                          title={lang === 'vi' ? 'Hủy' : 'Cancel'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* Display Line Badge, Name, Palette, Settings & Loop */
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        {/* Line Badge (100% Circle NO MATTER WHAT, NEVER OVERFLOWS) */}
                        {(() => {
                          const lineBadge = line.code || (isBusLineType(line.type) ? `B${idx + 1}` : `${idx + 1}`);
                          return (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditLineColor(line, lines.indexOf(line));
                              }}
                              title={lang === 'vi' ? 'Bấm vào số tuyến để đổi màu theo mã HEX' : 'Click line number to change color (HEX)'}
                              style={{ backgroundColor: line.color, color: line.textColor }}
                              className="w-[30px] h-[30px] min-w-[30px] min-h-[30px] aspect-square rounded-full flex items-center justify-center font-black shadow-md shrink-0 hover:scale-110 active:scale-95 transition-transform cursor-pointer ring-1 ring-white/30 overflow-hidden"
                            >
                              <span className={`truncate text-center select-none block max-w-[92%] px-0.5 ${getCircleBadgeTextClass(lineBadge.length)}`}>
                                {lineBadge}
                              </span>
                            </button>
                          );
                        })()}

                        {/* Line Name */}
                        <div className="flex items-center gap-1 min-w-0 flex-1 max-w-[130px] group/name">
                          <span
                            className="font-bold text-xs truncate cursor-pointer hover:text-amber-300 transition-colors"
                            title={lang === 'vi' ? 'Bấm để đổi tên & kí hiệu tuyến' : 'Click to rename & edit line code'}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLineId(line.id);
                              setEditingLineName(line.name);
                              setEditingLineCode(line.code || (isBusLineType(line.type) ? `B${idx + 1}` : `${idx + 1}`));
                            }}
                          >
                            {line.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingLineId(line.id);
                              setEditingLineName(line.name);
                              setEditingLineCode(line.code || (isBusLineType(line.type) ? `B${idx + 1}` : `${idx + 1}`));
                            }}
                            title={lang === 'vi' ? 'Đổi tên & kí hiệu tuyến' : 'Rename & edit line code'}
                            className="p-0.5 rounded opacity-40 group-hover/name:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px] shrink-0"
                          >
                            <Pencil className="w-2.5 h-2.5 text-amber-300" />
                          </button>
                        </div>

                        {/* Color Edit Button Shortcut */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditLineColor(line, idx);
                          }}
                          title={lang === 'vi' ? `Đổi màu tuyến (${line.color})` : `Edit line color (${line.color})`}
                          className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px] shrink-0"
                        >
                          <Palette className="w-3 h-3 text-cyan-400" />
                        </button>

                        {/* Line Settings (Depot & Headway) */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLineSettings?.(line);
                          }}
                          title={lang === 'vi' ? 'Cài đặt tuyến (Chọn ga Depot & Giãn cách xuất bến)' : 'Line settings (Depot & headway)'}
                          className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px] shrink-0"
                        >
                          <Settings className="w-3 h-3 text-amber-400" />
                        </button>

                        {/* Loop Indicator */}
                        {line.isLoop && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">{lang === 'vi' ? 'Vòng' : 'Loop'}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {/* Top Right: Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRequestDeleteLine) {
                          onRequestDeleteLine(line.id, line.name);
                        } else {
                          onDeleteLine(line.id);
                        }
                      }}
                      title={lang === 'vi' ? 'Xóa tuyến đường này' : 'Delete this route'}
                      className="p-1 rounded-md opacity-40 hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Station Sequence Preview */}
                  <div className="mb-2.5">
                    <div className="flex items-center justify-between gap-2 min-w-0 text-[10px] opacity-70 mb-1">
                      <span className="truncate min-w-0">{line.stationIds.length} {lang === 'vi' ? 'nhà ga' : 'stations'} • {calculateLineLengthKm(line.stationIds, line.isLoop, stationMap)} km</span>
                      <span className="text-[10px] text-emerald-400 font-semibold shrink-0 truncate max-w-[50%]">
                        {isSelected ? (lang === 'vi' ? '● Đang chọn vẽ' : '● Selected') : ''}
                      </span>
                    </div>

                    {/* Station Chips Ribbon (Wrapped to show all stations from left to right) */}
                    {line.stationIds.length === 0 ? (
                      <div className="text-[11px] italic opacity-50 px-1">
                        {lang === 'vi' ? 'Chưa nối ga nào (kéo trên map để nối)' : 'No stations connected yet'}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1 py-1 text-[11px]">
                        {line.stationIds.map((sId, sIdx) => {
                          const st = stationMap.get(sId);
                          const glyph = st ? getShapeGlyph(st.shape) : '●';
                          const stName = st?.name || sId;

                          return (
                            <React.Fragment key={`${line.id}-${sId}-${sIdx}`}>
                              <div
                                title={`${stName} (${lang === 'vi' ? 'Nhấp 2 lần trên bản đồ để hủy' : 'Double click on map to remove'})`}
                                className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[10px] border ${isDark
                                  ? 'bg-slate-900/80 border-slate-700/80 text-slate-200'
                                  : 'bg-white border-neutral-300 text-slate-800'
                                  }`}
                              >
                                <span style={{ color: line.color }} className="font-black text-xs leading-none">
                                  {glyph}
                                </span>
                                <span className="max-w-[85px] truncate">{stName}</span>
                              </div>
                              {sIdx < line.stationIds.length - 1 && (
                                <span className="text-[10px] opacity-40 shrink-0">→</span>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {line.isLoop && (
                          <span className="text-[10px] text-purple-400 font-bold shrink-0">↺</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Depot & Service Controller Card */}
                  <div className={`mb-2.5 p-2 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-neutral-100/90 border-neutral-300'
                    }`}>
                    <div className="flex items-center justify-between text-[10px] mb-1.5">
                      <div className="flex items-center gap-1 min-w-0">
                        <Building2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-bold opacity-75">{lang === 'vi' ? 'Depot:' : 'Depot:'}</span>
                        <span className="font-semibold text-amber-300 truncate max-w-[110px]">
                          {depotName}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLineSettings?.(line);
                        }}
                        className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer shrink-0"
                      >
                        <Settings className="w-2.5 h-2.5" />
                        <span>{lang === 'vi' ? 'Cài đặt' : 'Settings'}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 min-w-0">
                      {/* Toggle button: Xuất Depot vs Về Depot */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleLineDepot?.(line.id);
                        }}
                        title={
                          line.isDepotRecalled
                            ? (lang === 'vi' ? `Xuất bến các đoàn tàu từ Depot (giãn cách ${line.dispatchIntervalSeconds || 10}s)` : `Dispatch trains from depot (${line.dispatchIntervalSeconds || 10}s)`)
                            : (lang === 'vi' ? 'Thu hồi toàn bộ tàu về Depot và trả khách ở ga gần nhất' : 'Recall all trains to depot')
                        }
                        className={`flex-1 min-w-0 py-1.5 px-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 border ${line.isDepotRecalled
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                          : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                          }`}
                      >
                        {line.isDepotRecalled ? (
                          <>
                            <Play className="w-3 h-3 fill-current shrink-0" />
                            <span className="truncate">
                              {lang === 'vi' ? 'Xuất Depot' : 'Xuất Depot'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Pause className="w-3 h-3 shrink-0" />
                            <span className="truncate">
                              {lang === 'vi' ? 'Về Depot' : 'Về Depot'}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Docked Status badge */}
                      <span
                        title={lang === 'vi' ? `${dockedTrainsCount} đoàn tàu đang đỗ tại Depot` : `${dockedTrainsCount} trains docked at depot`}
                        className={`px-1.5 py-1 rounded-lg font-mono text-[9px] font-bold shrink-0 whitespace-nowrap border ${dockedTrainsCount > 0
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                      >
                        🏢 {dockedTrainsCount}/{trainsOnThisLine.length}
                      </span>
                    </div>
                  </div>

                  {/* Line Type Selector: If bus line -> 2 bus options (Xe buýt bth vs Xe BRT); If metro line -> 4 train types */}
                  {isBusLineType(line.type) ? (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] opacity-75 mb-1.5">
                        <span className="font-semibold">{lang === 'vi' ? 'Loại xe buýt:' : 'Bus option:'}</span>
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                          {calculateLineLengthKm(line.stationIds, line.isLoop, stationMap) >= 25
                            ? (lang === 'vi' ? 'Đường Dài ($2)' : 'Long Route ($2)')
                            : (lang === 'vi' ? 'Nội Thành ($1)' : 'City Route ($1)')}
                        </span>
                      </div>

                      <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl border ${
                        isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-neutral-100 border-neutral-300'
                      }`}>
                        {/* Option 1: Xe buýt bình thường */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'standard_bus');
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                            line.type !== 'feeder_bus'
                              ? 'bg-amber-600 text-white shadow-xs ring-1 ring-amber-400'
                              : isDark
                              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                              : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
                          }`}
                        >
                          <span className="text-base">🚌</span>
                          <div className="flex flex-col text-left">
                            <span>{lang === 'vi' ? 'Xe buýt bth' : 'Regular Bus'}</span>
                            <span className="text-[9px] opacity-75 font-normal">6 chỗ • 0.80x</span>
                          </div>
                        </button>

                        {/* Option 2: Xe BRT */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'feeder_bus');
                          }}
                          className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 ${
                            line.type === 'feeder_bus'
                              ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-300'
                              : isDark
                              ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                              : 'text-neutral-700 hover:text-black hover:bg-neutral-200'
                          }`}
                        >
                          <span className="text-base">⚡</span>
                          <div className="flex flex-col text-left">
                            <span>{lang === 'vi' ? 'Xe BRT' : 'BRT Bus'}</span>
                            <span className="text-[9px] opacity-85 font-normal">4 chỗ • 0.90x</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                        <span>{lang === 'vi' ? 'Loại đoàn tàu:' : 'Train type:'}</span>
                        <span className="font-mono text-[9px] text-emerald-400 font-semibold">
                          {(line.type || 'metro') === 'high_speed'
                            ? (lang === 'vi' ? 'Tốc độ +80%' : '+80% speed')
                            : (line.type || 'metro') === 'double_decker'
                              ? (lang === 'vi' ? 'Tàu 2 Tầng (+20% tốc độ, 2x sức chứa)' : 'Double-Decker (+20% speed, 2x cap)')
                              : (line.type || 'metro') === 'intercity'
                                ? (lang === 'vi' ? 'Tốc độ +20%' : '+20% speed')
                                : (lang === 'vi' ? 'Tốc độ Chuẩn (1.0x)' : 'Standard (1.0x)')}
                        </span>
                      </div>
                      <div className={`grid grid-cols-4 gap-1 p-1 rounded-xl border ${isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-neutral-100 border-neutral-300'
                        }`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'metro');
                          }}
                          title={lang === 'vi' ? 'Metro: Tốc độ hiện tại (1.0x chuẩn)' : 'Metro: Standard baseline speed (1.0x)'}
                          className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${(line.type || 'metro') === 'metro'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                            }`}
                        >
                          <span className="text-xs">🚇</span>
                          <span className="truncate">Metro</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'intercity');
                          }}
                          title={lang === 'vi' ? 'Intercity: Nhanh hơn 20% so với metro' : 'Intercity: 20% faster than metro'}
                          className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${line.type === 'intercity'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                            }`}
                        >
                          <span className="text-xs">🚆</span>
                          <span className="truncate">Inter</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'high_speed');
                          }}
                          title={lang === 'vi' ? 'High Speed: Nhanh hơn 80% so với metro' : 'High Speed: 80% faster than metro'}
                          className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${line.type === 'high_speed'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                            }`}
                        >
                          <span className="text-xs">🚅</span>
                          <span className="truncate">H.Spd</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChangeLineType?.(line.id, 'double_decker');
                          }}
                          title={lang === 'vi' ? 'Tàu 2 Tầng: Tốc độ giống Intercity (+20%), sức chứa gấp đôi (12-24 khách)' : 'Double-Decker: +20% speed (like Intercity), 2x capacity'}
                          className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${line.type === 'double_decker'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                            }`}
                        >
                          <span className="text-xs">🏢</span>
                          <span className="truncate">2-Tầng</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Fleet & Carriages Controls Container */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/40">
                    {/* Train Dispatcher */}
                    <div className={`p-2 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/70 border-slate-700/70' : 'bg-white border-neutral-200'
                      }`}>
                      <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-1">
                        <div className="flex items-center gap-1">
                          {isBusLineType(line.type) ? (
                            <>
                              <span className="text-xs">🚌</span>
                              <span>{line.type === 'feeder_bus' ? 'Xe BRT' : (lang === 'vi' ? 'Xe buýt bth' : 'Regular Bus')}</span>
                            </>
                          ) : (
                            <>
                              <TrainIcon className="w-3 h-3 text-blue-400" />
                              <span>{lang === 'vi' ? 'Đoàn tàu' : 'Fleet'}</span>
                            </>
                          )}
                        </div>
                        {onRebalanceHeadway && trainsOnThisLine.length >= 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRebalanceHeadway(line.id);
                            }}
                            title={lang === 'vi' ? 'Điều tiết khoảng cách giãn cách đều giữa các phương tiện (Anti-Bunching)' : 'Rebalance equal headway (Anti-Bunching)'}
                            className="px-1.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer active:scale-95 transition"
                          >
                            <span>⚡</span>
                            <span>{lang === 'vi' ? 'Giãn cách' : 'Spacing'}</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        {/* Minus Train / Bus */}
                        <button
                          disabled={trainsOnThisLine.length === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTrain(line.id);
                          }}
                          title={
                            trainsOnThisLine.length > 0
                              ? (isBusLineType(line.type)
                                ? (lang === 'vi' ? 'Thu hồi 1 xe buýt về kho buýt' : 'Recall 1 bus to depot')
                                : (lang === 'vi' ? 'Thu hồi 1 tàu về kho dự phòng' : 'Recall 1 train to depot'))
                              : (isBusLineType(line.type)
                                ? (lang === 'vi' ? 'Tuyến này chưa có xe buýt chạy' : 'No bus on line')
                                : (lang === 'vi' ? 'Tuyến này chưa có tàu chạy' : 'No train on line'))
                          }
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${trainsOnThisLine.length > 0
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer active:scale-90'
                            : 'opacity-25 cursor-not-allowed text-neutral-500'
                            }`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        {/* Train / Bus Count */}
                        <span className="font-mono font-black text-xs sm:text-sm text-blue-400 px-1.5">
                          {trainsOnThisLine.length}
                        </span>

                        {/* Plus Train / Bus */}
                        <button
                          disabled={isBusLineType(line.type) ? (inventory.unassignedBuses ?? 0) <= 0 : inventory.unassignedTrains <= 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeployTrain(line.id);
                          }}
                          title={
                            isBusLineType(line.type)
                              ? (inventory.unassignedBuses ?? 0) > 0
                                ? (lang === 'vi' ? `Thêm 1 xe buýt vào tuyến (Kho còn ${inventory.unassignedBuses ?? 0} xe)` : `Deploy 1 bus (${inventory.unassignedBuses ?? 0} in depot)`)
                                : (lang === 'vi' ? 'Kho hết xe buýt! Mua thêm trong Shop' : 'Bus depot empty! Buy in Shop')
                              : inventory.unassignedTrains > 0
                                ? (lang === 'vi' ? `Thêm 1 tàu vào tuyến (Kho còn ${inventory.unassignedTrains} tàu)` : `Deploy 1 train (${inventory.unassignedTrains} in depot)`)
                                : (lang === 'vi' ? 'Kho hết tàu! Thu hồi từ tuyến khác hoặc mua trong Shop' : 'Depot empty! Recall or buy in Shop')
                          }
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${(isBusLineType(line.type) ? (inventory.unassignedBuses ?? 0) > 0 : inventory.unassignedTrains > 0)
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer active:scale-90'
                            : 'opacity-25 cursor-not-allowed text-neutral-500'
                            }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Carriage Dispatcher (Replaced for Bus) */}
                    {isBusLineType(line.type) ? (
                      <div className={`p-2 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                        }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs">🚌</span>
                            <span>{line.type === 'feeder_bus' ? 'Xe BRT (Nhanh)' : (lang === 'vi' ? 'Xe buýt bth' : 'Regular Bus')}</span>
                          </div>
                        </div>
                        <div className="text-[11px] font-bold text-amber-300 py-0.5">
                          {line.type === 'feeder_bus'
                            ? (lang === 'vi' ? '4 chỗ / Xe BRT' : '4 Cap / BRT')
                            : (lang === 'vi' ? '6 chỗ / Xe bth' : '6 Cap / Regular')}
                        </div>
                        <div className="text-[9px] text-amber-400/80 font-medium">
                          {line.type === 'feeder_bus'
                            ? (lang === 'vi' ? 'Tốc độ 0.90x • Làn ưu tiên' : '0.90x speed • Dedicated lane')
                            : (lang === 'vi' ? 'Tốc độ 0.80x • Làn hỗn hợp' : '0.80x speed • Mixed lane')}
                        </div>
                      </div>
                    ) : (
                      <div className={`p-2 rounded-xl border flex flex-col justify-between ${isDark ? 'bg-slate-900/70 border-slate-700/70' : 'bg-white border-neutral-200'
                        }`}>
                        <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-1">
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            <span>{lang === 'vi' ? 'Toa xe' : 'Carriages'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          {/* Minus Carriage */}
                          <button
                            disabled={carriagesOnThisLine === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveCarriage(line.id);
                            }}
                            title={
                              carriagesOnThisLine > 0
                                ? (lang === 'vi' ? 'Tháo 1 toa xe về kho' : 'Recall 1 carriage to depot')
                                : (lang === 'vi' ? 'Tuyến này chưa gắn toa xe thêm' : 'No extra carriage')
                            }
                            className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${carriagesOnThisLine > 0
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer active:scale-90'
                              : 'opacity-25 cursor-not-allowed text-neutral-500'
                              }`}
                          >
                            <Minus className="w-4 h-4" />
                          </button>

                          {/* Carriage Count */}
                          <span className="font-mono font-black text-xs sm:text-sm text-indigo-400 px-1.5">
                            {carriagesOnThisLine}
                          </span>

                          {/* Plus Carriage */}
                          {(() => {
                            const isDouble = line.type === 'double_decker';
                            const availableCarriages = inventory.carriages;
                            const hasStock = availableCarriages > 0;
                            const canAdd = hasStock && trainsOnThisLine.length > 0 && carriagesOnThisLine < maxCarriagesOnLine;
                            return (
                              <button
                                disabled={!canAdd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAddCarriage(line.id);
                                }}
                                title={
                                  trainsOnThisLine.length === 0
                                    ? (lang === 'vi' ? 'Cần có tàu chạy trên tuyến trước khi gắn toa' : 'Deploy train first')
                                    : hasStock && carriagesOnThisLine < maxCarriagesOnLine
                                      ? (lang === 'vi'
                                        ? (isDouble
                                          ? `Gắn 1 toa 2 tầng (+8 khách, kho còn ${availableCarriages})`
                                          : `Gắn 1 toa xe (+4 khách, kho còn ${availableCarriages})`)
                                        : (isDouble
                                          ? `Attach 1 double-decker carriage (+8 cap, ${availableCarriages} in depot)`
                                          : `Attach 1 carriage (+4 cap, ${inventory.carriages} in depot)`))
                                      : carriagesOnThisLine >= maxCarriagesOnLine
                                        ? (lang === 'vi' ? 'Đã tối đa 2 toa xe/mỗi tàu' : 'Max 2 carriages per train')
                                        : (lang === 'vi'
                                          ? (isDouble ? 'Kho hết toa 2 tầng ($350)! Mua trong Shop' : 'Kho hết toa xe! Mua thêm trong Shop')
                                          : (isDouble ? 'Depot empty! Buy double-decker carriage in Shop' : 'Depot empty! Buy in Shop'))
                                }
                                className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${canAdd
                                  ? (isDouble
                                    ? 'bg-sky-500/20 text-sky-300 hover:bg-sky-500 hover:text-white cursor-pointer active:scale-90'
                                    : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white cursor-pointer active:scale-90')
                                  : 'opacity-25 cursor-not-allowed text-neutral-500'
                                  }`}
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. Bottom Footer: Depot Inventory Counters & Shop Shortcut */}
        <div className={`p-3 border-t mt-auto space-y-2.5 ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-neutral-200 bg-neutral-50/90'
          }`}>
          {/* Quick Inventory Badges (Trains, BRT Buses, Carriages) */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {/* Spare Trains in Depot */}
            <div
              onClick={onOpenShop}
              title={lang === 'vi' ? 'Tàu dự phòng sẵn sàng phân bổ' : 'Spare trains in depot'}
              className={`p-2 rounded-xl border transition cursor-pointer ${isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500' : 'bg-white border-neutral-200 hover:border-neutral-400'
                }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] opacity-75 mb-0.5">
                <TrainIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>{lang === 'vi' ? 'Tàu' : 'Trains'}</span>
              </div>
              <div className="font-mono font-black text-sm text-purple-400">
                {inventory.unassignedTrains}
              </div>
            </div>

            {/* Spare BRT Buses in Depot */}
            <div
              onClick={onOpenShop}
              title={lang === 'vi' ? 'Xe buýt BRT dự phòng' : 'Spare BRT buses in depot'}
              className={`p-2 rounded-xl border transition cursor-pointer ${isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500' : 'bg-white border-neutral-200 hover:border-neutral-400'
                }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] opacity-75 mb-0.5">
                <span className="text-xs">🚌</span>
                <span>{lang === 'vi' ? 'Buýt' : 'Buses'}</span>
              </div>
              <div className="font-mono font-black text-sm text-amber-400">
                {inventory.unassignedBuses ?? 0}
              </div>
            </div>

            {/* Spare Carriages in Depot */}
            <div
              onClick={onOpenShop}
              title={lang === 'vi' ? 'Toa xe tiêu chuẩn trong kho' : 'Extra carriages in depot'}
              className={`p-2 rounded-xl border transition cursor-pointer ${isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500' : 'bg-white border-neutral-200 hover:border-neutral-400'
                }`}
            >
              <div className="flex items-center justify-center gap-1.5 text-[11px] opacity-75 mb-0.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>{lang === 'vi' ? 'Toa kho' : 'Cars'}</span>
              </div>
              <div className="font-mono font-black text-sm text-blue-400">
                {inventory.carriages}
              </div>
            </div>

          </div>

          {/* Inspector Route Trigger Button */}
          {onOpenInspector && (
            <button
              onClick={onOpenInspector}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-98"
            >
              <span>👮</span>
              <span>{lang === 'vi' ? 'Lập lộ trình Thanh tra Tuyến' : 'Line Inspector Itinerary'}</span>
            </button>
          )}

          {/* Shop Trigger Button */}
          <button
            onClick={onOpenShop}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Cửa hàng thiết bị (Shop)' : 'Equipment Shop'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
