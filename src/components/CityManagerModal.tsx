import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Building2,
  MapPin,
  Check,
  AlertTriangle,
  Compass,
  Sparkles,
  Waves,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { CityMapConfig } from '../types/game';
import { createBlankCity, cloneCityFromPreset, deleteCustomCity } from '../data/customCities';

interface CityManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityMaps: CityMapConfig[];
  currentCityId: string;
  onSelectCity: (cityId: string) => void;
  onRefreshCities: () => void;
  lang: 'vi' | 'en';
  theme: 'dark' | 'light';
}

export const CityManagerModal: React.FC<CityManagerModalProps> = ({
  isOpen,
  onClose,
  cityMaps,
  currentCityId,
  onSelectCity,
  onRefreshCities,
  lang,
  theme
}) => {
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [createMode, setCreateMode] = useState<'blank' | 'clone'>('blank');

  // Form states for creating blank city
  const [blankNameVi, setBlankNameVi] = useState('');
  const [blankNameEn, setBlankNameEn] = useState('');
  const [blankDescVi, setBlankDescVi] = useState('');
  const [terrainStyle, setTerrainStyle] = useState<'open_river' | 'coastal' | 'twin_river' | 'clean_canvas'>('open_river');
  const [mapSize, setMapSize] = useState<'standard' | 'compact' | 'large'>('standard');

  // Form states for cloning
  const [selectedPresetId, setSelectedPresetId] = useState<string>(cityMaps[0]?.id || 'hanoi');
  const [cloneNameVi, setCloneNameVi] = useState('');
  const [cloneNameEn, setCloneNameEn] = useState('');

  // Delete confirmation safety dialog state
  // Requirement: "khi xoa thanh pho se phải nhập đúng hoàng toàn tên tph"
  const [cityToDelete, setCityToDelete] = useState<CityMapConfig | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

  if (!isOpen) return null;

  const handleCreateBlank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blankNameVi.trim()) return;

    let w = 2400;
    let h = 1700;
    if (mapSize === 'compact') {
      w = 1800;
      h = 1300;
    } else if (mapSize === 'large') {
      w = 3000;
      h = 2100;
    }

    const newCity = createBlankCity({
      nameVi: blankNameVi.trim(),
      nameEn: blankNameEn.trim() || undefined,
      descriptionVi: blankDescVi.trim() || undefined,
      terrainStyle,
      worldWidth: w,
      worldHeight: h
    });

    onRefreshCities();
    onSelectCity(newCity.id);
    setBlankNameVi('');
    setBlankNameEn('');
    setBlankDescVi('');
    setActiveTab('list');
    onClose();
  };

  const handleCreateClone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneNameVi.trim()) return;

    const newCity = cloneCityFromPreset(
      selectedPresetId,
      cloneNameVi.trim(),
      cloneNameEn.trim() || undefined
    );

    if (newCity) {
      onRefreshCities();
      onSelectCity(newCity.id);
      setCloneNameVi('');
      setCloneNameEn('');
      setActiveTab('list');
      onClose();
    }
  };

  const handleConfirmDelete = () => {
    if (!cityToDelete) return;
    if (deleteConfirmInput.trim() !== cityToDelete.nameVi.trim()) return;

    const cityId = cityToDelete.id;
    deleteCustomCity(cityId);

    // If the active city was deleted, switch to the first available preset
    if (currentCityId === cityId) {
      const fallback = cityMaps.find(c => c.id !== cityId) || cityMaps[0];
      if (fallback) {
        onSelectCity(fallback.id);
      }
    }

    onRefreshCities();
    setCityToDelete(null);
    setDeleteConfirmInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-slate-700/80 text-slate-100' : 'bg-white border-neutral-300 text-slate-900'
      }`}>
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between gap-3 bg-linear-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {lang === 'vi' ? 'Quản Lý & Tạo Thành Phố' : 'City Map Manager'}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'vi'
                  ? 'Chọn bản đồ, tạo mới từ đầu hoặc nhân bản từ các preset có sẵn'
                  : 'Manage cities, create custom maps or clone from existing presets'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-2 px-4 border-b border-slate-800/60 bg-slate-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'list'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Danh sách thành phố' : 'City List'} ({cityMaps.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'vi' ? 'Tạo thành phố mới' : 'Create New City'}</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 scrollbar-thin">
          {/* TAB 1: LIST CITIES */}
          {activeTab === 'list' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {cityMaps.map(city => {
                  const isCurrent = city.id === currentCityId;
                  const isCustom = !!city.isCustom;

                  return (
                    <div
                      key={city.id}
                      className={`relative rounded-2xl p-3.5 border transition-all flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? isDark
                            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-950/20 ring-1 ring-emerald-500/30'
                            : 'bg-emerald-50/80 border-emerald-400 shadow-md ring-1 ring-emerald-400/30'
                          : isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-neutral-200 hover:border-neutral-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                              <span>{city.nameVi}</span>
                              {city.nameEn && city.nameEn !== city.nameVi && (
                                <span className="text-xs text-slate-400 font-normal">({city.nameEn})</span>
                              )}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isCustom ? (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                {lang === 'vi' ? 'Tùy chỉnh' : 'Custom'}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {lang === 'vi' ? 'Mặc định' : 'Preset'}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {lang === 'vi' ? city.descriptionVi : city.descriptionEn}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 mt-2 text-xs">
                        <div className="text-[10px] text-slate-400 font-mono">
                          <span>{city.initialStations?.length || 0} ga đầu</span>
                          <span className="mx-1">•</span>
                          <span>{city.worldWidth || 2400}x{city.worldHeight || 1700}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isCurrent ? (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>{lang === 'vi' ? 'Đang chơi' : 'Active'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSelectCity(city.id);
                                onClose();
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-xs"
                            >
                              {lang === 'vi' ? 'Vào chơi' : 'Play'}
                            </button>
                          )}

                          {isCustom && (
                            <button
                              type="button"
                              title={lang === 'vi' ? 'Xóa thành phố này' : 'Delete this city'}
                              onClick={() => {
                                setCityToDelete(city);
                                setDeleteConfirmInput('');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Promo Card */}
              <div className="p-4 rounded-2xl border border-dashed border-slate-700/80 bg-slate-950/30 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-200">
                      {lang === 'vi' ? 'Muốn tạo thành phố của riêng bạn?' : 'Want to create your own city?'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {lang === 'vi'
                        ? 'Tạo bản đồ trắng hoặc nhân bản từ Hà Nội/Sài Gòn/Tokyo.'
                        : 'Create a blank canvas or clone from Hanoi/Saigon/Tokyo.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer shrink-0 border border-slate-700 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'vi' ? 'Tạo mới' : 'Create'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: CREATE NEW CITY */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {/* Mode Switch: Blank Canvas vs Clone from Preset */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateMode('blank')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    createMode === 'blank'
                      ? 'bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? '1. Tạo mới hoàn toàn' : '1. Blank Map'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreateMode('clone')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    createMode === 'clone'
                      ? 'bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? '2. Theo Preset hiện tại' : '2. Clone from Preset'}</span>
                </button>
              </div>

              {/* OPTION 1: CREATE BLANK CITY */}
              {createMode === 'blank' && (
                <form onSubmit={handleCreateBlank} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'vi' ? 'Tên thành phố (Tiếng Việt) *' : 'City Name (Vietnamese) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={blankNameVi}
                        onChange={e => setBlankNameVi(e.target.value)}
                        placeholder="Ví dụ: Đà Nẵng, Hải Phòng, Cần Thơ..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'vi' ? 'Tên tiếng Anh (Tùy chọn)' : 'English Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={blankNameEn}
                        onChange={e => setBlankNameEn(e.target.value)}
                        placeholder="E.g. Da Nang, Hai Phong..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      {lang === 'vi' ? 'Mô tả đô thị' : 'Description'}
                    </label>
                    <input
                      type="text"
                      value={blankDescVi}
                      onChange={e => setBlankDescVi(e.target.value)}
                      placeholder="Mạng lưới tàu điện kết nối các khu công nghệ và bãi biển..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>

                  {/* Terrain & River Style Picker */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                      <Waves className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{lang === 'vi' ? 'Kiểu địa hình sông biển' : 'Terrain & River Style'}</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'open_river', labelVi: 'Sông uốn lượn', labelEn: 'Sweeping River', icon: '🌊' },
                        { id: 'coastal', labelVi: 'Ven biển / Vịnh', labelEn: 'Coastal Bay', icon: '🏝️' },
                        { id: 'twin_river', labelVi: 'Sông song song', labelEn: 'Twin Rivers', icon: '🏞️' },
                        { id: 'clean_canvas', labelVi: 'Mặt đất phẳng', labelEn: 'Flat Canvas', icon: '⬜' }
                      ].map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTerrainStyle(t.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                            terrainStyle === t.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-base">{t.icon}</span>
                          <span>{lang === 'vi' ? t.labelVi : t.labelEn}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Map Canvas Dimensions */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {lang === 'vi' ? 'Quy mô không gian bản đồ' : 'Map Size'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'compact', labelVi: 'Gọn gàng (1800x1300)', labelEn: 'Compact' },
                        { id: 'standard', labelVi: 'Tiêu chuẩn (2400x1700)', labelEn: 'Standard' },
                        { id: 'large', labelVi: 'Rộng lớn (3000x2100)', labelEn: 'Large Mega' }
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setMapSize(s.id as any)}
                          className={`py-2 px-2.5 rounded-xl border text-[11px] font-semibold transition cursor-pointer text-center ${
                            mapSize === s.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {lang === 'vi' ? s.labelVi : s.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'vi' ? 'Quay lại' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={!blankNameVi.trim()}
                      className="px-5 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{lang === 'vi' ? 'Tạo Thành Phố Ngay' : 'Create City Now'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* OPTION 2: CLONE FROM PRESET */}
              {createMode === 'clone' && (
                <form onSubmit={handleCreateClone} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      {lang === 'vi' ? 'Chọn Preset Bản Đồ Gốc Để Nhân Bản *' : 'Select Source Preset to Clone *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {cityMaps.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setSelectedPresetId(p.id);
                            if (!cloneNameVi) {
                              setCloneNameVi(`${p.nameVi} (Bản Mới)`);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            selectedPresetId === p.id
                              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="font-bold text-xs text-white">{p.nameVi}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.nameEn}</div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-1">
                            {p.initialStations?.length || 0} ga • {p.riverPolygons?.length || 0} nhánh sông
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'vi' ? 'Tên thành phố mới (Tiếng Việt) *' : 'New City Name (Vietnamese) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={cloneNameVi}
                        onChange={e => setCloneNameVi(e.target.value)}
                        placeholder="Ví dụ: Hà Nội Tương Lai, Sài Gòn Mới..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        {lang === 'vi' ? 'Tên tiếng Anh (Tùy chọn)' : 'English Name (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={cloneNameEn}
                        onChange={e => setCloneNameEn(e.target.value)}
                        placeholder="E.g. Future Hanoi, New Saigon..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => setActiveTab('list')}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      {lang === 'vi' ? 'Quay lại' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={!cloneNameVi.trim()}
                      className="px-5 py-2 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{lang === 'vi' ? 'Nhân Bản Thành Phố' : 'Clone City'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal (EXACT FULL NAME VERIFICATION REQUIRED) */}
        {/* "khi xoa thanh pho se phải nhập đúng hoàng toàn tên tph" */}
        {cityToDelete && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-md bg-slate-900 border border-rose-500/50 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-3.5 overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {lang === 'vi' ? 'Xác nhận xóa vĩnh viễn thành phố' : 'Confirm Permanent Deletion'}
                  </h3>
                  <p className="text-xs text-rose-300 font-bold">
                    "{cityToDelete.nameVi}"
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-xs text-rose-200 leading-relaxed">
                {lang === 'vi'
                  ? 'CẢNH BÁO: Hành động này không thể hoàn tác! Mọi tuyến tàu, ga và kỷ lục của thành phố này sẽ bị xóa sạch.'
                  : 'WARNING: This cannot be undone! All routes, stations, and records of this city will be deleted.'}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {lang === 'vi' ? (
                    <>
                      Để xác nhận, vui lòng nhập chính xác toàn bộ tên thành phố: <strong className="text-amber-300 font-mono select-all">"{cityToDelete.nameVi}"</strong>
                    </>
                  ) : (
                    <>
                      To confirm, please type the exact full name: <strong className="text-amber-300 font-mono select-all">"{cityToDelete.nameVi}"</strong>
                    </>
                  )}
                </label>
                <input
                  type="text"
                  autoFocus
                  value={deleteConfirmInput}
                  onChange={e => setDeleteConfirmInput(e.target.value)}
                  placeholder={cityToDelete.nameVi}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-rose-500 transition font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCityToDelete(null);
                    setDeleteConfirmInput('');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                >
                  {lang === 'vi' ? 'Hủy' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmInput.trim() !== cityToDelete.nameVi.trim()}
                  onClick={handleConfirmDelete}
                  className={`px-4 py-1.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md ${
                    deleteConfirmInput.trim() === cityToDelete.nameVi.trim()
                      ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'vi' ? 'Xóa Vĩnh Viễn' : 'Delete Permanently'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
