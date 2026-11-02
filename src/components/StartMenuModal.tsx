import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  MapPin,
  Trophy,
  Check,
  Building2,
  Spline,
  ArrowLeft
} from 'lucide-react';
import { CityMapConfig } from '../types/game';
import { UserProfile } from '../services/firebase';
import { CAMPAIGN_SCENARIOS } from '../data/campaignScenarios';

interface StartMenuModalProps {
  isOpen: boolean;
  onPlay: () => void;
  onSelectScenario: (scenarioId: string) => void;
  onOpenAuth: () => void;
  onOpenTutorial: () => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  cityMaps: CityMapConfig[];
  currentCityId: string;
  onSelectCity: (cityId: string) => void;
  onOpenCityManager?: () => void;
  highScore: { bestPassengers: number; bestDays: number };
  lang: 'vi' | 'en';
  theme?: 'dark' | 'light';
  isMuted?: boolean;
  onToggleTheme?: () => void;
  onToggleMute?: () => void;
  onToggleLang?: () => void;
}

type MenuScreen = 'main' | 'city_select' | 'challenges' | 'options';

export const StartMenuModal: React.FC<StartMenuModalProps> = ({
  isOpen,
  onPlay,
  onSelectScenario,
  onOpenAuth,
  onOpenTutorial,
  currentUser,
  onLogout,
  cityMaps,
  currentCityId,
  onSelectCity,
  onOpenCityManager,
  highScore,
  lang,
  theme = 'dark',
  isMuted = false,
  onToggleTheme,
  onToggleMute,
  onToggleLang
}) => {
  const [screen, setScreen] = useState<MenuScreen>('main');

  if (!isOpen) return null;

  const currentCity = cityMaps.find(c => c.id === currentCityId) || cityMaps[0];
  const cityName = lang === 'vi' ? currentCity.nameVi : currentCity.nameEn;

  return (
  const isDark = theme === 'dark';

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${isDark ? 'bg-[#252528] text-white' : 'bg-[#FAF9F6] text-neutral-900'} select-none overflow-hidden font-sans`}>
      {/* Authentic Mini Metro Background Vector Canvas / SVG Track Lines (as seen in Screenshot 1) */}
      <svg
        className={`absolute inset-0 w-full h-full pointer-events-none ${isDark ? 'opacity-90' : 'opacity-70'}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="yellowLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>
        </defs>

        {/* Diagonal Green Line (Left-Top to Center-Left) */}
        <path
          d="M 120 0 L 120 60 L 20 220 L 20 400"
          fill="none"
          stroke="#48bb78"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pink/Coral Line (Bottom-Left) */}
        <path
          d="M 0 450 L 120 450 L 190 560 L 320 720"
          fill="none"
          stroke="#e53e3e"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pink Train Car */}
        <rect
          x="140"
          y="485"
          width="42"
          height="14"
          transform="rotate(57.5 140 485)"
          fill="#e53e3e"
          rx="3"
        />

        {/* Yellow Line (Center Vertical to Bottom Right) */}
        <path
          d="M 640 0 L 640 420 L 710 520 L 880 750"
          fill="none"
          stroke="#eab308"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Yellow Train Car */}
        <rect
          x="715"
          y="525"
          width="45"
          height="15"
          transform="rotate(53.5 715 525)"
          fill="#eab308"
          rx="3"
        />

        {/* Cyan Line (Parallel running alongside yellow line) */}
        <path
          d="M 740 0 L 740 380 L 740 500 L 920 750"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Cyan Train Car */}
        <rect
          x="785"
          y="560"
          width="45"
          height="15"
          transform="rotate(54 785 560)"
          fill="#38bdf8"
          rx="3"
        />
      </svg>

      {/* Top-Left Back / Close Button */}
      {screen !== 'main' ? (
        <button
          type="button"
          onClick={() => setScreen('main')}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-3.5 py-2 rounded-xs bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold transition cursor-pointer shadow-lg active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm uppercase tracking-wider">{lang === 'vi' ? 'Quay lại' : 'Back'}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onPlay}
          title={lang === 'vi' ? 'Tiếp tục vào bản đồ' : 'Resume Map'}
          className={`absolute top-6 left-6 z-20 p-2.5 rounded-full transition cursor-pointer ${
            isDark ? 'hover:bg-white/10 text-white/80 hover:text-white' : 'hover:bg-black/5 text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <span className="text-2xl font-bold">←</span>
        </button>
      )}

      {/* SCREEN 1: MAIN MENU (100% Match with Screenshot 1) */}
      {screen === 'main' && (
        <div className="relative z-10 w-full max-w-4xl px-8 sm:px-14 flex flex-col items-start justify-center animate-in fade-in duration-300">
          {/* Authentic Mini Metro Title with Square and Triangle Glyphs */}
          <div className="mb-8 flex items-baseline gap-2">
            <h1 className={`text-5xl sm:text-7xl font-extrabold tracking-tight flex items-center ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              <span>Mini Metro</span>
              <span className={`inline-flex items-center gap-1 ml-2 ${isDark ? 'text-white/90' : 'text-neutral-800'}`}>
                <span className={`w-3.5 h-3.5 sm:w-5 sm:h-5 inline-block rounded-xs ${isDark ? 'bg-white' : 'bg-neutral-900'}`} />
                <span className="text-base sm:text-xl font-mono leading-none">▲</span>
              </span>
            </h1>
          </div>

          {/* Action List with Authentic Blue Rectangular Highlight Boxes */}
          <div className="flex flex-col items-start gap-3 w-auto">
            {/* Play Button */}
            <button
              type="button"
              onClick={() => setScreen('city_select')}
              className="group flex items-center gap-3.5 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold text-2xl sm:text-3xl tracking-tight shadow-md transition-all cursor-pointer rounded-xs active:scale-98"
            >
              <span className="text-2xl sm:text-3xl transition-transform group-hover:translate-x-1">➜</span>
              <span>{lang === 'vi' ? 'Chơi' : 'Play'}</span>
            </button>

            {/* Daily Challenge / Scenarios Button */}
            <button
              type="button"
              onClick={() => setScreen('challenges')}
              className="group flex items-center gap-3.5 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold text-2xl sm:text-3xl tracking-tight shadow-md transition-all cursor-pointer rounded-xs active:scale-98"
            >
              <span className="text-2xl sm:text-3xl transition-transform group-hover:translate-x-1">➜</span>
              <span className="flex items-center gap-2">
                <span>{lang === 'vi' ? 'Thử thách mỗi ngày' : 'Daily Challenge'}</span>
                <span className="w-2 h-2 rounded-full bg-white/80 inline-block" />
              </span>
            </button>

            {/* Options Button */}
            <button
              type="button"
              onClick={() => setScreen('options')}
              className="group flex items-center gap-3.5 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold text-2xl sm:text-3xl tracking-tight shadow-md transition-all cursor-pointer rounded-xs active:scale-98"
            >
              <span className="text-2xl sm:text-3xl transition-transform group-hover:translate-y-1">↓</span>
              <span>{lang === 'vi' ? 'Cài đặt' : 'Options'}</span>
            </button>

            {/* Exit / Return to Canvas Button */}
            <button
              type="button"
              onClick={onPlay}
              className="group flex items-center gap-3.5 px-5 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-extrabold text-2xl sm:text-3xl tracking-tight shadow-md transition-all cursor-pointer rounded-xs active:scale-98"
            >
              <span className="text-2xl sm:text-3xl transition-transform group-hover:-translate-x-0.5 group-hover:translate-y-0.5">↙</span>
              <span>{lang === 'vi' ? 'Thoát vào game' : 'Exit'}</span>
            </button>
          </div>

          {/* Current City & High Score Status Line */}
          <div className={`mt-8 flex items-center gap-4 text-xs font-mono ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
            <span className={`flex items-center gap-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}>
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              <span>{cityName}</span>
            </span>
            {highScore.bestPassengers > 0 && (
              <span className="flex items-center gap-1.5 text-amber-500 font-bold">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                <span>{highScore.bestPassengers.toLocaleString()} {lang === 'vi' ? 'khách' : 'pax'} ({highScore.bestDays} {lang === 'vi' ? 'ngày' : 'days'})</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 2: CITY SELECTION (Vietnamese Cities) */}
      {screen === 'city_select' && (
        <div className="relative z-10 w-full max-w-4xl px-6 sm:px-10 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {lang === 'vi' ? 'Chọn Thành Phố' : 'Select City'}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {lang === 'vi'
                ? 'Mỗi thành phố có hệ thống sông ngòi và lưu lượng hành khách đặc trưng'
                : 'Each city features unique waterways and traffic demands'}
            </p>
          </div>

          {/* Cities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 w-full max-h-[58vh] overflow-y-auto pr-1">
            {cityMaps.map((city) => {
              const isSelected = city.id === currentCityId;
              const cName = lang === 'vi' ? city.nameVi : city.nameEn;

              return (
                <div
                  key={city.id}
                  onClick={() => onSelectCity(city.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#3b82f6]/20 border-[#3b82f6] ring-2 ring-[#3b82f6]'
                      : isDark
                      ? 'bg-neutral-900/80 border-neutral-700/80 hover:border-neutral-500'
                      : 'bg-white border-neutral-200 hover:border-neutral-400 shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-neutral-900'}`}>{cName}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#3b82f6]" />}
                    </div>

                    <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                      {lang === 'vi' ? city.descriptionVi : city.descriptionEn}
                    </p>
                  </div>

                  <div className={`mt-4 pt-2.5 border-t flex items-center justify-between text-[11px] font-mono ${
                    isDark ? 'border-neutral-800 text-neutral-400' : 'border-neutral-200 text-neutral-600'
                  }`}>
                    <span>{city.riverPolygons?.length || 0} {lang === 'vi' ? 'nhánh sông' : 'waterways'}</span>
                    <span className="text-emerald-500 font-bold">{city.worldWidth}x{city.worldHeight}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onPlay();
              }}
              className="flex items-center gap-3 px-8 py-3.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-black text-lg tracking-wide shadow-xl transition cursor-pointer rounded-xs active:scale-95"
            >
              <span className="text-xl">➜</span>
              <span>{lang === 'vi' ? 'Bắt đầu chơi ngay' : 'Start Transit Network'}</span>
            </button>

            {onOpenCityManager && (
              <button
                type="button"
                onClick={onOpenCityManager}
                className={`flex items-center gap-2 px-4 py-3.5 rounded-xs font-bold text-sm border transition cursor-pointer ${
                  isDark
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white border-neutral-700'
                    : 'bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300 shadow-xs'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-500" />
                <span>{lang === 'vi' ? 'Tạo bản đồ mới' : 'Custom Map Editor'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SCREEN 3: CHALLENGES & CAMPAIGNS */}
      {screen === 'challenges' && (
        <div className="relative z-10 w-full max-w-3xl px-6 sm:px-10 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {lang === 'vi' ? 'Thử Thách & Kịch Bản' : 'Scenarios & Challenges'}
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
              {lang === 'vi' ? 'Hoàn thành mục tiêu vận chuyển với tài nguyên giới hạn' : 'Deliver passengers under restricted resources'}
            </p>
          </div>

          <div className="w-full max-h-[55vh] overflow-y-auto space-y-3 pr-1">
            {CAMPAIGN_SCENARIOS.map((sc) => (
              <div
                key={sc.id}
                onClick={() => {
                  onSelectScenario(sc.id);
                  onPlay();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                  isDark
                    ? 'bg-neutral-900/90 border-neutral-700 hover:border-[#3b82f6]'
                    : 'bg-white border-neutral-200 hover:border-[#3b82f6] shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-black transition ${
                      isDark ? 'text-white group-hover:text-[#3b82f6]' : 'text-neutral-900 group-hover:text-[#2563eb]'
                    }`}>
                      {lang === 'vi' ? sc.titleVi : sc.titleEn}
                    </span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                    }`}>
                      {sc.targetPassengers} {lang === 'vi' ? 'khách' : 'pax'} ({sc.timeLimitDays} {lang === 'vi' ? 'ngày' : 'days'})
                    </span>
                  </div>
                  <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                    {lang === 'vi' ? sc.descriptionVi : sc.descriptionEn}
                  </p>
                </div>

                <button
                  type="button"
                  className="px-4 py-2 bg-[#3b82f6] group-hover:bg-[#2563eb] text-white text-xs font-bold rounded-xs shadow-md shrink-0 ml-3"
                >
                  ➜ {lang === 'vi' ? 'Tham gia' : 'Start'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SCREEN 4: OPTIONS (Cài đặt) */}
      {screen === 'options' && (
        <div className="relative z-10 w-full max-w-xl px-6 sm:px-10 flex flex-col items-center justify-center animate-in fade-in duration-200">
          <div className="text-center mb-6">
            <h2 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-neutral-900'}`}>
              {lang === 'vi' ? 'Cài Đặt Hệ Thống' : 'Options'}
            </h2>
          </div>

          <div className="w-full space-y-3">
            {/* Language Toggle */}
            {onToggleLang && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{lang === 'vi' ? 'Ngôn ngữ' : 'Language'}</div>
                  <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>Tiếng Việt / English</div>
                </div>
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="px-4 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-bold rounded-xs cursor-pointer shadow-md"
                >
                  {lang === 'vi' ? 'Tiếng Việt' : 'English'}
                </button>
              </div>
            )}

            {/* Sound Mute Toggle */}
            {onToggleMute && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{lang === 'vi' ? 'Âm thanh mô phỏng' : 'Audio & Chimes'}</div>
                  <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {isMuted ? (lang === 'vi' ? 'Đang tắt' : 'Muted') : (lang === 'vi' ? 'Đang bật' : 'Enabled')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className={`px-4 py-1.5 rounded-xs text-xs font-bold cursor-pointer border flex items-center gap-1.5 ${
                    isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
                  <span>{isMuted ? (lang === 'vi' ? 'Bật âm thanh' : 'Unmute') : (lang === 'vi' ? 'Tắt âm thanh' : 'Mute')}</span>
                </button>
              </div>
            )}

            {/* Dark / Light Theme Toggle */}
            {onToggleTheme && (
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
              }`}>
                <div>
                  <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{lang === 'vi' ? 'Giao diện hiển thị' : 'Color Theme'}</div>
                  <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {theme === 'dark' ? (lang === 'vi' ? 'Tối (Dark Subway)' : 'Dark (Subway)') : (lang === 'vi' ? 'Sáng (Clean Paper)' : 'Light (Paper)')}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className={`px-4 py-1.5 rounded-xs text-xs font-bold cursor-pointer border flex items-center gap-1.5 ${
                    isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                  }`}
                >
                  {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>{theme === 'dark' ? (lang === 'vi' ? 'Chuyển sang Sáng' : 'Switch to Light') : (lang === 'vi' ? 'Chuyển sang Tối' : 'Switch to Dark')}</span>
                </button>
              </div>
            )}

            {/* How to play tutorial */}
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-white border-neutral-200 shadow-xs'
            }`}>
              <div>
                <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-neutral-900'}`}>{lang === 'vi' ? 'Hướng dẫn cơ bản' : 'How to Play'}</div>
                <div className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>{lang === 'vi' ? 'Quy tắc kết nối ga và mở rộng' : 'Rules of transit lines'}</div>
              </div>
              <button
                type="button"
                onClick={onOpenTutorial}
                className={`px-4 py-1.5 rounded-xs text-xs font-bold cursor-pointer border ${
                  isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300'
                }`}
              >
                {lang === 'vi' ? 'Xem hướng dẫn' : 'View Guide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle Dinosaur Polo Club style dino logo in the bottom-right corner (from Screenshot 1) */}
      <div className="absolute bottom-5 right-5 pointer-events-none opacity-40 hover:opacity-100 transition">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      </div>
    </div>
  );
};
