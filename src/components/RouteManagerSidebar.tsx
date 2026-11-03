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
  Check
} from 'lucide-react';
import { MetroLine, GameInventory, Train, Station, StationShape, GameStats, MetroLineType } from '../types/game';

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
  onToggleCollapse: () => void;
  onSelectLine: (lineId: string | null) => void;
  onCreateNewLine: () => void;
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
  onOpenLineSettings?: (line: MetroLine) => void;
  onToggleLineDepot?: (lineId: string) => void;
  onRenameLine?: (lineId: string, newName: string) => void;
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
  onToggleCollapse,
  onSelectLine,
  onCreateNewLine,
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
  onOpenLineSettings,
  onToggleLineDepot,
  onRenameLine
}) => {
  const isDark = theme === 'dark';
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  const [editingLineId, setEditingLineId] = React.useState<string | null>(null);
  const [editingLineName, setEditingLineName] = React.useState<string>('');

  // When collapsed: render an ultra-sleek compact dock rail on the left
  if (isCollapsed) {
    return (
      <aside
        className={`w-12 sm:w-14 shrink-0 h-full flex flex-col items-center justify-between py-2.5 sm:py-3 border-r z-20 transition-all select-none ${
          isDark
            ? 'bg-slate-900/95 border-slate-800 text-slate-100 backdrop-blur-md'
            : 'bg-white/95 border-neutral-200 text-slate-800 backdrop-blur-md'
        }`}
      >
        {/* Top: Expand Toggle & Route Icon */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={onToggleCollapse}
            title={lang === 'vi' ? 'Mở rộng Quản lý Tuyến' : 'Expand Route Manager'}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition cursor-pointer active:scale-95 ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'bg-neutral-100 hover:bg-neutral-200 text-slate-800'
            }`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs bg-emerald-600/20 text-emerald-400"
            title={`${lines.length}/${inventory.availableLines} ${lang === 'vi' ? 'tuyến' : 'lines'}`}
          >
            <Route className="w-4 h-4" />
          </div>
        </div>

        {/* Middle: Lines vertical dot list (clicking opens color modal or selects) */}
        <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center gap-2.5 w-full scrollbar-none">
          {lines.map((line, idx) => {
            const isSelected = selectedLineId === line.id;
            const trainsCount = trains.filter(t => t.lineId === line.id).length;

            return (
              <button
                key={line.id}
                onClick={() => onSelectLine(isSelected ? null : line.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onEditLineColor(line, idx);
                }}
                title={`${line.name} (${line.stationIds.length} ga, ${trainsCount} tàu) - Nhấp chuột phải để đổi màu HEX`}
                style={{
                  backgroundColor: line.color,
                  color: line.textColor
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-transform relative cursor-pointer ${
                  isSelected ? 'ring-3 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                }`}
              >
                {idx + 1}
                {trainsCount > 0 && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-mono font-bold flex items-center justify-center border border-white/20">
                    {trainsCount}
                  </span>
                )}
              </button>
            );
          })}

          {lines.length < inventory.availableLines && (
            <button
              onClick={onCreateNewLine}
              title={lang === 'vi' ? 'Tạo tuyến metro mới' : 'Create new line'}
              className={`w-8 h-8 rounded-full border border-dashed flex items-center justify-center transition cursor-pointer ${
                isDark
                  ? 'border-slate-600 hover:border-emerald-500 hover:text-emerald-400'
                  : 'border-neutral-400 hover:border-emerald-600 hover:text-emerald-600'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          {/* Station builder trigger icon */}
          <button
            onClick={onStartPlacingStation}
            title={lang === 'vi' ? 'Xây ga tự do ($1,500/ga)' : 'Build custom station ($1,500)'}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer ${
              isPlacingStation
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
        className={`fixed md:relative inset-y-0 left-0 z-40 md:z-20 w-[85vw] max-w-sm md:w-84 shrink-0 h-full flex flex-col border-r transition-all select-none shadow-2xl md:shadow-none ${
          isDark
            ? 'bg-slate-900/98 border-slate-800 text-slate-100 backdrop-blur-md'
            : 'bg-white/98 border-neutral-200 text-slate-800 backdrop-blur-md'
        }`}
      >
      {/* 1. Header: Title, Line Count & Collapse Button */}
      <div className={`p-3.5 border-b flex items-center justify-between ${
        isDark ? 'border-slate-800 bg-slate-900/60' : 'border-neutral-200 bg-neutral-50/80'
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
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                isDark ? 'bg-slate-800 text-emerald-400' : 'bg-neutral-200 text-emerald-700'
              }`}>
                {lines.length}/{inventory.availableLines}
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
          className={`p-1.5 rounded-lg border transition cursor-pointer ${
            isDark
              ? 'bg-slate-800/80 border-slate-700 hover:bg-slate-700 text-slate-300'
              : 'bg-white border-neutral-300 hover:bg-neutral-100 text-slate-600'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Station Tools: Xây ga ($1,500) & Xóa ga */}
      <div className={`px-3 py-2 border-b flex items-center justify-between gap-2 ${
        isDark ? 'border-slate-800/80 bg-slate-900/40' : 'border-neutral-200/80 bg-neutral-50/60'
      }`}>
        <button
          onClick={onStartPlacingStation}
          title={lang === 'vi' ? 'Xây ga mới tự do trên bản đồ (1,500$)' : 'Place station ($1,500)'}
          className={`flex-1 py-1.5 px-2.5 rounded-lg font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 border ${
            isPlacingStation
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
      </div>

      {/* 3. Top Action: Create New Line Button */}
      <div className="px-3.5 pt-3 pb-1">
        {lines.length < inventory.availableLines ? (
          <button
            onClick={onCreateNewLine}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Tạo tuyến metro mới' : 'Create New Metro Line'}</span>
          </button>
        ) : (
          <div className={`w-full py-1.5 px-3 rounded-xl border text-center text-[11px] font-medium flex items-center justify-center gap-1.5 ${
            isDark ? 'bg-slate-800/50 border-slate-700/60 text-slate-400' : 'bg-neutral-100 border-neutral-200 text-neutral-500'
          }`}>
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              {lang === 'vi' ? 'Đã đạt tối đa số tuyến' : 'Max lines reached'}
            </span>
            <button
              onClick={onOpenShop}
              className="text-emerald-400 font-bold hover:underline ml-1"
            >
              {lang === 'vi' ? 'Mua thêm +' : 'Buy +'}
            </button>
          </div>
        )}
      </div>

      {/* 4. Scrollable Lines List */}
      <div className="flex-1 overflow-y-auto px-3.5 py-2 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700">
        {lines.length === 0 ? (
          <div className={`p-4 rounded-2xl border text-center my-4 ${
            isDark ? 'bg-slate-800/40 border-slate-800 text-slate-400' : 'bg-neutral-50 border-neutral-200 text-neutral-500'
          }`}>
            <Route className="w-8 h-8 mx-auto mb-2 text-emerald-500/70 opacity-60" />
            <p className="text-xs font-bold text-white mb-1">
              {lang === 'vi' ? 'Chưa có tuyến metro nào' : 'No metro lines yet'}
            </p>
            <p className="text-[11px] opacity-75 mb-2 leading-relaxed">
              {lang === 'vi'
                ? 'Nhấp hoặc kéo chuột giữa các nhà ga trên bản đồ để bắt đầu xây tuyến metro đầu tiên!'
                : 'Click or drag between stations on the map to build your first metro line!'}
            </p>
          </div>
        ) : (
          lines.map((line, idx) => {
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
                className={`rounded-2xl border p-3 transition-all cursor-pointer shadow-sm relative ${
                  isSelected
                    ? 'ring-2 ring-emerald-500/80 shadow-md ' +
                      (isDark ? 'bg-slate-800/90' : 'bg-emerald-50/40 border-emerald-400')
                    : isDark
                    ? 'bg-slate-800/50 border-slate-700/80 hover:border-slate-600 hover:bg-slate-800/80'
                    : 'bg-neutral-50/80 border-neutral-200 hover:border-neutral-300 hover:bg-white'
                }`}
              >
                {/* Line Header: Color Pill with Click to Change Color, Name, Loop Badge & Delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Line Badge (ẤN VÀO SỐ TUYẾN ĐỂ ĐỔI MÀU THEO HEX CODE) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLineColor(line, idx);
                      }}
                      title={lang === 'vi' ? 'Bấm vào số tuyến để đổi màu theo mã HEX' : 'Click line number to change color (HEX)'}
                      style={{ backgroundColor: line.color, color: line.textColor }}
                      className="w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-md shrink-0 hover:scale-115 active:scale-95 transition-transform cursor-pointer ring-1 ring-white/30"
                    >
                      {idx + 1}
                    </button>

                    {/* Line Name (Editable) */}
                    {editingLineId === line.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingLineName}
                          maxLength={30}
                          autoFocus
                          onChange={(e) => setEditingLineName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const trimmed = editingLineName.trim();
                              if (trimmed && onRenameLine) {
                                onRenameLine(line.id, trimmed);
                              }
                              setEditingLineId(null);
                            } else if (e.key === 'Escape') {
                              setEditingLineId(null);
                            }
                          }}
                          onBlur={() => {
                            const trimmed = editingLineName.trim();
                            if (trimmed && onRenameLine) {
                              onRenameLine(line.id, trimmed);
                            }
                            setEditingLineId(null);
                          }}
                          className="px-1.5 py-0.5 text-xs font-bold rounded bg-slate-900 border border-amber-400 text-white focus:outline-hidden w-28 shadow-inner"
                          placeholder={lang === 'vi' ? 'Tên tuyến...' : 'Line name...'}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = editingLineName.trim();
                            if (trimmed && onRenameLine) {
                              onRenameLine(line.id, trimmed);
                            }
                            setEditingLineId(null);
                          }}
                          className="p-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 group/name">
                        <span
                          className="font-bold text-xs truncate max-w-[110px] cursor-pointer hover:text-amber-300 transition-colors"
                          title={lang === 'vi' ? 'Bấm để đổi tên tuyến' : 'Click to rename line'}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLineId(line.id);
                            setEditingLineName(line.name);
                          }}
                        >
                          {line.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLineId(line.id);
                            setEditingLineName(line.name);
                          }}
                          title={lang === 'vi' ? 'Đổi tên tuyến' : 'Rename line'}
                          className="p-0.5 rounded opacity-40 group-hover/name:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px]"
                        >
                          <Pencil className="w-2.5 h-2.5 text-amber-300" />
                        </button>
                      </div>
                    )}

                    {/* Color Edit Button Shortcut */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditLineColor(line, idx);
                      }}
                      title={lang === 'vi' ? `Đổi màu tuyến (${line.color})` : `Edit line color (${line.color})`}
                      className="p-1 rounded-md opacity-50 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px]"
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
                      className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-slate-700/50 transition cursor-pointer text-[10px]"
                    >
                      <Settings className="w-3 h-3 text-amber-400" />
                    </button>

                    {/* Loop Indicator */}
                    {line.isLoop && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>{lang === 'vi' ? 'Vòng tròn' : 'Loop'}</span>
                      </span>
                    )}
                  </div>

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
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                    <span>{line.stationIds.length} {lang === 'vi' ? 'nhà ga' : 'stations'}</span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
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
                              className={`shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium text-[10px] border ${
                                isDark
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
                <div className={`mb-2.5 p-2 rounded-xl border ${
                  isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-neutral-100/90 border-neutral-300'
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
                      className={`flex-1 min-w-0 py-1.5 px-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95 border ${
                        line.isDepotRecalled
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
                      className={`px-1.5 py-1 rounded-lg font-mono text-[9px] font-bold shrink-0 whitespace-nowrap border ${
                        dockedTrainsCount > 0
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      🏢 {dockedTrainsCount}/{trainsOnThisLine.length}
                    </span>
                  </div>
                </div>

                {/* Line Type Selector: Metro (1.0x) | Intercity (+20%) | High Speed (+80%) */}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-[10px] opacity-70 mb-1">
                    <span>{lang === 'vi' ? 'Loại tuyến:' : 'Line type:'}</span>
                    <span className="font-mono text-[9px] text-emerald-400 font-semibold">
                      {(line.type || 'metro') === 'high_speed'
                        ? (lang === 'vi' ? 'Tốc độ +80%' : '+80% speed')
                        : (line.type || 'metro') === 'double_decker'
                        ? (lang === 'vi' ? 'Tàu 2 Tầng (+20% tốc độ, 2x sức chứa)' : 'Double-Decker (+20% speed, 2x cap)')
                        : (line.type || 'metro') === 'intercity'
                        ? (lang === 'vi' ? 'Tốc độ +20%' : '+20% speed')
                        : (line.type || 'metro') === 'feeder_bus'
                        ? (lang === 'vi' ? 'Buýt BRT (6 chỗ/xe, -10% tốc độ, qua cầu miễn phí)' : 'BRT Bus (6 cap/bus, -10% speed, free bridges)')
                        : (lang === 'vi' ? 'Tốc độ Chuẩn (1.0x)' : 'Standard (1.0x)')}
                    </span>
                  </div>
                  <div className={`grid grid-cols-5 gap-1 p-1 rounded-xl border ${
                    isDark ? 'bg-slate-900/60 border-slate-700/60' : 'bg-neutral-100 border-neutral-300'
                  }`}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeLineType?.(line.id, 'metro');
                      }}
                      title={lang === 'vi' ? 'Metro: Tốc độ hiện tại (1.0x chuẩn)' : 'Metro: Standard baseline speed (1.0x)'}
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        (line.type || 'metro') === 'metro'
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
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        line.type === 'intercity'
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
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        line.type === 'high_speed'
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
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        line.type === 'double_decker'
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                      }`}
                    >
                      <span className="text-xs">🏢</span>
                      <span className="truncate">2-Tầng</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onChangeLineType?.(line.id, 'feeder_bus');
                      }}
                      title={lang === 'vi' ? 'Buýt BRT: Tốc độ chậm hơn metro 10% (0.90x), qua cầu đường bộ vượt sông MIỄN PHÍ không tốn Hầm' : 'Feeder BRT: 10% slower, free bridge river crossing'}
                      className={`py-1 px-0.5 rounded-lg text-[9px] font-bold flex flex-col items-center justify-center gap-0.5 transition cursor-pointer ${
                        line.type === 'feeder_bus'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'opacity-60 hover:opacity-100 hover:bg-slate-700/30'
                      }`}
                    >
                      <span className="text-xs">🚌</span>
                      <span className="truncate">BRT</span>
                    </button>
                  </div>
                </div>

                {/* Fleet & Carriages Controls Container */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-700/40">
                  {/* Train Dispatcher */}
                  <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                    isDark ? 'bg-slate-900/70 border-slate-700/70' : 'bg-white border-neutral-200'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-80 mb-1">
                      <div className="flex items-center gap-1">
                        <TrainIcon className="w-3 h-3 text-blue-400" />
                        <span>{lang === 'vi' ? 'Đoàn tàu' : 'Fleet'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Minus Train */}
                      <button
                        disabled={trainsOnThisLine.length === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrain(line.id);
                        }}
                        title={
                          trainsOnThisLine.length > 0
                            ? (lang === 'vi' ? 'Thu hồi 1 tàu về kho dự phòng' : 'Recall 1 train to depot')
                            : (lang === 'vi' ? 'Tuyến này chưa có tàu chạy' : 'No train on line')
                        }
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${
                          trainsOnThisLine.length > 0
                            ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer active:scale-90'
                            : 'opacity-25 cursor-not-allowed text-neutral-500'
                        }`}
                      >
                        <Minus className="w-4 h-4" />
                      </button>

                      {/* Train Count */}
                      <span className="font-mono font-black text-xs sm:text-sm text-blue-400 px-1.5">
                        {trainsOnThisLine.length}
                      </span>

                      {/* Plus Train */}
                      <button
                        disabled={inventory.unassignedTrains <= 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeployTrain(line.id);
                        }}
                        title={
                          inventory.unassignedTrains > 0
                            ? (lang === 'vi' ? `Thêm 1 tàu vào tuyến (Kho còn ${inventory.unassignedTrains} tàu)` : `Deploy 1 train (${inventory.unassignedTrains} in depot)`)
                            : (lang === 'vi' ? 'Kho hết tàu! Thu hồi từ tuyến khác hoặc mua trong Shop' : 'Depot empty! Recall or buy in Shop')
                        }
                        className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${
                          inventory.unassignedTrains > 0
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer active:scale-90'
                            : 'opacity-25 cursor-not-allowed text-neutral-500'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Carriage Dispatcher (Replaced for BRT) */}
                  {line.type === 'feeder_bus' ? (
                    <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-amber-950/20 border-amber-500/30' : 'bg-amber-50/70 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 mb-1">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">🚌</span>
                          <span>{lang === 'vi' ? 'Quy chuẩn BRT' : 'BRT Standard'}</span>
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-amber-300 py-0.5">
                        {lang === 'vi' ? '6 chỗ / Xe đơn' : '6 Cap / Single Bus'}
                      </div>
                      <div className="text-[9px] text-amber-400/80 font-medium">
                        {lang === 'vi' ? 'Không gắn toa phụ' : 'No extra carriages'}
                      </div>
                    </div>
                  ) : (
                    <div className={`p-2 rounded-xl border flex flex-col justify-between ${
                      isDark ? 'bg-slate-900/70 border-slate-700/70' : 'bg-white border-neutral-200'
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
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${
                            carriagesOnThisLine > 0
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
                        <button
                          disabled={inventory.carriages <= 0 || trainsOnThisLine.length === 0 || carriagesOnThisLine >= maxCarriagesOnLine}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddCarriage(line.id);
                          }}
                          title={
                            trainsOnThisLine.length === 0
                              ? (lang === 'vi' ? 'Cần có tàu chạy trên tuyến trước khi gắn toa' : 'Deploy train first')
                              : inventory.carriages > 0 && carriagesOnThisLine < maxCarriagesOnLine
                              ? (lang === 'vi' ? `Gắn 1 toa xe (+4 khách, kho còn ${inventory.carriages})` : `Attach 1 carriage (+4 cap, ${inventory.carriages} in depot)`)
                              : carriagesOnThisLine >= maxCarriagesOnLine
                              ? (lang === 'vi' ? 'Đã tối đa 2 toa xe/mỗi tàu' : 'Max 2 carriages per train')
                              : (lang === 'vi' ? 'Kho hết toa xe! Mua thêm trong Shop' : 'Depot empty! Buy in Shop')
                          }
                          className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg font-bold transition touch-manipulation ${
                            inventory.carriages > 0 && trainsOnThisLine.length > 0 && carriagesOnThisLine < maxCarriagesOnLine
                              ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500 hover:text-white cursor-pointer active:scale-90'
                              : 'opacity-25 cursor-not-allowed text-neutral-500'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
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
      <div className={`p-3 border-t mt-auto space-y-2.5 ${
        isDark ? 'border-slate-800 bg-slate-900/90' : 'border-neutral-200 bg-neutral-50/90'
      }`}>
        {/* Quick Inventory Badges (Trains, Carriages, Double-Decker) */}
        <div className={`grid ${(inventory.doubleDeckerTrains ?? 0) > 0 ? 'grid-cols-3' : 'grid-cols-2'} gap-2 text-center`}>
          {/* Spare Trains in Depot */}
          <div
            onClick={onOpenShop}
            title={lang === 'vi' ? 'Tàu dự phòng sẵn sàng phân bổ' : 'Spare trains in depot'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500' : 'bg-white border-neutral-200 hover:border-neutral-400'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-[11px] opacity-75 mb-0.5">
              <TrainIcon className="w-3.5 h-3.5 text-purple-400" />
              <span>{lang === 'vi' ? 'Tàu chờ' : 'Trains'}</span>
            </div>
            <div className="font-mono font-black text-sm text-purple-400">
              {inventory.unassignedTrains}
            </div>
          </div>

          {/* Spare Carriages in Depot */}
          <div
            onClick={onOpenShop}
            title={lang === 'vi' ? 'Toa xe bổ sung trong kho' : 'Extra carriages in depot'}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isDark ? 'bg-slate-800/60 border-slate-700/60 hover:border-slate-500' : 'bg-white border-neutral-200 hover:border-neutral-400'
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

          {/* Double-Decker Trains (if unlocked/purchased) */}
          {(inventory.doubleDeckerTrains ?? 0) > 0 && (
            <div
              onClick={onOpenShop}
              title={lang === 'vi' ? 'Tàu 2 tầng sẵn sàng (Sức chứa x2)' : 'Double-decker trains in stock'}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'bg-amber-950/30 border-amber-500/40 hover:border-amber-400' : 'bg-amber-50 border-amber-300 hover:border-amber-500'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-500 font-semibold mb-0.5">
                <span>2-Tầng</span>
              </div>
              <div className="font-mono font-black text-sm text-amber-500">
                {inventory.doubleDeckerTrains}
              </div>
            </div>
          )}
        </div>

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
