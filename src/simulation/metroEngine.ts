import {
  Station,
  MetroLine,
  Train,
  FloatingText,
  GameMode,
  GameInventory,
  GameStats,
  CityMapConfig,
  StationShape,
  Passenger,
  StationData,
  MetroLineType,
  WeatherType,
  WeatherState,
  UrbanIncident,
  CampaignScenario,
  CampaignState,
  InspectorState,
  IncidentType,
  BankLoan,
  UrbanSurgeEvent,
  DailyChallenge
} from '../types/game';
import { CAMPAIGN_SCENARIOS } from '../data/campaignScenarios';
import { LINE_PALETTE } from '../data/maps';
import { distance, segmentCrossesRiver, isPointInWater } from '../utils/geometry';
import { findNextTransitStep } from './pathfinding';
import { soundEngine } from '../audio/soundEngine';

export interface SimulationState {
  stations: Station[];
  lines: MetroLine[];
  trains: Train[];
  inventory: GameInventory;
  stats: GameStats;
  money: number;
  timeOfDayHours: number; // e.g. 6.0 to 24.0
  currentDayIndex: number; // 0 = Mon, 6 = Sun
  weekNumber: number;
  gameSpeed: number; // 0 = pause, 1, 2, 3
  isGameOver: boolean;
  gameOverReason: string | null;
  gameOverStationId?: string | null;
  floatingTexts: FloatingText[];
  pendingWeeklyReward: boolean;
  gameMode: GameMode;
  isRushHour: boolean;
  weather: WeatherState;
  activeIncident: UrbanIncident | null;
  campaignState?: CampaignState | null;
  inspectorState: InspectorState;
  disableIncidents: boolean;
  activeLoans: BankLoan[];
  activeSurgeEvent: UrbanSurgeEvent | null;
  dailyChallenges: DailyChallenge[];
}

export const DAY_NAMES_VI = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
export const DAY_NAMES_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function getLineSpeedMultiplier(type?: MetroLineType): number {
  switch (type) {
    case 'feeder_bus':
      return 0.90; // Agile city BRT bus (10% slower than metro)
    case 'double_decker':
      return 1.20; // Double-decker train (speed same as intercity: +20%)
    case 'intercity':
      return 1.20; // +20% faster than metro
    case 'high_speed':
      return 1.80; // +80% faster than metro
    case 'metro':
    default:
      return 1.0; // standard metro speed
  }
}

export function getTrainRouteCoordinate(train: Train, totalSegments: number, isLoop: boolean): number {
  const p = Math.max(0, Math.min(1, train.progress ?? 0));
  const seg = Math.max(0, Math.min(totalSegments - 1, train.segmentIndex ?? 0));
  if (isLoop) {
    if (train.direction === 1) {
      return seg + p;
    } else {
      return ((seg - p) % totalSegments + totalSegments) % totalSegments;
    }
  } else {
    if (train.direction === 1) {
      return seg + p;
    } else {
      return totalSegments + (totalSegments - 1 - seg) + p;
    }
  }
}

export function getHeadwayDistanceAhead(
  train: Train,
  otherTrain: Train,
  totalSegments: number,
  isLoop: boolean
): number {
  const L = isLoop ? totalSegments : 2 * totalSegments;
  const posA = getTrainRouteCoordinate(train, totalSegments, isLoop);
  const posB = getTrainRouteCoordinate(otherTrain, totalSegments, isLoop);
  return (posB - posA + L) % L;
}

export class MetroEngine {
  public state: SimulationState;
  public mapConfig: CityMapConfig;
  public stationPool: StationData[];
  public masterStationPool: StationData[];
  public masterInitialStations: StationData[];
  public isUnlimitedMode: boolean = false;
  private nextStationSpawnTime: number = 25; // seconds
  private lastWarningSoundTime: number = 0;
  private passengerIdCounter: number = 1;
  private returnCommuterQueue: { originStationId: string; targetShape: StationShape; readyHour: number }[] = [];
  public maintenanceProtectedToday: boolean = false;
  private nightMaintenanceAnnouncedToday: boolean = false;
  public activeExpoStationId: string | null = null;

  public toggleUnlimitedMode() {
    this.isUnlimitedMode = !this.isUnlimitedMode;
    if (this.isUnlimitedMode) {
      this.state.inventory.availableLines = 99;
      this.state.inventory.unassignedTrains = 99;
      this.state.inventory.carriages = 99;
      this.state.inventory.tunnelTokens = 99;
      this.state.inventory.interchangeTokens = 99;
    }
  }

  public spawnStation() {
    this.spawnNextStation();
  }

  constructor(mapConfig: CityMapConfig, mode: GameMode = 'standard') {
    this.mapConfig = mapConfig;
    this.masterStationPool = [...mapConfig.stationPool];
    this.masterInitialStations = [...mapConfig.initialStations];
    this.stationPool = [...mapConfig.stationPool];

    // Initialize stations
    const initialStations: Station[] = mapConfig.initialStations.map((s, idx) => ({
      id: s.id || `st-${idx + 1}`,
      name: s.name,
      shape: s.shape,
      x: s.x,
      y: s.y,
      passengers: [],
      maxCapacity: 6,
      isInterchange: false,
      overcrowdedTimer: 0,
      isOvercrowded: false,
      spawnTime: 0,
      specialHubType: s.specialHubType || (s.name.includes('Sân Bay') || s.name.includes('Sân bay') ? 'airport' : s.name.includes('Cảng') ? 'seaport' : undefined)
    }));

    this.state = {
      stations: initialStations,
      lines: [],
      trains: [],
      inventory: {
        availableLines: 3,
        unassignedTrains: 2,
        carriages: 1,
        interchangeTokens: 1,
        tunnelTokens: 2,
        doubleDeckerTrains: 0,
        doubleDeckerCarriages: 0,
        feederBuses: 1
      },
      stats: {
        totalPassengersDelivered: 0,
        totalDays: 1,
        totalWeeks: 1,
        moneyEarned: 0,
        peakLinesUsed: 0,
        peakTrainsUsed: 0,
        crowdedWarningsAvoided: 0,
        todayPassengers: 0,
        citizenSatisfaction: 95,
        dailyHistory: [],
        monthlyPassHoldersCount: 20,
        weeklyPassRevenueTotal: 0,
        distanceFareRevenueTotal: 0,
        luggageFareRevenueTotal: 0,
        nightMaintenanceCount: 0,
        hasTransitAdContract: false,
        transitAdDaysRemaining: 0,
        totalAdRevenue: 0,
        totalTouristTips: 0,
        expoEventsCompleted: 0
      },
      money: 200000,
      timeOfDayHours: 7.0, // starts at 07:00 AM
      currentDayIndex: 0,
      weekNumber: 1,
      gameSpeed: 1,
      isGameOver: false,
      gameOverReason: null,
      gameOverStationId: null,
      floatingTexts: [],
      pendingWeeklyReward: false,
      gameMode: mode,
      isRushHour: false,
      weather: {
        type: 'sunny',
        current: 'sunny',
        temperature: 31,
        rainIntensity: 0,
        descriptionVi: 'Trời nắng ráo',
        descriptionEn: 'Sunny & Clear',
        floodedStationIds: [],
        durationRemaining: 180
      },
      activeIncident: null,
      campaignState: null,
      inspectorState: {
        status: 'idle',
        currentStationId: null,
        currentTrainId: null,
        visitedStationIds: [],
        timeRemaining: 180,
        cooldownRemaining: 0,
        targetCount: 5,
        rewardAmount: 4000
      },
      disableIncidents: typeof localStorage !== 'undefined' && localStorage.getItem('mini_metro_disable_incidents') === 'true',
      activeLoans: [],
      activeSurgeEvent: null,
      dailyChallenges: [
        {
          id: 'dc-1',
          titleVi: 'Vận chuyển cao điểm',
          titleEn: 'Rush Hour Conveyor',
          descVi: 'Vận chuyển an toàn 50 lượt hành khách',
          descEn: 'Transport 50 passengers safely',
          targetValue: 50,
          currentValue: 0,
          reward: 1200,
          isCompleted: false,
          rewardClaimed: false,
          type: 'passengers',
          icon: '🚇'
        },
        {
          id: 'dc-2',
          titleVi: 'Đô thị đáng sống',
          titleEn: 'Liveable Metropolis',
          descVi: 'Duy trì chỉ số hài lòng người dân (CSI) trên 85%',
          descEn: 'Maintain Citizen Satisfaction above 85%',
          targetValue: 85,
          currentValue: 95,
          reward: 1500,
          isCompleted: true,
          rewardClaimed: false,
          type: 'satisfaction',
          icon: '⭐'
        },
        {
          id: 'dc-3',
          titleVi: 'Đầu mối liên vận',
          titleEn: 'Intermodal Hubs',
          descVi: 'Đón hoặc trả 15 khách tại trạm Sân bay / Cảng biển',
          descEn: 'Pick up or deliver 15 passengers at Airport/Seaport hubs',
          targetValue: 15,
          currentValue: 0,
          reward: 2000,
          isCompleted: false,
          rewardClaimed: false,
          type: 'intermodal',
          icon: '✈️'
        }
      ]
    };
  }

  public setDisableIncidents(disable: boolean) {
    this.state.disableIncidents = disable;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mini_metro_disable_incidents', disable ? 'true' : 'false');
      }
    } catch {}

    if (disable) {
      // Clear active breakdown or flooding incident immediately
      if (
        this.state.activeIncident &&
        (this.state.activeIncident.type === 'train_breakdown' || this.state.weather.type === 'flooded')
      ) {
        this.clearActiveIncident();
      }
      for (const t of this.state.trains) {
        t.breakdownTimer = 0;
      }
      for (const s of this.state.stations) {
        s.isFlooded = false;
      }
      if (this.state.weather.type === 'flooded') {
        this.setWeather('sunny');
      }
      this.addFloatingText(740, 500, '🛡️ Đã chặn sự cố hỏng tàu & ngập lụt', '#10B981');
    } else {
      this.addFloatingText(740, 500, '⚙️ Cho phép sự cố ngẫu nhiên theo dõi', '#F59E0B');
    }
  }

  public setGameSpeed(speed: number) {
    this.state.gameSpeed = speed;
  }

  public setGameMode(mode: GameMode) {
    this.state.gameMode = mode;
    if (mode === 'zen') {
      this.state.isGameOver = false;
      this.state.gameOverReason = null;
      for (const station of this.state.stations) {
        station.isOvercrowded = false;
        station.overcrowdedTimer = 0;
      }
    }
  }

  // Creative Time Adjustment: relative delta from baseline [-1h, +2h]
  public timeOffsetHours: number = 0;

  public adjustTimeOfDay(deltaHours: number) {
    const targetOffset = Math.max(-1.0, Math.min(2.0, this.timeOffsetHours + deltaHours));
    const effectiveDelta = targetOffset - this.timeOffsetHours;
    this.timeOffsetHours = targetOffset;

    let nextHours = this.state.timeOfDayHours + effectiveDelta;
    if (nextHours < 0) nextHours += 24;
    if (nextHours >= 24) nextHours -= 24;
    this.state.timeOfDayHours = Number(nextHours.toFixed(3));

    const h = this.state.timeOfDayHours % 24;
    this.state.isRushHour = (h >= 7.0 && h <= 9.5) || (h >= 17.0 && h <= 19.5);
  }

  public setTimeOffset(offset: number) {
    const targetOffset = Math.max(-1.0, Math.min(2.0, offset));
    const effectiveDelta = targetOffset - this.timeOffsetHours;
    this.timeOffsetHours = targetOffset;

    let nextHours = this.state.timeOfDayHours + effectiveDelta;
    if (nextHours < 0) nextHours += 24;
    if (nextHours >= 24) nextHours -= 24;
    this.state.timeOfDayHours = Number(nextHours.toFixed(3));

    const h = this.state.timeOfDayHours % 24;
    this.state.isRushHour = (h >= 7.0 && h <= 9.5) || (h >= 17.0 && h <= 19.5);
  }

  public resetTimeOffset() {
    this.setTimeOffset(0);
  }

  /**
   * Main simulation step (delta time in seconds)
   */
  public update(dt: number) {
    if (this.state.isGameOver || this.state.gameSpeed === 0 || this.state.pendingWeeklyReward) {
      return;
    }

    const simDt = dt * this.state.gameSpeed;

    // 1. Advance Game Clock
    // 1 real second at 1x = 1 game minute (1/60 hour per second)
    const hoursPerSecond = 1 / 60;
    this.state.timeOfDayHours += hoursPerSecond * simDt;

    // Check Rush Hour
    const h = this.state.timeOfDayHours % 24;
    const isMorningRush = h >= 7.0 && h <= 9.5;
    const isEveningRush = h >= 17.0 && h <= 19.5;
    this.state.isRushHour = isMorningRush || isEveningRush;

    // Feature 10: Night Maintenance Railcar Sweep (05:00 Morning Inspection Complete)
    if (h >= 5.0 && h < 5.4 && !this.nightMaintenanceAnnouncedToday) {
      this.nightMaintenanceAnnouncedToday = true;
      this.maintenanceProtectedToday = true;
      this.state.stats.nightMaintenanceCount = (this.state.stats.nightMaintenanceCount || 0) + 1;
      this.addFloatingText(740, 440, '🔧 Bảo trì đường ray đêm hoàn tất: -90% nguy cơ hỏng tàu hôm nay!', '#10B981');
      soundEngine.playConnect();
    } else if (h >= 12.0) {
      this.nightMaintenanceAnnouncedToday = false;
    }

    if (this.state.timeOfDayHours >= 24) {
      this.state.timeOfDayHours -= 24;
      this.maintenanceProtectedToday = false;
      const finishedDayIndex = this.state.currentDayIndex;
      const dayNameVi = DAY_NAMES_VI[finishedDayIndex] || `Ngày ${this.state.stats.totalDays}`;
      const dayNameEn = DAY_NAMES_EN[finishedDayIndex] || `Day ${this.state.stats.totalDays}`;

      if (!this.state.stats.dailyHistory) {
        this.state.stats.dailyHistory = [];
      }
      this.state.stats.dailyHistory.push({
        dayIndex: finishedDayIndex,
        dayNameVi,
        dayNameEn,
        passengers: this.state.stats.todayPassengers || 0,
        totalDelivered: this.state.stats.totalPassengersDelivered
      });
      // Keep up to 14 days of history
      if (this.state.stats.dailyHistory.length > 14) {
        this.state.stats.dailyHistory.shift();
      }
      this.state.stats.todayPassengers = 0;

      // Update daily passenger history for each line
      for (const l of this.state.lines) {
        if (!l.stats) {
          l.stats = {
            todayPassengers: 0,
            totalPassengers: 0,
            dailyPassengers: [],
            totalWaitTimeSamples: 0,
            totalWaitTimeSeconds: 0,
            congestionStopsCount: 0
          };
        }
        l.stats.dailyPassengers.push(l.stats.todayPassengers || 0);
        if (l.stats.dailyPassengers.length > 7) {
          l.stats.dailyPassengers.shift();
        }
        l.stats.todayPassengers = 0;
      }

      this.state.currentDayIndex = (this.state.currentDayIndex + 1) % 7;
      this.state.stats.totalDays++;

      // Operating cost deduction at midnight ($20 per active train, $10 per line)
      const dailyCost = this.state.trains.length * 20 + this.state.lines.length * 10;
      this.state.money = Math.max(0, this.state.money - dailyCost);

      // Feature 19: Doanh thu quảng cáo thân tàu ($200/ngày cho mỗi toa tàu đang vận hành, mua theo tuần)
      if (this.state.stats.hasTransitAdContract && (this.state.stats.transitAdDaysRemaining || 0) > 0) {
        const totalCars = this.state.trains.reduce((sum, t) => sum + 1 + (t.carriagesCount || 0), 0);
        const adPayout = totalCars * 200;
        this.state.money += adPayout;
        this.state.stats.totalAdRevenue = (this.state.stats.totalAdRevenue || 0) + adPayout;
        this.state.stats.transitAdDaysRemaining = Math.max(0, (this.state.stats.transitAdDaysRemaining || 0) - 1);

        if (this.state.stats.transitAdDaysRemaining === 0) {
          this.state.stats.hasTransitAdContract = false;
          this.addFloatingText(740, 480, `📰 +$${adPayout.toLocaleString()} QC Thân tàu • Hợp đồng tuần ĐÃ HẾT HẠN!`, '#F59E0B');
          soundEngine.playDisconnect();
        } else {
          this.addFloatingText(740, 480, `📰 +$${adPayout.toLocaleString()} QC Thân tàu (${totalCars} toa • Còn ${this.state.stats.transitAdDaysRemaining} ngày)`, '#0EA5E9');
        }
      } else {
        this.state.stats.hasTransitAdContract = false;
        this.state.stats.transitAdDaysRemaining = 0;
      }

      // Feature 28: Đếm ngược tuần lễ Expo & Thưởng hoàn thành
      if (this.activeExpoStationId) {
        const expoSt = this.state.stations.find(s => s.id === this.activeExpoStationId);
        if (expoSt) {
          expoSt.expoRemainingDays = Math.max(0, (expoSt.expoRemainingDays || 7) - 1);
          if (expoSt.expoRemainingDays === 0) {
            const reward = 15000;
            this.state.money += reward;
            this.state.stats.expoEventsCompleted = (this.state.stats.expoEventsCompleted || 0) + 1;
            soundEngine.playFanfare();
            this.addFloatingText(740, 400, `🏆 THÀNH CÔNG TUẦN LỄ EXPO! +$${reward.toLocaleString()} TÀI TRỢ`, '#F59E0B');
            expoSt.isExpoCentre = false;
            this.activeExpoStationId = null;
          }
        } else {
          this.activeExpoStationId = null;
        }
      } else if (this.state.stats.totalDays % 14 === 2 && this.state.stations.length >= 4) {
        // Kích hoạt tuần lễ Expo định kỳ mỗi 2 tuần một lần
        this.triggerExpoWeek();
      }

      // Sunday midnight: trigger Weekly Upgrade Grant & Loans/Satisfaction bonus & Weekly Pass Payout!
      if (this.state.currentDayIndex === 0) {
        this.state.weekNumber++;
        this.state.stats.totalWeeks++;
        this.state.pendingWeeklyReward = true;

        // Feature 12: Weekly Pass Revenue ($1,400/tuần/người - 80% cư dân)
        const baseCommuters = Math.max(10, Math.round(this.state.stations.length * 6 + (this.state.stats.totalPassengersDelivered * 0.12)));
        const monthlyPassHolders = Math.round(baseCommuters * 0.80);
        const weeklyPassRevenue = monthlyPassHolders * 1400; // $1,400/tuần/người!
        this.state.money += weeklyPassRevenue;
        this.state.stats.weeklyPassRevenueTotal = (this.state.stats.weeklyPassRevenueTotal || 0) + weeklyPassRevenue;
        this.state.stats.monthlyPassHoldersCount = monthlyPassHolders;
        this.addFloatingText(740, 360, `🎫 +$${weeklyPassRevenue.toLocaleString()} (${monthlyPassHolders} cư dân dùng Vé Tháng - $1,400/người)!`, '#06B6D4');

        // Deduct weekly interest for active bank loans
        if (this.state.activeLoans && this.state.activeLoans.length > 0) {
          const totalInterest = this.state.activeLoans.reduce((sum, l) => sum + l.weeklyInterestAmount, 0);
          this.state.money = Math.max(0, this.state.money - totalInterest);
          this.addFloatingText(740, 420, `-$${totalInterest.toLocaleString()} Trả lãi ngân hàng tuần!`, '#F59E0B');
        }

        // CSI Citizen Satisfaction Bonus (if CSI >= 85%, +$1,000 city council subsidy bonus)
        if ((this.state.stats.citizenSatisfaction || 0) >= 85) {
          const subsidy = 1000;
          this.state.money += subsidy;
          this.addFloatingText(740, 460, `+$${subsidy.toLocaleString()} Thưởng Đô thị Đáng Sống (CSI ≥ 85%)!`, '#10B981');
        }

        soundEngine.playFanfare();
        return;
      }
    }

    // 2. Station Spawning Progression
    this.nextStationSpawnTime -= simDt;
    if (this.nextStationSpawnTime <= 0 && this.stationPool.length > 0) {
      this.spawnNextStation();
      // Intervals grow slightly as network gets larger
      this.nextStationSpawnTime = 30 + this.state.stations.length * 4;
    }

    // 3. Passenger Spawning at Stations
    this.updatePassengerSpawns(simDt);

    // 4. Train Movement, Boarding & Alighting
    this.updateTrains(simDt);

    // 4b. Metro Line Inspector Simulation
    this.updateInspector(simDt, dt);

    // 5. Station Overcrowding checks
    this.updateOvercrowding(simDt);

    // 6. Update floating texts
    this.updateFloatingTexts(simDt);

    // 7. Update Weather & Urban Incidents
    this.updateWeather(simDt);

    // 7b. Update Urban Surge Event & Citizen Satisfaction
    this.updateSurgeEvent(simDt);
    this.updateCitizenSatisfaction(simDt);

    // 8. Campaign Mode Progression & Win/Loss Evaluation
    if (this.state.gameMode === 'campaign' && this.state.campaignState && !this.state.campaignState.isWon && !this.state.campaignState.isFailed) {
      const cs = this.state.campaignState;
      cs.currentDelivered = this.state.stats.totalPassengersDelivered;
      cs.currentDay = this.state.stats.totalDays;

      const scenario = CAMPAIGN_SCENARIOS.find(s => s.id === cs.scenarioId);
      const targetBudget = cs.scenarioId === 'budget_master' ? 3500 : 0;
      const budgetMet = this.state.money >= targetBudget;

      if (cs.currentDelivered >= cs.targetPassengers && budgetMet) {
        cs.isWon = true;
        let stars = 1;
        if (scenario) {
          if (cs.currentDay <= scenario.starThresholds.threeStarDays) stars = 3;
          else if (cs.currentDay <= scenario.starThresholds.twoStarDays) stars = 2;
        }
        cs.starsEarned = stars;
        soundEngine.playFanfare();
        const worldW = this.mapConfig.worldWidth || 2400;
        const worldH = this.mapConfig.worldHeight || 1700;
        this.addFloatingText(worldW / 2, worldH / 2, '🎉 CHIẾN THẮNG KỊCH BẢN! 🎉', '#10B981');
      } else if (cs.currentDay > cs.timeLimitDays) {
        cs.isFailed = true;
        cs.failReason = 'Hết thời gian quy định của kịch bản';
        soundEngine.playGameOver();
      }
    }
  }

  private spawnNextStation() {
    if (this.stationPool.length === 0) return;
    const nextData = this.stationPool.shift()!;
    const newStation: Station = {
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: nextData.name,
      shape: nextData.shape,
      x: nextData.x,
      y: nextData.y,
      passengers: [],
      maxCapacity: 6,
      isInterchange: false,
      overcrowdedTimer: 0,
      isOvercrowded: false,
      spawnTime: Date.now(),
      specialHubType: nextData.specialHubType || (nextData.name.includes('Sân Bay') || nextData.name.includes('Sân bay') ? 'airport' : nextData.name.includes('Cảng') ? 'seaport' : undefined)
    };

    this.state.stations.push(newStation);
    soundEngine.playStationSpawn();

    this.addFloatingText(newStation.x, newStation.y - 15, `+ Ga ${newStation.name}`, '#10B981');
  }

  private updatePassengerSpawns(simDt: number) {
    // Collect all shapes that currently exist among all stations
    const existingShapes = Array.from(new Set(this.state.stations.map(s => s.shape)));
    if (existingShapes.length < 2) return;

    // Spawn rate multiplier: higher during rush hour & during rain/storm/flood (+35%)
    const rushMultiplier = this.state.isRushHour ? 2.6 : 1.0;
    const weatherSpawnMultiplier = (this.state.weather.type === 'rainy' || this.state.weather.type === 'storm' || this.state.weather.type === 'flooded')
      ? 1.35
      : 1.0;
    const spawnMultiplier = rushMultiplier * weatherSpawnMultiplier;

    for (const station of this.state.stations) {
      // Chance per second to spawn a passenger at this station (3x higher if station is Expo Centre!)
      const expoMult = station.isExpoCentre ? 3.2 : 1.0;
      const spawnRate = (0.07 + Math.random() * 0.05) * spawnMultiplier * expoMult;
      if (Math.random() < spawnRate * simDt) {
        if (station.passengers.length < station.maxCapacity + (station.isExpoCentre ? 8 : 4)) {
          // Choose a target shape distinct from current station shape
          const candidateShapes = existingShapes.filter(sh => sh !== station.shape);
          if (candidateShapes.length > 0) {
            // Feature 16: Commuter Roundtrips weight modulation based on time of day
            const h = this.state.timeOfDayHours % 24;
            const isMorning = h >= 6.0 && h <= 11.5;
            const isAfternoon = h >= 16.0 && h <= 20.0;

            // Circle/Triangle/Square have higher weight; Star/Diamond/Pentagon are rarer
            const weights: Record<StationShape, number> = {
              circle: isAfternoon ? 8 : 3,
              triangle: 3,
              square: isMorning ? 7 : 2,
              diamond: isMorning ? 2 : 1,
              star: isMorning ? 3 : 1,
              cross: 1,
              pentagon: 1
            };

            const shapePool: StationShape[] = [];
            candidateShapes.forEach(sh => {
              const w = weights[sh] || 1;
              for (let i = 0; i < w; i++) shapePool.push(sh);
            });

            const targetShape = shapePool[Math.floor(Math.random() * shapePool.length)];

            // Feature 13: Học sinh & Sinh viên (Giờ tan trường 11:30-12:30 & 16:30-17:30 tại ga Square)
            const isSchoolDismissal = (h >= 11.4 && h <= 12.6) || (h >= 16.4 && h <= 17.6);
            const isSchoolOrigin = station.shape === 'square';
            const isStudent = isSchoolDismissal && isSchoolOrigin && Math.random() < 0.65;

            // Feature 14: Du khách quốc tế mang máy ảnh / bản đồ (10% khách)
            const isTourist = !isStudent && (targetShape === 'star' || targetShape === 'diamond' || Math.random() < 0.12);

            // Feature 19 (cũ): Khách mang vali (Airport Luggage Passengers)
            const isAirportRelated = station.specialHubType === 'airport' || targetShape === 'star';
            const hasLuggage = !isStudent && (isAirportRelated ? Math.random() < 0.45 : Math.random() < 0.12);

            // Feature 12: 80% cư dân dùng vé tháng ($1400/tuần/người), 20% vé lẻ ($2/ga)
            const isMonthlyPassHolder = isStudent ? true : Math.random() < 0.80;

            const finalTargetShape = isStudent ? (candidateShapes.includes('circle') ? 'circle' : targetShape) : targetShape;

            const passenger: Passenger = {
              id: `p-${this.passengerIdCounter++}`,
              targetShape: finalTargetShape,
              spawnTime: Date.now(),
              stationId: station.id,
              hasLuggage,
              isMonthlyPassHolder,
              stationsTraveled: 0,
              commuterHomeStationId: station.shape === 'circle' ? station.id : undefined,
              isReturnTrip: isAfternoon && targetShape === 'circle',
              isStudent,
              isTourist,
              transferCount: 0
            };
            station.passengers.push(passenger);

            // Feature 13: Học sinh đi thành nhóm bạn 2-3 người cùng về nhà!
            if (isStudent && Math.random() < 0.55 && station.passengers.length < station.maxCapacity + 3) {
              station.passengers.push({
                id: `p-student-buddy-${this.passengerIdCounter++}`,
                targetShape: finalTargetShape,
                spawnTime: Date.now(),
                stationId: station.id,
                hasLuggage: false,
                isMonthlyPassHolder: true,
                stationsTraveled: 0,
                isStudent: true,
                isTourist: false,
                transferCount: 0
              });
            }
          }
        }
      }
    }

    // Feature 16: Spawn queued return commuters during afternoon rush (16h - 20h)
    if (!this.returnCommuterQueue) this.returnCommuterQueue = [];
    const currH = this.state.timeOfDayHours % 24;
    if (currH >= 16.0 && this.returnCommuterQueue.length > 0 && Math.random() < 0.45 * simDt) {
      const returnCommuter = this.returnCommuterQueue.shift();
      if (returnCommuter) {
        const originSt = this.state.stations.find(s => s.id === returnCommuter.originStationId);
        if (originSt && originSt.passengers.length < originSt.maxCapacity + 4) {
          originSt.passengers.push({
            id: `p-return-${this.passengerIdCounter++}`,
            targetShape: returnCommuter.targetShape,
            spawnTime: Date.now(),
            stationId: originSt.id,
            isReturnTrip: true,
            isMonthlyPassHolder: Math.random() < 0.85,
            stationsTraveled: 0
          });
        }
      }
    }
  }

  private updateTrains(simDt: number) {
    const stationMap = new Map<string, Station>(this.state.stations.map(s => [s.id, s]));

    // Ensure every active line with >= 2 stations has an operating train
    for (const line of this.state.lines) {
      if (line.stationIds.length >= 2) {
        const trainsOnLine = this.state.trains.filter(t => t.lineId === line.id);
        if (trainsOnLine.length === 0) {
          this.state.trains.push({
            id: `train-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            lineId: line.id,
            carriagesCount: 0,
            capacity: 6,
            speed: 45,
            segmentIndex: 0,
            progress: 0.1,
            direction: 1,
            passengers: [],
            dwellingTime: 0,
            isDockedAtDepot: false
          });
        }
      }
    }

    // 0. Staggered Depot Dispatch Headway Loop
    for (const line of this.state.lines) {
      if (line.stationIds.length < 2) continue;
      const depotId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
        ? line.depotStationId
        : line.stationIds[0];

      // If line is IN SERVICE (not recalled): dispatch docked trains one-by-one
      if (!line.isDepotRecalled) {
        const dockedTrains = this.state.trains.filter(t => t.lineId === line.id && t.isDockedAtDepot);
        if (dockedTrains.length > 0) {
          line.dispatchTimer = (line.dispatchTimer ?? 0) - simDt;
          if (line.dispatchTimer <= 0) {
            // Dispatch the next docked train!
            const trainToDispatch = dockedTrains[0];
            trainToDispatch.isDockedAtDepot = false;
            trainToDispatch.dwellingTime = 0.6;
            trainToDispatch.progress = 0;
            trainToDispatch.currentStationId = depotId;

            // Align segment index to move outward from depot station
            const depotIdx = line.stationIds.indexOf(depotId);
            if (depotIdx !== -1) {
              if (line.isLoop) {
                trainToDispatch.segmentIndex = depotIdx;
                trainToDispatch.direction = 1;
              } else {
                if (depotIdx >= line.stationIds.length - 1) {
                  trainToDispatch.segmentIndex = Math.max(0, line.stationIds.length - 2);
                  trainToDispatch.direction = -1;
                } else {
                  trainToDispatch.segmentIndex = depotIdx;
                  trainToDispatch.direction = 1;
                }
              }
            }

            // Set dispatch timer for the next train in queue
            const interval = line.dispatchIntervalSeconds || 10;
            line.dispatchTimer = interval;

            const depotStation = stationMap.get(depotId);
            if (depotStation) {
              this.addFloatingText(depotStation.x, depotStation.y - 28, `🟢 Xuất Depot (+1 Tàu)!`, line.color);
            }
            soundEngine.playConnect();
          }
        }
      }
    }

    for (const train of this.state.trains) {
      const line = this.state.lines.find(l => l.id === train.lineId);
      if (!line || line.stationIds.length < 2) continue;

      const sIds = line.stationIds;
      const totalSegments = line.isLoop ? sIds.length : sIds.length - 1;
      if (totalSegments <= 0) continue;

      // Auto-recover any train that was accidentally immobilized by previous terminus/stuck logic
      if (train.isStuck && (!train.breakdownTimer || train.breakdownTimer <= 0)) {
        train.isStuck = false;
        train.stuckTimer = 0;
        if (train.dwellingTime > 2) train.dwellingTime = 0.5;
      }

      // If train is experiencing a mechanical breakdown
      if (train.breakdownTimer && train.breakdownTimer > 0) {
        train.breakdownTimer -= simDt;
        if (train.breakdownTimer <= 0) {
          train.breakdownTimer = 0;
          this.addFloatingText(740, 500, '🔧 Tàu đã tự khắc phục sự cố hỏng hóc!', '#10B981');
        }
        continue;
      }

      // If train is stuck at a station (only for manual stuck testing)
      if (train.isStuck) {
        train.stuckTimer = (train.stuckTimer || 0) + simDt;
        continue;
      }

      // If train is docked at depot station
      if (train.isDockedAtDepot) {
        continue;
      }

      // Sanitize progress and segmentIndex
      if (typeof train.progress !== 'number' || isNaN(train.progress) || train.progress < 0) {
        train.progress = 0;
      }
      if (typeof train.dwellingTime !== 'number' || isNaN(train.dwellingTime) || train.dwellingTime < 0) {
        train.dwellingTime = 0;
      }
      // Auto-recover any train that is not docked at depot but has abnormally high dwelling time
      if (!train.isDockedAtDepot && train.dwellingTime > 2.0) {
        train.dwellingTime = 0.5;
      }
      if (typeof train.segmentIndex !== 'number' || isNaN(train.segmentIndex)) {
        train.segmentIndex = 0;
      }
      train.segmentIndex = Math.max(0, Math.min(train.segmentIndex, totalSegments - 1));

      // If dwelling at station
      if (train.dwellingTime > 0) {
        train.dwellingTime -= simDt;
        if (train.dwellingTime <= 0) {
          train.currentStationId = undefined;
        }
        continue;
      }

      // Calculate segment length for realistic travel speed
      const segIdx = Math.max(0, Math.min(train.segmentIndex, totalSegments - 1));
      const uId = sIds[segIdx];
      const vId = line.isLoop && segIdx === sIds.length - 1 ? sIds[0] : sIds[segIdx + 1];

      const s1 = stationMap.get(uId);
      const s2 = stationMap.get(vId);
      if (!s1 || !s2) continue;

      // Ensure line performance stats object exists
      if (!line.stats) {
        line.stats = {
          todayPassengers: 0,
          totalPassengers: 0,
          dailyPassengers: [],
          totalWaitTimeSamples: 0,
          totalWaitTimeSeconds: 0,
          congestionStopsCount: 0
        };
      }

      // Dynamic Headway Regulation along continuous route (prevents train bunching & tail-gating)
      const trainsOnLine = this.state.trains.filter(t => t.lineId === line.id && !t.isDockedAtDepot);
      const L = line.isLoop ? totalSegments : 2 * totalSegments;
      const idealSpacing = L / Math.max(1, trainsOnLine.length);

      let minGapAhead = L;
      let leadTrain: Train | null = null;
      for (const otherTrain of trainsOnLine) {
        if (otherTrain.id === train.id) continue;
        const gap = getHeadwayDistanceAhead(train, otherTrain, totalSegments, line.isLoop);
        if (gap > 0.001 && gap < minGapAhead) {
          minGapAhead = gap;
          leadTrain = otherTrain;
        }
      }

      // Safe headway buffers:
      // Minimum visual buffer: ~0.38 segments (trains cannot tailgate or overlap!)
      // Feature 2: With CBTC driverless automation, safe gap is reduced to 0.18 segments!
      train.isCBTC = !!line.hasCBTC;
      const minSafeGap = line.hasCBTC ? 0.18 : 0.38;
      const normalGap = line.hasCBTC ? Math.max(0.40, idealSpacing * 0.45) : Math.max(0.75, idealSpacing * 0.70);

      let headwayMultiplier = 1.0;
      if (trainsOnLine.length > 1 && leadTrain) {
        if (minGapAhead < minSafeGap) {
          // Dangerous close-tailgating!
          if (leadTrain.dwellingTime > 0) {
            // Lead train is stopped at station: trailing train halts safely outside the station
            headwayMultiplier = 0.0;
          } else {
            // Lead train is moving: trailing train crawls cautiously until gap widens
            headwayMultiplier = Math.max(0.12, (minGapAhead / minSafeGap) * 0.45);
          }
        } else if (minGapAhead < normalGap) {
          // Approaching comfort zone: gentle deceleration to restore spacing
          const ratio = (minGapAhead - minSafeGap) / (normalGap - minSafeGap);
          headwayMultiplier = 0.45 + 0.55 * ratio;
        } else {
          headwayMultiplier = 1.0;
        }
      }

      const segDistance = Math.max(40, distance(s1, s2));
      const baseSpeed = typeof train.speed === 'number' && train.speed > 5 ? Math.max(55, train.speed) : 75;
      const typeMultiplier = getLineSpeedMultiplier(line.type);
      let weatherSpeedMultiplier = 1.0;
      if (s1.isFlooded || s2.isFlooded) {
        weatherSpeedMultiplier = 0.75; // Flooded track cautious crawl (safe and responsive)
      } else if (this.state.weather.type === 'storm') {
        weatherSpeedMultiplier = 0.85; // Storm caution
      }

      // Tăng 50% (1.5x) tốc độ cho đoàn tàu đã trả khách xong trên đường quay về depot
      const depotRecallSpeedMultiplier = (line.isDepotRecalled && train.passengers.length === 0) ? 1.5 : 1.0;

      // Realistic physical acceleration upon departure and deceleration upon arrival
      const p = Math.max(0, Math.min(1, train.progress));
      let accelDecelMultiplier = 1.0;
      const rampZone = 0.18;
      if (p < rampZone) {
        const t = p / rampZone;
        accelDecelMultiplier = 0.40 + 0.60 * Math.sin(t * (Math.PI / 2));
      } else if (p > 1.0 - rampZone) {
        const t = (1.0 - p) / rampZone;
        accelDecelMultiplier = 0.40 + 0.60 * Math.sin(t * (Math.PI / 2));
      }

      // Calculate speed with headway regulation (stops cleanly if headwayMultiplier === 0)
      let finalSpeed = baseSpeed * 0.90 * typeMultiplier * weatherSpeedMultiplier * depotRecallSpeedMultiplier * accelDecelMultiplier * headwayMultiplier;
      if (headwayMultiplier === 0) {
        finalSpeed = 0;
      } else {
        finalSpeed = Math.max(25, finalSpeed); // minimum responsive speed when moving
      }
      const stepProgress = (finalSpeed * simDt) / segDistance;

      train.progress += stepProgress;

      // Reached station!
      if (train.progress >= 1.0) {
        train.progress = 0;

        // Determine which station the train just arrived at
        let arrivedStationId: string;
        if (train.direction === 1) {
          arrivedStationId = vId;
          train.segmentIndex++;
        } else {
          arrivedStationId = uId;
          train.segmentIndex--;
        }

        const arrivedStation = stationMap.get(arrivedStationId);
        if (arrivedStation) {
          this.handleTrainArrivalAtStation(train, arrivedStation, line);
        }

        // Handle terminus turn-around or loop wrapping immediately upon arrival
        // Note: Terminus buffer caps are purely decorative (Mini Metro style) - trains NEVER get stuck!
        if (line.isLoop) {
          if (train.segmentIndex >= totalSegments) {
            train.segmentIndex = 0;
          } else if (train.segmentIndex < 0) {
            train.segmentIndex = totalSegments - 1;
          }
        } else {
          // Reached end of line -> turn around and head back along the line
          if (train.segmentIndex >= totalSegments) {
            train.segmentIndex = Math.max(0, totalSegments - 1);
            train.direction = -1;
          } else if (train.segmentIndex < 0) {
            train.segmentIndex = 0;
            train.direction = 1;
          }
        }

        if (train.isDockedAtDepot) {
          continue;
        }
      }
    }
  }

  private handleTrainArrivalAtStation(train: Train, station: Station, line: MetroLine) {
    // Train pauses at station (longer dwelling if double decker loading large crowds, 50% faster if Smart IC)
    const isDouble = !!train.isDoubleDecker;
    let baseDwell = (line.isDepotRecalled && train.passengers.length === 0)
      ? 0.3
      : (isDouble && train.passengers.length > 8)
      ? 1.15
      : 0.8;
    if (station.hasSmartIC) {
      baseDwell *= 0.5; // Feature 24: Cổng soát vé Smart IC giảm 50% thời gian chờ!
    }
    train.dwellingTime = baseDwell;
    train.currentStationId = station.id;

    // Headway equalization: If trailing too close to the lead train, hold slightly at station to equalize spacing
    const activeTrainsOnLine = this.state.trains.filter(t => t.lineId === line.id && !t.isDockedAtDepot);
    if (activeTrainsOnLine.length > 1 && !line.isDepotRecalled) {
      const totalSegs = line.isLoop ? line.stationIds.length : Math.max(1, line.stationIds.length - 1);
      const L = line.isLoop ? totalSegs : 2 * totalSegs;
      const idealSpacing = L / activeTrainsOnLine.length;

      let minGapAhead = L;
      for (const other of activeTrainsOnLine) {
        if (other.id === train.id) continue;
        const gap = getHeadwayDistanceAhead(train, other, totalSegs, line.isLoop);
        if (gap > 0.001 && gap < minGapAhead) {
          minGapAhead = gap;
        }
      }

      if (minGapAhead < idealSpacing * 0.65) {
        const holdExtra = Math.min(1.5, (idealSpacing * 0.65 - minGapAhead) * 2.0);
        train.dwellingTime += holdExtra;
      }
    }

    // Check if line is recalled to Depot and this station is the designated depot
    const depotId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
      ? line.depotStationId
      : line.stationIds[0];

    if (line.isDepotRecalled && station.id === depotId) {
      train.isDockedAtDepot = true;
      train.dwellingTime = 999999;
      // Transfer any remaining passengers to the station platform
      if (train.passengers.length > 0) {
        station.passengers.push(...train.passengers);
        train.passengers = [];
      }
      this.addFloatingText(station.x, station.y - 28, '🛑 Tàu đã cập bến Depot!', line.color);
      soundEngine.playDisconnect();
      return;
    }

    let fareEarned = 0;
    let passengersDeliveredHere = 0;
    let monthlyPassDelivered = 0;

    // Fast transit route cache for this station arrival (avoids duplicate BFS for same destination shape)
    const transitStepCache = new Map<StationShape, ReturnType<typeof findNextTransitStep>>();
    const getNextStep = (shape: StationShape) => {
      if (!transitStepCache.has(shape)) {
        transitStepCache.set(
          shape,
          findNextTransitStep(station.id, shape, this.state.stations, this.state.lines)
        );
      }
      return transitStepCache.get(shape)!;
    };

    // 1. Check Alighting passengers
    const remainingInTrain: Passenger[] = [];
    for (const p of train.passengers) {
      p.stationsTraveled = (p.stationsTraveled || 0) + 1;

      if (p.targetShape === station.shape) {
        // Successful destination reached!
        passengersDeliveredHere++;
        let fare = 0;

        if (p.isMonthlyPassHolder) {
          // Feature 12: 80% cư dân dùng vé tháng ($1400/tuần đã tính vào ngân sách) -> Vé lượt = $0!
          fare = 0;
          monthlyPassDelivered++;
        } else {
          // Feature 12: 1 ga = $2!
          const stationsCount = Math.max(1, p.stationsTraveled || 1);
          fare = stationsCount * 2; // 1 ga = $2!

          // Feature 19: Khách mang vali trả x3 vé!
          if (p.hasLuggage) {
            fare *= 3;
            this.state.stats.luggageFareRevenueTotal = (this.state.stats.luggageFareRevenueTotal || 0) + fare;
          }

          if (this.state.isRushHour) {
            fare = Math.round(fare * 1.5);
          }

          if (station.specialHubType === 'airport' || station.specialHubType === 'seaport') {
            fare = Math.round(fare * 1.5);
          }

          if (this.state.activeSurgeEvent && this.state.activeSurgeEvent.stationId === station.id) {
            fare = Math.round(fare * this.state.activeSurgeEvent.fareMultiplier);
          }

          const modeMultiplier = this.state.gameMode === 'standard' ? 1.5 : 1;
          fare = Math.round(fare * modeMultiplier);

          fareEarned += fare;
          this.state.stats.distanceFareRevenueTotal = (this.state.stats.distanceFareRevenueTotal || 0) + fare;
        }

        // Feature 14: Du khách quốc tế thưởng Tip $10 nếu đi thẳng không đổi tàu
        if (p.isTourist) {
          if ((p.transferCount || 0) === 0) {
            const tip = 10;
            fareEarned += tip;
            this.state.stats.totalTouristTips = (this.state.stats.totalTouristTips || 0) + tip;
            this.addFloatingText(station.x, station.y - 35, '+$10 Tip 📸 Du khách', '#F59E0B');
          }
        }

        // Feature 16: Hành khách đi khứ hồi (Commuter Roundtrips)
        // Nếu buổi sáng đi từ ga Circle đến ga Square/Star -> xếp vào hàng đợi về nhà buổi chiều!
        const h = this.state.timeOfDayHours % 24;
        if (h < 12.0 && station.shape !== 'circle' && Math.random() < 0.65) {
          if (!this.returnCommuterQueue) this.returnCommuterQueue = [];
          this.returnCommuterQueue.push({
            originStationId: station.id,
            targetShape: 'circle',
            readyHour: 16.5
          });
        }

        this.state.stats.totalPassengersDelivered++;
        this.state.stats.todayPassengers = (this.state.stats.todayPassengers || 0) + 1;
        this.state.stats.moneyEarned += fare;

        // Update daily challenges
        for (const dc of this.state.dailyChallenges) {
          if (!dc.isCompleted) {
            if (dc.type === 'passengers') {
              dc.currentValue += 1;
              if (dc.currentValue >= dc.targetValue) dc.isCompleted = true;
            } else if (dc.type === 'intermodal' && (station.specialHubType === 'airport' || station.specialHubType === 'seaport')) {
              dc.currentValue += 1;
              if (dc.currentValue >= dc.targetValue) dc.isCompleted = true;
            }
          }
        }

        if (!line.stats) {
          line.stats = {
            todayPassengers: 0,
            totalPassengers: 0,
            dailyPassengers: [],
            totalWaitTimeSamples: 0,
            totalWaitTimeSeconds: 0,
            congestionStopsCount: 0
          };
        }
        line.stats.totalPassengers++;
        line.stats.todayPassengers++;
      } else {
        // Check if passenger should transfer at this station
        const nextStep = getNextStep(p.targetShape);
        if (nextStep && nextStep.lineId !== line.id) {
          // Passenger alights to transfer to another line here
          p.transferCount = (p.transferCount || 0) + 1;
          station.passengers.push(p);
          soundEngine.playBoard();
        } else {
          remainingInTrain.push(p);
        }
      }
    }

    train.passengers = remainingInTrain;

    if (passengersDeliveredHere > 0) {
      this.state.money += fareEarned;
      soundEngine.playArrive(passengersDeliveredHere);
      if (fareEarned > 0) {
        this.addFloatingText(station.x, station.y - 20, `+$${fareEarned} (Vé lẻ: $2/ga)`, '#10B981');
      } else if (monthlyPassDelivered > 0) {
        this.addFloatingText(station.x, station.y - 20, `🎫 Vé Tháng (${monthlyPassDelivered} khách)`, '#06B6D4');
      }
    }

    // If line is recalled to Depot:
    // Offload all remaining passengers at this nearest station on the route back to depot and re-orient towards depot!
    if (line.isDepotRecalled) {
      if (train.passengers.length > 0) {
        station.passengers.push(...train.passengers);
        train.passengers = [];
        this.addFloatingText(station.x, station.y - 25, '⚡ Trả khách xong - Tăng tốc 50% về Depot', '#F59E0B');
      }

      // Re-orient direction and align segmentIndex cleanly towards depot station
      const depotIdx = line.stationIds.indexOf(depotId);
      const currIdx = line.stationIds.indexOf(station.id);
      if (depotIdx !== -1 && currIdx !== -1) {
        if (!line.isLoop) {
          if (depotIdx > currIdx) {
            train.direction = 1;
            train.segmentIndex = Math.min(currIdx, line.stationIds.length - 2);
            train.progress = 0;
          } else if (depotIdx < currIdx) {
            train.direction = -1;
            train.segmentIndex = Math.max(0, currIdx - 1);
            train.progress = 0;
          }
        } else {
          const total = line.stationIds.length;
          const forwardDist = (depotIdx - currIdx + total) % total;
          const backwardDist = (currIdx - depotIdx + total) % total;
          if (forwardDist <= backwardDist) {
            train.direction = 1;
            train.segmentIndex = currIdx;
            train.progress = 0;
          } else {
            train.direction = -1;
            train.segmentIndex = (currIdx - 1 + total) % total;
            train.progress = 0;
          }
        }
      }

      // Do NOT board new passengers on a train heading out-of-service to depot!
      return;
    }

    // 2. Boarding passengers at station (Luggage takes 2 slots)
    const currentSlotsUsed = train.passengers.reduce((sum, p) => sum + (p.hasLuggage ? 2 : 1), 0);
    let availableSlots = train.capacity - currentSlotsUsed;
    if (availableSlots > 0 && station.passengers.length > 0) {
      const remainingAtStation: Passenger[] = [];
      let boardedCount = 0;

      for (const p of station.passengers) {
        const slotsNeeded = p.hasLuggage ? 2 : 1;
        if (slotsNeeded <= availableSlots) {
          // Does this train/line lead closer to p.targetShape?
          const nextStep = getNextStep(p.targetShape);
          if (nextStep && nextStep.lineId === line.id) {
            train.passengers.push(p);
            availableSlots -= slotsNeeded;
            boardedCount++;
            if (!line.stats) {
              line.stats = {
                todayPassengers: 0,
                totalPassengers: 0,
                dailyPassengers: [],
                totalWaitTimeSamples: 0,
                totalWaitTimeSeconds: 0,
                congestionStopsCount: 0
              };
            }
            const waitSec = Math.max(0.5, (Date.now() - p.spawnTime) / 1000);
            line.stats.totalWaitTimeSamples++;
            line.stats.totalWaitTimeSeconds += waitSec;
            continue;
          }
        }
        remainingAtStation.push(p);
      }

      station.passengers = remainingAtStation;
      if (boardedCount > 0) {
        soundEngine.playBoard();
      }
    }

    // 3. Metro Line Inspector Logic: Alight at planned stations to inspect, then catch next train
    const insp = this.state.inspectorState;
    if (insp && insp.status === 'patrolling') {
      // Case A: Inspector was waiting at this station -> hop onto next arriving train heading towards end station!
      if (insp.currentStationId === station.id && !insp.currentTrainId) {
        const canBoard = (!insp.dwellAtStationTimer || insp.dwellAtStationTimer <= 0) && train.id !== insp.lastTrainId;
        const endStId = insp.plannedStationIds && insp.plannedStationIds.length > 0
          ? insp.plannedStationIds[insp.plannedStationIds.length - 1]
          : null;
        const isHeadingToEnd = !endStId || this.isTrainHeadingTowardsEnd(train, station.id, endStId, line);

        if (canBoard && (!insp.targetLineId || insp.targetLineId === train.lineId) && isHeadingToEnd) {
          insp.currentTrainId = train.id;
          insp.currentStationId = null;
          insp.lastTrainId = null;
          insp.stationWaitTimer = 40;
          soundEngine.playInspectorBoard();
          const endSt = endStId ? this.state.stations.find(s => s.id === endStId) : null;
          const endName = endSt ? `Ga ${endSt.name}` : 'ga cuối';
          this.addFloatingText(station.x, station.y - 32, `👮 Lên tàu hướng về ${endName}!`, '#F59E0B');
        }
      }
      // Case B: Inspector is aboard this arriving train -> check if this station is in the planned itinerary!
      else if (insp.currentTrainId === train.id) {
        const isPlanned = !insp.plannedStationIds || insp.plannedStationIds.includes(station.id);
        const isAlreadyInspected = insp.visitedStationIds.includes(station.id);

        // DO NOT ALIGHT AT STATIONS ALREADY INSPECTED! ("ko xuống ga đã được mark là đã kt")
        if (isPlanned && !isAlreadyInspected) {
          insp.visitedStationIds.push(station.id);
          const count = insp.visitedStationIds.length;
          const target = insp.targetCount;

          // Inspector ALIGHTS to inspect this station!
          insp.currentStationId = station.id;
          insp.currentTrainId = null;
          insp.lastTrainId = train.id;
          insp.dwellAtStationTimer = 3.0; // 3 seconds inspecting platform before catching next train
          insp.stationWaitTimer = 40; // Reset 40s wait timer at this next station!

          if (count >= target) {
            insp.status = 'completed';
            insp.cooldownRemaining = 0; // Cooldown eliminated - immediately ready!
            insp.currentTrainId = null;
            this.state.money += insp.rewardAmount;
            this.state.stats.moneyEarned += insp.rewardAmount;

            // Track & award inspector medals
            if (!insp.medals) insp.medals = [];
            const existingMedalIds = new Set(insp.medals.map(m => m.id));

            if (!existingMedalIds.has('first_patrol')) {
              insp.medals.push({
                id: 'first_patrol',
                titleVi: 'Huy Chương Tuần Tra Đầu Tiên',
                titleEn: 'First Patrol Medal',
                descVi: 'Hoàn thành chuyến tuần tra tuyến đầu tiên an toàn.',
                descEn: 'Completed first successful route inspection.',
                icon: '🎖️',
                unlockedAt: Date.now()
              });
            }
            if (count >= 7 && !existingMedalIds.has('master_inspector')) {
              insp.medals.push({
                id: 'master_inspector',
                titleVi: 'Thanh Tra Trưởng Xuất Sắc',
                titleEn: 'Chief Inspector Medal',
                descVi: 'Kiểm tra từ 7 nhà ga trở lên trong một lộ trình.',
                descEn: 'Inspected 7+ stations in a single mission.',
                icon: '🏅',
                unlockedAt: Date.now()
              });
            }

            soundEngine.playInspectorReward();
            this.addFloatingText(
              station.x,
              station.y - 40,
              `🎉 +$${insp.rewardAmount.toLocaleString()} HOÀN THÀNH THANH TRA! (${count}/${target} ga)`,
              '#F59E0B'
            );
          } else {
            soundEngine.playInspectorCheck(count);
            this.addFloatingText(
              station.x,
              station.y - 32,
              `👮 Xuống ga ${station.name} (${count}/${target})! Đang kiểm tra & chờ tàu kế...`,
              '#10B981'
            );
          }
        }
        // If already inspected or not planned: inspector stays on board train heading to destination!
      }
    }
  }

  private updateOvercrowding(simDt: number) {
    // In Zen mode, stations NEVER suffer overcrowding penalties, countdown rings, warnings, or game over!
    if (this.state.gameMode === 'zen') {
      for (const station of this.state.stations) {
        station.isOvercrowded = false;
        station.overcrowdedTimer = 0;
      }
      return;
    }

    let anyDangerouslyCrowded = false;

    for (const station of this.state.stations) {
      station.isOvercrowded = station.passengers.length >= station.maxCapacity;

      if (station.isOvercrowded) {
        // Timer fills up in ~22 seconds of overcrowding
        station.overcrowdedTimer = Math.min(1.0, station.overcrowdedTimer + simDt / 22);

        if (station.overcrowdedTimer >= 0.7) {
          anyDangerouslyCrowded = true;
        }

        // Game Over when overcrowded timer reaches 1.0 (Zen mode already early-returned above)
        if (station.overcrowdedTimer >= 1.0) {
          this.triggerGameOver(`Ga "${station.name}" đã bị quá tải hành khách quá lâu!`, station.id);
          return;
        }
      } else {
        // Cools down when below capacity
        if (station.overcrowdedTimer > 0) {
          station.overcrowdedTimer = Math.max(0, station.overcrowdedTimer - simDt / 10);
        }
      }
    }

    // Play soft danger heartbeat if any station is > 70% overcrowded
    if (anyDangerouslyCrowded) {
      const now = Date.now();
      if (now - this.lastWarningSoundTime > 1200) {
        soundEngine.playWarning(0.8);
        this.lastWarningSoundTime = now;
      }
    }
  }

  private triggerGameOver(reason: string, stationId?: string) {
    if (this.state.gameMode === 'zen') return;
    this.state.isGameOver = true;
    this.state.gameOverReason = reason;
    this.state.gameOverStationId = stationId || null;
    soundEngine.playGameOver();
  }

  public addFloatingText(x: number, y: number, text: string, color = '#10B981') {
    this.state.floatingTexts.push({
      id: `ft-${Date.now()}-${Math.random()}`,
      x,
      y,
      text,
      color,
      life: 1.0
    });
  }

  private updateFloatingTexts(simDt: number) {
    this.state.floatingTexts = this.state.floatingTexts
      .map(ft => ({
        ...ft,
        y: ft.y - 18 * simDt,
        life: ft.life - 1.2 * simDt
      }))
      .filter(ft => ft.life > 0);
  }

  /**
   * Checks whether a train at currentStationId is heading towards endStationId on line.
   * Ensures the inspector only travels in the forward direction from start to end station.
   */
  public isTrainHeadingTowardsEnd(
    train: Train,
    currentStationId: string,
    endStationId: string,
    line: MetroLine
  ): boolean {
    if (!line || line.stationIds.length < 2) return false;
    const sIds = line.stationIds;
    const currIdx = sIds.indexOf(currentStationId);
    const endIdx = sIds.indexOf(endStationId);
    if (currIdx === -1 || endIdx === -1) return false;
    if (currIdx === endIdx) return true;

    // Determine the departing direction of the train from currentStationId
    let depDirection = train.direction;

    if (!line.isLoop) {
      const totalSegments = sIds.length - 1;
      if (currIdx >= totalSegments || train.segmentIndex >= totalSegments) {
        depDirection = -1;
      } else if (currIdx <= 0 || train.segmentIndex < 0) {
        depDirection = 1;
      }

      if (endIdx > currIdx) {
        return depDirection === 1;
      } else {
        return depDirection === -1;
      }
    } else {
      // Loop line
      const total = sIds.length;
      if (depDirection === 1) {
        const forwardDist = (endIdx - currIdx + total) % total;
        const backwardDist = (currIdx - endIdx + total) % total;
        return forwardDist <= backwardDist;
      } else {
        const backwardDist = (currIdx - endIdx + total) % total;
        const forwardDist = (endIdx - currIdx + total) % total;
        return backwardDist <= forwardDist;
      }
    }
  }

  // --- Metro Line Inspector Controller & Loop ---
  public startSelectingInspectorStation(): boolean {
    if (!this.state.inspectorState) {
      this.state.inspectorState = {
        status: 'idle',
        currentStationId: null,
        currentTrainId: null,
        visitedStationIds: [],
        timeRemaining: 90,
        cooldownRemaining: 0,
        targetCount: 5,
        rewardAmount: 2000
      };
    }

    if (this.state.inspectorState.cooldownRemaining > 0) {
      soundEngine.playDisconnect();
      this.addFloatingText(740, 500, `Thanh tra đang hồi chiêu (${Math.ceil(this.state.inspectorState.cooldownRemaining)}s)`, '#EF4444');
      return false;
    }

    if (this.state.stations.length === 0) {
      soundEngine.playDisconnect();
      this.addFloatingText(740, 500, 'Chưa có nhà ga nào trên bản đồ!', '#EF4444');
      return false;
    }

    this.state.inspectorState.status = 'selecting_station';
    soundEngine.playInspectorCheck(1);
    this.addFloatingText(740, 500, '👉 Chọn 1 ga bất kỳ để xuất phát thanh tra', '#F59E0B');
    return true;
  }

  public cancelInspector(): void {
    const insp = this.state.inspectorState;
    if (!insp) return;

    if (insp.status === 'selecting_station') {
      insp.status = 'idle';
      return;
    }

    if (insp.status === 'patrolling') {
      insp.status = 'idle';
      insp.currentTrainId = null;
      insp.currentStationId = null;
      insp.visitedStationIds = [];
      insp.timeRemaining = 180;
      soundEngine.playDisconnect();
      this.addFloatingText(740, 500, 'Đã hủy nhiệm vụ thanh tra tuyến tàu', '#94A3B8');
    }
  }

  public deployInspectorAtStation(stationId: string): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station) return false;

    this.state.inspectorState = {
      status: 'patrolling',
      currentStationId: station.id,
      currentTrainId: null,
      visitedStationIds: [station.id],
      timeRemaining: 180,
      cooldownRemaining: 0,
      targetCount: 5,
      rewardAmount: 2000,
      failureReason: undefined,
      stationWaitTimer: 40
    };

    soundEngine.playInspectorBoard();
    this.addFloatingText(station.x, station.y - 25, '👮 Thanh tra đã vào vị trí: 1/5 ga!', '#F59E0B');
    return true;
  }

  public deployInspectorOnLine(lineId: string, plannedStationIds?: string[] | string): { success: boolean; errorMsg?: string } {
    if (!this.state.inspectorState) {
      this.state.inspectorState = {
        status: 'idle',
        currentStationId: null,
        currentTrainId: null,
        targetLineId: null,
        visitedStationIds: [],
        timeRemaining: 180,
        cooldownRemaining: 0,
        targetCount: 5,
        rewardAmount: 4000
      };
    }

    const DEPLOY_COST = 1000;
    this.state.inspectorState.cooldownRemaining = 0;

    if (this.state.money < DEPLOY_COST) {
      soundEngine.playDisconnect();
      const msg = `Không đủ tiền! Bạn cần ít nhất $${DEPLOY_COST.toLocaleString()} để chi trả phí thanh tra.`;
      this.addFloatingText(740, 500, msg, '#EF4444');
      return { success: false, errorMsg: msg };
    }

    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) {
      soundEngine.playDisconnect();
      const msg = 'Không tìm thấy tuyến tàu!';
      this.addFloatingText(740, 500, msg, '#EF4444');
      return { success: false, errorMsg: msg };
    }

    // Determine chosen stations (minimum 5 stations, but can be 5 or more)
    let chosenIds: string[] = [];
    if (Array.isArray(plannedStationIds) && plannedStationIds.length > 0) {
      chosenIds = plannedStationIds.filter(id => line.stationIds.includes(id));
    } else if (typeof plannedStationIds === 'string' && line.stationIds.includes(plannedStationIds)) {
      const startIdx = line.stationIds.indexOf(plannedStationIds);
      chosenIds = [...line.stationIds.slice(startIdx), ...line.stationIds.slice(0, startIdx)];
    } else {
      chosenIds = [...line.stationIds];
    }

    if (chosenIds.length < 5) {
      soundEngine.playDisconnect();
      const msg = `Cần chọn ít nhất 5 ga trên tuyến ${line.name} (đã chọn ${chosenIds.length} ga)!`;
      this.addFloatingText(740, 500, msg, '#EF4444');
      return { success: false, errorMsg: msg };
    }

    const targetCount = chosenIds.length;
    // Formula: 300 x số ga
    const rewardAmount = 300 * targetCount;
    // Time limit: 3 phút (180 giây) để hoàn thành toàn bộ lộ trình
    const timeRemaining = 180;

    // Deduct $1,000 deployment fee
    this.state.money -= DEPLOY_COST;

    const startStId = chosenIds[0];
    const endStId = chosenIds[chosenIds.length - 1];
    const startStation = this.state.stations.find(s => s.id === startStId);
    const endStation = this.state.stations.find(s => s.id === endStId);

    // Inspector starts AT THE FIRST STATION (startStId) on the platform
    // First station is inspected for 3.0s, then inspector only boards trains heading to end station!
    this.state.inspectorState = {
      status: 'patrolling',
      targetLineId: line.id,
      currentStationId: startStId,
      currentTrainId: null,
      visitedStationIds: [startStId],
      plannedStationIds: chosenIds,
      lastTrainId: null,
      dwellAtStationTimer: 3.0,
      timeRemaining,
      cooldownRemaining: 0,
      targetCount,
      rewardAmount,
      failureReason: undefined,
      stationWaitTimer: 40
    };

    soundEngine.playInspectorBoard();
    const stX = startStation ? startStation.x : 740;
    const stY = startStation ? startStation.y : 500;
    const endName = endStation ? `Ga ${endStation.name}` : 'ga cuối';
    this.addFloatingText(
      stX,
      stY - 25,
      `👮 Xuất phát tại Ga ${startStation?.name || ''} ➔ Hướng về ${endName} (-$1,000)`,
      '#F59E0B'
    );
    return { success: true };
  }

  public alightInspectorAtStation(): boolean {
    const insp = this.state.inspectorState;
    if (!insp || insp.status !== 'patrolling' || !insp.currentTrainId) {
      return false;
    }
    const train = this.state.trains.find(t => t.id === insp.currentTrainId);
    if (train && train.currentStationId) {
      // Do not alight at stations that are already marked as inspected!
      if (insp.visitedStationIds.includes(train.currentStationId)) {
        soundEngine.playDisconnect();
        this.addFloatingText(740, 500, 'Ga này đã được kiểm tra xong rồi!', '#94A3B8');
        return false;
      }
      insp.currentStationId = train.currentStationId;
      insp.currentTrainId = null;
      insp.lastTrainId = train.id;
      insp.dwellAtStationTimer = 3.0;
      insp.stationWaitTimer = 40;
      if (!insp.visitedStationIds.includes(train.currentStationId)) {
        insp.visitedStationIds.push(train.currentStationId);
      }
      const st = this.state.stations.find(s => s.id === train.currentStationId);
      soundEngine.playInspectorBoard();
      if (st) {
        this.addFloatingText(st.x, st.y - 25, '👮 Đang kiểm tra sân ga...', '#06B6D4');
      }
      return true;
    }
    return false;
  }

  private updateInspector(simDt: number, realDt: number = simDt) {
    const insp = this.state.inspectorState;
    if (!insp) return;

    // Cooldown management: eliminated entirely - ready immediately!
    if (insp.status === 'completed' || insp.status === 'failed') {
      insp.cooldownRemaining = 0;
      insp.status = 'idle';
      insp.visitedStationIds = [];
      insp.currentStationId = null;
      insp.currentTrainId = null;
      insp.failureReason = undefined;
      return;
    }

    if (insp.status === 'idle') {
      insp.cooldownRemaining = 0;
      return;
    }

    if (insp.status !== 'patrolling') return;

    // 0. Dwell timer countdown at station platform
    if (insp.dwellAtStationTimer && insp.dwellAtStationTimer > 0) {
      insp.dwellAtStationTimer -= simDt;
    }

    // 0.1 Reset lastTrainId once that previous train leaves the station
    if (insp.lastTrainId && insp.currentStationId) {
      const prevTrain = this.state.trains.find(t => t.id === insp.lastTrainId);
      if (!prevTrain || prevTrain.currentStationId !== insp.currentStationId) {
        insp.lastTrainId = null;
      }
    }

    // 0.2 Station Wait Countdown (Real-world 40s timer waiting for a train to pick up inspector):
    // "khi ở 1 ga mà sau 40s ngoài đời mà ko có tàu đón thì sẽ thua khi đến ga tiếp theo sẽ rết timer và sẽ hiện ra 1 timer trên đầu thanh tra"
    if (insp.currentStationId && !insp.currentTrainId) {
      if (insp.stationWaitTimer === undefined) {
        insp.stationWaitTimer = 40;
      }
      if (this.state.gameSpeed > 0) {
        insp.stationWaitTimer -= realDt;
      }

      if (insp.stationWaitTimer <= 0) {
        insp.stationWaitTimer = 0;
        insp.status = 'failed';
        insp.failureReason = 'Quá 40s không có tàu đón tại ga!';
        insp.cooldownRemaining = 0;
        const failStation = this.state.stations.find(s => s.id === insp.currentStationId);
        insp.currentTrainId = null;
        insp.currentStationId = null;
        soundEngine.playInspectorFail();
        const fx = failStation ? failStation.x : 740;
        const fy = failStation ? failStation.y - 30 : 500;
        this.addFloatingText(fx, fy, '❌ Thất bại: Quá 40s không có tàu đón!', '#EF4444');
        return;
      }
    }

    // 1. Time Limit Countdown (3 minutes)
    insp.timeRemaining -= simDt;
    if (insp.timeRemaining <= 0) {
      insp.status = 'failed';
      insp.failureReason = 'Quá 3 phút mà chưa kiểm tra xong toàn bộ tuyến!';
      insp.cooldownRemaining = 0;
      insp.currentTrainId = null;
      insp.currentStationId = null;
      soundEngine.playInspectorFail();
      this.addFloatingText(740, 500, '❌ Thất bại: Quá 3 phút thanh tra tuyến!', '#EF4444');
      return;
    }

    // 2. Failure Condition: Overcrowding check
    // "khi thanh tra tuyến thì thay vì scan xem tất cả các ga có ga nào quá tải ko thì chỉ can ga mà đang ở kiểm tra. trong chế đọ zen thì sẽ ko scana kiểm tra cái nào cả."
    if (this.state.gameMode !== 'zen' && insp.currentStationId) {
      const currentStation = this.state.stations.find(s => s.id === insp.currentStationId);
      if (currentStation && currentStation.isOvercrowded && currentStation.overcrowdedTimer >= 0.85) {
        insp.status = 'failed';
        insp.failureReason = `Ga "${currentStation.name}" đang kiểm tra bị quá tải!`;
        insp.cooldownRemaining = 0;
        insp.currentTrainId = null;
        insp.currentStationId = null;
        soundEngine.playInspectorFail();
        this.addFloatingText(currentStation.x, currentStation.y - 30, '❌ Thất bại: Ga đang kiểm tra bị quá tải!', '#EF4444');
        return;
      }
    }

    // 3. Platform Boarding check: If inspector is waiting on platform and done inspecting platform
    if (insp.currentStationId && !insp.currentTrainId) {
      const canBoard = !insp.dwellAtStationTimer || insp.dwellAtStationTimer <= 0;
      if (canBoard) {
        const waitingStationId = insp.currentStationId;
        const line = this.state.lines.find(l => l.id === (insp.targetLineId || ''));
        const endStId = insp.plannedStationIds && insp.plannedStationIds.length > 0
          ? insp.plannedStationIds[insp.plannedStationIds.length - 1]
          : null;

        const boardingTrain = this.state.trains.find(t => 
          t.currentStationId === waitingStationId && 
          t.dwellingTime > 0 &&
          t.id !== insp.lastTrainId &&
          (!insp.targetLineId || t.lineId === insp.targetLineId) &&
          (!line || !endStId || this.isTrainHeadingTowardsEnd(t, waitingStationId, endStId, line))
        );
        if (boardingTrain) {
          insp.currentTrainId = boardingTrain.id;
          insp.currentStationId = null;
          insp.lastTrainId = null;
          insp.stationWaitTimer = 40;
          const endSt = endStId ? this.state.stations.find(s => s.id === endStId) : null;
          const endName = endSt ? `Ga ${endSt.name}` : 'ga cuối';
          soundEngine.playInspectorBoard();
          this.addFloatingText(740, 500, `👮 Lên tàu hướng về ${endName}!`, '#F59E0B');
        }
      }
    }

    // 4. In-train health check
    if (insp.currentTrainId) {
      const train = this.state.trains.find(t => t.id === insp.currentTrainId);
      if (!train) {
        insp.status = 'failed';
        insp.failureReason = 'Đoàn tàu thanh tra bị thu hồi';
        insp.cooldownRemaining = 0;
        insp.currentTrainId = null;
        soundEngine.playInspectorFail();
        this.addFloatingText(740, 500, '❌ Đoàn tàu thanh tra bị thu hồi!', '#EF4444');
      }
    }
  }

  // --- Dynamic Weather & Urban Incidents ---
  public clearActiveIncident() {
    this.state.activeIncident = null;
    this.state.stations.forEach(s => {
      s.isFlooded = false;
    });
    if (this.state.weather) {
      this.state.weather.floodedStationIds = [];
    }
  }

  private updateWeather(simDt: number) {
    this.state.weather.durationRemaining -= simDt;
    const worldW = this.mapConfig.worldWidth || 2400;
    const worldH = this.mapConfig.worldHeight || 1700;

    // Check incident timer if active
    if (this.state.activeIncident) {
      this.state.activeIncident.remainingSeconds -= simDt;
      if (this.state.activeIncident.remainingSeconds <= 0) {
        // Incident resolved! Grant bonus reward
        const reward = this.state.activeIncident.rewardEarned || 500;
        this.state.money += reward;
        this.addFloatingText(
          worldW / 2,
          worldH / 2,
          `+$${reward} Khắc phục xong sự cố ngập úng!`,
          '#10B981'
        );
        soundEngine.playCashReward();
        this.clearActiveIncident();
      }
    }

    if (this.state.weather.durationRemaining <= 0) {
      // If previous weather was flooded/storm, give safe clearance reward
      if (this.state.weather.type === 'flooded' || this.state.weather.type === 'storm') {
        const reward = 600;
        this.state.money += reward;
        this.addFloatingText(
          worldW / 2,
          worldH / 2 - 40,
          `+$${reward} Thưởng vượt ngập bão an toàn!`,
          '#06B6D4'
        );
        soundEngine.playCashReward();
      }

      // Clear any previous incident and unflood stations when weather cycle expires
      this.clearActiveIncident();

      // Pick next weather
      const roll = Math.random();
      if (this.state.disableIncidents) {
        // When incidents are disabled: only pleasant sunny or light rainy weather, never flooded or breakdown
        if (roll < 0.60) {
          this.setWeather('sunny');
        } else {
          this.setWeather('rainy');
        }
      } else if (roll < 0.50) {
        this.setWeather('sunny');
        if (Math.random() < 0.40) {
          this.triggerUrbanIncident();
        }
      } else if (roll < 0.75) {
        this.setWeather('rainy');
        if (Math.random() < 0.35) {
          this.triggerUrbanIncident();
        }
      } else {
        this.setWeather('flooded');
      }
    }
  }

  public triggerUrbanIncident(forcedType?: IncidentType) {
    if (this.state.activeIncident) return;
    const types: IncidentType[] = this.state.disableIncidents
      ? ['concert_festival']
      : ['concert_festival', 'train_breakdown', 'severe_storm'];
    let chosenType = forcedType || types[Math.floor(Math.random() * types.length)];
    if (this.state.disableIncidents && (chosenType === 'train_breakdown' || chosenType === 'flooded')) {
      chosenType = 'concert_festival';
    }
    const duration = 45;

    if (chosenType === 'concert_festival' && this.state.stations.length > 0) {
      const targetStation = this.state.stations[Math.floor(Math.random() * this.state.stations.length)];
      const shapes: StationShape[] = ['circle', 'triangle', 'square', 'star', 'diamond'];
      for (let i = 0; i < 6; i++) {
        const otherShapes = shapes.filter(s => s !== targetStation.shape);
        targetStation.passengers.push({
          id: `p-concert-${Date.now()}-${i}`,
          targetShape: otherShapes[Math.floor(Math.random() * otherShapes.length)],
          spawnTime: Date.now(),
          stationId: targetStation.id
        });
      }
      this.state.activeIncident = {
        id: `inc-concert-${Date.now()}`,
        type: 'concert_festival',
        titleVi: 'Đại Nhạc Hội Đô Thị',
        titleEn: 'Urban Music Festival',
        descriptionVi: `Khán giả dồn đông tại Ga ${targetStation.name}. Hãy điều tàu giải tỏa!`,
        descriptionEn: `Crowd surge at ${targetStation.name} station. Dispatch fleets!`,
        affectedStationIds: [targetStation.id],
        speedMultiplier: 1.0,
        remainingSeconds: duration,
        rewardEarned: 900
      };
      this.addFloatingText(targetStation.x, targetStation.y - 30, '🎸 Đại Nhạc Hội: Đông nghẹt khách!', '#F59E0B');
    } else if (chosenType === 'train_breakdown' && this.state.trains.length > 0) {
      if (this.state.disableIncidents) return;
      // Feature 10: Night maintenance prevents 90% of breakdowns
      if (this.maintenanceProtectedToday && Math.random() < 0.90) {
        this.addFloatingText(740, 500, '🛡️ Bảo trì đêm đã ngăn chặn 1 sự cố hỏng tàu!', '#10B981');
        return;
      }
      const runningTrains = this.state.trains.filter(t => !t.isDockedAtDepot);
      if (runningTrains.length > 0) {
        const brokenTrain = runningTrains[Math.floor(Math.random() * runningTrains.length)];
        brokenTrain.breakdownTimer = 35;
        const line = this.state.lines.find(l => l.id === brokenTrain.lineId);
        this.state.activeIncident = {
          id: `inc-breakdown-${Date.now()}`,
          type: 'train_breakdown',
          titleVi: 'Sự Cố Kỹ Thuật Đoàn Tàu',
          titleEn: 'Train Breakdown Incident',
          descriptionVi: `1 đoàn tàu trên ${line?.name || 'tuyến'} bị trục trặc. Cần Đội kỹ sư sửa chữa ($400).`,
          descriptionEn: `1 train on ${line?.name || 'line'} broken down. Call repair crew ($400).`,
          affectedStationIds: [],
          affectedTrainId: brokenTrain.id,
          speedMultiplier: 0.8,
          remainingSeconds: 35,
          rewardEarned: 500
        };
        soundEngine.playDisconnect();
        this.addFloatingText(740, 500, '⚠️ Cảnh báo: Tàu gặp sự cố cơ học!', '#EF4444');
      }
    } else if (chosenType === 'severe_storm') {
      this.setWeather('storm');
      this.state.activeIncident = {
        id: `inc-storm-${Date.now()}`,
        type: 'severe_storm',
        titleVi: 'Cơn Dông Lốc Bất Ngờ',
        titleEn: 'Severe Gale & Storm',
        descriptionVi: 'Gió giật mạnh làm giảm 25% tốc độ toàn mạng lưới.',
        descriptionEn: 'High winds reduce train speed by 25%.',
        affectedStationIds: [],
        speedMultiplier: 0.75,
        remainingSeconds: 40,
        rewardEarned: 700
      };
    }
  }

  public setWeather(type: WeatherType) {
    // If incidents are disabled, waterlogging / flooded weather is converted to gentle city rain
    if (this.state.disableIncidents && type === 'flooded') {
      type = 'rainy';
    }

    // Clear previous incident and unflood all stations
    this.clearActiveIncident();

    const floodedIds: string[] = [];
    let temp = 31;
    let rainInt = 0;
    let descVi = 'Trời nắng ráo';
    let descEn = 'Sunny & Clear';
    let duration = 180 + Math.random() * 60;
    const worldW = this.mapConfig.worldWidth || 2400;
    const worldH = this.mapConfig.worldHeight || 1700;

    if (type === 'rainy') {
      temp = 26;
      rainInt = 0.55;
      descVi = 'Mưa rào đô thị';
      descEn = 'City Rain';
      duration = 75 + Math.random() * 30;
      this.addFloatingText(
        worldW / 2,
        worldH / 2,
        '🌧️ Mưa rào: Khách dồn lên tàu (+35%)',
        '#38BDF8'
      );
    } else if (type === 'storm') {
      temp = 24;
      rainInt = 0.85;
      descVi = 'Mưa giông sấm sét';
      descEn = 'Thunderstorm';
      duration = 50 + Math.random() * 20;
      this.addFloatingText(
        worldW / 2,
        worldH / 2,
        '⛈️ Giông bão: Tàu giảm tốc an toàn',
        '#818CF8'
      );
    } else if (type === 'flooded') {
      temp = 25;
      rainInt = 1.0;
      descVi = 'Mưa lớn ngập úng';
      descEn = 'Urban Waterlogging';
      duration = 50 + Math.random() * 20;

      if (this.state.stations.length > 0) {
        const shuffled = [...this.state.stations].sort(() => 0.5 - Math.random());
        const floodCount = Math.min(2, Math.max(1, Math.floor(this.state.stations.length / 4)));
        const chosen = shuffled.slice(0, floodCount);
        chosen.forEach(s => {
          s.isFlooded = true;
          floodedIds.push(s.id);
          this.addFloatingText(s.x, s.y - 25, '🌊 Ga ngập nước! Tàu chạy chậm', '#38BDF8');
        });

        this.state.activeIncident = {
          id: `inc-${Date.now()}`,
          titleVi: 'Ngập úng đô thị cục bộ',
          titleEn: 'Urban Flooding Incident',
          descriptionVi: `Ga ${chosen.map(c => c.name).join(', ')} bị ngập. Tàu giảm tốc 40%.`,
          descriptionEn: `Stations ${chosen.map(c => c.name).join(', ')} flooded. Trains cautious speed.`,
          affectedStationIds: floodedIds,
          speedMultiplier: 0.6,
          remainingSeconds: duration,
          rewardEarned: 800
        };
      }
    }

    this.state.weather = {
      type,
      current: type,
      temperature: temp,
      rainIntensity: rainInt,
      descriptionVi: descVi,
      descriptionEn: descEn,
      floodedStationIds: floodedIds,
      durationRemaining: duration
    };
  }

  /**
   * Sets a station as a terminus/decorative endpoint on a line
   * Trains cannot pass through terminus stations - they serve as visual line endpoints
   * @param lineId - The line ID
   * @param stationId - The station to make a terminus
   * @returns true if terminus was set successfully
   */
  public setTerminusStation(lineId: string, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    const station = this.state.stations.find(s => s.id === stationId);
    
    if (!line || !station) return false;
    if (!line.stationIds.includes(stationId)) return false;

    if (!line.terminusStations) {
      line.terminusStations = [];
    }

    if (!line.terminusStations.includes(stationId)) {
      line.terminusStations.push(stationId);
      soundEngine.playConnect();
      this.addFloatingText(station.x, station.y - 30, '⭕ Đầu tuyến (Không đi qua)', '#06B6D4');
      return true;
    }

    return false;
  }

  /**
   * Removes terminus status from a station
   */
  public removeTerminusStation(lineId: string, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    const station = this.state.stations.find(s => s.id === stationId);
    
    if (!line || !station || !line.terminusStations) return false;

    const idx = line.terminusStations.indexOf(stationId);
    if (idx > -1) {
      line.terminusStations.splice(idx, 1);
      soundEngine.playDisconnect();
      this.addFloatingText(station.x, station.y - 30, '✖ Hủy đầu tuyến', line.color || '#94A3B8');
      return true;
    }

    return false;
  }

  /**
   * Sticks a train at a station - it will not move until unstuck
   * @param trainId - The train to stick
   * @param stationId - Optional station ID where train should be stuck
   * @returns true if train was stuck successfully
   */
  public stuckTrain(trainId: string, stationId?: string): boolean {
    const train = this.state.trains.find(t => t.id === trainId);
    if (!train) return false;

    const targetStation = stationId 
      ? this.state.stations.find(s => s.id === stationId)
      : this.state.stations.find(s => s.id === train.currentStationId);

    if (!targetStation) return false;

    train.isStuck = true;
    train.stuckTimer = 0;
    train.dwellingTime = 999999; // Infinite dwelling
    train.currentStationId = targetStation.id;
    
    soundEngine.playWarning(0.8);
    this.addFloatingText(targetStation.x, targetStation.y - 30, '🛑 Tàu bị ỵ tại ga!', '#EF4444');
    return true;
  }

  /**
   * Unsticks a train so it can move again
   * @param trainId - The train to unstick
   * @returns true if train was unstuck successfully
   */
  public unstuckTrain(trainId: string): boolean {
    const train = this.state.trains.find(t => t.id === trainId);
    if (!train || !train.isStuck) return false;

    train.isStuck = false;
    train.stuckTimer = 0;
    train.dwellingTime = 0;

    const station = this.state.stations.find(s => s.id === train.currentStationId);
    if (station) {
      soundEngine.playConnect();
      this.addFloatingText(station.x, station.y - 30, '✅ Tàu đã phục hồi!', '#10B981');
    }

    return true;
  }

  /**
   * Checks if a train can pass through a station (considers terminus status)
   */
  private canTrainPassStation(train: Train, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === train.lineId);
    if (!line || !line.terminusStations) return true;

    return !line.terminusStations.includes(stationId);
  }

  // Route Management
  public createLine(
    name: string,
    color: string,
    darkColor: string,
    textColor: string,
    type: MetroLineType = 'metro'
  ): MetroLine | null {
    if (this.state.lines.length >= this.state.inventory.availableLines) {
      return null;
    }

    const newLine: MetroLine = {
      id: `line-${Date.now()}`,
      name,
      color,
      darkColor,
      textColor,
      stationIds: [],
      isLoop: false,
      type
    };

    this.state.lines.push(newLine);
    soundEngine.playConnect();
    return newLine;
  }

  /**
   * Counts how many river-crossing segments an active line currently uses.
   */
  public countLineRiverCrossings(line: MetroLine): number {
    if (!this.mapConfig.riverPolygons || line.stationIds.length < 2) return 0;
    let count = 0;
    const sIds = line.stationIds;
    const totalSegs = line.isLoop ? sIds.length : sIds.length - 1;
    for (let i = 0; i < totalSegs; i++) {
      const u = this.state.stations.find(s => s.id === sIds[i]);
      const v = this.state.stations.find(s => s.id === (i === sIds.length - 1 && line.isLoop ? sIds[0] : sIds[i + 1]));
      if (u && v && (
        segmentCrossesRiver(u, v, this.mapConfig.riverPolygons) ||
        isPointInWater({ x: (u.x + v.x) / 2, y: (u.y + v.y) / 2 }, this.mapConfig.riverPolygons)
      )) {
        count++;
      }
    }
    return count;
  }

  public updateLineType(lineId: string, type: MetroLineType): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;
    const oldType = line.type || 'metro';
    if (oldType === type) return true;

    // Feature 8: Handle river crossings (tunnels) when converting to / from BRT
    const riverCrossings = this.countLineRiverCrossings(line);
    if (!this.isUnlimitedMode && riverCrossings > 0) {
      // If switching FROM rail to BRT: BRT crosses road bridges for free, refund all tunnels
      if (oldType !== 'feeder_bus' && type === 'feeder_bus') {
        this.state.inventory.tunnelTokens += riverCrossings;
        this.addFloatingText(740, 470, `+${riverCrossings} Hầm Vượt Sông hoàn lại (BRT qua cầu miễn phí)`, '#06B6D4');
      }
      // If switching FROM BRT to rail: rail requires tunnels, verify and deduct tokens
      else if (oldType === 'feeder_bus' && type !== 'feeder_bus') {
        if (this.state.inventory.tunnelTokens < riverCrossings) {
          soundEngine.playDisconnect();
          this.addFloatingText(740, 470, `❌ Không đủ Hầm Vượt Sông! Cần ${riverCrossings} hầm để chuyển sang đường sắt`, '#EF4444');
          return false;
        }
        this.state.inventory.tunnelTokens -= riverCrossings;
        this.addFloatingText(740, 470, `-${riverCrossings} Hầm Vượt Sông (Chuyển sang đường sắt)`, '#06B6D4');
      }
    }

    line.type = type;

    // Apply or remove fleet specs based on line type
    if (type === 'double_decker') {
      for (const t of this.state.trains) {
        if (t.lineId === lineId) {
          // If train had standard carriages, return them because double-decker trains use dedicated carriages
          if (!t.isDoubleDecker && t.carriagesCount > 0) {
            this.state.inventory.carriages += t.carriagesCount;
            t.carriagesCount = 0;
          }
          t.isDoubleDecker = true;
          t.capacity = 12 + (t.carriagesCount || 0) * 8;
        }
      }
    } else if (type === 'feeder_bus') {
      // 1 BRT bus carries 6 passengers (does not attach train carriages)
      for (const t of this.state.trains) {
        if (t.lineId === lineId) {
          if (t.isDoubleDecker && t.carriagesCount > 0) {
            this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + t.carriagesCount;
            t.carriagesCount = 0;
          } else if (t.carriagesCount > 0) {
            this.state.inventory.carriages += t.carriagesCount;
            t.carriagesCount = 0;
          }
          t.isDoubleDecker = false;
          t.capacity = 6;
        }
      }
    } else {
      for (const t of this.state.trains) {
        if (t.lineId === lineId) {
          // If switching from double-decker, return dedicated double-decker carriages to inventory
          if (t.isDoubleDecker && t.carriagesCount > 0) {
            this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + t.carriagesCount;
            t.carriagesCount = 0;
          }
          t.isDoubleDecker = false;
          t.capacity = 6 + (t.carriagesCount || 0) * 4;
        }
      }
    }

    soundEngine.playConnect();
    const typeLabel = type === 'high_speed'
      ? 'High Speed (+80%)'
      : type === 'intercity'
      ? 'Intercity (+20%)'
      : type === 'double_decker'
      ? 'Tàu 2 Tầng (+20% tốc độ, 2x sức chứa)'
      : type === 'feeder_bus'
      ? 'Buýt BRT (-10% tốc độ, qua cầu miễn phí)'
      : 'Metro (Chuẩn 1.0x)';
    this.addFloatingText(740, 500, `${line.name} ➔ ${typeLabel}`, '#10B981');
    return true;
  }

  public renameLine(lineId: string, newName: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    const trimmed = newName.trim();
    if (!line || !trimmed) return false;
    line.name = trimmed;
    soundEngine.playConnect();
    this.addFloatingText(740, 500, `✏️ Tuyến: ${trimmed}`, line.color);
    return true;
  }

  public toggleLineCBTC(lineId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;

    const turningOn = !line.hasCBTC;
    const cost = 3500;

    if (turningOn && !this.isUnlimitedMode) {
      if (this.state.money < cost) {
        soundEngine.playDisconnect();
        this.addFloatingText(740, 500, `❌ Cần $${cost.toLocaleString()} để nâng cấp Tín hiệu Tự hành CBTC!`, '#EF4444');
        return false;
      }
      this.state.money -= cost;
    }

    line.hasCBTC = turningOn;
    for (const t of this.state.trains) {
      if (t.lineId === lineId) {
        t.isCBTC = turningOn;
      }
    }

    soundEngine.playConnect();
    if (turningOn) {
      this.addFloatingText(740, 500, `📡 ${line.name}: Kích hoạt Tự hành CBTC (-$${cost.toLocaleString()})! Giãn cách 0.18x`, '#06B6D4');
    } else {
      this.addFloatingText(740, 500, `📡 ${line.name}: Trở về Tín hiệu Truyền thống`, '#94A3B8');
    }
    return true;
  }

  public upgradeStationSmartIC(stationId: string): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station || station.hasSmartIC) return false;

    const cost = 1200;
    if (!this.isUnlimitedMode) {
      if (this.state.money < cost) {
        soundEngine.playDisconnect();
        this.addFloatingText(station.x, station.y - 30, `❌ Cần $${cost.toLocaleString()} để lắp Cổng Soát vé IC Card!`, '#EF4444');
        return false;
      }
      this.state.money -= cost;
    }

    station.hasSmartIC = true;
    soundEngine.playConnect();
    this.addFloatingText(station.x, station.y - 30, `💳 Ga ${station.name}: Cổng Soát vé Thông minh IC Card (-50% chờ)!`, '#10B981');
    return true;
  }

  public buyTransitAdContract(cost = 2000): boolean {
    if (!this.isUnlimitedMode) {
      if (this.state.money < cost) {
        soundEngine.playDisconnect();
        this.addFloatingText(740, 500, `❌ Cần $${cost.toLocaleString()} để ký/gia hạn Hợp đồng Quảng cáo 1 Tuần!`, '#EF4444');
        return false;
      }
      this.state.money -= cost;
    }

    this.state.stats.transitAdDaysRemaining = (this.state.stats.transitAdDaysRemaining || 0) + 7;
    this.state.stats.hasTransitAdContract = true;
    soundEngine.playFanfare();
    this.addFloatingText(
      740,
      500,
      `📰 Ký Hợp đồng Quảng cáo 1 Tuần (-$${cost.toLocaleString()}): Còn ${this.state.stats.transitAdDaysRemaining} ngày (+$200/ngày/toa)!`,
      '#0EA5E9'
    );
    return true;
  }

  public toggleTransitAdContract(): boolean {
    return this.buyTransitAdContract();
  }

  public triggerExpoWeek(forceStationId?: string): boolean {
    if (this.state.stations.length === 0) return false;
    const currentExpo = this.state.stations.find(s => s.isExpoCentre);
    if (currentExpo) return false;

    let candidate = forceStationId
      ? this.state.stations.find(s => s.id === forceStationId)
      : this.state.stations.find(s => (s.shape === 'star' || s.shape === 'diamond' || s.shape === 'square') && this.state.lines.some(l => l.stationIds.includes(s.id)));
    if (!candidate) {
      candidate = this.state.stations.find(s => this.state.lines.some(l => l.stationIds.includes(s.id))) || this.state.stations[0];
    }
    if (!candidate) return false;

    candidate.isExpoCentre = true;
    candidate.expoRemainingDays = 7;
    this.activeExpoStationId = candidate.id;
    soundEngine.playFanfare();
    this.addFloatingText(candidate.x, candidate.y - 35, `🌟 TUẦN LỄ EXPO: Ga ${candidate.name} làm Trung tâm Triển lãm! Thưởng $15,000!`, '#F59E0B');
    return true;
  }

  public deleteLine(lineId: string) {
    const line = this.state.lines.find(l => l.id === lineId);
    if (line && line.stationIds.length >= 2 && !this.isUnlimitedMode && this.mapConfig.riverPolygons) {
      // Feeder bus lines use road bridges for free, so they do NOT tie up tunnel tokens
      if (line.type !== 'feeder_bus') {
        const riverCrossingRefund = this.countLineRiverCrossings(line);
        if (riverCrossingRefund > 0) {
          this.state.inventory.tunnelTokens += riverCrossingRefund;
          this.addFloatingText(740, 500, `+${riverCrossingRefund} Hầm Vượt Sông hoàn lại`, '#06B6D4');
        }
      }
    }

    // Remove trains on this line and return them to inventory
    const trainsOnLine = this.state.trains.filter(t => t.lineId === lineId);
    this.state.inventory.unassignedTrains += trainsOnLine.length;
    trainsOnLine.forEach(t => {
      if (t.isDoubleDecker) {
        this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + t.carriagesCount;
      } else {
        this.state.inventory.carriages += t.carriagesCount;
      }
    });

    this.state.trains = this.state.trains.filter(t => t.lineId !== lineId);
    this.state.lines = this.state.lines.filter(l => l.id !== lineId);
    soundEngine.playDisconnect();
  }

  public updateLineColor(lineId: string, color: string, darkColor: string, textColor: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;
    line.color = color;
    line.darkColor = darkColor;
    line.textColor = textColor;
    soundEngine.playConnect();
    return true;
  }

  public clearAllStations(): void {
    // Return all active trains and carriages to depot
    this.state.inventory.unassignedTrains += this.state.trains.length;
    this.state.trains.forEach(t => {
      if (t.isDoubleDecker) {
        this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + t.carriagesCount;
      } else {
        this.state.inventory.carriages += t.carriagesCount;
      }
    });
    this.state.trains = [];

    // Reset all lines (clear routes)
    for (const line of this.state.lines) {
      line.stationIds = [];
      line.isLoop = false;
    }

    // Clear all stations
    this.state.stations = [];

    // Critical fix: restore stationPool from master configuration so stations can be spawned/unlocked again!
    this.stationPool = [...this.masterStationPool];

    soundEngine.playDisconnect();
    this.addFloatingText(740, 500, 'Đã xóa tất cả nhà ga trên bản đồ', '#EF4444');
  }

  public restoreDefaultStations(): void {
    // Clear lines and return fleet
    this.state.inventory.unassignedTrains += this.state.trains.length;
    this.state.trains.forEach(t => {
      if (t.isDoubleDecker) {
        this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + t.carriagesCount;
      } else {
        this.state.inventory.carriages += t.carriagesCount;
      }
    });
    this.state.trains = [];
    for (const line of this.state.lines) {
      line.stationIds = [];
      line.isLoop = false;
    }

    // Restore initial stations
    this.state.stations = this.masterInitialStations.map((s, idx) => ({
      id: s.id || `st-${idx + 1}`,
      name: s.name,
      shape: s.shape,
      x: s.x,
      y: s.y,
      passengers: [],
      maxCapacity: 6,
      isInterchange: false,
      overcrowdedTimer: 0,
      isOvercrowded: false,
      spawnTime: 0
    }));

    // Reset stationPool
    this.stationPool = [...this.masterStationPool];
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, 'Đã khôi phục các nhà ga ban đầu!', '#10B981');
  }

  public deleteSingleStation(stationId: string): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station) return false;

    // Remove station from any line traversing it
    for (const line of [...this.state.lines]) {
      if (line.stationIds.includes(stationId)) {
        this.removeStationFromLine(line.id, stationId);
      }
    }

    this.state.stations = this.state.stations.filter(s => s.id !== stationId);
    soundEngine.playDisconnect();
    this.addFloatingText(station.x, station.y - 20, `Đã xóa ga ${station.name}`, '#EF4444');
    return true;
  }

  public createCustomStation(
    name: string,
    shape: StationShape,
    x: number,
    y: number,
    cost = 1500
  ): { success: boolean; station?: Station; errorMsg?: string } {
    if (this.state.money < cost) {
      soundEngine.playDisconnect();
      return {
        success: false,
        errorMsg: `Cần $${cost.toLocaleString()} để xây nhà ga mới!`
      };
    }

    this.state.money -= cost;
    const newStation: Station = {
      id: `custom-st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: name.trim() || `Ga Mới ${this.state.stations.length + 1}`,
      shape,
      x: Math.round(x),
      y: Math.round(y),
      passengers: [],
      maxCapacity: 6,
      isInterchange: false,
      overcrowdedTimer: 0,
      isOvercrowded: false,
      spawnTime: Date.now()
    };

    this.state.stations.push(newStation);
    soundEngine.playStationSpawn();
    this.addFloatingText(newStation.x, newStation.y - 20, `-$1,500 (+1 Ga ${newStation.name})`, '#10B981');

    return { success: true, station: newStation };
  }

  public changeStationShape(stationId: string, shape: StationShape): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station) return false;
    station.shape = shape;
    soundEngine.playConnect();
    this.addFloatingText(station.x, station.y - 20, `Đổi dạng: ${shape}`, '#3B82F6');
    return true;
  }

  public unlockAllStations(): { count: number } {
    const existingNames = new Set(this.state.stations.map(s => s.name));

    // If pool is empty or stations were cleared, recharge from master lists
    const missingStations: StationData[] = [];
    for (const initSt of this.masterInitialStations) {
      if (!existingNames.has(initSt.name)) {
        missingStations.push(initSt);
        existingNames.add(initSt.name);
      }
    }
    for (const poolSt of this.masterStationPool) {
      if (!existingNames.has(poolSt.name)) {
        missingStations.push(poolSt);
        existingNames.add(poolSt.name);
      }
    }

    // Also include whatever was currently in this.stationPool
    for (const p of this.stationPool) {
      if (!existingNames.has(p.name)) {
        missingStations.push(p);
        existingNames.add(p.name);
      }
    }

    if (missingStations.length === 0) {
      soundEngine.playDisconnect();
      this.addFloatingText(740, 500, 'Tất cả các nhà ga đã có mặt trên bản đồ!', '#38BDF8');
      return { count: 0 };
    }

    const count = missingStations.length;
    for (const poolSt of missingStations) {
      const id = poolSt.id || `st-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      this.state.stations.push({
        id,
        name: poolSt.name,
        shape: poolSt.shape,
        x: poolSt.x,
        y: poolSt.y,
        passengers: [],
        maxCapacity: 6,
        isInterchange: false,
        overcrowdedTimer: 0,
        isOvercrowded: false,
        spawnTime: Date.now()
      });
    }

    this.stationPool = [];
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, `★ Đã mở khóa toàn bộ ${count} nhà ga!`, '#F59E0B');
    return { count };
  }

  public addStationToLine(lineId: string, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;

    // Check if station is already in line
    const existingIdx = line.stationIds.indexOf(stationId);
    if (existingIdx !== -1) {
      // If it is the first station and line has >= 3 stations, close loop!
      if (existingIdx === 0 && line.stationIds.length >= 3 && !line.isLoop) {
        line.isLoop = true;
        soundEngine.playConnect();
        return true;
      }
      return false;
    }

    line.stationIds.push(stationId);
    soundEngine.playConnect();

    // If this line has at least 2 stations and no train yet, deploy 1 train automatically if available
    const trainsOnLine = this.state.trains.filter(t => t.lineId === lineId);
    if (trainsOnLine.length === 0 && this.state.inventory.unassignedTrains > 0) {
      this.deployTrainToLine(lineId);
    }

    return true;
  }

  /**
   * Intelligently connects two stations:
   * - Extends from line start or end
   * - Closes loops if connecting start & end
   * - Or creates a new line if needed
   */
  public connectStations(fromId: string, toId: string, preferredLineId?: string | null): MetroLine | null {
    if (fromId === toId) return null;

    const fromStation = this.state.stations.find(s => s.id === fromId);
    const toStation = this.state.stations.find(s => s.id === toId);
    if (!fromStation || !toStation) return null;

    const rivers = this.mapConfig.riverPolygons || [];
    const crossesWater = rivers.length > 0 && (
      segmentCrossesRiver(fromStation, toStation, rivers) ||
      isPointInWater({ x: (fromStation.x + toStation.x) / 2, y: (fromStation.y + toStation.y) / 2 }, rivers)
    );

    let targetLine: MetroLine | undefined;

    // 1. If preferredLineId is specified and not a closed loop, prioritize user's selected line!
    if (preferredLineId) {
      const pref = this.state.lines.find(l => l.id === preferredLineId);
      if (pref && !pref.isLoop) {
        targetLine = pref;
      }
    }

    // 2. Only if no preferred line, check if an existing line already has fromId or toId at either end to extend
    if (!targetLine) {
      targetLine = this.state.lines.find(l => {
        if (l.isLoop || l.stationIds.length === 0) return false;
        const first = l.stationIds[0];
        const last = l.stationIds[l.stationIds.length - 1];
        return first === fromId || last === fromId || first === toId || last === toId;
      });
    }

    // 3. If still no line, create a new line if under limit
    if (!targetLine) {
      if (this.state.lines.length < this.state.inventory.availableLines) {
        const nextIdx = this.state.lines.length;
        const pal = LINE_PALETTE[nextIdx % LINE_PALETTE.length];

        targetLine = this.createLine(
          `Tuyến 0${nextIdx + 1}`,
          pal.color,
          pal.darkColor,
          pal.textColor
        ) || undefined;
      }
    }

    // 4. If all lines used, pick the last non-loop line
    if (!targetLine) {
      targetLine = this.state.lines.find(l => !l.isLoop) || this.state.lines[0];
    }

    if (!targetLine) return null;

    // Feature 8: Xe buýt trung chuyển BRT đi qua cầu đường bộ vượt sông MIỄN PHÍ, không cần Hầm Vượt Sông!
    const isFeederBus = targetLine.type === 'feeder_bus';
    if (crossesWater && !this.isUnlimitedMode && !isFeederBus) {
      if (this.state.inventory.tunnelTokens <= 0) {
        soundEngine.playDisconnect();
        this.addFloatingText(fromStation.x, fromStation.y - 30, '❌ Không đủ Hầm/Cầu vượt sông! Mua trong Shop', '#EF4444');
        return null;
      }
    }

    const sIds = targetLine.stationIds;

    const onConnected = (line: MetroLine): MetroLine => {
      soundEngine.playConnect();
      if (crossesWater && !this.isUnlimitedMode) {
        if (line.type === 'feeder_bus') {
          this.addFloatingText((fromStation.x + toStation.x) / 2, (fromStation.y + toStation.y) / 2 - 20, '🚌 Buýt BRT qua cầu (Miễn phí)', '#10B981');
        } else {
          this.state.inventory.tunnelTokens = Math.max(0, this.state.inventory.tunnelTokens - 1);
          this.addFloatingText((fromStation.x + toStation.x) / 2, (fromStation.y + toStation.y) / 2 - 20, '🌊 -1 Hầm Vượt Sông', '#06B6D4');
        }
      }
      return line;
    };

    // If target line is brand new / empty
    if (sIds.length === 0) {
      sIds.push(fromId, toId);
      if (this.state.inventory.unassignedTrains > 0) {
        this.deployTrainToLine(targetLine.id);
      }
      return onConnected(targetLine);
    }

    if (sIds.length === 1) {
      if (sIds[0] === fromId) {
        sIds.push(toId);
      } else if (sIds[0] === toId) {
        sIds.push(fromId);
      } else {
        sIds.push(toId);
      }
      if (this.state.inventory.unassignedTrains > 0) {
        this.deployTrainToLine(targetLine.id);
      }
      return onConnected(targetLine);
    }

    const first = sIds[0];
    const last = sIds[sIds.length - 1];

    // Check loop closing
    if ((fromId === first && toId === last) || (fromId === last && toId === first)) {
      if (sIds.length >= 3 && !targetLine.isLoop) {
        targetLine.isLoop = true;
        return onConnected(targetLine);
      }
    }

    // If both stations are already in the line, avoid duplicate loop/reversal
    if (sIds.includes(fromId) && sIds.includes(toId)) {
      return targetLine;
    }

    // Extend from end
    if (fromId === last && !sIds.includes(toId)) {
      sIds.push(toId);
      return onConnected(targetLine);
    }
    if (toId === last && !sIds.includes(fromId)) {
      sIds.push(fromId);
      return onConnected(targetLine);
    }

    // Prepend to start
    if (fromId === first && !sIds.includes(toId)) {
      sIds.unshift(toId);
      return onConnected(targetLine);
    }
    if (toId === first && !sIds.includes(fromId)) {
      sIds.unshift(fromId);
      return onConnected(targetLine);
    }

    // If fromId is in the line (intermediate station), insert toId adjacent to fromId
    const fromIdx = sIds.indexOf(fromId);
    if (fromIdx !== -1 && !sIds.includes(toId)) {
      const prevSt = fromIdx > 0 ? this.state.stations.find(s => s.id === sIds[fromIdx - 1]) : null;
      const nextSt = fromIdx < sIds.length - 1 ? this.state.stations.find(s => s.id === sIds[fromIdx + 1]) : null;
      const targetSt = this.state.stations.find(s => s.id === toId);
      const currSt = this.state.stations.find(s => s.id === fromId);

      if (prevSt && nextSt && targetSt && currSt) {
        const distBefore = Math.hypot(prevSt.x - targetSt.x, prevSt.y - targetSt.y) + Math.hypot(targetSt.x - currSt.x, targetSt.y - currSt.y);
        const distAfter = Math.hypot(currSt.x - targetSt.x, currSt.y - targetSt.y) + Math.hypot(targetSt.x - nextSt.x, targetSt.y - nextSt.y);
        if (distAfter <= distBefore) {
          sIds.splice(fromIdx + 1, 0, toId);
        } else {
          sIds.splice(fromIdx, 0, toId);
        }
      } else {
        sIds.splice(fromIdx + 1, 0, toId);
      }
      return onConnected(targetLine);
    }

    // If toId is in the line (intermediate station), insert fromId adjacent to toId
    const toIdx = sIds.indexOf(toId);
    if (toIdx !== -1 && !sIds.includes(fromId)) {
      const prevSt = toIdx > 0 ? this.state.stations.find(s => s.id === sIds[toIdx - 1]) : null;
      const nextSt = toIdx < sIds.length - 1 ? this.state.stations.find(s => s.id === sIds[toIdx + 1]) : null;
      const fromSt = this.state.stations.find(s => s.id === fromId);
      const currSt = this.state.stations.find(s => s.id === toId);

      if (prevSt && nextSt && fromSt && currSt) {
        const distBefore = Math.hypot(prevSt.x - fromSt.x, prevSt.y - fromSt.y) + Math.hypot(fromSt.x - currSt.x, fromSt.y - currSt.y);
        const distAfter = Math.hypot(currSt.x - fromSt.x, currSt.y - fromSt.y) + Math.hypot(fromSt.x - nextSt.x, fromSt.y - nextSt.y);
        if (distAfter <= distBefore) {
          sIds.splice(toIdx + 1, 0, fromId);
        } else {
          sIds.splice(toIdx, 0, fromId);
        }
      } else {
        sIds.splice(toIdx + 1, 0, fromId);
      }
      return onConnected(targetLine);
    }

    // Fallback: append the unincluded station to the nearest end
    if (!sIds.includes(toId)) {
      sIds.push(toId);
      return onConnected(targetLine);
    } else if (!sIds.includes(fromId)) {
      sIds.unshift(fromId);
      return onConnected(targetLine);
    }

    return targetLine;
  }

  public deployTrainToLine(lineId: string): boolean {
    if (this.state.inventory.unassignedTrains <= 0) return false;

    const line = this.state.lines.find(l => l.id === lineId);
    if (!line || line.stationIds.length < 2) return false;

    const depotId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
      ? line.depotStationId
      : line.stationIds[0];

    const isRecalled = !!line.isDepotRecalled;
    const depotIdx = Math.max(0, line.stationIds.indexOf(depotId));
    const maxSeg = Math.max(0, line.isLoop ? line.stationIds.length - 1 : line.stationIds.length - 2);
    let segIdx = depotIdx >= line.stationIds.length - 1 && !line.isLoop ? maxSeg : Math.min(depotIdx, maxSeg);
    let dir: 1 | -1 = depotIdx >= line.stationIds.length - 1 && !line.isLoop ? -1 : 1;
    let spawnStationId = depotId;

    const runningTrains = this.state.trains.filter(t => t.lineId === lineId && !t.isDockedAtDepot);
    if (!isRecalled && runningTrains.length > 0) {
      // Find the station on the line with the greatest minimum distance to any active train (natural equidistant spacing)
      const totalSegs = line.isLoop ? line.stationIds.length : Math.max(1, line.stationIds.length - 1);
      const L = line.isLoop ? totalSegs : 2 * totalSegs;

      let bestStationIdx = 0;
      let maxMinDist = -1;

      for (let sIdx = 0; sIdx < line.stationIds.length; sIdx++) {
        const fakeTrain = { segmentIndex: Math.min(sIdx, totalSegs - 1), progress: 0, direction: 1 } as Train;
        const fakeCoord = getTrainRouteCoordinate(fakeTrain, totalSegs, line.isLoop);

        let minDist = L;
        for (const rt of runningTrains) {
          const rtCoord = getTrainRouteCoordinate(rt, totalSegs, line.isLoop);
          const d1 = (rtCoord - fakeCoord + L) % L;
          const d2 = (fakeCoord - rtCoord + L) % L;
          const dist = Math.min(d1, d2);
          if (dist < minDist) minDist = dist;
        }

        if (minDist > maxMinDist) {
          maxMinDist = minDist;
          bestStationIdx = sIdx;
        }
      }

      spawnStationId = line.stationIds[bestStationIdx];
      segIdx = bestStationIdx >= line.stationIds.length - 1 && !line.isLoop ? maxSeg : Math.min(bestStationIdx, maxSeg);
      dir = bestStationIdx >= line.stationIds.length - 1 && !line.isLoop ? -1 : 1;
    }

    const isDouble = line.type === 'double_decker';
    const isBus = line.type === 'feeder_bus';
    this.state.inventory.unassignedTrains--;
    const train: Train = {
      id: `train-${Date.now()}-${Math.random()}`,
      lineId,
      carriagesCount: 0,
      capacity: isDouble ? 12 : 6, // 1 xe BRT chở 6 người
      speed: 45,
      segmentIndex: segIdx,
      progress: 0,
      direction: dir,
      passengers: [],
      dwellingTime: isRecalled ? 999999 : 0.8,
      currentStationId: spawnStationId,
      isDockedAtDepot: isRecalled,
      isDoubleDecker: isDouble
    };

    this.state.trains.push(train);
    soundEngine.playConnect();

    // Floating text notification
    const spawnStation = this.state.stations.find(s => s.id === spawnStationId) || this.state.stations.find(s => s.id === depotId);
    if (spawnStation) {
      const vehicleName = isBus ? 'Xe Buýt BRT (6 chỗ)' : (isDouble ? 'Tàu 2 Tầng (12 chỗ)' : 'Tàu');
      const msg = isRecalled ? `+1 ${vehicleName} (Đỗ tại Depot ${line.name})` : `+1 ${vehicleName} (${line.name})`;
      this.addFloatingText(spawnStation.x, spawnStation.y - 30, msg, '#10B981');
    }
    return true;
  }

  /**
   * Recalls 1 train from a specific line back to the depot / inventory
   */
  public removeTrainFromLine(lineId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    const trainsOnLine = this.state.trains.filter(t => t.lineId === lineId);
    if (trainsOnLine.length === 0) return false;

    // Pick a train on this line (prefer one with fewer passengers)
    trainsOnLine.sort((a, b) => a.passengers.length - b.passengers.length);
    const trainToRemove = trainsOnLine[0];

    // Return passengers aboard to nearest station on the line if any
    const fallbackStationId = trainToRemove.currentStationId || line?.stationIds[0];
    const station = this.state.stations.find(s => s.id === fallbackStationId);
    if (trainToRemove.passengers.length > 0 && station) {
      station.passengers.push(...trainToRemove.passengers);
    }

    // Return train and carriages to inventory
    this.state.inventory.unassignedTrains++;
    if (trainToRemove.isDoubleDecker) {
      this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + trainToRemove.carriagesCount;
    } else {
      this.state.inventory.carriages += trainToRemove.carriagesCount;
    }

    // Remove from trains list
    this.state.trains = this.state.trains.filter(t => t.id !== trainToRemove.id);
    soundEngine.playDisconnect();

    // Floating feedback notification
    if (station) {
      this.addFloatingText(station.x, station.y - 30, `-1 Tàu (${line?.name || ''}) ➔ Đã thu hồi về kho`, '#F59E0B');
    } else {
      this.addFloatingText(740, 500, `-1 Tàu ➔ Đã thu hồi về kho`, '#F59E0B');
    }

    return true;
  }

  /**
   * Removes a station from an active line
   */
  public removeStationFromLine(lineId: string, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line || !line.stationIds.includes(stationId)) return false;

    const station = this.state.stations.find(s => s.id === stationId);
    const crossingsBefore = (!this.isUnlimitedMode && line.type !== 'feeder_bus') ? this.countLineRiverCrossings(line) : 0;

    // Remove this station from line
    line.stationIds = line.stationIds.filter(id => id !== stationId);

    if (line.isLoop && line.stationIds.length < 3) {
      line.isLoop = false;
    }

    // Fix trains on this line
    const maxSegment = Math.max(0, line.isLoop ? line.stationIds.length - 1 : line.stationIds.length - 2);
    for (const train of this.state.trains) {
      if (train.lineId === lineId) {
        if (train.segmentIndex > maxSegment) {
          train.segmentIndex = maxSegment;
          train.progress = 0;
        }
      }
    }

    // If line now has less than 2 stations, delete line and return its trains to inventory
    if (line.stationIds.length < 2) {
      const lineName = line.name;
      this.deleteLine(lineId);
      if (station) {
        this.addFloatingText(station.x, station.y - 30, `Đã xóa tuyến ${lineName} (ít hơn 2 ga) ➔ Hoàn tàu về kho`, '#EF4444');
      }
    } else {
      const crossingsAfter = (!this.isUnlimitedMode && line.type !== 'feeder_bus') ? this.countLineRiverCrossings(line) : 0;
      if (crossingsBefore > crossingsAfter) {
        const refund = crossingsBefore - crossingsAfter;
        this.state.inventory.tunnelTokens += refund;
        this.addFloatingText(station ? station.x : 740, (station ? station.y : 500) - 55, `+${refund} Hầm Vượt Sông hoàn lại`, '#06B6D4');
      }
      soundEngine.playDisconnect();
      if (station) {
        this.addFloatingText(station.x, station.y - 30, `✖ Đã hủy ga khỏi ${line.name}`, line.color || '#F59E0B');
      }
    }

    return true;
  }

  /**
   * Cancels/removes a station from a route when player accidentally selected it
   * (triggered when double-clicking or pressing 2 times on the station)
   */
  public cancelStationFromRoute(
    stationId: string,
    preferredLineId?: string | null
  ): { success: boolean; lineName?: string; lineColor?: string } {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station) return { success: false };

    const linesServing = this.state.lines.filter(l => l.stationIds.includes(stationId));
    if (linesServing.length === 0) {
      soundEngine.playDisconnect();
      this.addFloatingText(
        station.x,
        station.y - 25,
        'Ga này chưa nối vào tuyến tàu nào',
        '#94A3B8'
      );
      return { success: false };
    }

    // If preferred line is selected and contains this station, remove from it
    let targetLine = preferredLineId ? linesServing.find(l => l.id === preferredLineId) : undefined;
    // Otherwise remove from the most recent line
    if (!targetLine) {
      targetLine = linesServing[linesServing.length - 1];
    }

    const lineName = targetLine.name;
    const lineColor = targetLine.color;
    const ok = this.removeStationFromLine(targetLine.id, stationId);
    return { success: ok, lineName, lineColor };
  }

  public addCarriageToTrain(trainId: string): boolean {
    const train = this.state.trains.find(t => t.id === trainId);
    if (!train || train.carriagesCount >= 2) return false;

    const line = this.state.lines.find(l => l.id === train.lineId);
    if (line?.type === 'feeder_bus') {
      this.addFloatingText(740, 500, 'Xe buýt BRT chở 6 người (không gắn toa xe)!', '#F59E0B');
      return false;
    }

    const isDouble = train.isDoubleDecker || line?.type === 'double_decker';
    if (isDouble) {
      if ((this.state.inventory.doubleDeckerCarriages || 0) <= 0) {
        this.addFloatingText(740, 500, 'Cần Toa Hai Tầng riêng ($350 trong Shop)!', '#EF4444');
        return false;
      }
      this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) - 1;
      train.carriagesCount++;
      train.capacity += 8;
      soundEngine.playConnect();
      return true;
    } else {
      if (this.state.inventory.carriages <= 0) return false;
      this.state.inventory.carriages--;
      train.carriagesCount++;
      train.capacity += 4;
      soundEngine.playConnect();
      return true;
    }
  }

  public addCarriageToLine(lineId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (line?.type === 'feeder_bus') {
      this.addFloatingText(740, 500, 'Xe buýt BRT chở 6 người (không gắn toa xe)!', '#F59E0B');
      return false;
    }

    const isDouble = line?.type === 'double_decker';
    if (isDouble) {
      if ((this.state.inventory.doubleDeckerCarriages || 0) <= 0) {
        this.addFloatingText(740, 500, 'Cần Toa Hai Tầng riêng ($350 trong Shop)!', '#EF4444');
        return false;
      }
    } else {
      if (this.state.inventory.carriages <= 0) return false;
    }

    const lineTrains = this.state.trains.filter(t => t.lineId === lineId);
    if (lineTrains.length === 0) return false;

    // Attach to train on this line with fewest carriages (< 2)
    const sorted = [...lineTrains].sort((a, b) => a.carriagesCount - b.carriagesCount);
    const train = sorted.find(t => t.carriagesCount < 2);
    if (!train) return false;

    if (isDouble || train.isDoubleDecker) {
      this.state.inventory.doubleDeckerCarriages = Math.max(0, (this.state.inventory.doubleDeckerCarriages || 0) - 1);
      train.carriagesCount++;
      train.capacity += 8;
      soundEngine.playConnect();

      const currStation = this.state.stations.find(s => s.id === train.currentStationId);
      this.addFloatingText(
        currStation ? currStation.x : 740,
        currStation ? currStation.y - 25 : 500,
        `+1 Toa 2 Tầng (Sức chứa ${train.capacity})`,
        '#38BDF8'
      );
      return true;
    } else {
      this.state.inventory.carriages--;
      train.carriagesCount++;
      train.capacity += 4;
      soundEngine.playConnect();

      const currStation = this.state.stations.find(s => s.id === train.currentStationId);
      this.addFloatingText(
        currStation ? currStation.x : 740,
        currStation ? currStation.y - 25 : 500,
        `+1 Toa (Sức chứa ${train.capacity})`,
        '#60A5FA'
      );
      return true;
    }
  }

  public removeCarriageFromLine(lineId: string): boolean {
    const lineTrains = this.state.trains.filter(t => t.lineId === lineId);
    if (lineTrains.length === 0) return false;

    // Pick train with most carriages (> 0) to recall
    const sorted = [...lineTrains].sort((a, b) => b.carriagesCount - a.carriagesCount);
    const train = sorted.find(t => t.carriagesCount > 0);
    if (!train) return false;

    const line = this.state.lines.find(l => l.id === lineId);
    const isDouble = train.isDoubleDecker || line?.type === 'double_decker';

    if (isDouble) {
      train.carriagesCount--;
      train.capacity -= 8;
      this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + 1;
      soundEngine.playDisconnect();

      const currStation = this.state.stations.find(s => s.id === train.currentStationId);
      this.addFloatingText(
        currStation ? currStation.x : 740,
        currStation ? currStation.y - 25 : 500,
        '-1 Toa 2 Tầng về kho',
        '#38BDF8'
      );
      return true;
    } else {
      train.carriagesCount--;
      train.capacity -= 4;
      this.state.inventory.carriages++;
      soundEngine.playDisconnect();

      const currStation = this.state.stations.find(s => s.id === train.currentStationId);
      this.addFloatingText(
        currStation ? currStation.x : 740,
        currStation ? currStation.y - 25 : 500,
        '-1 Toa về kho',
        '#94A3B8'
      );
      return true;
    }
  }

  public upgradeStationToInterchange(stationId: string): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station || station.isInterchange) return false;

    if (this.state.inventory.interchangeTokens > 0) {
      this.state.inventory.interchangeTokens--;
    } else if (this.state.money >= 350) {
      this.state.money -= 350;
    } else {
      return false;
    }

    station.isInterchange = true;
    station.maxCapacity = 14;
    soundEngine.playFanfare();
    this.addFloatingText(station.x, station.y - 25, '★ Ga Trung Chuyển', '#F59E0B');
    return true;
  }

  // Purchases using money
  public buyTrain(): boolean {
    const cost = 400 + this.state.trains.length * 100;
    if (this.state.money < cost) return false;
    this.state.money -= cost;
    this.state.inventory.unassignedTrains++;
    soundEngine.playFanfare();
    return true;
  }

  public buyCarriage(): boolean {
    const cost = 250;
    if (this.state.money < cost) return false;
    this.state.money -= cost;
    this.state.inventory.carriages++;
    soundEngine.playFanfare();
    return true;
  }

  public buyLine(): boolean {
    const cost = 3000;
    if (this.state.money < cost || this.state.inventory.availableLines >= 15) return false;
    this.state.money -= cost;
    this.state.inventory.availableLines++;
    soundEngine.playFanfare();
    return true;
  }

  public buyTunnel(cost = 300): boolean {
    if (this.state.money < cost) {
      soundEngine.playDisconnect();
      return false;
    }
    this.state.money -= cost;
    this.state.inventory.tunnelTokens++;
    soundEngine.playCashReward();
    this.addFloatingText(740, 500, `-$${cost} (+1 Hầm Vượt Sông)`, '#06B6D4');
    return true;
  }

  // Feature 7: Mua hoặc nâng cấp Tàu Hai Tầng (Double-Decker Train)
  public buyDoubleDeckerTrain(cost = 800): boolean {
    if (this.state.money < cost) {
      soundEngine.playDisconnect();
      return false;
    }
    this.state.money -= cost;
    this.state.inventory.doubleDeckerTrains = (this.state.inventory.doubleDeckerTrains || 0) + 1;
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, `-$${cost} (+1 Tàu Hai Tầng)`, '#3B82F6');
    return true;
  }

  // Toa xe hai tầng riêng biệt (đắt hơn 40% toa thường: $250 * 1.4 = $350, +8 sức chứa)
  public buyDoubleDeckerCarriage(cost = 350): boolean {
    if (this.state.money < cost) {
      soundEngine.playDisconnect();
      return false;
    }
    this.state.money -= cost;
    this.state.inventory.doubleDeckerCarriages = (this.state.inventory.doubleDeckerCarriages || 0) + 1;
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, `-$${cost} (+1 Toa Tàu 2 Tầng, +8 Chỗ)`, '#38BDF8');
    return true;
  }

  public upgradeTrainToDoubleDecker(trainId: string): boolean {
    const train = this.state.trains.find(t => t.id === trainId);
    if (!train || train.isDoubleDecker) return false;
    if ((this.state.inventory.doubleDeckerTrains || 0) <= 0) {
      const cost = 800;
      if (this.state.money < cost) return false;
      this.state.money -= cost;
    } else {
      this.state.inventory.doubleDeckerTrains = Math.max(0, (this.state.inventory.doubleDeckerTrains || 0) - 1);
    }
    train.isDoubleDecker = true;
    train.capacity = (6 + train.carriagesCount * 4) * 2; // double capacity!
    soundEngine.playCashReward();
    this.addFloatingText(740, 500, `🚀 Nâng cấp Tàu 2 Tầng (Sức chứa: ${train.capacity})!`, '#3B82F6');
    return true;
  }

  // Feature 8: Tuyến Buýt Nhanh Trung Chuyển (Feeder BRT Bus)
  public buyFeederBus(cost = 350): boolean {
    if (this.state.money < cost) {
      soundEngine.playDisconnect();
      return false;
    }
    this.state.money -= cost;
    this.state.inventory.feederBuses = (this.state.inventory.feederBuses || 0) + 1;
    this.state.inventory.availableLines++;
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, `-$${cost} (+1 Tuyến Buýt BRT Qua Cầu Miễn Phí)`, '#10B981');
    return true;
  }

  public setLineDepot(lineId: string, stationId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line || !line.stationIds.includes(stationId)) return false;
    line.depotStationId = stationId;
    const st = this.state.stations.find(s => s.id === stationId);
    soundEngine.playConnect();
    if (st) {
      this.addFloatingText(st.x, st.y - 30, `🏢 Đặt làm Depot: ${line.name}`, line.color);
    }
    return true;
  }

  public setLineDispatchInterval(lineId: string, seconds: number): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;
    line.dispatchIntervalSeconds = Math.max(5, Math.min(60, Math.round(seconds)));
    return true;
  }

  public toggleLineDepotRecall(lineId: string): boolean {
    const line = this.state.lines.find(l => l.id === lineId);
    if (!line) return false;
    line.isDepotRecalled = !line.isDepotRecalled;

    const depotId = (line.depotStationId && line.stationIds.includes(line.depotStationId))
      ? line.depotStationId
      : line.stationIds[0];
    const depotStation = this.state.stations.find(s => s.id === depotId);

    if (line.isDepotRecalled) {
      soundEngine.playDisconnect();
      const depotIdx = line.stationIds.indexOf(depotId);

      for (const train of this.state.trains) {
        if (train.lineId !== lineId || train.isDockedAtDepot) continue;

        // If currently stopped at a station, leave passengers at this station immediately
        if (train.currentStationId) {
          const currSt = this.state.stations.find(s => s.id === train.currentStationId);
          if (currSt && train.passengers.length > 0) {
            currSt.passengers.push(...train.passengers);
            train.passengers = [];
            this.addFloatingText(currSt.x, currSt.y - 25, '⚡ Trả khách xong - Tăng tốc 50% về Depot', '#F59E0B');
          }
          // If already at depot station, dock immediately!
          if (train.currentStationId === depotId) {
            train.isDockedAtDepot = true;
            train.dwellingTime = 999999;
            continue;
          }
        }

        // Orient direction directly towards depot station
        if (depotIdx !== -1) {
          const oldDir = train.direction;
          let targetDir = oldDir;

          if (!line.isLoop) {
            if (depotIdx > train.segmentIndex) {
              targetDir = 1;
            } else if (depotIdx < train.segmentIndex) {
              targetDir = -1;
            } else {
              targetDir = -1;
            }
          } else {
            const total = line.stationIds.length;
            const forwardDist = (depotIdx - train.segmentIndex + total) % total;
            const backwardDist = (train.segmentIndex - depotIdx + total) % total;
            targetDir = forwardDist <= backwardDist ? 1 : -1;
          }

          if (targetDir !== oldDir) {
            train.direction = targetDir;
            // Invert progress if mid-segment so train physically stays in place while turning around
            if (!train.currentStationId) {
              train.progress = Math.max(0, Math.min(1, 1 - train.progress));
            }
          }
        }
      }

      if (depotStation) {
        this.addFloatingText(depotStation.x, depotStation.y - 35, `🛑 Toàn bộ tàu quay về Depot ${line.name}!`, '#F59E0B');
      }
    } else {
      line.dispatchTimer = 0; // immediate dispatch of the first docked train!
      soundEngine.playConnect();
      if (depotStation) {
        this.addFloatingText(depotStation.x, depotStation.y - 35, `▶ Xuất Depot cách nhau ${line.dispatchIntervalSeconds || 10}s!`, '#10B981');
      }
    }
    return true;
  }

  // Emergency Engineering Repair Crew ($400)
  public repairTrain(trainId: string): boolean {
    const train = this.state.trains.find(t => t.id === trainId);
    if (!train) return false;
    if (this.state.money < 400) return false;

    this.state.money -= 400;
    train.breakdownTimer = 0;
    if (this.state.activeIncident && this.state.activeIncident.affectedTrainId === trainId) {
      this.clearActiveIncident();
    }
    soundEngine.playFanfare();
    this.addFloatingText(740, 500, '🛠️ Đội kỹ sư đã sửa chữa xong tàu! (-$400)', '#10B981');
    return true;
  }

  // Police & Station Security Crowd Control ($300)
  public deployStationSecurity(stationId: string): boolean {
    const station = this.state.stations.find(s => s.id === stationId);
    if (!station) return false;
    if (this.state.money < 300) return false;

    this.state.money -= 300;
    station.isOvercrowded = false;
    station.overcrowdedTimer = 0;
    // Disperse up to 40% of waiting crowd safely
    const disperseCount = Math.floor(station.passengers.length * 0.4);
    if (disperseCount > 0) {
      station.passengers.splice(0, disperseCount);
    }
    soundEngine.playInspectorCheck(1);
    this.addFloatingText(station.x, station.y - 30, `👮 An ninh đã giải tỏa trật tự ga! (-$300)`, '#38BDF8');
    return true;
  }

  public buyInterchangeUpgrade(): boolean {
    const cost = 350;
    if (this.state.money < cost) return false;
    this.state.money -= cost;
    this.state.inventory.interchangeTokens++;
    soundEngine.playFanfare();
    return true;
  }

  public startCampaignScenario(scenarioId: string): boolean {
    const scenario = CAMPAIGN_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return false;

    this.state.gameMode = 'campaign';
    this.state.stats.totalPassengersDelivered = 0;
    this.state.stats.totalDays = 1;
    this.state.stats.todayPassengers = 0;
    this.state.stats.dailyHistory = [];
    this.state.currentDayIndex = 0;
    this.state.timeOfDayHours = 7.0;
    this.state.isGameOver = false;
    this.state.gameOverReason = null;

    // Set scenario budget & fleet
    this.state.money = scenario.initialMoney ?? 1500;
    this.state.inventory = {
      availableLines: scenario.initialLines ?? 3,
      unassignedTrains: scenario.initialTrains ?? 2,
      carriages: scenario.initialCarriages ?? 1,
      interchangeTokens: 1,
      tunnelTokens: 2
    };

    // Restore stations cleanly
    this.restoreDefaultStations();

    // Weather setup
    if (scenario.fixedWeather) {
      this.setWeather(scenario.fixedWeather);
    } else {
      this.setWeather('sunny');
    }

    // Set campaign state
    this.state.campaignState = {
      scenarioId: scenario.id,
      targetPassengers: scenario.targetPassengers,
      currentDelivered: 0,
      timeLimitDays: scenario.timeLimitDays,
      currentDay: 1,
      isWon: false,
      isFailed: false
    };

    soundEngine.playFanfare();
    const worldW = this.mapConfig.worldWidth || 2400;
    const worldH = this.mapConfig.worldHeight || 1700;
    this.addFloatingText(worldW / 2, worldH / 2, `🎯 BẮT ĐẦU: ${scenario.titleVi}`, '#F59E0B');
    return true;
  }

  // --- Persistence & Save System ---

  public serialize(): string {
    return JSON.stringify({
      version: 3,
      cityId: this.mapConfig.id,
      money: this.state.money,
      timeOfDayHours: this.state.timeOfDayHours,
      currentDayIndex: this.state.currentDayIndex,
      weekNumber: this.state.weekNumber,
      gameMode: this.state.gameMode,
      inventory: this.state.inventory,
      stats: this.state.stats,
      stations: this.state.stations,
      lines: this.state.lines,
      trains: this.state.trains,
      stationPool: this.stationPool,
      nextStationSpawnTime: this.nextStationSpawnTime,
      passengerIdCounter: this.passengerIdCounter,
      weather: this.state.weather,
      activeIncident: this.state.activeIncident,
      disableIncidents: this.state.disableIncidents,
      timestamp: Date.now()
    });
  }

  public restore(savedJson: string): boolean {
    try {
      const data = JSON.parse(savedJson);
      if (!data || !data.cityId || data.cityId !== this.mapConfig.id) {
        return false;
      }

      // If restoring Hanoi from old small version, start fresh with the grand new Hanoi map!
      if (this.mapConfig.id === 'hanoi' && (!data.version || data.version < 3)) {
        return false;
      }

      this.state.money = typeof data.money === 'number' ? data.money : 200000;
      this.state.timeOfDayHours = typeof data.timeOfDayHours === 'number' ? data.timeOfDayHours : 7.0;
      this.state.currentDayIndex = typeof data.currentDayIndex === 'number' ? data.currentDayIndex : 0;
      this.state.weekNumber = typeof data.weekNumber === 'number' ? data.weekNumber : 1;
      this.state.gameMode = data.gameMode || 'standard';
      this.state.disableIncidents = typeof data.disableIncidents === 'boolean'
        ? data.disableIncidents
        : (typeof localStorage !== 'undefined' && localStorage.getItem('mini_metro_disable_incidents') === 'true');

      if (data.inventory) {
        this.state.inventory = {
          availableLines: data.inventory.availableLines ?? 3,
          unassignedTrains: data.inventory.unassignedTrains ?? 2,
          carriages: data.inventory.carriages ?? 1,
          doubleDeckerCarriages: data.inventory.doubleDeckerCarriages ?? 0,
          doubleDeckerTrains: data.inventory.doubleDeckerTrains ?? 0,
          feederBuses: data.inventory.feederBuses ?? 1,
          interchangeTokens: data.inventory.interchangeTokens ?? 1,
          tunnelTokens: data.inventory.tunnelTokens ?? 2
        };
      }

      if (data.stats) {
        this.state.stats = {
          totalPassengersDelivered: data.stats.totalPassengersDelivered ?? 0,
          totalDays: data.stats.totalDays ?? 1,
          totalWeeks: data.stats.totalWeeks ?? 1,
          moneyEarned: data.stats.moneyEarned ?? 0,
          peakLinesUsed: data.stats.peakLinesUsed ?? 0,
          peakTrainsUsed: data.stats.peakTrainsUsed ?? 0,
          crowdedWarningsAvoided: data.stats.crowdedWarningsAvoided ?? 0,
          todayPassengers: data.stats.todayPassengers ?? 0,
          dailyHistory: Array.isArray(data.stats.dailyHistory) ? data.stats.dailyHistory : []
        };
      }

      if (Array.isArray(data.stations) && data.stations.length > 0) {
        this.state.stations = data.stations.map((s: Station) => ({
          ...s,
          passengers: Array.isArray(s.passengers) ? s.passengers : [],
          overcrowdedTimer: Math.min(0.5, s.overcrowdedTimer || 0), // avoid spawning directly into instant game over
          isOvercrowded: false,
          isFlooded: !!s.isFlooded
        }));
      }

      if (Array.isArray(data.lines)) {
        this.state.lines = data.lines.map((l: MetroLine) => ({
          ...l,
          type: l.type || 'metro'
        }));
      }

      if (Array.isArray(data.trains)) {
        this.state.trains = data.trains.map((t: Train) => ({
          ...t,
          dwellingTime: 0,
          passengers: Array.isArray(t.passengers) ? t.passengers : []
        }));
      }

      if (Array.isArray(data.stationPool)) {
        this.stationPool = data.stationPool;
      }

      if (typeof data.nextStationSpawnTime === 'number') {
        this.nextStationSpawnTime = Math.max(10, data.nextStationSpawnTime);
      }

      if (typeof data.passengerIdCounter === 'number') {
        this.passengerIdCounter = data.passengerIdCounter;
      }

      if (data.weather) {
        this.state.weather = {
          ...data.weather,
          current: data.weather.current || data.weather.type || 'sunny',
          type: data.weather.type || 'sunny'
        };
      }

      if (data.activeIncident) {
        if (typeof data.activeIncident.remainingSeconds === 'number' && data.activeIncident.remainingSeconds <= 0) {
          this.clearActiveIncident();
        } else if (this.state.weather.type !== 'flooded') {
          this.clearActiveIncident();
        } else {
          this.state.activeIncident = data.activeIncident;
        }
      } else if (this.state.weather.type !== 'flooded') {
        this.clearActiveIncident();
      }

      if (!this.state.inspectorState) {
        this.state.inspectorState = {
          status: 'idle',
          currentStationId: null,
          currentTrainId: null,
          targetLineId: null,
          visitedStationIds: [],
          timeRemaining: 90,
          cooldownRemaining: 0,
          targetCount: 5,
          rewardAmount: 1500
        };
      } else {
        this.state.inspectorState.rewardAmount = 300 * (this.state.inspectorState.targetCount || 5);
        this.state.inspectorState.targetCount = this.state.inspectorState.targetCount || 5;
      }

      if (!Array.isArray(this.state.activeLoans)) {
        this.state.activeLoans = [];
      }
      if (!this.state.activeSurgeEvent) {
        this.state.activeSurgeEvent = null;
      }
      if (!Array.isArray(this.state.dailyChallenges) || this.state.dailyChallenges.length === 0) {
        this.state.dailyChallenges = [
          {
            id: 'dc-1',
            titleVi: 'Vận chuyển cao điểm',
            titleEn: 'Rush Hour Conveyor',
            descVi: 'Vận chuyển an toàn 50 lượt hành khách',
            descEn: 'Transport 50 passengers safely',
            targetValue: 50,
            currentValue: 0,
            reward: 1200,
            isCompleted: false,
            rewardClaimed: false,
            type: 'passengers',
            icon: '🚇'
          },
          {
            id: 'dc-2',
            titleVi: 'Đô thị đáng sống',
            titleEn: 'Liveable Metropolis',
            descVi: 'Duy trì chỉ số hài lòng người dân (CSI) trên 85%',
            descEn: 'Maintain Citizen Satisfaction above 85%',
            targetValue: 85,
            currentValue: 95,
            reward: 1500,
            isCompleted: true,
            rewardClaimed: false,
            type: 'satisfaction',
            icon: '⭐'
          },
          {
            id: 'dc-3',
            titleVi: 'Đầu mối liên vận',
            titleEn: 'Intermodal Hubs',
            descVi: 'Đón hoặc trả 15 khách tại trạm Sân bay / Cảng biển',
            descEn: 'Pick up or deliver 15 passengers at Airport/Seaport hubs',
            targetValue: 15,
            currentValue: 0,
            reward: 2000,
            isCompleted: false,
            rewardClaimed: false,
            type: 'intermodal',
            icon: '✈️'
          }
        ];
      }
      if (typeof this.state.stats.citizenSatisfaction !== 'number') {
        this.state.stats.citizenSatisfaction = 95;
      }

      this.state.isGameOver = false;
      this.state.gameOverReason = null;
      this.state.pendingWeeklyReward = false;

      return true;
    } catch (e) {
      console.error('Failed to restore simulation state', e);
      return false;
    }
  }

  // --- Urban Transit Bank Methods ---
  public takeBankLoan(loanAmount: 3000 | 10000 | 25000) {
    const rates: Record<number, { nameVi: string; nameEn: string; rate: number }> = {
      3000: { nameVi: 'Khoản vay cứu trợ khẩn cấp', nameEn: 'Emergency Short-term Loan', rate: 0.04 },
      10000: { nameVi: 'Gói tín dụng phát triển mạng lưới', nameEn: 'Network Expansion Credit', rate: 0.06 },
      25000: { nameVi: 'Trái phiếu đại đô thị cấp quốc gia', nameEn: 'Metropolitan Development Bond', rate: 0.08 }
    };
    const info = rates[loanAmount] || { nameVi: 'Vay ngân hàng đô thị', nameEn: 'Transit Bank Loan', rate: 0.05 };
    const loan: BankLoan = {
      id: `loan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nameVi: info.nameVi,
      nameEn: info.nameEn,
      amount: loanAmount,
      weeklyInterestRate: info.rate,
      weeklyInterestAmount: Math.round(loanAmount * info.rate),
      remainingPrincipal: loanAmount,
      takenDay: this.state.stats.totalDays
    };
    this.state.activeLoans.push(loan);
    this.state.money += loanAmount;
    soundEngine.playCashReward();
    this.addFloatingText(740, 480, `+$${loanAmount.toLocaleString()} Giải ngân vốn ngân hàng đô thị!`, '#10B981');
  }

  public repayBankLoan(loanId: string): boolean {
    const idx = this.state.activeLoans.findIndex(l => l.id === loanId);
    if (idx === -1) return false;
    const loan = this.state.activeLoans[idx];
    if (this.state.money < loan.remainingPrincipal) {
      return false;
    }
    this.state.money -= loan.remainingPrincipal;
    this.state.activeLoans.splice(idx, 1);
    soundEngine.playCashReward();
    this.addFloatingText(740, 480, `-$${loan.remainingPrincipal.toLocaleString()} Tất toán khoản vay thành công!`, '#06B6D4');
    return true;
  }

  // --- Daily Operations Challenges ---
  public claimChallengeReward(challengeId: string): boolean {
    const c = this.state.dailyChallenges.find(ch => ch.id === challengeId);
    if (!c || !c.isCompleted || c.rewardClaimed) return false;
    c.rewardClaimed = true;
    this.state.money += c.reward;
    soundEngine.playFanfare();
    this.addFloatingText(740, 480, `+$${c.reward} Thưởng hoàn thành thử thách!`, '#10B981');
    return true;
  }

  // --- Urban Surge Events Simulation ---
  private surgeSpawnCooldown: number = 65;

  private updateSurgeEvent(simDt: number) {
    if (this.state.activeSurgeEvent) {
      this.state.activeSurgeEvent.durationRemaining -= simDt;

      // Spawn surge passengers during active event
      if (Math.random() < 0.28 * simDt) {
        const station = this.state.stations.find(s => s.id === this.state.activeSurgeEvent?.stationId);
        if (station && station.passengers.length < station.maxCapacity + 5) {
          const shapes = this.state.stations.map(s => s.shape).filter(sh => sh !== station.shape);
          if (shapes.length > 0) {
            const targetShape = shapes[Math.floor(Math.random() * shapes.length)];
            station.passengers.push({
              id: `p-surge-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              targetShape,
              spawnTime: Date.now(),
              stationId: station.id
            });
            this.state.activeSurgeEvent.crowdTotalSpawned = (this.state.activeSurgeEvent.crowdTotalSpawned || 0) + 1;
          }
        }
      }

      if (this.state.activeSurgeEvent.durationRemaining <= 0) {
        const bonus = 800;
        this.state.money += bonus;
        this.addFloatingText(740, 480, `+$${bonus} Kết thúc cao điểm sự kiện đô thị!`, '#10B981');
        soundEngine.playCashReward();
        this.state.activeSurgeEvent = null;
      }
    } else {
      this.surgeSpawnCooldown -= simDt;
      if (this.surgeSpawnCooldown <= 0) {
        this.surgeSpawnCooldown = 110 + Math.random() * 70;
        if (Math.random() < 0.40 && this.state.stations.length >= 4) {
          this.triggerUrbanSurgeEvent();
        }
      }
    }
  }

  public triggerUrbanSurgeEvent() {
    if (this.state.activeSurgeEvent || this.state.stations.length === 0) return;
    const candidates = this.state.stations;
    const targetStation = candidates[Math.floor(Math.random() * candidates.length)];
    const events = [
      { titleVi: 'Đại Nhạc Hội SVĐ', titleEn: 'Stadium Mega Concert', descVi: 'Hàng ngàn khán giả đổ về ga tham dự đại nhạc hội.', icon: '🎸' },
      { titleVi: 'Lễ Hội Countdown Đô Thị', titleEn: 'Metropolitan Countdown', descVi: 'Người dân đổ dồn về trung tâm đón mừng năm mới.', icon: '🎆' },
      { titleVi: 'Hội Chợ Triển Lãm Quốc Tế', titleEn: 'International Expo', descVi: 'Đoàn khách ngoại giao và thương mại tấp nập.', icon: '🏢' },
      { titleVi: 'Lễ Hội Phố Đi Bộ', titleEn: 'Walking Street Festival', descVi: 'Khách du lịch và gia đình dạo chơi cuối tuần.', icon: '🎪' }
    ];
    const ev = events[Math.floor(Math.random() * events.length)];
    this.state.activeSurgeEvent = {
      id: `surge-${Date.now()}`,
      titleVi: ev.titleVi,
      titleEn: ev.titleEn,
      descriptionVi: `${ev.descVi} (${targetStation.name}). Giá vé x3!`,
      descriptionEn: `${ev.descVi} (${targetStation.name}). 3x Ticket fares!`,
      stationId: targetStation.id,
      stationName: targetStation.name,
      durationRemaining: 60,
      fareMultiplier: 3.0,
      icon: ev.icon,
      crowdTotalSpawned: 0
    };
    soundEngine.playFanfare();
    this.addFloatingText(targetStation.x, targetStation.y - 30, `🔥 ${ev.titleVi}: Vé x3!`, '#F97316');
  }

  // --- Citizen Satisfaction Index (CSI) Simulation ---
  private updateCitizenSatisfaction(simDt: number) {
    if (this.state.gameMode === 'zen') {
      this.state.stats.citizenSatisfaction = 100;
      return;
    }
    const overcrowdedCount = this.state.stations.filter(s => s.isOvercrowded || s.overcrowdedTimer > 0.4).length;
    let targetCSI = 100 - (overcrowdedCount * 18);

    const totalWaiting = this.state.stations.reduce((sum, s) => sum + s.passengers.length, 0);
    const avgWaiting = this.state.stations.length > 0 ? totalWaiting / this.state.stations.length : 0;
    if (avgWaiting > 2.2) {
      targetCSI -= (avgWaiting - 2.2) * 7;
    }

    const connectedStations = new Set(this.state.lines.flatMap(l => l.stationIds));
    const coverage = this.state.stations.length > 0 ? connectedStations.size / this.state.stations.length : 1;
    if (coverage < 0.8) {
      targetCSI -= (1 - coverage) * 25;
    }

    targetCSI = Math.max(10, Math.min(100, targetCSI));
    const currentCSI = this.state.stats.citizenSatisfaction || 95;
    this.state.stats.citizenSatisfaction = Math.round(currentCSI + (targetCSI - currentCSI) * Math.min(1, simDt * 0.4));

    for (const dc of this.state.dailyChallenges) {
      if (dc.type === 'satisfaction' && !dc.isCompleted) {
        if (this.state.stats.citizenSatisfaction >= dc.targetValue) {
          dc.isCompleted = true;
        }
      }
    }
  }

  public static saveToStorage(engine: MetroEngine) {
    try {
      const key = `mini_metro_save_${engine.mapConfig.id}`;
      const payload = engine.serialize();
      localStorage.setItem(key, payload);
      localStorage.setItem('mini_metro_last_city', engine.mapConfig.id);

      // Also update high score record
      const cityId = engine.mapConfig.id;
      const curRecord = MetroEngine.getHighScore(cityId);
      const curPassengers = engine.state.stats.totalPassengersDelivered;
      const curDays = engine.state.stats.totalDays;

      if (curPassengers > curRecord.bestPassengers || (curPassengers === curRecord.bestPassengers && curDays > curRecord.bestDays)) {
        localStorage.setItem(`mini_metro_highscore_${cityId}`, JSON.stringify({
          bestPassengers: Math.max(curRecord.bestPassengers, curPassengers),
          bestDays: Math.max(curRecord.bestDays, curDays),
          date: new Date().toLocaleDateString('vi-VN')
        }));
      }
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }

  public static loadFromStorage(cityId: string, mapConfig: CityMapConfig): MetroEngine | null {
    try {
      const key = `mini_metro_save_${cityId}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const engine = new MetroEngine(mapConfig);
      if (engine.restore(raw)) {
        return engine;
      }
    } catch (e) {
      console.warn('LocalStorage load error', e);
    }
    return null;
  }

  public static clearSave(cityId: string) {
    try {
      localStorage.removeItem(`mini_metro_save_${cityId}`);
    } catch (e) {
      console.warn('LocalStorage clear error', e);
    }
  }

  public static getHighScore(cityId: string): { bestPassengers: number; bestDays: number; date?: string } {
    try {
      const raw = localStorage.getItem(`mini_metro_highscore_${cityId}`);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {}
    return { bestPassengers: 0, bestDays: 0 };
  }
}

