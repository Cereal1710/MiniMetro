import React, { useState } from 'react';
import { X, Check, Palette } from 'lucide-react';
import { MetroLine } from '../types/game';

interface LineColorModalProps {
  line: MetroLine | null;
  lineIndex: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
  onSaveColor: (lineId: string, hexColor: string) => void;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0284C7', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#A855F7', // Violet
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#64748B'  // Slate
];

export const LineColorModal: React.FC<LineColorModalProps> = ({
  line,
  lineIndex,
  theme,
  lang,
  onClose,
  onSaveColor
}) => {
  if (!line) return null;
  const isDark = theme === 'dark';

  const [hexInput, setHexInput] = useState<string>(line.color || '#EF4444');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validate hex code (e.g. #FFF or #FFFFFF)
  const isValidHex = (hex: string) => {
    return /^#([0-9A-Fa-f]{3}){1,2}$/.test(hex.trim());
  };

  const handleHexChange = (value: string) => {
    let formatted = value.trim();
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    setHexInput(formatted);
    if (isValidHex(formatted)) {
      setErrorMsg(null);
    }
  };

  const handleSave = () => {
    if (!isValidHex(hexInput)) {
      setErrorMsg(lang === 'vi' ? 'Mã màu HEX không hợp lệ (ví dụ: #EF4444)' : 'Invalid HEX color code (e.g. #EF4444)');
      return;
    }
    onSaveColor(line.id, hexInput.trim());
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-sm max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl p-5 border shadow-2xl relative cursor-default scrollbar-thin ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-neutral-200 text-slate-900'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-800/60 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shadow-xs">
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-tight">
              {lang === 'vi' ? 'Đổi màu tuyến metro' : 'Customize Line Color'}
            </h3>
            <p className="text-[11px] opacity-60">
              {line.name} • {lang === 'vi' ? `Tuyến số ${lineIndex + 1}` : `Line #${lineIndex + 1}`}
            </p>
          </div>
        </div>

        {/* Live Preview Card */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between mb-4 ${
          isDark ? 'bg-slate-800/60 border-slate-700/80' : 'bg-neutral-50 border-neutral-200'
        }`}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-md transition-colors"
              style={{
                backgroundColor: isValidHex(hexInput) ? hexInput : line.color,
                color: '#FFFFFF'
              }}
            >
              {lineIndex + 1}
            </div>
            <div>
              <div className="font-bold text-xs">{line.name}</div>
              <div className="font-mono text-[11px] font-semibold text-emerald-400">
                {isValidHex(hexInput) ? hexInput.toUpperCase() : line.color.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Native HTML Color Picker Swatch */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="nativeColorPicker"
              title={lang === 'vi' ? 'Mở bảng chọn màu đồ họa' : 'Open visual color picker'}
              className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer transition flex items-center gap-1.5 hover:scale-102 active:scale-98"
              style={{
                borderColor: isValidHex(hexInput) ? hexInput : undefined
              }}
            >
              <input
                id="nativeColorPicker"
                type="color"
                value={isValidHex(hexInput) ? hexInput : line.color}
                onChange={(e) => handleHexChange(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent block"
              />
              <span className="text-[10px] uppercase font-mono">{lang === 'vi' ? 'Bảng màu' : 'Picker'}</span>
            </label>
          </div>
        </div>

        {/* Hex Code Input Field */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider opacity-70 mb-1.5">
            {lang === 'vi' ? 'Nhập mã màu HEX (ví dụ: #EF4444)' : 'Enter HEX Color Code'}
          </label>
          <div className="relative">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              placeholder="#10B981"
              maxLength={7}
              className={`w-full py-2 px-3 font-mono font-bold text-sm rounded-xl border outline-none transition uppercase ${
                errorMsg
                  ? 'border-red-500 focus:ring-2 focus:ring-red-500/40'
                  : isDark
                  ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  : 'bg-white border-neutral-300 text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20'
              }`}
            />
            {isValidHex(hexInput) && (
              <div
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/40 shadow-xs"
                style={{ backgroundColor: hexInput }}
              />
            )}
          </div>
          {errorMsg && (
            <p className="text-[11px] text-red-400 font-semibold mt-1">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Quick Palette */}
        <div className="mb-5">
          <label className="block text-[10px] font-bold uppercase tracking-wider opacity-60 mb-2">
            {lang === 'vi' ? 'Bảng màu metro tiêu chuẩn' : 'Standard Metro Palette'}
          </label>
          <div className="grid grid-cols-8 gap-2">
            {PRESET_COLORS.map(c => {
              const isSelected = hexInput.toUpperCase() === c.toUpperCase();
              return (
                <button
                  key={c}
                  onClick={() => handleHexChange(c)}
                  style={{ backgroundColor: c }}
                  title={c}
                  className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center cursor-pointer shadow-sm ${
                    isSelected ? 'ring-2 ring-offset-2 ring-white scale-110' : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isDark
                ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                : 'bg-neutral-100 border-neutral-300 hover:bg-neutral-200 text-slate-700'
            }`}
          >
            {lang === 'vi' ? 'Hủy' : 'Cancel'}
          </button>

          <button
            onClick={handleSave}
            className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Áp dụng màu' : 'Apply Color'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
