import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Layers,
  MapPin,
  Trees,
  Compass,
  Train,
  Volume2,
  Sparkles,
  Eye,
  EyeOff,
  Navigation
} from 'lucide-react';
import { LayerVisibilityOptions } from '../canvas/renderer';
import { CityMapConfig } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MapControlsProps {
  zoom: number;
  minZoom: number;
  maxZoom: number;
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
  isHanoi: boolean;
  layers: LayerVisibilityOptions;
  mapConfig: CityMapConfig;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onToggleLayer: (layerKey: keyof LayerVisibilityOptions) => void;
  onApplyRealPreset?: () => void;
  // Mini map radar props
  worldWidth: number;
  worldHeight: number;
  viewportFrustum?: { x: number; y: number; width: number; height: number };
  onPanToWorld?: (wx: number, wy: number) => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  zoom,
  minZoom,
  maxZoom,
  lang,
  theme,
  isHanoi,
  layers,
  mapConfig,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleLayer,
  onApplyRealPreset,
  worldWidth,
  worldHeight,
  viewportFrustum,
  onPanToWorld
}) => {
  const isDark = theme === 'dark';
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(true);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      {/* Top-Right Floating Map Tool HUD */}
      <div className="absolute top-18 right-4 flex flex-col items-end gap-2 z-20 pointer-events-auto">
        {/* Real Metro Quick Loader (Prominent if Hanoi) */}
        {isHanoi && onApplyRealPreset && (
          <button
            onClick={() => {
              onApplyRealPreset();
              soundEngine.playHanoiMetroChime();
            }}
            title={lang === 'vi' ? 'Nạp nhanh Tuyến 2A (Cát Linh - Hà Đông) và Tuyến 3 (Nhổn - Ga Hà Nội) thực tế' : 'Instantly load real Hanoi Metro Line 2A & Line 3'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/20 active:scale-95 transition-all cursor-pointer border border-emerald-400/30"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{lang === 'vi' ? 'Nạp Tuyến 2A & 3 Thực Tế' : 'Load Real Metro Lines'}</span>
          </button>
        )}

        {/* Audio chime button */}
        {isHanoi && (
          <button
            onClick={() => soundEngine.playHanoiMetroChime()}
            title={lang === 'vi' ? 'Phát chuông thông báo ga Metro Hà Nội' : 'Play Hanoi Metro station chime'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer border ${
              isDark
                ? 'bg-slate-900/90 text-slate-200 border-slate-700/80 hover:bg-slate-800'
                : 'bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">{lang === 'vi' ? 'Chuông Ga Hà Nội' : 'Hanoi Chime'}</span>
          </button>
        )}

        {/* Floating Controls Bar: Layers Toggle & Zoom */}
        <div className={`flex items-center rounded-2xl shadow-xl border backdrop-blur-md p-1 gap-1 ${
          isDark ? 'bg-slate-900/95 border-slate-700/80' : 'bg-white/95 border-neutral-200'
        }`}>
          {/* Layer toggles dropdown button */}
          <button
            onClick={() => setIsLayersOpen(prev => !prev)}
            title={lang === 'vi' ? 'Bật / Tắt các lớp bản đồ (Địa danh, Cầu, Hồ, Vành đai)' : 'Toggle map layers'}
            className={`p-2 rounded-xl transition cursor-pointer relative ${
              isLayersOpen
                ? 'bg-emerald-500 text-white'
                : isDark
                ? 'text-slate-300 hover:bg-slate-800'
                : 'text-slate-700 hover:bg-neutral-100'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-neutral-300 dark:bg-slate-700 mx-0.5" />

          {/* Zoom Out */}
          <button
            disabled={zoom <= minZoom}
            onClick={onZoomOut}
            title={lang === 'vi' ? 'Thu nhỏ bản đồ (hoặc cuộn chuột xuống)' : 'Zoom out'}
            className={`p-2 rounded-xl transition cursor-pointer ${
              zoom <= minZoom
                ? 'opacity-30 cursor-not-allowed text-neutral-400'
                : isDark
                ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
                : 'text-slate-700 hover:bg-neutral-100 active:scale-95'
            }`}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* Zoom Level Readout */}
          <button
            onClick={onResetView}
            title={lang === 'vi' ? 'Nhấn để đặt lại tầm nhìn vừa màn hình (100%)' : 'Click to reset view (100%)'}
            className={`px-2 py-1 text-xs font-mono font-bold rounded-lg transition cursor-pointer ${
              isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-neutral-100'
            }`}
          >
            {zoomPercent}%
          </button>

          {/* Zoom In */}
          <button
            disabled={zoom >= maxZoom}
            onClick={onZoomIn}
            title={lang === 'vi' ? 'Phóng to bản đồ (hoặc cuộn chuột lên)' : 'Zoom in'}
            className={`p-2 rounded-xl transition cursor-pointer ${
              zoom >= maxZoom
                ? 'opacity-30 cursor-not-allowed text-neutral-400'
                : isDark
                ? 'text-slate-300 hover:bg-slate-800 active:scale-95'
                : 'text-slate-700 hover:bg-neutral-100 active:scale-95'
            }`}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-neutral-300 dark:bg-slate-700 mx-0.5" />

          {/* Fit / Reset */}
          <button
            onClick={onResetView}
            title={lang === 'vi' ? 'Toàn cảnh Hà Nội vừa màn hình' : 'Fit to screen'}
            className={`p-2 rounded-xl transition cursor-pointer ${
              isDark ? 'text-slate-300 hover:bg-slate-800 active:scale-95' : 'text-slate-700 hover:bg-neutral-100 active:scale-95'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Layers Dropdown Menu */}
        {isLayersOpen && (
          <div className={`mt-1 p-3 rounded-2xl shadow-2xl border backdrop-blur-xl w-64 z-30 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-slate-900/95 border-slate-700 text-slate-100' : 'bg-white/98 border-neutral-200 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-1 border-b border-neutral-200 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500">
                {lang === 'vi' ? 'Lớp Bản Đồ Hà Nội' : 'Hanoi Map Layers'}
              </span>
              <button
                onClick={() => setIsLayersOpen(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Landmarks */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'vi' ? 'Địa danh & Di tích' : 'Heritage Landmarks'}</span>
              </span>
              <input
                type="checkbox"
                checked={layers.landmarks}
                onChange={() => onToggleLayer('landmarks')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Bridges */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-cyan-500" />
                <span>{lang === 'vi' ? 'Cầu Sông Hồng (Long Biên, Nhật Tân...)' : 'Bridges (Long Bien, Nhat Tan)'}</span>
              </span>
              <input
                type="checkbox"
                checked={layers.bridges}
                onChange={() => onToggleLayer('bridges')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Parks & Greenery */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <Trees className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'vi' ? 'Công viên & Mảng xanh' : 'Parks & Greenery'}</span>
              </span>
              <input
                type="checkbox"
                checked={layers.parks}
                onChange={() => onToggleLayer('parks')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Arterial Roads / Ring highways */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5 text-blue-500" />
                <span>{lang === 'vi' ? 'Vành Đai 1, 2, 3' : 'Ring Roads (Vanh Dai 1-3)'}</span>
              </span>
              <input
                type="checkbox"
                checked={layers.roads}
                onChange={() => onToggleLayer('roads')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* Real Metro Reference overlay */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <Train className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'vi' ? 'Đường ray Tuyến 2A & 3 tham chiếu' : 'Real Lines Reference Track'}</span>
              </span>
              <input
                type="checkbox"
                checked={!!layers.realLinesRef}
                onChange={() => onToggleLayer('realLinesRef')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>

            {/* District Labels */}
            <label className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-neutral-400">Q.</span>
                <span>{lang === 'vi' ? 'Tên Quận / Huyện' : 'District Badges'}</span>
              </span>
              <input
                type="checkbox"
                checked={layers.districts}
                onChange={() => onToggleLayer('districts')}
                className="rounded accent-emerald-500 cursor-pointer"
              />
            </label>
          </div>
        )}
      </div>

      {/* Mini-Map / Radar HUD (Bottom-Right, above bottom bar) */}
      <div className="absolute bottom-22 right-4 z-20 pointer-events-auto">
        <div className={`rounded-2xl border shadow-xl backdrop-blur-md overflow-hidden transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-neutral-300'
        } ${showMiniMap ? 'w-48 h-36 p-1.5' : 'w-9 h-9 p-0 flex items-center justify-center'}`}>
          {showMiniMap ? (
            <div className="relative w-full h-full flex flex-col">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 px-1 pb-1">
                <span className="flex items-center gap-1 text-emerald-500">
                  <Compass className="w-3 h-3" />
                  HÀ NỘI RADAR
                </span>
                <button
                  onClick={() => setShowMiniMap(false)}
                  className="hover:text-neutral-200 cursor-pointer"
                  title="Ẩn radar"
                >
                  <EyeOff className="w-3 h-3" />
                </button>
              </div>

              {/* Radar Canvas / Click-to-Pan Surface */}
              <div
                onClick={(e) => {
                  if (!onPanToWorld) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  const clickY = e.clientY - rect.top;
                  const targetWx = (clickX / rect.width) * worldWidth;
                  const targetWy = (clickY / rect.height) * worldHeight;
                  onPanToWorld(targetWx, targetWy);
                }}
                className={`relative flex-1 rounded-lg border overflow-hidden cursor-crosshair ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-100 border-neutral-200'
                }`}
              >
                {/* Simplified SVG Map of Red River & West Lake */}
                <svg
                  viewBox={`0 0 ${worldWidth} ${worldHeight}`}
                  className="w-full h-full pointer-events-none"
                  preserveAspectRatio="xMidYMid slice"
                >
                  {/* Rivers */}
                  {mapConfig.riverPolygons.map((r, i) => (
                    <polygon
                      key={i}
                      points={r.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill={r.isIsland ? (isDark ? '#143125' : '#D1E7DD') : (isDark ? '#1E293B' : '#BAE6FD')}
                    />
                  ))}

                  {/* Initial / Main Stations */}
                  {mapConfig.initialStations.map((st, i) => (
                    <circle
                      key={i}
                      cx={st.x}
                      cy={st.y}
                      r={30}
                      fill={isDark ? '#FFFFFF' : '#0F172A'}
                    />
                  ))}
                </svg>

                {/* Viewport Frustum Rectangle */}
                {viewportFrustum && (
                  <div
                    style={{
                      left: `${Math.max(0, Math.min(100, (viewportFrustum.x / worldWidth) * 100))}%`,
                      top: `${Math.max(0, Math.min(100, (viewportFrustum.y / worldHeight) * 100))}%`,
                      width: `${Math.max(8, Math.min(100, (viewportFrustum.width / worldWidth) * 100))}%`,
                      height: `${Math.max(8, Math.min(100, (viewportFrustum.height / worldHeight) * 100))}%`
                    }}
                    className="absolute border-2 border-emerald-400 bg-emerald-500/20 rounded pointer-events-none transition-all duration-75"
                  />
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowMiniMap(true)}
              title="Hiện radar toàn cảnh"
              className="w-full h-full flex items-center justify-center text-neutral-400 hover:text-emerald-500 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </>
  );
};
