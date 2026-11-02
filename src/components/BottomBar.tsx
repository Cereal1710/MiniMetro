import React from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Train as TrainIcon,
  Layers,
  ArrowRight,
  ShieldAlert,
  Star,
  Shuffle,
  Sparkles,
  Infinity as InfinityIcon
} from 'lucide-react';
import { MetroLine, GameInventory, Train } from '../types/game';

interface BottomBarProps {
  lines: MetroLine[];
  trains: Train[];
  inventory: GameInventory;
  selectedLineId: string | null;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  isUnlimitedMode?: boolean;
  isCreativeToolbarOpen?: boolean;
  onSelectLine: (lineId: string | null) => void;
  onCreateNewLine: () => void;
  onDeleteLine: (lineId: string) => void;
  onDeployTrain: (lineId: string) => void;
  onRemoveTrain: (lineId: string) => void;
  onAddCarriage: (lineId: string) => void;
  onRemoveCarriage: (lineId: string) => void;
  onOpenShop: () => void;
  onToggleCreativeToolbar?: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  lines,
  trains,
  inventory,
  selectedLineId,
  theme,
  lang,
  isUnlimitedMode = false,
  isCreativeToolbarOpen = false,
  onSelectLine,
  onCreateNewLine,
  onDeleteLine,
  onDeployTrain,
  onRemoveTrain,
  onAddCarriage,
  onRemoveCarriage,
  onOpenShop,
  onToggleCreativeToolbar
}) => {
  const isDark = theme === 'dark';

  return (
    <footer className={`h-20 px-3 md:px-5 flex items-center justify-between border-t transition-colors select-none z-20 gap-3 w-full max-w-full overflow-hidden ${
      isDark ? 'bg-neutral-900/95 border-neutral-800 text-neutral-100 backdrop-blur-md' : 'bg-white/95 border-neutral-200 text-neutral-800 backdrop-blur-md'
    }`}>
      {/* Left: Metro Lines Dock with horizontal scroll and mouse wheel support */}
      <div
        onWheel={(e) => {
          if (e.deltaY !== 0) {
            e.currentTarget.scrollLeft += e.deltaY;
          }
        }}
        className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1.5 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700"
      >
        {lines.map((line, idx) => {
          const isSelected = selectedLineId === line.id;
          const trainsOnThisLine = trains.filter(t => t.lineId === line.id);
          const carriagesOnThisLine = trainsOnThisLine.reduce((sum, t) => sum + t.carriagesCount, 0);
          const maxCarriagesOnLine = trainsOnThisLine.length * 2;

          return (
            <div
              key={line.id}
              onClick={() => onSelectLine(isSelected ? null : line.id)}
              style={{
                borderColor: isSelected ? line.color : undefined
              }}
              className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-sm ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-emerald-500 scale-102'
                  : isDark
                  ? 'bg-neutral-800/80 border-neutral-700 hover:border-neutral-500'
                  : 'bg-neutral-100 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {/* Color Bar / Pill */}
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[10px] text-white shadow-sm"
                style={{ backgroundColor: line.color }}
              >
                {idx + 1}
              </div>

              {/* Station Count */}
              <div className="text-xs font-semibold whitespace-nowrap">
                {line.stationIds.length} {lang === 'vi' ? 'ga' : 'stops'}
              </div>

              {/* Fleet Stepper: Decrease / Train Count / Increase */}
              <div
                className={`flex items-center rounded-lg px-1 py-0.5 border text-xs gap-1 ${
                  isDark ? 'bg-neutral-900/90 border-neutral-700/80' : 'bg-white/90 border-neutral-300'
                }`}
                title={lang === 'vi' ? 'Điều phối số đoàn tàu chạy trên tuyến này' : 'Adjust active trains on this line'}
              >
                {/* Giảm tàu button */}
                <button
                  disabled={trainsOnThisLine.length === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTrain(line.id);
                  }}
                  title={
                    trainsOnThisLine.length > 0
                      ? (lang === 'vi' ? 'Giảm 1 đoàn tàu (thu hồi về kho)' : 'Recall 1 train from this line to depot')
                      : (lang === 'vi' ? 'Tuyến này chưa có tàu hoạt động' : 'No trains running on this line')
                  }
                  className={`w-6 h-6 flex items-center justify-center rounded transition font-bold ${
                    trainsOnThisLine.length > 0
                      ? 'bg-amber-500/25 text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer active:scale-95 shadow-xs'
                      : 'opacity-25 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Train count display */}
                <div
                  className="flex items-center gap-1 font-mono font-bold text-xs px-1 min-w-[28px] justify-center"
                  title={lang === 'vi' ? `${trainsOnThisLine.length} đoàn tàu đang chạy trên tuyến` : `${trainsOnThisLine.length} trains running on line`}
                >
                  <TrainIcon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{trainsOnThisLine.length}</span>
                </div>

                {/* Thêm tàu button */}
                <button
                  disabled={!isUnlimitedMode && inventory.unassignedTrains <= 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeployTrain(line.id);
                  }}
                  title={
                    isUnlimitedMode
                      ? (lang === 'vi' ? 'Thêm 1 đoàn tàu vào tuyến (Vô hạn tàu khả dụng)' : 'Deploy 1 train (Unlimited fleet enabled)')
                      : inventory.unassignedTrains > 0
                      ? (lang === 'vi' ? `Thêm 1 đoàn tàu vào tuyến (Kho còn ${inventory.unassignedTrains} tàu)` : `Deploy 1 train to line (${inventory.unassignedTrains} ready in depot)`)
                      : (lang === 'vi' ? 'Kho hết tàu dự phòng! Bấm giảm (-) ở tuyến khác để chuyển sang đây, hoặc mua thêm ở Shop' : 'Depot empty! Recall from other lines or buy in Shop')
                  }
                  className={`w-6 h-6 flex items-center justify-center rounded transition font-bold ${
                    isUnlimitedMode || inventory.unassignedTrains > 0
                      ? 'bg-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer active:scale-95 shadow-xs'
                      : 'opacity-25 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Carriage Stepper: Bỏ toa / Số toa / Gắn toa */}
              <div
                className={`flex items-center rounded-lg px-1 py-0.5 border text-xs gap-1 ${
                  isDark ? 'bg-neutral-900/90 border-neutral-700/80' : 'bg-white/90 border-neutral-300'
                }`}
                title={lang === 'vi' ? 'Gắn hoặc thu hồi toa xe chở khách trên tuyến này' : 'Manage carriages on this line'}
              >
                {/* Bỏ toa button */}
                <button
                  disabled={carriagesOnThisLine === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveCarriage(line.id);
                  }}
                  title={
                    carriagesOnThisLine > 0
                      ? (lang === 'vi' ? 'Bỏ 1 toa xe khỏi tàu (thu hồi về kho)' : 'Recall 1 carriage to depot')
                      : (lang === 'vi' ? 'Tuyến này chưa gắn thêm toa xe nào' : 'No extra carriages on this line')
                  }
                  className={`w-6 h-6 flex items-center justify-center rounded transition font-bold ${
                    carriagesOnThisLine > 0
                      ? 'bg-amber-500/25 text-amber-400 hover:bg-amber-500 hover:text-white cursor-pointer active:scale-95 shadow-xs'
                      : 'opacity-25 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                {/* Carriage count display */}
                <div
                  className="flex items-center gap-1 font-mono font-bold text-xs px-1 min-w-[28px] justify-center"
                  title={lang === 'vi' ? `${carriagesOnThisLine} toa xe gắn thêm trên tuyến (Tăng sức chứa +4 khách/toa)` : `${carriagesOnThisLine} extra carriages on line`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{carriagesOnThisLine}</span>
                </div>

                {/* Gắn toa button */}
                <button
                  disabled={(!isUnlimitedMode && inventory.carriages <= 0) || trainsOnThisLine.length === 0 || (!isUnlimitedMode && carriagesOnThisLine >= maxCarriagesOnLine)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddCarriage(line.id);
                  }}
                  title={
                    trainsOnThisLine.length === 0
                      ? (lang === 'vi' ? 'Cần có tàu chạy trên tuyến trước khi gắn toa' : 'Deploy a train first before attaching carriages')
                      : isUnlimitedMode
                      ? (lang === 'vi' ? 'Gắn 1 toa xe (Vô hạn toa khả dụng, +4 khách)' : 'Attach 1 carriage (Unlimited mode enabled)')
                      : inventory.carriages > 0 && carriagesOnThisLine < maxCarriagesOnLine
                      ? (lang === 'vi' ? `Gắn 1 toa xe vào tàu (Kho còn ${inventory.carriages} toa, sức chứa +4 khách)` : `Attach 1 carriage (${inventory.carriages} ready in depot, +4 capacity)`)
                      : carriagesOnThisLine >= maxCarriagesOnLine
                      ? (lang === 'vi' ? 'Các tàu trên tuyến đã gắn tối đa toa (2 toa/tàu)' : 'Max carriages attached (2 per train)')
                      : (lang === 'vi' ? 'Kho tạm hết toa xe! Mua thêm trong Shop hoặc nhận thưởng tuần' : 'Depot empty! Buy in Shop or weekly rewards')
                  }
                  className={`w-6 h-6 flex items-center justify-center rounded transition font-bold ${
                    (isUnlimitedMode || (inventory.carriages > 0 && carriagesOnThisLine < maxCarriagesOnLine)) && trainsOnThisLine.length > 0
                      ? 'bg-indigo-500/25 text-indigo-300 hover:bg-indigo-500 hover:text-white cursor-pointer active:scale-95 shadow-xs'
                      : 'opacity-25 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Delete Line Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteLine(line.id);
                }}
                title={lang === 'vi' ? 'Xóa tuyến đường' : 'Delete line'}
                className="p-1 rounded-md opacity-40 hover:opacity-100 hover:text-red-400 transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* Add New Line Button */}
        {(isUnlimitedMode || lines.length < inventory.availableLines) && (
          <button
            onClick={onCreateNewLine}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed transition text-xs font-bold whitespace-nowrap cursor-pointer active:scale-95 ${
              isDark
                ? 'border-neutral-600 hover:border-emerald-500 hover:text-emerald-400 bg-neutral-800/40'
                : 'border-neutral-300 hover:border-emerald-600 hover:text-emerald-600 bg-neutral-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Tạo tuyến' : 'New Line'}</span>
            <span className="text-[10px] opacity-60">
              ({lines.length}/{isUnlimitedMode ? '∞' : inventory.availableLines})
            </span>
          </button>
        )}
      </div>

      {/* Right: Quick Inventory Counters, Creative Toggle & Shop Trigger */}
      <div className="shrink-0 flex items-center gap-2">
        {/* Creative Mode / Station & Terrain Builder Button */}
        {onToggleCreativeToolbar && (
          <button
            onClick={onToggleCreativeToolbar}
            title={lang === 'vi' ? 'Bộ công cụ sáng tạo: Thêm ga, vẽ địa hình sông nước, vô hạn tuyến đường' : 'Creative Tools: Add stations, sculpt rivers, unlimited rails'}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold border transition shadow-sm cursor-pointer active:scale-95 ${
              isCreativeToolbarOpen
                ? 'bg-linear-to-r from-amber-500 to-rose-500 text-white border-amber-400 ring-2 ring-amber-400 shadow-md'
                : isUnlimitedMode
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30'
                : isDark
                ? 'bg-neutral-800/90 border-neutral-700 hover:border-neutral-500 text-neutral-200 hover:text-white'
                : 'bg-neutral-100 border-neutral-300 hover:border-neutral-400 text-neutral-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">
              {lang === 'vi' ? 'Sáng Tạo' : 'Creative'}
            </span>
            {isUnlimitedMode && (
              <span className="px-1 py-0.2 rounded text-[10px] bg-amber-500 text-black font-black">
                ∞
              </span>
            )}
          </button>
        )}
        {/* Unassigned Trains */}
        <div
          onClick={onOpenShop}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
            isDark ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-500' : 'bg-neutral-100 border-neutral-200 hover:border-neutral-400'
          }`}
          title={lang === 'vi' ? 'Tàu dự phòng sẵn sàng bố trí' : 'Spare trains ready to deploy'}
        >
          <TrainIcon className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-mono font-bold">{inventory.unassignedTrains}</span>
          <span className="text-[10px] opacity-60 uppercase">{lang === 'vi' ? 'Tàu chờ' : 'Trains'}</span>
        </div>

        {/* Carriages */}
        <div
          onClick={onOpenShop}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
            isDark ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-500' : 'bg-neutral-100 border-neutral-200 hover:border-neutral-400'
          }`}
          title={lang === 'vi' ? 'Toa xe chở khách bổ sung' : 'Extra passenger carriages'}
        >
          <Layers className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-mono font-bold">{inventory.carriages}</span>
          <span className="text-[10px] opacity-60 uppercase">{lang === 'vi' ? 'Toa' : 'Carriages'}</span>
        </div>

        {/* Interchange Tokens */}
        <div
          onClick={onOpenShop}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border cursor-pointer transition ${
            isDark ? 'bg-neutral-800/50 border-neutral-700 hover:border-neutral-500' : 'bg-neutral-100 border-neutral-200 hover:border-neutral-400'
          }`}
          title={lang === 'vi' ? 'Nâng cấp ga trung chuyển (sức chứa x2)' : 'Interchange station upgrades'}
        >
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-mono font-bold">{inventory.interchangeTokens}</span>
          <span className="text-[10px] opacity-60 uppercase">{lang === 'vi' ? 'Ga Hub' : 'Hubs'}</span>
        </div>

        {/* Shop Button */}
        <button
          onClick={onOpenShop}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5"
        >
          <span>{lang === 'vi' ? 'Mua sắm thiết bị' : 'Shop'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
