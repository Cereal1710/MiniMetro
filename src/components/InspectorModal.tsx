import React, { useState } from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle2, X, ArrowRight, Play, Sparkles, CheckSquare, Square } from 'lucide-react';
import { MetroLine, Station, InspectorState } from '../types/game';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lines: MetroLine[];
  stations: Station[];
  inspectorState: InspectorState;
  money?: number;
  theme: 'dark' | 'light';
  lang: 'vi' | 'en';
  onRequestDeploy?: (lineId: string, plannedStationIds: string[]) => void;
  onDeployOnLine: (lineId: string, plannedStationIds: string[]) => void;
  onCancelInspector: () => void;
}

export const InspectorModal: React.FC<InspectorModalProps> = ({
  isOpen,
  onClose,
  lines,
  stations,
  inspectorState,
  money = 0,
  theme,
  lang,
  onRequestDeploy,
  onDeployOnLine,
  onCancelInspector
}) => {
  const isDark = theme === 'dark';
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [selectedStationIds, setSelectedStationIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const isCoolingDown = (inspectorState.cooldownRemaining || 0) > 0;
  const isPatrolling = inspectorState.status === 'patrolling';

  // Station lookup
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  const handleSelectLine = (line: MetroLine) => {
    setSelectedLineId(line.id);
    // By default, select all stations on the line
    setSelectedStationIds([...line.stationIds]);
  };

  const handleToggleStation = (sId: string, line: MetroLine) => {
    setSelectedStationIds(prev => {
      if (prev.includes(sId)) {
        return prev.filter(id => id !== sId);
      } else {
        // Keep canonical sequence of line stations
        return line.stationIds.filter(id => prev.includes(id) || id === sId);
      }
    });
  };

  const handleStartInspection = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line || selectedStationIds.length < 5) return;
    if (onRequestDeploy) {
      onRequestDeploy(lineId, selectedStationIds);
    } else {
      onDeployOnLine(lineId, selectedStationIds);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in select-none">
      <div className={`relative w-full max-w-2xl max-h-[92dvh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all ${
        isDark ? 'bg-slate-900 border-amber-500/40 text-slate-100' : 'bg-white border-amber-300 text-slate-900'
      }`}>
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between gap-3 bg-linear-to-r from-amber-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-md">
              👮
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  {lang === 'vi' ? 'Lập Lộ trình Thanh tra Tuyến' : 'Metro Line Inspector'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-mono font-black shadow-xs">
                  {lang === 'vi' ? 'Thưởng: 300$/ga' : 'Reward: $300/station'}
                </span>
                <span className="text-[11px] font-bold text-rose-400 font-mono px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30">
                  {lang === 'vi' ? 'Phí: $1,000' : 'Cost: $1,000'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {lang === 'vi'
                  ? 'Chọn các ga thanh tra sẽ xuống kiểm tra và bắt tàu tiếp theo (tối thiểu 5 ga)'
                  : 'Select stations the inspector will alight, inspect & catch next train (min 5 stations)'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cooldown Warning if Active */}
        {isCoolingDown && (
          <div className="p-3 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-300">
            <Clock className="w-4 h-4 animate-spin text-amber-400 shrink-0" style={{ animationDuration: '4s' }} />
            <div className="flex-1">
              <span className="font-bold">
                {lang === 'vi' ? 'Thanh tra đang hồi chiêu:' : 'Inspector on cooldown:'}{' '}
              </span>
              <span className="font-mono font-bold text-amber-200">
                {Math.ceil(inspectorState.cooldownRemaining)}s
              </span>
              <span className="text-slate-400 ml-1.5">
                {lang === 'vi' ? '(Vui lòng chờ hết hồi chiêu để bắt đầu đợt mới)' : '(Please wait for cooldown to expire)'}
              </span>
            </div>
          </div>
        )}

        {/* Patrolling Active Status Banner */}
        {isPatrolling && (
          <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg animate-pulse">👮</span>
              <div>
                <span className="font-bold text-emerald-400">
                  {lang === 'vi' ? 'Đang tuần tra:' : 'Patrol in progress:'}{' '}
                </span>
                <span className="font-mono text-white font-bold">
                  {inspectorState.visitedStationIds.length}/{inspectorState.targetCount} {lang === 'vi' ? 'ga' : 'stations'}
                </span>
                <span className="text-slate-400 ml-1.5">
                  ({Math.max(0, Math.floor(inspectorState.timeRemaining))}s {lang === 'vi' ? 'còn lại' : 'left'})
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onCancelInspector();
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition cursor-pointer active:scale-95"
            >
              {lang === 'vi' ? 'Hủy đợt này' : 'Cancel Patrol'}
            </button>
          </div>
        )}

        {/* Main Content: Line List & Station Selector */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-4 scrollbar-thin">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
            <span>{lang === 'vi' ? 'BƯỚC 1: CHỌN TUYẾN TÀU (CÓ TỪ 5 GA TRỞ LÊN)' : 'STEP 1: SELECT LINE (5+ STATIONS)'}</span>
            <span className="font-mono text-[11px] text-amber-400">
              {lines.filter(l => l.stationIds.length >= 5).length}/{lines.length} {lang === 'vi' ? 'tuyến đủ điều kiện' : 'eligible lines'}
            </span>
          </div>

          {lines.length === 0 ? (
            <div className="p-6 text-center rounded-2xl border border-dashed border-slate-700 bg-slate-800/20 text-slate-400">
              <span className="text-3xl block mb-2">🚇</span>
              <p className="font-bold text-sm text-slate-300">
                {lang === 'vi' ? 'Chưa có tuyến metro nào!' : 'No metro lines built yet!'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {lang === 'vi'
                  ? 'Hãy kéo nối giữa các ga để xây dựng tuyến có từ 5 ga trở lên để bắt đầu thanh tra.'
                  : 'Connect stations on the map to create a line with at least 5 stations.'}
              </p>
            </div>
          ) : (
            lines.map((line, idx) => {
              const stationCount = line.stationIds.length;
              const isEligible = stationCount >= 5;
              const isSelected = selectedLineId === line.id;
              const chosenCount = isSelected ? selectedStationIds.length : stationCount;
              const isEnoughStations = isSelected ? chosenCount >= 5 : isEligible;
              const calculatedReward = 300 * chosenCount;

              return (
                <div
                  key={line.id}
                  onClick={() => {
                    if (isEligible && !isCoolingDown && !isPatrolling) {
                      handleSelectLine(line);
                    }
                  }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                    !isEligible
                      ? isDark
                        ? 'bg-slate-900/40 border-slate-800 opacity-60'
                        : 'bg-neutral-100/60 border-neutral-200 opacity-60'
                      : isSelected
                      ? 'bg-amber-500/10 border-amber-500 ring-2 ring-amber-500/30 shadow-lg'
                      : isDark
                      ? 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
                      : 'bg-white border-neutral-300 hover:border-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-5 h-5 rounded-full shadow-xs shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: line.color }}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{line.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-800 font-mono text-slate-400 border border-slate-700">
                            {line.type || 'metro'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Eligibility Badge */}
                    {isEligible ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{stationCount} {lang === 'vi' ? 'ga trên tuyến' : 'stations on line'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>
                          {lang === 'vi'
                            ? `Cần thêm ${5 - stationCount} ga`
                            : `Need ${5 - stationCount} more`}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Interactive Station Checklist for Inspection (Visible when line is selected) */}
                  {isSelected && isEligible && (
                    <div className="mt-3 pt-3 border-t border-amber-500/20 animate-in fade-in">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                            {lang === 'vi' ? 'BƯỚC 2: CHỌN CÁC GA XUỐNG KIỂM TRA:' : 'STEP 2: SELECT STATIONS TO INSPECT:'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${
                            selectedStationIds.length >= 5
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}>
                            {selectedStationIds.length} {lang === 'vi' ? 'ga đã chọn (tối thiểu 5 ga)' : 'stations selected (min 5)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px]">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStationIds([...line.stationIds]);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 cursor-pointer transition active:scale-95"
                          >
                            {lang === 'vi' ? 'Chọn tất cả' : 'Select All'}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStationIds(line.stationIds.slice(0, 5));
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold border border-slate-700 cursor-pointer transition active:scale-95"
                          >
                            {lang === 'vi' ? 'Chọn 5 ga đầu' : 'Select 5 First'}
                          </button>
                        </div>
                      </div>

                      {/* Station Checklist Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                        {line.stationIds.map((sId, sIdx) => {
                          const st = stationMap.get(sId);
                          const isChecked = selectedStationIds.includes(sId);
                          const orderIndex = isChecked ? selectedStationIds.indexOf(sId) + 1 : null;

                          return (
                            <div
                              key={sId}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStation(sId, line);
                              }}
                              className={`flex items-center justify-between p-2 sm:p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? isDark
                                    ? 'bg-amber-500/15 border-amber-500/60 text-white shadow-xs'
                                    : 'bg-amber-50 border-amber-400 text-slate-900 shadow-xs'
                                  : isDark
                                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-500 hover:border-slate-600'
                                  : 'bg-neutral-100 border-neutral-300 text-slate-500 hover:border-neutral-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isChecked
                                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                                    : 'bg-slate-700 text-slate-400'
                                }`}>
                                  {orderIndex ? `${orderIndex}` : `${sIdx + 1}`}
                                </span>
                                <span className="font-semibold truncate">{st?.name || `Ga ${sIdx + 1}`}</span>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                                  isChecked
                                    ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                    : 'border-slate-600 bg-slate-800/50'
                                }`}>
                                  {isChecked ? '✓' : ''}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mechanism Explanation Note */}
                      <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-[11px] text-slate-300 mb-3 flex items-start gap-2">
                        <span className="text-base shrink-0">💡</span>
                        <p className="leading-relaxed">
                          {lang === 'vi'
                            ? 'Thanh tra sẽ đi từ ga đầu đến ga cuối, chỉ lên các chuyến tàu hướng về điểm cuối và không xuống những ga đã được kiểm tra xong.'
                            : 'Inspector travels from the first to the last station, only boards trains heading towards the end destination, and will not alight at stations already inspected.'}
                        </p>
                      </div>

                      {/* Action Bar: Budget & Deploy Confirmation Button */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
                        <div className="text-xs">
                          <span className="text-slate-400 font-medium">{lang === 'vi' ? 'Dự kiến thưởng:' : 'Projected Reward:'} </span>
                          <span className="font-mono font-bold text-amber-300">
                            +${calculatedReward.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[10px] ml-1.5 font-mono">
                            (300$ × {selectedStationIds.length} ga = {calculatedReward >= 1000 ? `lãi +$${(calculatedReward - 1000).toLocaleString()}` : `lỗ -$${(1000 - calculatedReward).toLocaleString()}`})
                          </span>
                        </div>

                        {selectedStationIds.length < 5 ? (
                          <div className="px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              {lang === 'vi'
                                ? `Cần chọn thêm ${5 - selectedStationIds.length} ga nữa (tối thiểu 5 ga)`
                                : `Select ${5 - selectedStationIds.length} more stations (min 5)`}
                            </span>
                          </div>
                        ) : money < 1000 ? (
                          <div className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 border border-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>
                              {lang === 'vi'
                                ? `Cần $1,000 để xuất phát (Hiện có: $${money.toLocaleString()})`
                                : `Need $1,000 to deploy (Balance: $${money.toLocaleString()})`}
                            </span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartInspection(line.id);
                            }}
                            className="px-4 py-2 rounded-xl bg-linear-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 border border-amber-300 ring-2 ring-amber-400/20"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>
                              {lang === 'vi'
                                ? `Bắt đầu tuần tra (${selectedStationIds.length} ga) (-$1,000 ➔ Nhận $${calculatedReward.toLocaleString()})`
                                : `Deploy Inspector (${selectedStationIds.length} st.) (-$1,000 ➔ Get $${calculatedReward.toLocaleString()})`}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Station Sequence Preview (when NOT expanded) */}
                  {!isSelected && (
                    <div className="flex flex-wrap items-center gap-1 py-1 text-[11px] text-slate-400">
                      {line.stationIds.map((sId, sIdx) => {
                        const st = stationMap.get(sId);
                        return (
                          <React.Fragment key={sId}>
                            <span className={`px-2 py-0.5 rounded-md font-medium shrink-0 border ${
                              isDark
                                ? 'bg-slate-800/80 border-slate-700/60 text-slate-300'
                                : 'bg-neutral-100 border-neutral-300 text-slate-700'
                            }`}>
                              {st?.name || `Ga ${sIdx + 1}`}
                            </span>
                            {sIdx < line.stationIds.length - 1 && (
                              <span className="text-slate-500 shrink-0">→</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Rules Note */}
        <div className={`p-3.5 sm:p-4 border-t text-xs flex flex-wrap items-center justify-between gap-2 ${
          isDark ? 'border-slate-800 bg-slate-900/60 text-slate-400' : 'border-neutral-200 bg-neutral-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>⏱️ 3 phút (180s)</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{lang === 'vi' ? 'Hồi chiêu: 0s' : '0s Cooldown'}</span>
            <span>•</span>
            <span>{lang === 'vi' ? 'Chỉ tính quá tải tại ga đang kiểm tra (chờ tàu tối đa 40s/ga, Zen không kiểm tra)' : 'Only checks overcrowding at current station (max 40s wait, Zen exempt)'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition cursor-pointer"
            >
              {lang === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
