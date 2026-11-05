import React from 'react';
import { X, Train, Layers, Plus, Star, DollarSign, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import { GameInventory } from '../types/game';
import { formatMoney } from '../utils/geometry';

interface ShopModalProps {
  money: number;
  inventory: GameInventory;
  activeLinesCount: number;
  totalTrainsCount: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onClose: () => void;
  onBuyTrain: () => void;
  onBuyBus?: () => void;
  onBuyCarriage: () => void;
  onBuyLine: () => void;
  onBuyInterchange: () => void;
  onBuyTunnel?: () => void;
  hasTransitAdContract?: boolean;
  transitAdDaysRemaining?: number;
  onBuyTransitAdContract?: () => void;
  onBuyRailGrinder?: () => void;
  railGrinderBoostUntil?: number;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  money,
  inventory,
  activeLinesCount,
  totalTrainsCount,
  theme,
  lang,
  onClose,
  onBuyTrain,
  onBuyBus,
  onBuyCarriage,
  onBuyLine,
  onBuyInterchange,
  onBuyTunnel,
  hasTransitAdContract,
  transitAdDaysRemaining,
  onBuyTransitAdContract,
  onBuyRailGrinder,
  railGrinderBoostUntil
}) => {
  const isDark = theme === 'dark';

  const trainCost = 400 + totalTrainsCount * 100;
  const busCost = 300 + (inventory.unassignedBuses ?? 0) * 50;
  const carriageCost = 250;
  const lineCost = 3000;
  const interchangeCost = 350;
  const tunnelCost = 300;

  const items = [
    {
      titleVi: 'Hầm Vượt Sông / Cầu',
      titleEn: 'River Tunnel / Bridge Token',
      descVi: 'Bắt buộc khi đặt tuyến metro vượt qua sông hoặc vùng nước đô thị.',
      descEn: 'Required for metro tracks crossing rivers and urban waterways.',
      cost: tunnelCost,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-cyan-400 stroke-current fill-none stroke-2">
          <path d="M 3 8 C 8 13, 16 13, 21 8" />
          <path d="M 3 16 C 8 11, 16 11, 21 16" />
          <line x1="5" y1="12" x2="7" y2="12" strokeDasharray="1 1" />
          <line x1="11" y1="12" x2="13" y2="12" strokeDasharray="1 1" />
          <line x1="17" y1="12" x2="19" y2="12" strokeDasharray="1 1" />
        </svg>
      ),
      canBuy: money >= tunnelCost && !!onBuyTunnel,
      action: onBuyTunnel || (() => {}),
      currentCount: inventory.tunnelTokens,
      countLabelVi: 'Có sẵn',
      countLabelEn: 'Available'
    },
    {
      titleVi: 'Đoàn Tàu Metro Mới',
      titleEn: 'New Metro Train',
      descVi: 'Bổ sung 1 đoàn tàu vào kho dự phòng để điều phối lên các tuyến đường sắt.',
      descEn: 'Add 1 train to your depot to deploy onto crowded rail lines.',
      cost: trainCost,
      icon: <Train className="w-5 h-5 text-purple-400" />,
      canBuy: money >= trainCost,
      action: onBuyTrain,
      currentCount: inventory.unassignedTrains,
      countLabelVi: 'Chưa bố trí',
      countLabelEn: 'Depot'
    },
    {
      titleVi: 'Xe Buýt Nhanh BRT Mới',
      titleEn: 'New Feeder BRT Bus',
      descVi: 'Bổ sung 1 xe buýt nhanh BRT (6 chỗ, qua cầu đường bộ miễn phí) vào kho buýt.',
      descEn: 'Add 1 Feeder BRT bus (6 capacity, free road bridges) to your bus depot.',
      cost: busCost,
      icon: <span className="text-xl leading-none">🚌</span>,
      canBuy: money >= busCost && !!onBuyBus,
      action: onBuyBus || (() => {}),
      currentCount: inventory.unassignedBuses ?? 0,
      countLabelVi: 'Kho buýt',
      countLabelEn: 'Depot'
    },
    {
      titleVi: 'Toa Chở Khách Tiêu Chuẩn',
      titleEn: 'Standard Carriage Extension',
      descVi: 'Gắn thêm toa vào đoàn tàu thường hoặc 2 tầng (+4 chỗ tàu thường, +8 chỗ tàu 2 tầng).',
      descEn: 'Attach extra carriage to trains (+4 capacity for standard, +8 for double-decker).',
      cost: carriageCost,
      icon: <Layers className="w-5 h-5 text-indigo-400" />,
      canBuy: money >= carriageCost,
      action: onBuyCarriage,
      currentCount: inventory.carriages,
      countLabelVi: 'Có sẵn',
      countLabelEn: 'Available'
    },
    {
      titleVi: 'Hạn Mức Tuyến Đường',
      titleEn: 'New Metro Line Slot',
      descVi: 'Mở khóa thêm 1 tuyến tàu mới trong thành phố (tối đa 15 tuyến).',
      descEn: 'Unlock 1 additional line slot across the city (max 15 lines).',
      cost: lineCost,
      icon: <Plus className="w-5 h-5 text-emerald-400" />,
      canBuy: money >= lineCost && inventory.availableLines < 15,
      action: onBuyLine,
      currentCount: `${activeLinesCount}/${inventory.availableLines}`,
      countLabelVi: 'Đang dùng',
      countLabelEn: 'Active'
    },
    {
      titleVi: 'Hợp Đồng Quảng Cáo Thân Tàu (1 Tuần)',
      titleEn: 'Transit Advertising Contract (1 Week)',
      descVi: 'Hợp đồng 7 ngày (1 tuần). Thu nhập thụ động $200/ngày cho mỗi toa tàu (hiển thị dải sơn xanh da trời ở 2 bên thân tàu).',
      descEn: '7-day deal earning $200/day passive revenue for every active train car (features sky blue livery on both flanks).',
      cost: 2000,
      icon: <span className="text-base leading-none">📰</span>,
      canBuy: money >= 2000 && !!onBuyTransitAdContract,
      action: onBuyTransitAdContract || (() => {}),
      currentCount: hasTransitAdContract
        ? (lang === 'vi' ? `Còn ${transitAdDaysRemaining || 7} ngày` : `${transitAdDaysRemaining || 7} days left`)
        : (lang === 'vi' ? 'Chưa kích hoạt' : 'Inactive'),
      countLabelVi: hasTransitAdContract ? 'Thời hạn' : 'Trạng thái',
      countLabelEn: hasTransitAdContract ? 'Duration' : 'Status'
    },
    {
      titleVi: 'Xe Cứu Hộ Bảo Trì Đường Ray (24h)',
      titleEn: 'Emergency Rail Grinder Service (24h)',
      descVi: 'Tăng +25% tốc độ toàn bộ đoàn tàu trong 24h, đồng thời xóa ngay lập tức mọi sự cố ngập lụt và kẹt ray trên toàn thành phố.',
      descEn: 'Boost +25% train speeds for 24h and instantly clear all flooded and stalled rail track incidents city-wide.',
      cost: 2000,
      icon: <span className="text-xl leading-none">🛠️</span>,
      canBuy: money >= 2000 && !!onBuyRailGrinder,
      action: onBuyRailGrinder || (() => {}),
      currentCount: (railGrinderBoostUntil && railGrinderBoostUntil > Date.now())
        ? (lang === 'vi' ? 'Đang kích hoạt (+25%)' : 'Active (+25%)')
        : (lang === 'vi' ? 'Sẵn sàng điều động' : 'Ready to deploy'),
      countLabelVi: 'Trạng thái',
      countLabelEn: 'Status'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className={`w-full max-w-xl max-h-[90dvh] overflow-y-auto overflow-x-hidden rounded-2xl p-4 sm:p-6 md:p-7 border shadow-2xl relative scrollbar-thin ${
        isDark ? 'bg-neutral-900 border-neutral-800 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-neutral-500/20 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {lang === 'vi' ? 'Cửa Hàng Thiết Bị Giao Thông' : 'Transit Equipment Depot'}
              </h2>
              <p className="text-xs opacity-60">
                {lang === 'vi' ? 'Đầu tư tiền vé vào trang bị để nâng cấp năng lực vận tải' : 'Reinvest passenger fares to expand transport capacity'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase opacity-60">
              {lang === 'vi' ? 'Số dư hiện tại' : 'Current Balance'}
            </div>
            <div className="font-mono font-bold text-lg text-emerald-500">
              {formatMoney(money)}
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="space-y-3 mb-6">
          {items.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition ${
                isDark ? 'bg-neutral-800/50 border-neutral-700/80' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-neutral-700/30">
                  {item.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">
                      {lang === 'vi' ? item.titleVi : item.titleEn}
                    </h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-neutral-700/40 opacity-70">
                      {lang === 'vi' ? item.countLabelVi : item.countLabelEn}: {item.currentCount}
                    </span>
                  </div>
                  <p className="text-xs opacity-60 mt-0.5 max-w-sm">
                    {lang === 'vi' ? item.descVi : item.descEn}
                  </p>
                </div>
              </div>

              {/* Price & Buy Button */}
              <button
                onClick={item.action}
                disabled={!item.canBuy}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-sm ${
                  item.canBuy
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-95'
                    : 'bg-neutral-700/40 text-neutral-400 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{formatMoney(item.cost)}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className="text-[11px] opacity-60 text-center">
          {lang === 'vi'
            ? 'Mẹo: Giá tàu tăng dần theo quy mô hạm đội; hãy tối ưu hướng tuyến trước khi mua thêm.'
            : 'Tip: Fleet costs increase with size; streamline routes before adding trains.'}
        </div>
      </div>
    </div>
  );
};
