import React, { useState } from 'react';
import {
  PlusCircle,
  Waves,
  Infinity as InfinityIcon,
  X,
  Trash2,
  RotateCcw,
  Sparkles,
  Dice5,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Maximize2,
  Sun,
  CloudRain,
  CloudLightning,
  AlertTriangle,
  Clock,
  FastForward,
  Rewind
} from 'lucide-react';
import { StationShape, TerrainToolMode, WeatherType } from '../types/game';

interface CreativeToolbarProps {
  isOpen: boolean;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  isUnlimitedMode: boolean;
  activeEditorTool: 'none' | 'add_station' | 'draw_river' | 'erase_water';
  selectedShape: StationShape;
  stationName: string;
  inProgressPointsCount: number;
  linesCount: number;
  availableLines: number;
  currentWeather?: WeatherType;
  onClose: () => void;
  onToggleUnlimitedMode: () => void;
  onSelectEditorTool: (tool: 'none' | 'add_station' | 'draw_river' | 'erase_water') => void;
  onSelectShape: (shape: StationShape) => void;
  onChangeStationName: (name: string) => void;
  onRandomizeStationName: () => void;
  onSpawnRandomStation: () => void;
  onFinishRiverDrawing: () => void;
  onClearAllRivers: () => void;
  onResetRivers: () => void;
  onAddQuickLine: () => void;
  onAddQuickTrain: () => void;
  onAddQuickCarriage: () => void;
  onSetWeather?: (weather: WeatherType) => void;
  onClearIncident?: () => void;
  currentTimeHours?: number;
  timeOffsetHours?: number;
  onAdjustTime?: (deltaHours: number) => void;
  onSetTimeOffset?: (offset: number) => void;
  onResetTimeOffset?: () => void;
  onUnlockAllStations?: () => void;
  onRestoreDefaultStations?: () => void;
}

const STATION_SHAPES: { shape: StationShape; symbol: string; vi: string; en: string }[] = [
  { shape: 'circle', symbol: '●', vi: 'Tròn', en: 'Circle' },
  { shape: 'triangle', symbol: '▲', vi: 'Tam Giác', en: 'Triangle' },
  { shape: 'square', symbol: '■', vi: 'Vuông', en: 'Square' },
  { shape: 'diamond', symbol: '◆', vi: 'Thoi', en: 'Diamond' },
  { shape: 'star', symbol: '★', vi: 'Sao', en: 'Star' },
  { shape: 'cross', symbol: '✚', vi: 'Thập', en: 'Cross' },
  { shape: 'pentagon', symbol: '⬟', vi: 'Ngũ Giác', en: 'Pentagon' },
];

export const CreativeToolbar: React.FC<CreativeToolbarProps> = ({
  isOpen,
  theme,
  lang,
  isUnlimitedMode,
  activeEditorTool,
  selectedShape,
  stationName,
  inProgressPointsCount,
  linesCount,
  availableLines,
  onClose,
  onToggleUnlimitedMode,
  onSelectEditorTool,
  onSelectShape,
  onChangeStationName,
  onRandomizeStationName,
  onSpawnRandomStation,
  onFinishRiverDrawing,
  onClearAllRivers,
  onResetRivers,
  onAddQuickLine,
  onAddQuickTrain,
  onAddQuickCarriage,
  currentWeather = 'sunny',
  onSetWeather,
  onClearIncident,
  currentTimeHours,
  timeOffsetHours = 0,
  onAdjustTime,
  onSetTimeOffset,
  onResetTimeOffset,
  onUnlockAllStations,
  onRestoreDefaultStations
}) => {
  const [activeTab, setActiveTab] = useState<'station' | 'terrain' | 'unlimited' | 'weather'>('station');
  const [isMinimized, setIsMinimized] = useState(false);
  const isDark = theme === 'dark';

  const formatTime = (hoursVal?: number) => {
    if (typeof hoursVal !== 'number') return '--:--';
    const totalMinutes = Math.floor(hoursVal * 60) % (24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed bottom-4 sm:bottom-20 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-2xl max-h-[85dvh] overflow-y-auto rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-200 select-none ${
      isDark
        ? 'bg-neutral-900/98 border-neutral-700/80 text-neutral-100 shadow-black/60'
        : 'bg-white/98 border-neutral-300 text-neutral-900 shadow-xl'
    }`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-neutral-700/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-linear-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white text-xs font-black shadow-xs shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className="font-extrabold text-xs tracking-wide truncate max-w-[140px] sm:max-w-none">
            {lang === 'vi' ? 'BỘ CÔNG CỤ SÁNG TẠO' : 'CREATIVE TOOLBAR'}
          </span>

          {/* Unlimited Mode Quick Pill */}
          <button
            onClick={onToggleUnlimitedMode}
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer shrink-0 ${
              isUnlimitedMode
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-xs'
                : 'bg-neutral-800/60 border-neutral-700 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <InfinityIcon className="w-3 h-3" />
            <span>{isUnlimitedMode ? (lang === 'vi' ? 'Vô hạn ray: BẬT' : 'Unlimited: ON') : (lang === 'vi' ? 'Vô hạn: TẮT' : 'Unlimited: OFF')}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setIsMinimized(m => !m)}
            className="p-1.5 rounded-lg hover:bg-neutral-800/50 text-neutral-400 hover:text-white transition cursor-pointer"
            title={isMinimized ? 'Mở rộng' : 'Thu nhỏ'}
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition cursor-pointer"
            title="Đóng công cụ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-3">
          {/* Tabs Selector */}
          <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('station');
                if (activeEditorTool === 'draw_river' || activeEditorTool === 'erase_water') {
                  onSelectEditorTool('add_station');
                }
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'station'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? '1. Ga' : '1. Stations'}</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('terrain');
                if (activeEditorTool === 'add_station') {
                  onSelectEditorTool('draw_river');
                }
              }}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'terrain'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? '2. Địa hình' : '2. Terrain'}</span>
            </button>

            <button
              onClick={() => setActiveTab('unlimited')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'unlimited'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? '3. Vô hạn' : '3. Sandbox'}</span>
            </button>

            <button
              onClick={() => setActiveTab('weather')}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                activeTab === 'weather'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark ? 'bg-neutral-800/80 text-neutral-300 hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              <span>{lang === 'vi' ? '4. Thời tiết & Giờ' : '4. Weather & Time'}</span>
            </button>
          </div>

          {/* TAB 1: ADD STATIONS */}
          {activeTab === 'station' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold opacity-70">
                    {lang === 'vi' ? 'Chọn hình dạng ga:' : 'Station Shape:'}
                  </span>
                  <div className="flex items-center gap-1">
                    {STATION_SHAPES.map(item => (
                      <button
                        key={item.shape}
                        onClick={() => onSelectShape(item.shape)}
                        title={lang === 'vi' ? item.vi : item.en}
                        className={`w-7 h-7 rounded-lg text-sm font-black flex items-center justify-center transition cursor-pointer ${
                          selectedShape === item.shape
                            ? 'bg-emerald-600 text-white shadow-sm scale-105 ring-2 ring-emerald-400'
                            : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                        }`}
                      >
                        {item.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Random Spawn Button */}
                <button
                  onClick={onSpawnRandomStation}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Tạo ga ngẫu nhiên' : 'Spawn Random'}</span>
                </button>
              </div>

              {/* Station Name Input with Randomizer */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => onChangeStationName(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nhập tên nhà ga...' : 'Enter station name...'}
                    className={`w-full px-3 py-1.5 text-xs font-semibold rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 ${
                      isDark ? 'bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500' : 'bg-neutral-50 border-neutral-300 text-black placeholder-neutral-400'
                    }`}
                  />
                  <button
                    onClick={onRandomizeStationName}
                    title="Đổi tên ngẫu nhiên"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-emerald-400 transition cursor-pointer"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tool toggle: Place on map */}
                <button
                  onClick={() => onSelectEditorTool(activeEditorTool === 'add_station' ? 'none' : 'add_station')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    activeEditorTool === 'add_station'
                      ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400'
                      : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{activeEditorTool === 'add_station' ? (lang === 'vi' ? 'Đang bật: Nhấp bản đồ' : 'Placing: Click Map') : (lang === 'vi' ? 'Đặt lên bản đồ' : 'Place on Map')}</span>
                </button>
              </div>

              {/* Station Pool & Preset Lines Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-700/50">
                <button
                  onClick={onRestoreDefaultStations}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border border-neutral-700"
                  title="Khôi phục lại các ga ban đầu từ bản đồ chuẩn"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'vi' ? 'Khôi phục ga gốc' : 'Restore Default'}</span>
                </button>

                <button
                  onClick={onUnlockAllStations}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Hiển thị ngay toàn bộ tất cả nhà ga của thành phố"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'vi' ? 'Mở khóa toàn bộ ga' : 'Unlock All'}</span>
                </button>
              </div>

              <div className="text-[11px] text-emerald-400/90 flex items-center gap-1 font-medium bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <span>💡</span>
                <span>{lang === 'vi' ? 'Bật "Đặt lên bản đồ" rồi nhấp chuột/chạm bất kỳ vị trí nào trên canvas để tạo ga mới!' : 'Click anywhere on the canvas to place your station!'}</span>
              </div>
            </div>
          )}

          {/* TAB 2: TERRAIN / RIVER SCULPTOR */}
          {activeTab === 'terrain' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onSelectEditorTool(activeEditorTool === 'draw_river' ? 'none' : 'draw_river')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    activeEditorTool === 'draw_river'
                      ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400'
                      : isDark ? 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5" />
                  <span>{activeEditorTool === 'draw_river' ? (lang === 'vi' ? 'Đang vẽ sông/hồ' : 'Drawing Water') : (lang === 'vi' ? 'Vẽ Sông/Hồ Mới' : 'Draw Water Body')}</span>
                </button>

                {inProgressPointsCount >= 3 && (
                  <button
                    onClick={onFinishRiverDrawing}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95 animate-pulse"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{lang === 'vi' ? `Hoàn tất khúc nước (${inProgressPointsCount} điểm)` : `Finish (${inProgressPointsCount} pts)`}</span>
                  </button>
                )}

                <button
                  onClick={() => onSelectEditorTool(activeEditorTool === 'erase_water' ? 'none' : 'erase_water')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    activeEditorTool === 'erase_water'
                      ? 'bg-red-600 text-white shadow-md ring-2 ring-red-400'
                      : isDark ? 'bg-neutral-800 text-red-400 hover:bg-neutral-700' : 'bg-neutral-100 text-red-600 hover:bg-neutral-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{activeEditorTool === 'erase_water' ? (lang === 'vi' ? 'Bấm vào sông để xóa' : 'Click river to delete') : (lang === 'vi' ? 'Tẩy Nước' : 'Erase River')}</span>
                </button>
              </div>

              {/* Terrain Presets & Resets */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={onClearAllRivers}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-red-500/20 text-neutral-300 hover:text-red-400 text-xs font-semibold transition cursor-pointer border border-neutral-700"
                >
                  {lang === 'vi' ? '🧹 Xóa sạch toàn bộ nước' : 'Clear All Rivers'}
                </button>

                <button
                  onClick={onResetRivers}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-neutral-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Khôi phục sông gốc' : 'Reset Default Rivers'}</span>
                </button>
              </div>

              <div className="text-[11px] text-cyan-400/90 flex items-center gap-1 font-medium bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
                <span>💡</span>
                <span>{lang === 'vi' ? 'Bật "Vẽ Sông/Hồ Mới", nhấp các điểm trên bản đồ tạo đường viền sông, sau đó bấm Hoàn tất để đổ nước!' : 'Click points on the canvas to outline rivers or lakes, then click Finish!'}</span>
              </div>
            </div>
          )}

          {/* TAB 3: UNLIMITED RAILS & SANDBOX */}
          {activeTab === 'unlimited' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3 rounded-xl border bg-amber-500/10 border-amber-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500 text-neutral-900 flex items-center justify-center font-black">
                    <InfinityIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-400">
                      {lang === 'vi' ? 'Chế độ Không Giới Hạn (Sandbox Mode)' : 'Unlimited Sandbox Mode'}
                    </div>
                    <div className="text-[10px] opacity-70">
                      {lang === 'vi' ? 'Không lo cạn tuyến ray, không lo hết tàu/toa, không lo quá tải game over!' : 'Unlimited lines, endless fleet, free tunnels, zero game-over pressure!'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onToggleUnlimitedMode}
                  className={`px-4 py-2 rounded-xl text-xs font-black shadow-md transition cursor-pointer active:scale-95 ${
                    isUnlimitedMode
                      ? 'bg-amber-500 text-neutral-900 hover:bg-amber-400 ring-2 ring-amber-300'
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                >
                  {isUnlimitedMode ? (lang === 'vi' ? 'ĐANG BẬT' : 'ENABLED') : (lang === 'vi' ? 'BẬT NGAY' : 'ENABLE')}
                </button>
              </div>

              {/* Quick Resource Spawners */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onAddQuickLine}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? '+ Tuyến Mới (Tự chọn màu)' : '+ Add Line'}</span>
                </button>

                <button
                  onClick={onAddQuickTrain}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚂</span>
                  <span>{lang === 'vi' ? '+ Thêm Tàu Mới' : '+ Add Train'}</span>
                </button>

                <button
                  onClick={onAddQuickCarriage}
                  className="flex-1 py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-400 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>🚃</span>
                  <span>{lang === 'vi' ? '+ Thêm Toa Kéo' : '+ Add Carriage'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: WEATHER & URBAN DISASTERS */}
          {activeTab === 'weather' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold opacity-70">
                  {lang === 'vi' ? 'Chọn điều kiện thời tiết & mô phỏng sự cố:' : 'Simulate weather condition & incidents:'}
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-400 font-bold border border-indigo-500/30">
                  {lang === 'vi' ? 'Hiện tại: ' : 'Current: '}
                  {currentWeather.toUpperCase()}
                </span>
              </div>

              {/* Weather Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onSetWeather?.('sunny')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentWeather === 'sunny'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-400/50'
                      : isDark ? 'bg-neutral-800/70 border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Sun className="w-5 h-5 text-amber-400" />
                    <span className="text-[10px] font-mono font-bold opacity-60">32°C</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">{lang === 'vi' ? '☀️ Nắng Ráo' : '☀️ Sunny'}</div>
                    <div className="text-[10px] opacity-70 leading-tight">
                      {lang === 'vi' ? 'Điều kiện chuẩn' : 'Standard'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onSetWeather?.('rainy')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentWeather === 'rainy'
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300 ring-2 ring-sky-400/50'
                      : isDark ? 'bg-neutral-800/70 border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CloudRain className="w-5 h-5 text-sky-400" />
                    <span className="text-[10px] font-mono font-bold opacity-60">24°C</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">{lang === 'vi' ? '🌧️ Mưa Vừa' : '🌧️ Rainy'}</div>
                    <div className="text-[10px] opacity-70 leading-tight text-sky-400 font-semibold">
                      {lang === 'vi' ? '+35% khách cần đi' : '+35% passengers'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onSetWeather?.('storm')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentWeather === 'storm'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-400/50'
                      : isDark ? 'bg-neutral-800/70 border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <CloudLightning className="w-5 h-5 text-purple-400" />
                    <span className="text-[10px] font-mono font-bold opacity-60">21°C</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">{lang === 'vi' ? '⛈️ Giông Bão' : '⛈️ Storm'}</div>
                    <div className="text-[10px] opacity-70 leading-tight text-purple-400 font-semibold">
                      {lang === 'vi' ? 'Mưa to & tiền thưởng' : 'Heavy rain & bonus'}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => onSetWeather?.('flooded')}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                    currentWeather === 'flooded'
                      ? 'bg-blue-600/25 border-blue-500 text-blue-300 ring-2 ring-blue-400/50'
                      : isDark ? 'bg-neutral-800/70 border-neutral-700 hover:bg-neutral-800 text-neutral-300' : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Waves className="w-5 h-5 text-blue-400" />
                    <span className="text-[10px] font-mono font-bold opacity-60">23°C</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold">{lang === 'vi' ? '🌊 Ngập Úng' : '🌊 Flooded'}</div>
                    <div className="text-[10px] opacity-70 leading-tight text-blue-400 font-semibold">
                      {lang === 'vi' ? 'Tốc độ tàu 0.55x' : 'Speed 0.55x'}
                    </div>
                  </div>
                </button>
              </div>

              {/* Clear / Drain Water Button */}
              {onClearIncident && (
                <button
                  type="button"
                  onClick={onClearIncident}
                  className="w-full py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 hover:text-white text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                >
                  <X className="w-3.5 h-3.5 text-rose-400" />
                  <span>
                    {lang === 'vi'
                      ? 'Bơm thoát nước & Khắc phục toàn bộ ngập úng'
                      : 'Drain Water & Resolve All Flooding'}
                  </span>
                </button>
              )}

              {/* SECTION: TIME OF DAY ADJUSTER [-1h to +2h] */}
              <div className={`p-3 rounded-xl border space-y-2.5 ${
                isDark ? 'bg-neutral-800/60 border-neutral-700/60 text-neutral-100' : 'bg-neutral-100/80 border-neutral-300 text-neutral-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold">
                      {lang === 'vi' ? 'Chỉnh thời gian trong ngày (Lùi 1h — Tiến 2h)' : 'Time Adjuster (-1h to +2h)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      🕒 {formatTime(currentTimeHours)}
                    </span>
                    <span className="text-[10px] font-mono opacity-70">
                      {timeOffsetHours >= 0 ? `+${timeOffsetHours.toFixed(1)}h` : `${timeOffsetHours.toFixed(1)}h`}
                    </span>
                  </div>
                </div>

                {/* Quick Step Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onAdjustTime?.(-1.0)}
                    disabled={timeOffsetHours <= -1.0}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-2xs'
                    }`}
                    title="-1 giờ"
                  >
                    <Rewind className="w-3 h-3" />
                    <span>-1h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustTime?.(-0.5)}
                    disabled={timeOffsetHours <= -1.0}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-2xs'
                    }`}
                    title="-30 phút"
                  >
                    <span>-30p</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onResetTimeOffset?.()}
                    className="py-1 px-2.5 rounded-lg text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 transition cursor-pointer flex items-center justify-center gap-1"
                    title="Đặt lại mốc chuẩn"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>0h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustTime?.(0.5)}
                    disabled={timeOffsetHours >= 2.0}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-2xs'
                    }`}
                    title="+30 phút"
                  >
                    <span>+30p</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustTime?.(1.0)}
                    disabled={timeOffsetHours >= 2.0}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-2xs'
                    }`}
                    title="+1 giờ"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>+1h</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAdjustTime?.(2.0)}
                    disabled={timeOffsetHours >= 2.0}
                    className={`flex-1 py-1 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isDark ? 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700 text-neutral-300' : 'bg-white hover:bg-neutral-50 border-neutral-300 text-neutral-700 shadow-2xs'
                    }`}
                    title="+2 giờ"
                  >
                    <FastForward className="w-3 h-3" />
                    <span>+2h</span>
                  </button>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-3 pt-0.5">
                  <span className="text-[10px] font-mono text-neutral-400">-1h</span>
                  <input
                    type="range"
                    min="-1.0"
                    max="2.0"
                    step="0.1"
                    value={timeOffsetHours}
                    onChange={(e) => onSetTimeOffset?.(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <span className="text-[10px] font-mono text-neutral-400">+2h</span>
                </div>
              </div>

              {/* Informative Hint Banner */}
              <div className="text-[11px] text-indigo-400/90 flex items-center gap-1.5 font-medium bg-indigo-500/10 px-3 py-2 rounded-xl border border-indigo-500/20">
                <AlertTriangle className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>
                  {lang === 'vi'
                    ? 'Thời tiết thay đổi tự nhiên theo ngày, nhưng bạn có thể dùng bảng này để kích hoạt ngay lập tức thử thách mưa ngập hoặc giông bão!'
                    : 'Weather shifts dynamically day by day. You can use this sandbox panel to instantly test flood or storm scenarios!'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
