export type StationShape = 'circle' | 'triangle' | 'square' | 'star' | 'diamond' | 'cross' | 'pentagon';

export interface Passenger {
  id: string;
  targetShape: StationShape;
  spawnTime: number;
  stationId: string;
  isVip?: boolean;
  vipName?: string;
  vipRole?: string;
  vipIcon?: string;
  vipTimeLimit?: number;
  vipReward?: number;
}

export interface VipQuestInfo {
  passengerId: string;
  vipName: string;
  vipRole: string;
  vipIcon: string;
  stationId: string;
  stationName: string;
  targetShape: StationShape;
  timeLeft: number;
  reward: number;
}

export interface Station {
  id: string;
  name: string;
  shape: StationShape;
  x: number;
  y: number;
  passengers: Passenger[];
  maxCapacity: number;
  isInterchange: boolean;
  overcrowdedTimer: number; // 0 to 1
  isOvercrowded: boolean;
  spawnTime: number;
  pulseTimer?: number;
  isFlooded?: boolean;
  specialHubType?: 'airport' | 'seaport';
}

export interface BankLoan {
  id: string;
  nameVi: string;
  nameEn: string;
  amount: number;
  weeklyInterestRate: number; // e.g. 0.04 (4%)
  weeklyInterestAmount: number;
  remainingPrincipal: number;
  takenDay: number;
}

export interface UrbanSurgeEvent {
  id: string;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  stationId: string;
  stationName: string;
  durationRemaining: number;
  fareMultiplier: number;
  icon: string;
  crowdTotalSpawned: number;
}

export interface DailyChallenge {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  isCompleted: boolean;
  rewardClaimed: boolean;
  type: 'passengers' | 'satisfaction' | 'intermodal' | 'no_overcrowd';
  icon: string;
}

export interface LineSegment {
  fromId: string;
  toId: string;
  crossesRiver: boolean;
}

export type MetroLineType = 'metro' | 'intercity' | 'high_speed';

export interface LinePerformanceStats {
  todayPassengers: number;
  totalPassengers: number;
  dailyPassengers: number[]; // passengers delivered per day [Mon, Tue, Wed, ...]
  totalWaitTimeSamples: number;
  totalWaitTimeSeconds: number;
  congestionStopsCount: number; // số lần tàu phải dừng chờ vì nghẽn
}

export interface MetroLine {
  id: string;
  name: string;
  color: string;
  textColor: string;
  darkColor: string;
  stationIds: string[];
  isLoop: boolean;
  type?: MetroLineType;
  depotStationId?: string;
  isDepotRecalled?: boolean;
  dispatchIntervalSeconds?: number;
  dispatchTimer?: number;
  stats?: LinePerformanceStats;
}

export interface Train {
  id: string;
  lineId: string;
  carriagesCount: number; // 0, 1, 2
  capacity: number; // base 6 + 4 per carriage
  speed: number; // base speed
  segmentIndex: number;
  progress: number; // 0 to 1
  direction: 1 | -1;
  passengers: Passenger[];
  dwellingTime: number; // seconds at station
  currentStationId?: string;
  isDockedAtDepot?: boolean;
  isHeadingToDepot?: boolean;
  breakdownTimer?: number;
  turboTimer?: number;
  turboCooldown?: number;
  isBulletTrain?: boolean;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // 1 to 0
}

export interface RiverPolygon {
  name?: string;
  points: { x: number; y: number }[];
  isWaterBody?: boolean;
  isIsland?: boolean;
}

export interface MapLandmark {
  id: string;
  nameVi: string;
  nameEn: string;
  category: 'heritage' | 'government' | 'modern' | 'transport' | 'culture' | 'park';
  x: number;
  y: number;
  yearBuilt?: string;
  iconType: 'temple' | 'pagoda' | 'mausoleum' | 'opera' | 'airport' | 'train' | 'stadium' | 'tower' | 'park' | 'lake_island' | 'flag';
  badgeText?: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface MapBridge {
  id: string;
  nameVi: string;
  nameEn: string;
  type: 'cantilever' | 'cable_stayed' | 'truss' | 'girder' | 'arch';
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  color?: string;
  width?: number;
  towers?: number;
  yearBuilt?: number;
  descriptionVi?: string;
  descriptionEn?: string;
}

export interface MapPark {
  id: string;
  nameVi: string;
  nameEn: string;
  points: { x: number; y: number }[];
}

export interface MapRoad {
  id: string;
  nameVi: string;
  nameEn: string;
  isRing?: boolean;
  points: { x: number; y: number }[];
}

export interface MapDistrictLabel {
  nameVi: string;
  nameEn: string;
  x: number;
  y: number;
}

export interface RealMetroLinePreset {
  id: string;
  nameVi: string;
  nameEn: string;
  color: string;
  darkColor: string;
  textColor: string;
  stationIds: string[];
  isLoop?: boolean;
}

export interface StationData {
  id?: string;
  shape: StationShape;
  x: number;
  y: number;
  name: string;
  districtVi?: string;
  districtEn?: string;
  historicalNoteVi?: string;
  specialHubType?: 'airport' | 'seaport';
}

export interface CityMapConfig {
  id: string;
  nameVi: string;
  nameEn: string;
  descriptionVi: string;
  descriptionEn: string;
  version?: number;
  worldWidth?: number;
  worldHeight?: number;
  initialStations: StationData[];
  riverPolygons: RiverPolygon[];
  stationPool: StationData[];
  landmarks?: MapLandmark[];
  bridges?: MapBridge[];
  parks?: MapPark[];
  arterialRoads?: MapRoad[];
  districts?: MapDistrictLabel[];
  realLinesPreset?: RealMetroLinePreset[];
  isCustom?: boolean;
  createdAt?: number;
}

export type GameMode = 'standard' | 'zen' | 'rush_hour' | 'campaign';

export interface CampaignScenario {
  id: string;
  titleVi: string;
  titleEn: string;
  subtitleVi: string;
  subtitleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  cityId: string;
  targetPassengers: number;
  timeLimitDays: number;
  initialLines?: number;
  initialTrains?: number;
  initialCarriages?: number;
  initialMoney?: number;
  fixedWeather?: WeatherType;
  specialRulesVi: string[];
  specialRulesEn: string[];
  starThresholds: {
    oneStar: number; // e.g. target reached
    twoStarDays: number; // reached within X days
    threeStarDays: number; // reached within Y days
  };
}

export interface CampaignState {
  scenarioId: string;
  targetPassengers: number;
  currentDelivered: number;
  timeLimitDays: number;
  currentDay: number;
  isWon: boolean;
  isFailed: boolean;
  failReason?: string;
  starsEarned?: number;
}


export type TerrainToolMode = 'none' | 'add_station' | 'draw_river' | 'erase_water';

export interface GameInventory {
  availableLines: number;
  unassignedTrains: number;
  carriages: number;
  interchangeTokens: number;
  tunnelTokens: number;
}

export interface WeeklyChoiceOption {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  icon: string;
  apply: (inv: GameInventory) => GameInventory;
}

export interface DailyPassengerRecord {
  dayIndex: number;
  dayNameVi: string;
  dayNameEn: string;
  passengers: number;
  totalDelivered: number;
  revenue?: number;
}

export interface GameStats {
  totalPassengersDelivered: number;
  totalDays: number;
  totalWeeks: number;
  moneyEarned: number;
  peakLinesUsed: number;
  peakTrainsUsed: number;
  crowdedWarningsAvoided: number;
  todayPassengers?: number;
  citizenSatisfaction?: number; // 0 to 100%
  dailyHistory?: DailyPassengerRecord[];
}

export type WeatherType = 'sunny' | 'rainy' | 'storm' | 'flooded';

export interface WeatherState {
  type: WeatherType;
  current: WeatherType;
  temperature: number; // in Celsius e.g. 28-34
  rainIntensity: number; // 0 to 1
  descriptionVi: string;
  descriptionEn: string;
  floodedStationIds: string[];
  durationRemaining: number; // in seconds
}

export type IncidentType = 'flooded' | 'concert_festival' | 'severe_storm' | 'train_breakdown' | 'rush_surge';

export interface UrbanIncident {
  id: string;
  type?: IncidentType;
  titleVi: string;
  titleEn: string;
  descriptionVi: string;
  descriptionEn: string;
  affectedStationIds: string[];
  affectedTrainId?: string;
  speedMultiplier: number;
  remainingSeconds: number;
  rewardEarned?: number;
}

export interface InspectorMedal {
  id: string;
  titleVi: string;
  titleEn: string;
  descVi: string;
  descEn: string;
  icon: string;
  unlockedAt: number;
}

export interface InspectorState {
  status: 'idle' | 'selecting_station' | 'patrolling' | 'completed' | 'failed';
  currentStationId: string | null;
  currentTrainId: string | null;
  targetLineId?: string | null;
  visitedStationIds: string[];
  plannedStationIds?: string[];
  lastTrainId?: string | null;
  dwellAtStationTimer?: number;
  timeRemaining: number;       // e.g. 90 seconds + bonus
  cooldownRemaining: number;   // 30 seconds
  targetCount: number;         // min 5 stations
  rewardAmount: number;        // formula: $300 x station count
  failureReason?: string;
  stationWaitTimer?: number;
  medals?: InspectorMedal[];
}

