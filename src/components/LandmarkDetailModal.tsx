import React from 'react';
import {
  X,
  MapPin,
  Calendar,
  Compass,
  Award,
  Sparkles,
  ExternalLink,
  Volume2
} from 'lucide-react';
import { MapLandmark } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface LandmarkDetailModalProps {
  landmark: MapLandmark | null;
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
  onClose: () => void;
}

export const LandmarkDetailModal: React.FC<LandmarkDetailModalProps> = ({
  landmark,
  lang,
  theme,
  onClose
}) => {
  if (!landmark) return null;
  const isDark = theme === 'dark';

  const categoryLabelsVi: Record<string, string> = {
    heritage: 'Di Tích Lịch Sử & Danh Thắng',
    government: 'Trung Tâm Chính Trị Quốc Gia',
    modern: 'Kiến Trúc & Đô Thị Hiện Đại',
    transport: 'Đầu Mối Giao Thông Trọng Điểm',
    culture: 'Không Gian Văn Hóa & Làng Nghề',
    park: 'Công Viên Sinh Thái'
  };

  const categoryLabelsEn: Record<string, string> = {
    heritage: 'Historical Heritage & Scenic Spot',
    government: 'National Political Center',
    modern: 'Modern Architecture & Skyline',
    transport: 'Major Transportation Hub',
    culture: 'Cultural Space & Craft Village',
    park: 'Eco Park & Green Reserve'
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all animate-in zoom-in-95 duration-200 relative overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-neutral-200 text-slate-800'
        }`}
      >
        {/* Decorative Top Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-rose-500 to-emerald-500" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-neutral-100 hover:bg-white/10 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badges */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide bg-amber-500/15 text-amber-500 border border-amber-500/30">
            {landmark.badgeText || (lang === 'vi' ? 'Hà Nội' : 'Hanoi')}
          </span>
          <span className="text-xs text-neutral-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" />
            {lang === 'vi' ? categoryLabelsVi[landmark.category] : categoryLabelsEn[landmark.category]}
          </span>
        </div>

        {/* Landmark Title */}
        <h2 className="text-xl font-black tracking-tight mb-1 flex items-center gap-2">
          <span>{lang === 'vi' ? landmark.nameVi : landmark.nameEn}</span>
        </h2>
        <div className="text-xs text-neutral-400 mb-4 font-serif italic">
          {lang === 'vi' ? landmark.nameEn : landmark.nameVi}
        </div>

        {/* Year & Coordinates Info Bar */}
        <div className={`grid grid-cols-2 gap-2 p-3 rounded-2xl mb-4 border ${
          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-neutral-50 border-neutral-200'
        }`}>
          {landmark.yearBuilt && (
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <div className="text-[10px] text-neutral-400 uppercase font-bold">
                  {lang === 'vi' ? 'Khởi dựng' : 'Built / Founded'}
                </div>
                <div className="text-xs font-bold font-mono">{landmark.yearBuilt}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-bold">
                {lang === 'vi' ? 'Vị trí bản đồ' : 'Coordinates'}
              </div>
              <div className="text-xs font-bold font-mono">
                X: {Math.round(landmark.x)}, Y: {Math.round(landmark.y)}
              </div>
            </div>
          </div>
        </div>

        {/* Description Body */}
        <div className={`p-4 rounded-2xl mb-5 text-sm leading-relaxed border ${
          isDark ? 'bg-slate-800/40 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          {lang === 'vi' ? landmark.descriptionVi : landmark.descriptionEn}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEngine.playCathedralBell();
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                : 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-slate-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
            <span>{lang === 'vi' ? 'Nghe Tiếng Chuông Thủ Đô' : 'Play Heritage Bell'}</span>
          </button>

          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition cursor-pointer"
          >
            {lang === 'vi' ? 'Đã Hiểu' : 'Got It'}
          </button>
        </div>
      </div>
    </div>
  );
};
