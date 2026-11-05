import React from 'react';
import { X, CheckCircle2, Sparkles, Building, Layers, ArrowUpRight } from 'lucide-react';
import { Station } from '../types/game';

interface MassStationUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stations: Station[];
  money: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onUpgradeAll: (feature: 'smartIC' | 'coffee' | 'solar' | 'tod' | 'parkAndRide' | 'feeder' | 'all') => void;
}

interface FeatureDef {
  key: 'smartIC' | 'coffee' | 'solar' | 'tod' | 'parkAndRide' | 'feeder';
  icon: string;
  nameVi: string;
  nameEn: string;
  descVi: string;
  descEn: string;
  cost: number;
  check: (s: Station) => boolean;
  accentColor: string;
}

const UPGRADE_FEATURES: FeatureDef[] = [
  {
    key: 'smartIC',
    icon: '💳',
    nameVi: 'Cổng Soát Vé Smart IC Card',
    nameEn: 'Contactless Smart IC Gate',
    descVi: 'Giảm 50% thời gian đón trả khách (Dwell Time) & chống trốn vé toàn ga.',
    descEn: 'Cuts dwell boarding delay by 50% & eliminates fare evasion city-wide.',
    cost: 1200,
    check: (s) => Boolean(s.hasSmartIC),
    accentColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  {
    key: 'coffee',
    icon: '☕',
    nameVi: 'Kiosk Cà Phê & Cửa Hàng Tiện Lợi',
    nameEn: 'Coffee Kiosk & Mini Mart',
    descVi: 'Thu nhập thụ động +$25/h & +$0.5/khách ghé ga.',
    descEn: 'Passive income +$25/h & +$0.5/passenger passing through.',
    cost: 800,
    check: (s) => Boolean(s.hasCoffeeKiosk),
    accentColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  },
  {
    key: 'solar',
    icon: '☀️',
    nameVi: 'Mái Pin Năng Lượng Mặt Trời',
    nameEn: 'Solar Roof Clean Energy',
    descVi: 'Tiết kiệm +$40/h ban ngày & dự phòng điện giữ tàu chạy 100% khi mất điện.',
    descEn: 'Saves +$40/h during daylight & powers emergency batteries in blackouts.',
    cost: 1200,
    check: (s) => Boolean(s.hasSolarRoof),
    accentColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
  },
  {
    key: 'tod',
    icon: '🏢',
    nameVi: 'Phức Hợp Thương Mại & Căn Hộ TOD',
    nameEn: 'TOD Commercial Hub',
    descVi: 'Tăng +8 sức chứa nhà ga, thu nhập +$100/h & +$1.0/mỗi lượt khách.',
    descEn: '+8 station capacity, passive +$100/h & +$1.0/passenger.',
    cost: 3500,
    check: (s) => Boolean(s.isTodHub),
    accentColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30'
  },
  {
    key: 'parkAndRide',
    icon: '🅿️',
    nameVi: 'Bãi Gửi Xe Park & Ride (P+R)',
    nameEn: 'Park & Ride (P+R) Facility',
    descVi: 'Tăng +10 sức chứa ga & thu thêm +$1 phí đỗ xe trên mỗi hành khách.',
    descEn: '+10 station capacity & +$1 parking fee revenue per passenger.',
    cost: 600,
    check: (s) => Boolean(s.hasParkAndRide),
    accentColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  {
    key: 'feeder',
    icon: '🛵',
    nameVi: 'Trạm Xe Ôm Công Nghệ & Mini Feeder',
    nameEn: 'Feeder Motorbike Hub',
    descVi: 'Tự động sơ tán 2 khách sang ga lân cận khi ga quá tải, nhận +$3/khách.',
    descEn: 'Auto-transfers 2 passengers to nearby stations when crowded (+$3/pax).',
    cost: 500,
    check: (s) => Boolean(s.hasFeederStation),
    accentColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
  }
];

export const MassStationUpgradeModal: React.FC<MassStationUpgradeModalProps> = ({
  isOpen,
  onClose,
  stations,
  money,
  theme,
  lang,
  onUpgradeAll
}) => {
  if (!isOpen) return null;
  const isDark = theme === 'dark';
  const totalStations = stations.length;

  // Calculate master upgrade totals across all 6 features
  let masterRemainingUpgrades = 0;
  let masterTotalCost = 0;

  UPGRADE_FEATURES.forEach(feat => {
    const needUpgradeCount = stations.filter(s => !feat.check(s)).length;
    masterRemainingUpgrades += needUpgradeCount;
    masterTotalCost += needUpgradeCount * feat.cost;
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-xs p-3 sm:p-4 flex items-center justify-center animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-2xl max-h-[90dvh] overflow-y-auto my-auto rounded-3xl border p-4 sm:p-6 shadow-2xl transition-all scrollbar-thin ${
          isDark
            ? 'bg-neutral-900 border-neutral-700/80 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-700/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>{lang === 'vi' ? 'Nâng Cấp Hàng Loạt Toàn Bộ Nhà Ga' : 'Mass Station Network Upgrades'}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                  {totalStations} {lang === 'vi' ? 'Ga' : 'Stations'}
                </span>
              </h2>
              <p className="text-xs opacity-60">
                {lang === 'vi'
                  ? 'Trang bị đồng loạt tiện ích và công nghệ thông minh cho tất cả nhà ga đô thị.'
                  : 'Deploy amenities & smart infrastructure city-wide in 1 click.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl opacity-60 hover:opacity-100 hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master All-In-One Upgrade Banner */}
        <div className="mt-4 p-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shrink-0">
              ✨
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                <span>{lang === 'vi' ? 'Nâng Cấp Toàn Diện Mọi Tiện Ích' : 'Master All-Amenities Upgrade'}</span>
              </h3>
              <p className="text-xs text-neutral-300">
                {masterRemainingUpgrades === 0
                  ? (lang === 'vi' ? '🎉 Tất cả nhà ga đã đạt chuẩn tiện ích 100%!' : '🎉 All stations 100% upgraded!')
                  : (lang === 'vi'
                    ? `Lắp toàn bộ 6 tiện ích còn thiếu (${masterRemainingUpgrades} lượt) trên toàn thành phố.`
                    : `Install all missing upgrades (${masterRemainingUpgrades} slots) city-wide.`)}
              </p>
            </div>
          </div>

          {masterRemainingUpgrades > 0 && (
            <button
              disabled={money < masterTotalCost}
              onClick={() => onUpgradeAll('all')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 active:scale-95 ${
                money >= masterTotalCost
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              }`}
            >
              <span>{lang === 'vi' ? 'Nâng Cấp Toàn Bộ' : 'Upgrade All'}</span>
              <span className="font-mono font-black text-sm">
                ${masterTotalCost.toLocaleString()}
              </span>
            </button>
          )}
        </div>

        {/* Individual Feature Upgrades List */}
        <div className="mt-4 space-y-3">
          {UPGRADE_FEATURES.map((feat) => {
            const installedCount = stations.filter(s => feat.check(s)).length;
            const remainingCount = totalStations - installedCount;
            const totalFeatureCost = remainingCount * feat.cost;
            const isFullyInstalled = remainingCount === 0;
            const canAfford = money >= totalFeatureCost;
            const percent = totalStations > 0 ? Math.round((installedCount / totalStations) * 100) : 0;

            return (
              <div
                key={feat.key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isFullyInstalled
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isDark
                      ? 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-700'
                      : 'border-neutral-200 bg-neutral-50/80 hover:border-neutral-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Icon & Description */}
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl shrink-0 p-1.5 rounded-xl bg-neutral-800/50">
                      {feat.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs sm:text-sm">
                          {lang === 'vi' ? feat.nameVi : feat.nameEn}
                        </span>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-700/50 text-neutral-300">
                          ${feat.cost.toLocaleString()}/{lang === 'vi' ? 'ga' : 'station'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {lang === 'vi' ? feat.descVi : feat.descEn}
                      </p>

                      {/* Mini Progress Bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-24 sm:w-32 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isFullyInstalled ? 'bg-emerald-400' : 'bg-cyan-400'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono opacity-60">
                          {installedCount}/{totalStations} ({percent}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Upgrade Button */}
                  <div className="shrink-0 flex items-center justify-end sm:self-center">
                    {isFullyInstalled ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{lang === 'vi' ? 'Đã lắp 100%' : '100% Installed'}</span>
                      </div>
                    ) : (
                      <button
                        disabled={!canAfford}
                        onClick={() => onUpgradeAll(feat.key)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer active:scale-95 shadow-sm ${
                          canAfford
                            ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                            : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                        }`}
                      >
                        <span>
                          {lang === 'vi' ? `Lắp ${remainingCount} ga` : `Upgrade ${remainingCount}`}
                        </span>
                        <span className="font-mono font-bold">
                          ${totalFeatureCost.toLocaleString()}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Balance Note */}
        <div className="mt-4 pt-3 border-t border-neutral-700/40 flex items-center justify-between text-xs opacity-70">
          <span>{lang === 'vi' ? 'Ngân sách hiện có:' : 'Current Balance:'}</span>
          <span className="font-mono font-bold text-emerald-400 text-sm">
            ${money.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

