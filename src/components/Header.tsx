import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  HelpCircle,
  ShoppingBag,
  Flame,
  Users,
  DollarSign,
  Train as TrainIcon,
  Globe,
  Compass,
  Check,
  RotateCcw,
  Trophy,
  Spline,
  Route,
  Sparkles,
  Unlock,
  Eye,
  EyeOff,
  User,
  AlertTriangle,
  ShieldCheck,
  Building2,
  Plus,
  Landmark,
  Target,
  X
} from 'lucide-react';
import { GameMode, CityMapConfig, WeatherState, UrbanIncident, UrbanSurgeEvent } from '../types/game';
import { formatMoney, TrackRoutingStyle } from '../utils/geometry';
import { DAY_NAMES_VI, DAY_NAMES_EN } from '../simulation/metroEngine';
import { UserProfile } from '../services/firebase';

interface HeaderProps {
  cityName: string;
  timeOfDayHours: number;
  currentDayIndex: number;
  weekNumber: number;
  money: number;
  passengersDelivered: number;
  activeTrains: number;
  totalTrains: number;
  gameSpeed: number;
  isRushHour: boolean;
  weather?: WeatherState;
  activeIncident?: UrbanIncident | null;
  gameMode: GameMode;
  theme: 'dark' | 'light';
  isMuted: boolean;
  lang: 'vi' | 'en';
  cityMaps: CityMapConfig[];
  currentCityId: string;
  highScore?: { bestPassengers: number; bestDays: number };
  isSaved?: boolean;
  trackStyle?: TrackRoutingStyle;
  hideStationIcons?: boolean;
  hidePassengerCount?: boolean;
  disableIncidents?: boolean;
  onSetSpeed: (speed: number) => void;
  onToggleTheme: () => void;
  onToggleMute: () => void;
  onToggleLang: () => void;
  onToggleGameMode: () => void;
  onToggleTrackStyle?: () => void;
  onToggleCreativeToolbar?: () => void;
  onUnlockAllStations?: () => void;
  onToggleHideStationIcons?: () => void;
  onToggleHidePassengerCount?: () => void;
  onToggleDisableIncidents?: () => void;
  onResetGame: () => void;
  onOpenTutorial: () => void;
  onOpenShop: () => void;
  onSelectCity: (cityId: string) => void;
  currentUser?: UserProfile | null;
  onOpenStartMenu?: () => void;
  onOpenAuth?: () => void;
  onDismissIncident?: () => void;
  onOpenCityManager?: () => void;
  citizenSatisfaction?: number;
  activeSurgeEvent?: UrbanSurgeEvent | null;
  onOpenBank?: () => void;
  onOpenInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  cityName,
  timeOfDayHours,
  currentDayIndex,
  weekNumber,
  money,
  passengersDelivered,
  activeTrains,
  totalTrains,
  gameSpeed,
  isRushHour,
  weather: _weather,
  activeIncident,
  citizenSatisfaction,
  activeSurgeEvent,
  onOpenBank,
  gameMode,
  theme,
  isMuted,
  lang,
  cityMaps,
  currentCityId,
  highScore,
  isSaved,
  trackStyle = 'octolinear',
  hideStationIcons = false,
  hidePassengerCount = false,
  disableIncidents = false,
  onSetSpeed,
  onToggleTheme,
  onToggleMute,
  onToggleLang,
  onToggleGameMode,
  onToggleTrackStyle,
  onToggleCreativeToolbar,
  onUnlockAllStations,
  onToggleHideStationIcons,
  onToggleHidePassengerCount,
  onToggleDisableIncidents,
  onResetGame,
  onOpenTutorial,
  onOpenShop,
  onSelectCity,
  currentUser,
  onOpenStartMenu,
  onOpenAuth,
  onDismissIncident,
  onOpenCityManager,
  onOpenInspector
}) => {
  const isDark = theme === 'dark';
  const dayName = lang === 'vi' ? DAY_NAMES_VI[currentDayIndex] : DAY_NAMES_EN[currentDayIndex];

  // 3-dot dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Format 24h clock to HH:MM
  const totalMinutes = Math.floor(timeOfDayHours * 60) % (24 * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  return (
    <header className={`h-13 px-3 sm:px-5 flex items-center justify-between border-b transition-colors select-none z-30 shrink-0 gap-2 sm:gap-4 ${
      isDark ? 'bg-[#252528]/98 border-[#38383e] text-neutral-100 backdrop-blur-xl' : 'bg-[#FAF9F6]/98 border-[#E2E0D8] text-neutral-900 backdrop-blur-xl'
    }`}>
      {/* Left: Brand / Return to Menu & City Selector */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {onOpenStartMenu ? (
            <button
              type="button"
              onClick={onOpenStartMenu}
              title={lang === 'vi' ? 'Quay lại Menu chính' : 'Return to Main Menu'}
              className="flex items-center gap-2 group cursor-pointer"
            >
              <span className="px-3 py-1.5 rounded-xl bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-xs tracking-wider uppercase transition shadow-sm flex items-center gap-1.5 active:scale-95">
                <span className="text-sm leading-none">←</span>
                <span>MENU</span>
              </span>
              <span className={`font-extrabold text-sm tracking-tight hidden md:inline-flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                <span>MINI METRO</span>
                <span className="w-2.5 h-2.5 rounded-xs bg-current inline-block opacity-80" />
                <span className="text-[11px] font-mono leading-none">▲</span>
              </span>
            </button>
          ) : (
            <div className={`font-extrabold text-sm tracking-tight flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <span>MINI METRO</span>
              <span className="w-2.5 h-2.5 rounded-xs bg-current inline-block opacity-80" />
              <span className="text-[11px] font-mono leading-none">▲</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 ml-1">
            {/* City Selector */}
            <select
              value={currentCityId}
              onChange={(e) => onSelectCity(e.target.value)}
              className={`text-xs font-bold cursor-pointer px-2.5 py-1 rounded-lg border transition max-w-[95px] sm:max-w-none truncate ${
                isDark
                  ? 'bg-[#202023] border-[#38383e] text-emerald-400 hover:border-[#3b82f6]'
                  : 'bg-white border-[#E2E0D8] text-emerald-700 hover:border-[#3b82f6]'
              }`}
            >
              {cityMaps.map(m => (
                <option key={m.id} value={m.id} className={isDark ? 'bg-[#252528] text-white' : 'bg-white text-neutral-900'}>
                  {lang === 'vi' ? m.nameVi : m.nameEn}{m.isCustom ? ' (Tùy chỉnh)' : ''}
                </option>
              ))}
            </select>

            {onOpenCityManager && (
              <button
                type="button"
                onClick={onOpenCityManager}
                title={lang === 'vi' ? 'Quản lý & Tạo thành phố mới' : 'Manage & Create cities'}
                className="p-1 -ml-0.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition cursor-pointer flex items-center justify-center shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Rush Hour Indicator - Minimalist */}
        {isRushHour && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
            <Flame className="w-3 h-3 fill-amber-400 animate-pulse" />
            <span className="hidden sm:inline">{lang === 'vi' ? 'Cao điểm' : 'Rush'}</span>
          </div>
        )}

        {/* Active Incident Alert - Clean */}
        {activeIncident && (
          <div
            className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0"
            title={lang === 'vi' ? activeIncident.descriptionVi : activeIncident.descriptionEn}
          >
            <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
            <span className="hidden xl:inline">{lang === 'vi' ? activeIncident.titleVi : activeIncident.titleEn}</span>
            {onDismissIncident && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismissIncident();
                }}
                className="ml-0.5 p-0.5 rounded-full hover:bg-rose-500/30 text-rose-300 hover:text-white transition cursor-pointer"
                title={lang === 'vi' ? 'Khắc phục ngay' : 'Dismiss'}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Center: Essential Clean Metrics */}
      <div className="flex items-center gap-3 sm:gap-6 md:gap-8 shrink-0 text-xs">
        {/* Day & Clock */}
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-medium hidden sm:inline ${isDark ? 'text-slate-400' : 'text-neutral-500'}`}>
            {dayName} · {lang === 'vi' ? `T${weekNumber}` : `W${weekNumber}`}
          </span>
          <span className={`font-mono font-bold sm:text-xs text-[11px] ${isDark ? 'text-slate-100' : 'text-neutral-900'}`}>
            {timeString}
          </span>
        </div>

        <div className={`h-3 w-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'} hidden sm:block`} />

        {/* Money */}
        <div className="flex items-center gap-1" title={lang === 'vi' ? 'Ngân sách hiện tại' : 'Current budget'}>
          <span className="font-mono font-bold text-emerald-500 text-xs sm:text-sm">
            {formatMoney(money)}
          </span>
        </div>

        <div className={`h-3 w-px ${isDark ? 'bg-neutral-800' : 'bg-neutral-300'} hidden sm:block`} />

        {/* Passengers */}
        <div className={`flex items-center gap-1 ${isDark ? 'text-slate-200' : 'text-neutral-800'}`} title={lang === 'vi' ? 'Tổng hành khách đã vận chuyển' : 'Total passengers delivered'}>
          <Users className="w-3.5 h-3.5 text-blue-500 opacity-90" />
          <span className="font-mono font-bold text-xs">
            {passengersDelivered.toLocaleString()}
          </span>
        </div>

        {/* Active Trains */}
        <div className={`hidden lg:flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-neutral-700'}`} title={lang === 'vi' ? 'Đoàn tàu đang chạy / tổng số tàu' : 'Fleet in service / total'}>
          <TrainIcon className="w-3.5 h-3.5 text-purple-500 opacity-90" />
          <span className="font-mono font-medium text-xs">
            {activeTrains}/{totalTrains}
          </span>
        </div>

      </div>

      {/* Right: Speed Controls & Minimal 3-Dots Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Speed Controls (Clean Segmented Pill) */}
        <div className={`flex items-center rounded-xl p-0.5 border ${
          isDark ? 'bg-[#202023] border-[#38383e]' : 'bg-white border-[#E2E0D8]'
        }`}>
          <button
            onClick={() => onSetSpeed(gameSpeed === 0 ? 1 : 0)}
            title={gameSpeed === 0 ? (lang === 'vi' ? 'Tiếp tục' : 'Resume') : (lang === 'vi' ? 'Tạm dừng' : 'Pause')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              gameSpeed === 0 ? 'bg-amber-500 text-white font-bold shadow-xs' : 'opacity-60 hover:opacity-100'
            }`}
          >
            {gameSpeed === 0 ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
          </button>

          {/* Mobile Speed Cycle Badge */}
          <button
            onClick={() => {
              const next = gameSpeed === 0 ? 1 : gameSpeed === 1 ? 2 : gameSpeed === 2 ? 3 : 1;
              onSetSpeed(next);
            }}
            className="sm:hidden px-1.5 py-0.5 text-[11px] font-mono font-bold text-[#3b82f6] cursor-pointer"
            title="Đổi tốc độ game"
          >
            {gameSpeed === 0 ? 'PAUSE' : `${gameSpeed}x`}
          </button>

          {/* Desktop full buttons */}
          <button
            onClick={() => onSetSpeed(1)}
            className={`hidden sm:block px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
              gameSpeed === 1 ? 'bg-[#3b82f6] text-white shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
          >
            1x
          </button>
          <button
            onClick={() => onSetSpeed(2)}
            className={`hidden sm:block px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
              gameSpeed === 2 ? 'bg-[#3b82f6] text-white shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
          >
            2x
          </button>
          <button
            onClick={() => onSetSpeed(3)}
            className={`hidden sm:block px-2.5 py-0.5 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
              gameSpeed === 3 ? 'bg-[#3b82f6] text-white shadow-sm' : 'opacity-70 hover:opacity-100'
            }`}
          >
            3x
          </button>
        </div>

        {/* Shop Quick Button */}
        <button
          type="button"
          onClick={onOpenShop}
          title={lang === 'vi' ? 'Cửa hàng thiết bị (Shop)' : 'Equipment Shop'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer shrink-0 ${
            isDark
              ? 'bg-[#202023] border-[#38383e] hover:border-emerald-500 text-emerald-400'
              : 'bg-white border-[#E2E0D8] hover:border-emerald-600 text-emerald-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span className="text-[11px] hidden lg:inline">{lang === 'vi' ? 'Cửa hàng' : 'Shop'}</span>
        </button>

        {/* User Account / Cloud Sync Badge */}
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            title={currentUser
              ? `${lang === 'vi' ? 'Tài khoản:' : 'Account:'} ${currentUser.username} (${lang === 'vi' ? 'Đã đồng bộ đám mây' : 'Cloud Synced'})`
              : (lang === 'vi' ? 'Đăng nhập để đồng bộ đám mây' : 'Log in to sync with Cloud')}
            className={`flex items-center gap-1 sm:gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold border transition cursor-pointer shrink-0 ${
              currentUser
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                : 'bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono max-w-[70px] truncate">
              {currentUser ? currentUser.username : (lang === 'vi' ? 'Đăng nhập' : 'Login')}
            </span>
            {currentUser ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="hidden sm:inline text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-300">
                LOCAL
              </span>
            )}
          </button>
        )}

        {/* Quick Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={isDark ? (lang === 'vi' ? 'Chuyển sang Chế độ Sáng' : 'Switch to Light Theme') : (lang === 'vi' ? 'Chuyển sang Chế độ Tối' : 'Switch to Dark Theme')}
          className={`p-1.5 sm:p-2 rounded-lg border transition cursor-pointer flex items-center justify-center shrink-0 ${
            isDark
              ? 'bg-[#2a2a2e] border-[#38383e] hover:bg-[#34343a] text-amber-400'
              : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-purple-600'
          }`}
        >
          {isDark ? <Sun className="w-3.5 h-3.5 fill-amber-400/20" /> : <Moon className="w-3.5 h-3.5 fill-purple-600/20" />}
        </button>

        {/* Quick Language Toggle */}
        <button
          onClick={onToggleLang}
          title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
          className={`flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg border text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
            isDark
              ? 'bg-[#2a2a2e] border-[#38383e] hover:bg-[#34343a] text-cyan-400'
              : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-cyan-700'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>{lang === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* The 3-Dots (...) Button for Secondary Actions */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            title={lang === 'vi' ? 'Cài đặt & Tùy chọn khác' : 'More Options'}
            className={`p-2 rounded-lg border transition cursor-pointer flex items-center justify-center shrink-0 ${
              isMenuOpen
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : isDark
                ? 'bg-[#2a2a2e] border-[#38383e] hover:bg-[#34343a] text-slate-300 hover:text-white'
                : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-slate-700'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu Popover */}
          {isMenuOpen && (
            <div className={`absolute right-0 mt-2 w-64 max-w-[92vw] max-h-[80dvh] overflow-y-auto rounded-xl p-2 border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${
              isDark ? 'bg-[#252528] border-[#38383e] text-neutral-100' : 'bg-[#FAF9F6] border-[#E2E0D8] text-neutral-900'
            }`}>
              {/* City Manager & Creator */}
              {onOpenCityManager && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenCityManager();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-emerald-400" />
                    <span>{lang === 'vi' ? 'Quản lý & Tạo thành phố' : 'City Manager & Creator'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    +{cityMaps.filter(c => c.isCustom).length || 0}
                  </span>
                </button>
              )}

              {/* Metro Line Inspector Trigger */}
              {onOpenInspector && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenInspector();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-amber-50 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">👮</span>
                    <span>{lang === 'vi' ? 'Thanh tra Tuyến (Thưởng $300/ga)' : 'Line Inspector ($300/st)'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    +$1,500+
                  </span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={onToggleMute}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
                  <span>{lang === 'vi' ? 'Âm thanh' : 'Audio Sound'}</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">
                  {isMuted ? (lang === 'vi' ? 'TẮT' : 'OFF') : (lang === 'vi' ? 'BẬT' : 'ON')}
                </span>
              </button>

              {/* Theme Toggle */}
              <button
                onClick={onToggleTheme}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
                  <span>{lang === 'vi' ? 'Giao diện' : 'Appearance'}</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">
                  {isDark ? (lang === 'vi' ? 'Tối' : 'Dark') : (lang === 'vi' ? 'Sáng' : 'Light')}
                </span>
              </button>

              {/* Language Switch */}
              <button
                onClick={onToggleLang}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>{lang === 'vi' ? 'Ngôn ngữ' : 'Language'}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {lang === 'vi' ? 'Tiếng Việt' : 'English'}
                </span>
              </button>

              {/* Switch Game Mode: Standard vs Zen vs Creative vs Rush Hour */}
              <button
                onClick={onToggleGameMode}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>{lang === 'vi' ? 'Chế độ chơi' : 'Game Mode'}</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400">
                  {gameMode === 'standard'
                    ? (lang === 'vi' ? 'Tiêu chuẩn (2x)' : 'Standard (2x)')
                    : gameMode === 'zen'
                    ? (lang === 'vi' ? 'Thư giãn (Zen)' : 'Zen')
                    : (lang === 'vi' ? 'Cao điểm' : 'Rush Hour')}
                </span>
              </button>

              {/* Creative Toolbar Trigger */}
              {onToggleCreativeToolbar && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onToggleCreativeToolbar();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-neutral-100 text-amber-600'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'vi' ? 'Bộ công cụ Sáng tạo & Địa hình' : 'Creative & Terrain Tools'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                    {lang === 'vi' ? 'Mở' : 'Open'}
                  </span>
                </button>
              )}

              {/* Track Routing Style Switch */}
              {onToggleTrackStyle && (
                <button
                  onClick={onToggleTrackStyle}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {trackStyle === 'curved' ? (
                      <Spline className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <Route className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{lang === 'vi' ? 'Kiểu đường ray' : 'Track Style'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {trackStyle === 'curved'
                      ? (lang === 'vi' ? 'Cong mượt' : 'Curved')
                      : trackStyle === 'octolinear'
                      ? (lang === 'vi' ? 'Gấp khúc 45°' : 'Octolinear')
                      : (lang === 'vi' ? 'Thẳng' : 'Straight')}
                  </span>
                </button>
              )}

              {/* Toggle Hide Station Icons */}
              {onToggleHideStationIcons && (
                <button
                  onClick={onToggleHideStationIcons}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {hideStationIcons ? (
                      <EyeOff className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>{lang === 'vi' ? 'Ẩn icon các nhà ga' : 'Hide Station Icons'}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    hideStationIcons
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}>
                    {hideStationIcons
                      ? (lang === 'vi' ? 'ĐANG ẨN' : 'HIDDEN')
                      : (lang === 'vi' ? 'HIỆN' : 'SHOWN')}
                  </span>
                </button>
              )}

              {/* Toggle Hide Passenger Count */}
              {onToggleHidePassengerCount && (
                <button
                  onClick={onToggleHidePassengerCount}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {hidePassengerCount ? (
                      <EyeOff className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Users className="w-4 h-4 text-blue-400" />
                    )}
                    <span>{lang === 'vi' ? 'Ẩn số lượng khách' : 'Hide Passenger Count'}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                    hidePassengerCount
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-blue-500/15 text-blue-400'
                  }`}>
                    {hidePassengerCount
                      ? (lang === 'vi' ? 'ĐANG ẨN' : 'HIDDEN')
                      : (lang === 'vi' ? 'HIỆN' : 'SHOWN')}
                  </span>
                </button>
              )}

              {/* Unlock All Stations (Pro) */}
              {onUnlockAllStations && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onUnlockAllStations();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isDark ? 'hover:bg-slate-800 text-amber-300' : 'hover:bg-amber-50 text-amber-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Unlock className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'vi' ? 'Unlock toàn bộ nhà ga (Pro)' : 'Unlock All Stations (Pro)'}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                </button>
              )}

              {/* Toggle Disable Incidents (Train breakdowns & floods) */}
              {onToggleDisableIncidents && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleDisableIncidents();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                    disableIncidents
                      ? isDark
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 shadow-xs'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                      : isDark
                      ? 'bg-transparent border-transparent hover:bg-slate-800 text-slate-300'
                      : 'bg-transparent border-transparent hover:bg-neutral-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 text-left">
                    <div className={`p-1 rounded-lg ${
                      disableIncidents
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : isDark
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold">{lang === 'vi' ? 'Chặn hỏng tàu & ngập lụt' : 'Block Breakdowns & Floods'}</span>
                      <span className={`text-[10px] ${disableIncidents ? (isDark ? 'text-emerald-400/80' : 'text-emerald-700') : 'text-slate-400'} font-normal`}>
                        {lang === 'vi' ? 'Không gián đoạn giãn cách tàu' : 'No headway disruptions'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      disableIncidents
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-700/40 text-slate-400'
                    }`}>
                      {disableIncidents
                        ? (lang === 'vi' ? 'ĐÃ CHẶN' : 'BLOCKED')
                        : (lang === 'vi' ? 'CHO PHÉP' : 'ALLOWED')}
                    </span>
                    {/* Visual switch slider pill */}
                    <div className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
                      disableIncidents ? 'bg-emerald-500 justify-end' : isDark ? 'bg-slate-700 justify-start' : 'bg-slate-300 justify-start'
                    }`}>
                      <div className="w-3.5 h-3.5 rounded-full bg-white shadow-xs" />
                    </div>
                  </div>
                </button>
              )}

              <div className="my-1 border-t border-slate-800/50" />

              {/* Tutorial / Help */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenTutorial();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-neutral-100 text-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>{lang === 'vi' ? 'Hướng dẫn cách chơi' : 'How to Play'}</span>
              </button>

              <div className="my-1 border-t border-slate-800/50" />

              {/* Reset City Save */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onResetGame();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-red-400" />
                <span>{lang === 'vi' ? 'Chơi mới (Xóa lưu thành phố này)' : 'Reset & Start New Game'}</span>
              </button>

              {/* High Score & Auto-save status footer */}
              {highScore && highScore.bestPassengers > 0 && (
                <div className={`mt-2 pt-2 border-t px-2 text-[10px] flex items-center justify-between opacity-70 ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-neutral-200 text-slate-500'
                }`}>
                  <span className="flex items-center gap-1 font-semibold">
                    <Trophy className="w-3 h-3 text-amber-400" />
                    {lang === 'vi' ? `Kỷ lục: ${highScore.bestPassengers} khách` : `Record: ${highScore.bestPassengers} pass.`}
                  </span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {lang === 'vi' ? 'Tự động lưu' : 'Auto-saved'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
