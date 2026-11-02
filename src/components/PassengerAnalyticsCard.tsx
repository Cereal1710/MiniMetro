import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Users,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { GameStats } from '../types/game';

interface PassengerAnalyticsCardProps {
  stats?: GameStats;
  currentDayIndex?: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
}

const SHORT_DAYS_VI = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SHORT_DAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const PassengerAnalyticsCard: React.FC<PassengerAnalyticsCardProps> = ({
  stats,
  currentDayIndex = 0,
  theme,
  lang
}) => {
  const isDark = theme === 'dark';
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const todayCount = stats?.todayPassengers ?? 0;
  const history = stats?.dailyHistory ?? [];

  // Build unified chart data: past days in history + current running day
  const chartData = useMemo(() => {
    const list: Array<{
      label: string;
      fullLabel: string;
      passengers: number;
      isToday: boolean;
    }> = [];

    // If we have history from past days
    if (history.length > 0) {
      history.forEach((rec, idx) => {
        const shortDay = lang === 'vi'
          ? (SHORT_DAYS_VI[rec.dayIndex] || `N${idx + 1}`)
          : (SHORT_DAYS_EN[rec.dayIndex] || `D${idx + 1}`);
        const fullDay = lang === 'vi' ? rec.dayNameVi : rec.dayNameEn;

        list.push({
          label: shortDay,
          fullLabel: fullDay,
          passengers: rec.passengers,
          isToday: false
        });
      });
    } else {
      // If no past days recorded yet, provide a baseline start
      const prevDayIdx = (currentDayIndex + 6) % 7;
      list.push({
        label: lang === 'vi' ? (SHORT_DAYS_VI[prevDayIdx] || 'Hôm qua') : (SHORT_DAYS_EN[prevDayIdx] || 'Yday'),
        fullLabel: lang === 'vi' ? 'Hôm qua' : 'Yesterday',
        passengers: 0,
        isToday: false
      });
    }

    // Append today's live tally
    const todayLabel = lang === 'vi' ? 'H.nay' : 'Today';
    const todayFullLabel = lang === 'vi'
      ? `${SHORT_DAYS_VI[currentDayIndex]} (Hôm nay)`
      : `${SHORT_DAYS_EN[currentDayIndex]} (Today)`;

    list.push({
      label: todayLabel,
      fullLabel: todayFullLabel,
      passengers: todayCount,
      isToday: true
    });

    return list;
  }, [history, todayCount, currentDayIndex, lang]);

  // Compute key stats metrics
  const { maxDayCount, avgCount } = useMemo(() => {
    if (chartData.length === 0) return { maxDayCount: 0, avgCount: 0 };
    const allCounts = chartData.map(d => d.passengers);
    const max = Math.max(...allCounts, 0);
    const sum = allCounts.reduce((acc, c) => acc + c, 0);
    const avg = Math.round(sum / allCounts.length);
    return { maxDayCount: max, avgCount: avg };
  }, [chartData]);

  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        isDark
          ? 'bg-slate-900/80 border-slate-800/80 text-slate-200'
          : 'bg-white border-neutral-200 text-slate-800 shadow-sm'
      }`}
    >
      {/* Header bar with toggle */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className={`px-3 py-2 flex items-center justify-between cursor-pointer select-none transition ${
          isDark ? 'hover:bg-slate-800/50' : 'hover:bg-neutral-50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-xs truncate">
            {lang === 'vi' ? 'Lưu lượng hành khách' : 'Passenger Analytics'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Badge showing today's count */}
          <span className="px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            +{todayCount} {lang === 'vi' ? 'hôm nay' : 'today'}
          </span>
          <button
            type="button"
            className="p-0.5 opacity-60 hover:opacity-100 transition"
            aria-label="Toggle details"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="px-3 pb-2.5 pt-1 space-y-2">
          {/* KPI metrics row */}
          <div className="grid grid-cols-3 gap-1.5 text-center">
            {/* Today */}
            <div
              className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[9px] opacity-70">
                <Users className="w-2.5 h-2.5 text-emerald-400" />
                <span>{lang === 'vi' ? 'Hôm nay' : 'Today'}</span>
              </div>
              <div className="font-mono font-bold text-xs text-emerald-400 mt-0.5">
                {todayCount}
              </div>
            </div>

            {/* Daily Avg */}
            <div
              className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[9px] opacity-70">
                <Calendar className="w-2.5 h-2.5 text-cyan-400" />
                <span>{lang === 'vi' ? 'TB/ngày' : 'Avg/Day'}</span>
              </div>
              <div className="font-mono font-bold text-xs text-cyan-400 mt-0.5">
                {avgCount}
              </div>
            </div>

            {/* Peak Day */}
            <div
              className={`p-1.5 rounded-lg border ${
                isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[9px] opacity-70">
                <Award className="w-2.5 h-2.5 text-amber-400" />
                <span>{lang === 'vi' ? 'Kỷ lục' : 'Peak'}</span>
              </div>
              <div className="font-mono font-bold text-xs text-amber-400 mt-0.5">
                {maxDayCount}
              </div>
            </div>
          </div>

          {/* Chart View Toggle Bar */}
          <div className="flex items-center justify-between text-[10px] pt-0.5">
            <span className="opacity-60 text-[10px]">
              {lang === 'vi' ? 'Biểu đồ chuyến qua các ngày' : 'Daily transit trend'}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChartType('area');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  chartType === 'area'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                {lang === 'vi' ? 'Vùng' : 'Area'}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChartType('bar');
                }}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                  chartType === 'bar'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-black'
                }`}
              >
                <BarChart3 className="w-3 h-3 inline-block -mt-0.5" />
              </button>
            </div>
          </div>

          {/* Recharts Container */}
          <div className="w-full h-[115px] min-w-0">
            <ResponsiveContainer width="100%" height={115}>
              {chartType === 'area' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="passengerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div
                          className={`p-1.5 rounded-md border text-[10px] shadow-lg ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-100'
                              : 'bg-white border-neutral-300 text-slate-800'
                          }`}
                        >
                          <div className="font-semibold text-slate-400">{item.fullLabel}</div>
                          <div className="font-mono font-bold text-emerald-400 text-xs">
                            {item.passengers} {lang === 'vi' ? 'hành khách' : 'passengers'}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="passengers"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#passengerGradient)"
                    dot={{
                      r: 2.5,
                      fill: '#10b981',
                      strokeWidth: 1,
                      stroke: isDark ? '#0f172a' : '#ffffff'
                    }}
                    activeDot={{ r: 4, fill: '#06b6d4' }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 8, right: 6, left: -22, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke={isDark ? '#334155' : '#e2e8f0'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke={isDark ? '#64748b' : '#94a3b8'}
                    fontSize={9}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const item = payload[0].payload;
                      return (
                        <div
                          className={`p-1.5 rounded-md border text-[10px] shadow-lg ${
                            isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-100'
                              : 'bg-white border-neutral-300 text-slate-800'
                          }`}
                        >
                          <div className="font-semibold text-slate-400">{item.fullLabel}</div>
                          <div className="font-mono font-bold text-emerald-400 text-xs">
                            {item.passengers} {lang === 'vi' ? 'hành khách' : 'passengers'}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar
                    dataKey="passengers"
                    fill="#10b981"
                    radius={[3, 3, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
