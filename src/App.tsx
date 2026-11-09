import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { RouteManagerSidebar } from './components/RouteManagerSidebar';
import { LineColorModal } from './components/LineColorModal';
import { StationDetailModal } from './components/StationDetailModal';
import { WeeklyModal } from './components/WeeklyModal';
import { ShopModal } from './components/ShopModal';
import { GameOverModal } from './components/GameOverModal';
import { TutorialModal } from './components/TutorialModal';
import { StartMenuModal } from './components/StartMenuModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CreativeToolbar } from './components/CreativeToolbar';
import { CampaignHUD } from './components/CampaignHUD';
import { InspectorHUD } from './components/InspectorHUD';
import { InspectorModal } from './components/InspectorModal';
import { TopLeftMapCards } from './components/TopLeftMapCards';
import { VictoryModal } from './components/VictoryModal';
import { LineSettingsModal } from './components/LineSettingsModal';
import { CityManagerModal } from './components/CityManagerModal';
import { UrbanBankModal } from './components/UrbanBankModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { MiniMetroDock } from './components/MiniMetroDock';
import { DonationModal } from './components/DonationModal';
import { MassStationUpgradeModal } from './components/MassStationUpgradeModal';
import { ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react';

import { CITY_MAPS, LINE_PALETTE, BUS_PALETTE } from './data/maps';
import { getAllCities } from './data/customCities';
import { MetroEngine } from './simulation/metroEngine';
import { renderScene, getTrainAtScreenPos } from './canvas/renderer';
import { soundEngine } from './audio/soundEngine';
import { Station, MetroLine, GameMode, Train, StationShape, WeatherType, WeatherState, UrbanIncident, CampaignState, InspectorState, BankLoan, UrbanSurgeEvent, DailyChallenge } from './types/game';
import { CAMPAIGN_SCENARIOS } from './data/campaignScenarios';
import { distance, distToSegment, generateTrackSegmentPoints, Point, TrackRoutingStyle, computeLineColors } from './utils/geometry';
import {
  auth,
  UserProfile,
  getCachedUserProfile,
  saveCityToCloud,
  loadCityFromCloud,
  logoutUser,
  onAuthStateChanged
} from './services/authStorage';

interface DragState {
  isDragging: boolean;
  fromStationId: string | null;
  toStationId?: string | null;
  currentPos: Point | null;
  targetStationId: string | null;
  lineId: string | null;
  isSegmentSplit?: boolean;
  segmentIndex?: number;
}

export interface CanvasViewport {
  rect: { left: number; top: number; width: number; height: number };
  scale: number;
  offsetX: number;
  offsetY: number;
  cameraZoom: number;
  panX: number;
  panY: number;
}

// Robust viewport transformation calculation from cached canvas dimensions with zoom & pan
export function computeViewport(
  rect: { left: number; top: number; width: number; height: number },
  cameraZoom = 1.0,
  panX = 0,
  panY = 0,
  worldWidth = 2400,
  worldHeight = 1700
): CanvasViewport {
  const padding = 15; // smaller padding so map is naturally bigger and fills the screen

  const availableW = Math.max(100, rect.width - padding * 2);
  const availableH = Math.max(100, rect.height - padding * 2);
  const scale = Math.min(availableW / worldWidth, availableH / worldHeight);

  const offsetX = (rect.width - worldWidth * scale) / 2;
  const offsetY = (rect.height - worldHeight * scale) / 2;

  return { rect, scale, offsetX, offsetY, cameraZoom, panX, panY };
}

// Convert screen pixel coordinate directly to simulation world coordinate taking into account zoom & pan
function clientToWorld(vp: CanvasViewport, clientX: number, clientY: number): Point {
  const { rect, scale, offsetX, offsetY, cameraZoom, panX, panY } = vp;
  const totalScale = scale * cameraZoom;
  const totalOffsetX = offsetX + panX;
  const totalOffsetY = offsetY + panY;
  return {
    x: (clientX - rect.left - totalOffsetX) / totalScale,
    y: (clientY - rect.top - totalOffsetY) / totalScale
  };
}

// Screen-space station picker: checks distance in SCREEN PIXELS (45px radius) with zoom & pan
function findStationNearClient(
  engine: MetroEngine,
  vp: CanvasViewport,
  clientX: number,
  clientY: number,
  screenTolerance = 45
): Station | null {
  const { rect, scale, offsetX, offsetY, cameraZoom, panX, panY } = vp;
  const totalScale = scale * cameraZoom;
  const totalOffsetX = offsetX + panX;
  const totalOffsetY = offsetY + panY;
  let closest: Station | null = null;
  let minScreenDist = screenTolerance;

  for (const station of engine.state.stations) {
    const stationScreenX = rect.left + totalOffsetX + station.x * totalScale;
    const stationScreenY = rect.top + totalOffsetY + station.y * totalScale;

    const screenDist = Math.hypot(clientX - stationScreenX, clientY - stationScreenY);
    if (screenDist <= minScreenDist) {
      minScreenDist = screenDist;
      closest = station;
    }
  }

  return closest;
}

export interface NearbySegmentResult {
  line: MetroLine;
  fromStation: Station;
  toStation: Station;
  segmentIndex: number;
  screenDist: number;
}

// Screen-space line segment picker: checks if client pointer is close to an existing visible route segment
function findLineSegmentNearClient(
  engine: MetroEngine,
  vp: CanvasViewport,
  clientX: number,
  clientY: number,
  trackStyle: TrackRoutingStyle = 'octolinear',
  preferredLineId?: string | null,
  screenTolerance = 38
): NearbySegmentResult | null {
  const { rect, scale, offsetX, offsetY, cameraZoom, panX, panY } = vp;
  const totalScale = scale * cameraZoom;
  const totalOffsetX = offsetX + panX;
  const totalOffsetY = offsetY + panY;

  const stationMap = new Map<string, Station>();
  for (const s of engine.state.stations) {
    stationMap.set(s.id, s);
  }

  let best: NearbySegmentResult | null = null;
  let minDist = screenTolerance;

  for (const line of engine.state.lines) {
    const sIds = line.stationIds;
    if (sIds.length < 2) continue;

    const count = line.isLoop ? sIds.length : sIds.length - 1;
    for (let i = 0; i < count; i++) {
      const fromSt = stationMap.get(sIds[i]);
      const toSt = stationMap.get(sIds[(i + 1) % sIds.length]);
      if (!fromSt || !toSt) continue;

      // Sample along the EXACT visible track geometry (bends, 45-degree angles, S-curves)
      const trackPts = generateTrackSegmentPoints(fromSt, toSt, trackStyle);
      const ptsLen = trackPts.length;

      for (let k = 0; k < ptsLen - 1; k++) {
        const p1Screen = {
          x: rect.left + totalOffsetX + trackPts[k].x * totalScale,
          y: rect.top + totalOffsetY + trackPts[k].y * totalScale
        };
        const p2Screen = {
          x: rect.left + totalOffsetX + trackPts[k + 1].x * totalScale,
          y: rect.top + totalOffsetY + trackPts[k + 1].y * totalScale
        };

        const d = distToSegment({ x: clientX, y: clientY }, p1Screen, p2Screen);
        // Give selected line priority
        const adjustedDist = (line.id === preferredLineId) ? d * 0.75 : d;

        if (adjustedDist < minDist) {
          minDist = adjustedDist;
          best = {
            line,
            fromStation: fromSt,
            toStation: toSt,
            segmentIndex: i,
            screenDist: d
          };
        }
      }
    }
  }

  return best;
}

export default function App() {
  // Game Settings & UI State
  const [lang, setLang] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('mini_metro_lang') as 'vi' | 'en') || 'vi';
  });
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('mini_metro_muted') === 'true';
  });
  const [currentCityId, setCurrentCityId] = useState<string>(() => {
    return localStorage.getItem('mini_metro_last_city') || 'hanoi';
  });
  const [allCities, setAllCities] = useState(() => getAllCities());
  const [isCityManagerOpen, setIsCityManagerOpen] = useState(false);

  const refreshCities = useCallback(() => {
    setAllCities(getAllCities());
  }, []);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [trackStyle, setTrackStyle] = useState<TrackRoutingStyle>(() => {
    const saved = localStorage.getItem('mini_metro_track_style');
    if (saved === 'octolinear' || saved === 'straight' || saved === 'curved') return saved;
    return 'octolinear';
  });
  const [isShiftDown, setIsShiftDown] = useState(false);

    const handleToggleTrackStyle = useCallback(() => {
    setTrackStyle(prev => {
      const next = prev === 'curved' ? 'octolinear' : prev === 'octolinear' ? 'straight' : 'curved';
      localStorage.setItem('mini_metro_track_style', next);
      return next;
    });
  }, []);

  // Station and Passenger Visibility Toggles
  const [hideStationIcons, setHideStationIcons] = useState<boolean>(() => {
    return localStorage.getItem('mini_metro_hide_station_icons') === 'true';
  });
  const [hidePassengerCount, setHidePassengerCount] = useState<boolean>(() => {
    return localStorage.getItem('mini_metro_hide_passenger_count') === 'true';
  });
  const [hideStationUpgrades, setHideStationUpgrades] = useState<boolean>(() => {
    return localStorage.getItem('mini_metro_hide_station_upgrades') === 'true';
  });

  const handleToggleHideStationIcons = useCallback(() => {
    setHideStationIcons(prev => {
      const next = !prev;
      localStorage.setItem('mini_metro_hide_station_icons', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const handleToggleHidePassengerCount = useCallback(() => {
    setHidePassengerCount(prev => {
      const next = !prev;
      localStorage.setItem('mini_metro_hide_passenger_count', next ? 'true' : 'false');
      return next;
    });
  }, []);

  const handleToggleHideStationUpgrades = useCallback(() => {
    setHideStationUpgrades(prev => {
      const next = !prev;
      localStorage.setItem('mini_metro_hide_station_upgrades', next ? 'true' : 'false');
      return next;
    });
  }, []);

  // Active Modals & Authentication
  const [inspectingStation, setInspectingStation] = useState<Station | null>(null);
  const [isWeeklyModalOpen, setIsWeeklyModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false);
  const [isMassUpgradeModalOpen, setIsMassUpgradeModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isStartMenuOpen, setIsStartMenuOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreativeToolbarOpen, setIsCreativeToolbarOpen] = useState(false);
  const [isInspectorModalOpen, setIsInspectorModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isChallengesModalOpen, setIsChallengesModalOpen] = useState(false);
  const [disableIncidents, setDisableIncidents] = useState<boolean>(() => {
    return typeof localStorage !== 'undefined' && localStorage.getItem('mini_metro_disable_incidents') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getCachedUserProfile());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'yellow';
    onConfirm: () => void;
  } | null>(null);

  // Engine instance reference & canvas reference
  const engineRef = useRef<MetroEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mouse interaction refs (stored in refs to avoid triggering React re-renders on mousemove!)
  const dragStateRef = useRef<DragState>({
    isDragging: false,
    fromStationId: null,
    toStationId: null,
    currentPos: null,
    targetStationId: null,
    lineId: null,
    isSegmentSplit: false,
    segmentIndex: undefined
  });
  const hoveredStationRef = useRef<string | null>(null);
  const mouseDownRef = useRef<{
    clientX: number;
    clientY: number;
    time: number;
    stationId: string | null;
    segmentHit?: NearbySegmentResult | null;
  } | null>(null);
  const lastStationClickRef = useRef<{ stationId: string; time: number } | null>(null);
  const singleClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Camera Zoom & Pan tracking
  const cameraZoomRef = useRef<number>(1.0);
  const cameraPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0
  });
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Line Color Customization
  const [editingColorLine, setEditingColorLine] = useState<{ line: MetroLine; index: number } | null>(null);
  // Line Settings Modal (Depot & Headway)
  const [editingSettingsLine, setEditingSettingsLine] = useState<MetroLine | null>(null);

  // Free Station Builder Mode ($1,500/station)
  const [isPlacingStation, setIsPlacingStation] = useState<boolean>(false);
  const [placingShape, setPlacingShape] = useState<StationShape>('circle');
  const [customStationName, setCustomStationName] = useState<string>('');

  // Hovered Train State for mouse tooltip box
  const [hoveredTrain, setHoveredTrain] = useState<{ trainId: string; lineId: string; clientX: number; clientY: number } | null>(null);

  // Cached Canvas Viewport Reference (eliminates forced layout reflows in 60fps loop and mouse events)
  const viewportRef = useRef<CanvasViewport>({
    rect: { left: 0, top: 0, width: 1480, height: 1050 },
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    cameraZoom: 1.0,
    panX: 0,
    panY: 0
  });

  // Track canvas size changes without per-frame getBoundingClientRect()
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateVp = () => {
      const rect = canvas.getBoundingClientRect();
      const wW = engineRef.current?.mapConfig.worldWidth || 2400;
      const wH = engineRef.current?.mapConfig.worldHeight || 1700;
      viewportRef.current = computeViewport(
        rect,
        cameraZoomRef.current,
        cameraPanRef.current.x,
        cameraPanRef.current.y,
        wW,
        wH
      );
    };

    updateVp();

    const ro = new ResizeObserver(() => {
      updateVp();
    });
    ro.observe(canvas);

    window.addEventListener('resize', updateVp, { passive: true });
    window.addEventListener('scroll', updateVp, { passive: true });

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateVp);
      window.removeEventListener('scroll', updateVp);
    };
  }, []);

  // Shift key detection for cursor change and panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftDown(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftDown(false);
        if (isPanningRef.current) {
          isPanningRef.current = false;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Zoom at specific screen coordinates
  const zoomAtScreen = useCallback((screenX: number, screenY: number, factor: number) => {
    const vp = viewportRef.current;
    const oldZoom = cameraZoomRef.current;
    const newZoom = Math.min(4.0, Math.max(0.4, Number((oldZoom * factor).toFixed(3))));
    if (Math.abs(newZoom - oldZoom) < 0.001) return;

    const totalOldScale = vp.scale * oldZoom;
    const oldPanX = cameraPanRef.current.x;
    const oldPanY = cameraPanRef.current.y;
    const worldX = (screenX - (vp.offsetX + oldPanX)) / totalOldScale;
    const worldY = (screenY - (vp.offsetY + oldPanY)) / totalOldScale;

    const newPanX = screenX - vp.offsetX - worldX * (vp.scale * newZoom);
    const newPanY = screenY - vp.offsetY - worldY * (vp.scale * newZoom);

    cameraZoomRef.current = newZoom;
    cameraPanRef.current = { x: newPanX, y: newPanY };
    viewportRef.current.cameraZoom = newZoom;
    viewportRef.current.panX = newPanX;
    viewportRef.current.panY = newPanY;
    setZoomPercent(Math.round(newZoom * 100));
  }, []);

  const handleResetCamera = useCallback(() => {
    cameraZoomRef.current = 1.0;
    cameraPanRef.current = { x: 0, y: 0 };
    viewportRef.current.cameraZoom = 1.0;
    viewportRef.current.panX = 0;
    viewportRef.current.panY = 0;
    setZoomPercent(100);
  }, []);

  const handleZoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomAtScreen(rect.width / 2, rect.height / 2, 1.25);
  }, [zoomAtScreen]);

  const handleZoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    zoomAtScreen(rect.width / 2, rect.height / 2, 0.8);
  }, [zoomAtScreen]);

  // Non-passive wheel event listener: ensures e.preventDefault() stops browser navigation/scrolling
  // and properly handles Shift+Wheel where browsers convert vertical deltaY into horizontal deltaX
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      // In browsers, holding Shift converts vertical wheel scroll (deltaY) into horizontal wheel scroll (deltaX)
      // Pick the delta axis with the dominant movement
      let delta = 0;
      if (Math.abs(e.deltaY) >= Math.abs(e.deltaX) && Math.abs(e.deltaY) > 0.001) {
        delta = e.deltaY;
      } else if (Math.abs(e.deltaX) > 0.001) {
        delta = e.deltaX;
      }

      if (Math.abs(delta) < 0.001) return;

      // delta < 0: rolling wheel forward / scroll up -> Zoom in (factor > 1)
      // delta > 0: rolling wheel backward / scroll down -> Zoom out (factor < 1)
      const factor = delta < 0 ? 1.15 : 0.87;
      zoomAtScreen(screenX, screenY, factor);
    };

    canvas.addEventListener('wheel', onNativeWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onNativeWheel);
    };
  }, [zoomAtScreen]);

  // UI state updated at low frequency (5Hz) to keep React blazing fast
  const [uiSnapshot, setUiSnapshot] = useState<{
    money: number;
    timeOfDayHours: number;
    currentDayIndex: number;
    weekNumber: number;
    gameSpeed: number;
    isRushHour: boolean;
    weather: WeatherState;
    activeIncident: UrbanIncident | null;
    gameMode: GameMode;
    passengersDelivered: number;
    trainsCount: number;
    unassignedTrains: number;
    unassignedBuses?: number;
    stations: Station[];
    lines: MetroLine[];
    trains: Train[];
    inventory: MetroEngine['state']['inventory'];
    isGameOver: boolean;
    gameOverReason: string | null;
    gameOverStationId?: string | null;
    stats: MetroEngine['state']['stats'];
    campaignState?: CampaignState | null;
    inspectorState?: InspectorState;
    disableIncidents?: boolean;
    citizenSatisfaction?: number;
    activeLoans?: BankLoan[];
    activeSurgeEvent?: UrbanSurgeEvent | null;
    dailyChallenges?: DailyChallenge[];
  } | null>(null);

  const syncSnapshot = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setUiSnapshot({
      money: engine.state.money,
      timeOfDayHours: engine.state.timeOfDayHours,
      currentDayIndex: engine.state.currentDayIndex,
      weekNumber: engine.state.weekNumber,
      gameSpeed: engine.state.gameSpeed,
      isRushHour: engine.state.isRushHour,
      weather: engine.state.weather,
      activeIncident: engine.state.activeIncident,
      gameMode: engine.state.gameMode,
      passengersDelivered: engine.state.stats.totalPassengersDelivered,
      trainsCount: engine.state.trains.length,
      unassignedTrains: engine.state.inventory.unassignedTrains,
      unassignedBuses: engine.state.inventory.unassignedBuses ?? 0,
      stations: [...engine.state.stations],
      lines: [...engine.state.lines],
      trains: [...engine.state.trains],
      inventory: { ...engine.state.inventory },
      isGameOver: engine.state.isGameOver,
      gameOverReason: engine.state.gameOverReason,
      gameOverStationId: engine.state.gameOverStationId,
      stats: { ...engine.state.stats },
      campaignState: engine.state.campaignState ? { ...engine.state.campaignState } : null,
      inspectorState: engine.state.inspectorState ? { ...engine.state.inspectorState } : undefined,
      disableIncidents: engine.state.disableIncidents,
      citizenSatisfaction: engine.state.stats.citizenSatisfaction,
      activeLoans: engine.state.activeLoans ? [...engine.state.activeLoans] : [],
      activeSurgeEvent: engine.state.activeSurgeEvent,
      dailyChallenges: engine.state.dailyChallenges ? [...engine.state.dailyChallenges] : []
    });
  }, []);

  // Initialize or Reset Engine (with automatic save restoration)
  const initEngine = useCallback((cityId: string, mode: GameMode = 'standard', forceNewGame = false) => {
    const availableCities = getAllCities();
    const config = availableCities.find(m => m.id === cityId) || availableCities[0];
    let engine: MetroEngine | null = null;

    if (!forceNewGame) {
      engine = MetroEngine.loadFromStorage(cityId, config);
    }

    if (!engine) {
      engine = new MetroEngine(config, mode);
    }

    engineRef.current = engine;
    (window as unknown as { __engine: typeof engine }).__engine = engine;
    dragStateRef.current = {
      isDragging: false,
      fromStationId: null,
      currentPos: null,
      targetStationId: null,
      lineId: null
    };
    setSelectedLineId(null);
    setInspectingStation(null);
    setIsWeeklyModalOpen(false);
    setDisableIncidents(engine.state.disableIncidents);

    setUiSnapshot({
      money: engine.state.money,
      timeOfDayHours: engine.state.timeOfDayHours,
      currentDayIndex: engine.state.currentDayIndex,
      weekNumber: engine.state.weekNumber,
      gameSpeed: engine.state.gameSpeed,
      isRushHour: engine.state.isRushHour,
      weather: engine.state.weather,
      activeIncident: engine.state.activeIncident,
      gameMode: engine.state.gameMode,
      passengersDelivered: engine.state.stats.totalPassengersDelivered,
      trainsCount: engine.state.trains.length,
      unassignedTrains: engine.state.inventory.unassignedTrains,
      unassignedBuses: engine.state.inventory.unassignedBuses ?? 0,
      stations: [...engine.state.stations],
      lines: [...engine.state.lines],
      trains: [...engine.state.trains],
      inventory: { ...engine.state.inventory },
      isGameOver: engine.state.isGameOver,
      gameOverReason: engine.state.gameOverReason,
      stats: { ...engine.state.stats },
      campaignState: engine.state.campaignState ? { ...engine.state.campaignState } : null,
      inspectorState: engine.state.inspectorState ? { ...engine.state.inspectorState } : {
        status: 'idle',
        currentStationId: null,
        currentTrainId: null,
        targetLineId: null,
        visitedStationIds: [],
        timeRemaining: 90,
        cooldownRemaining: 0,
        targetCount: 5,
        rewardAmount: 4000
      },
      disableIncidents: engine.state.disableIncidents
    });
  }, []);

  // Initialize on mount
  useEffect(() => {
    initEngine(currentCityId);
  }, [currentCityId, initEngine]);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        const cached = getCachedUserProfile();
        if (cached && cached.uid === user.uid) {
          setCurrentUser(cached);
        } else {
          const profile: UserProfile = {
            uid: user.uid,
            username: user.displayName || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString()
          };
          setCurrentUser(profile);
          localStorage.setItem('metro_user_profile', JSON.stringify(profile));
        }
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLoginSuccess = useCallback(async (profile: UserProfile) => {
    setCurrentUser(profile);
    // Check if cloud save exists for current city and restore it
    try {
      const cloudJson = await loadCityFromCloud(profile.uid, currentCityId);
      if (cloudJson && engineRef.current) {
        const restored = engineRef.current.restore(cloudJson);
        if (restored) {
          syncSnapshot();
        }
      }
    } catch (e) {
      console.warn('Error loading cloud save on login', e);
    }
  }, [currentCityId, syncSnapshot]);

  const handleLogout = useCallback(async () => {
    await logoutUser();
    setCurrentUser(null);
  }, []);

  // Periodic Auto-save & Window close save (both LocalStorage and Cloud Firestore when logged in)
  useEffect(() => {
    const interval = setInterval(() => {
      const engine = engineRef.current;
      if (engine && !engine.state.isGameOver) {
        MetroEngine.saveToStorage(engine);
        if (currentUser) {
          saveCityToCloud(
            currentUser.uid,
            engine.mapConfig.id,
            engine.serialize(),
            engine.state.stats.totalPassengersDelivered,
            engine.state.stats.totalDays
          ).catch(() => {});
        }
      }
    }, 2500);

    const handleBeforeUnload = () => {
      const engine = engineRef.current;
      if (engine && !engine.state.isGameOver) {
        MetroEngine.saveToStorage(engine);
        if (currentUser) {
          saveCityToCloud(
            currentUser.uid,
            engine.mapConfig.id,
            engine.serialize(),
            engine.state.stats.totalPassengersDelivered,
            engine.state.stats.totalDays
          ).catch(() => {});
        }
      }
    };

    const handleVisibilityChange = () => {
      const engine = engineRef.current;
      if (document.hidden && engine && !engine.state.isGameOver) {
        MetroEngine.saveToStorage(engine);
        if (currentUser) {
          saveCityToCloud(
            currentUser.uid,
            engine.mapConfig.id,
            engine.serialize(),
            engine.state.stats.totalPassengersDelivered,
            engine.state.stats.totalDays
          ).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Sync mute setting
  useEffect(() => {
    soundEngine.setMuted(isMuted);
    localStorage.setItem('mini_metro_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  // Sync language setting
  useEffect(() => {
    localStorage.setItem('mini_metro_lang', lang);
  }, [lang]);

  // Low-frequency UI sync interval (200ms) - decouples React re-renders from the 60fps canvas loop!
  useEffect(() => {
    const uiInterval = setInterval(() => {
      const engine = engineRef.current;
      if (!engine) return;

      setUiSnapshot({
        money: engine.state.money,
        timeOfDayHours: engine.state.timeOfDayHours,
        currentDayIndex: engine.state.currentDayIndex,
        weekNumber: engine.state.weekNumber,
        gameSpeed: engine.state.gameSpeed,
        isRushHour: engine.state.isRushHour,
        weather: engine.state.weather,
        activeIncident: engine.state.activeIncident,
        gameMode: engine.state.gameMode,
        passengersDelivered: engine.state.stats.totalPassengersDelivered,
        trainsCount: engine.state.trains.length,
        unassignedTrains: engine.state.inventory.unassignedTrains,
        unassignedBuses: engine.state.inventory.unassignedBuses ?? 0,
        stations: [...engine.state.stations],
        lines: [...engine.state.lines],
        trains: [...engine.state.trains],
        inventory: { ...engine.state.inventory },
        isGameOver: engine.state.isGameOver,
        gameOverReason: engine.state.gameOverReason,
        gameOverStationId: engine.state.gameOverStationId,
        stats: { ...engine.state.stats },
        campaignState: engine.state.campaignState ? { ...engine.state.campaignState } : null,
        inspectorState: engine.state.inspectorState ? { ...engine.state.inspectorState } : undefined,
        disableIncidents: engine.state.disableIncidents,
        citizenSatisfaction: engine.state.stats.citizenSatisfaction,
        activeLoans: engine.state.activeLoans ? [...engine.state.activeLoans] : [],
        activeSurgeEvent: engine.state.activeSurgeEvent,
        dailyChallenges: engine.state.dailyChallenges ? [...engine.state.dailyChallenges] : []
      });

      // Check weekly milestone trigger
      if (engine.state.pendingWeeklyReward && !isWeeklyModalOpen) {
        setIsWeeklyModalOpen(true);
      }
    }, 200);

    return () => clearInterval(uiInterval);
  }, [isWeeklyModalOpen]);

  // Reset Game Handler (Clear save and start fresh with Custom Center Confirm Modal)
  const handleResetGame = useCallback(() => {
    const engine = engineRef.current;
    const cityName = lang === 'vi' ? engine?.mapConfig.nameVi : engine?.mapConfig.nameEn;
    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? 'Bắt đầu lại thành phố' : 'Reset City Map',
      message: lang === 'vi'
        ? `Bạn có chắc muốn bắt đầu lại thành phố ${cityName}? Toàn bộ tiến trình hiện tại trên bản đồ này sẽ được làm mới.`
        : `Are you sure you want to reset ${cityName}? Your current progress on this map will start fresh.`,
      confirmLabel: lang === 'vi' ? 'Bắt đầu lại' : 'Reset',
      cancelLabel: lang === 'vi' ? 'Hủy' : 'Cancel',
      onConfirm: () => {
        MetroEngine.clearSave(currentCityId);
        initEngine(currentCityId, 'standard', true);
        setConfirmDialog(null);
      }
    });
  }, [currentCityId, initEngine, lang]);

  // Dismiss / Clear Active Incident & Unflood stations immediately
  const handleDismissIncident = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clearActiveIncident();
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Campaign & Scenario Management Handlers
  const handleStartScenario = useCallback((scenarioId: string) => {
    if (engineRef.current) {
      engineRef.current.startCampaignScenario(scenarioId);
      setIsStartMenuOpen(false);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleRestartCurrentScenario = useCallback(() => {
    if (engineRef.current && engineRef.current.state.campaignState) {
      engineRef.current.startCampaignScenario(engineRef.current.state.campaignState.scenarioId);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleExitCampaign = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.setGameMode('standard');
      engineRef.current.state.campaignState = null;
      syncSnapshot();
      setIsStartMenuOpen(true);
    }
  }, [syncSnapshot]);

  const handleNextScenario = useCallback(() => {
    if (engineRef.current && engineRef.current.state.campaignState) {
      const currId = engineRef.current.state.campaignState.scenarioId;
      const currIdx = CAMPAIGN_SCENARIOS.findIndex(s => s.id === currId);
      const nextScenario = CAMPAIGN_SCENARIOS[(currIdx + 1) % CAMPAIGN_SCENARIOS.length];
      engineRef.current.startCampaignScenario(nextScenario.id);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Restore Default Stations
  const handleRestoreDefaultStations = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restoreDefaultStations();
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Urban Transit Bank Handlers
  const handleTakeLoan = useCallback((amount: 3000 | 10000 | 25000) => {
    if (engineRef.current) {
      engineRef.current.takeBankLoan(amount);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleRepayLoan = useCallback((loanId: string) => {
    if (engineRef.current) {
      engineRef.current.repayBankLoan(loanId);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Daily Challenge Handlers
  const handleClaimChallengeReward = useCallback((challengeId: string) => {
    if (engineRef.current) {
      engineRef.current.claimChallengeReward(challengeId);
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Unlock All Stations
  const handleUnlockAllStations = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.unlockAllStations();
      syncSnapshot();
    }
  }, [syncSnapshot]);

  // Main High-Performance 60fps Simulation & Render Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.1, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const engine = engineRef.current;
      const canvas = canvasRef.current;

      if (engine && canvas) {
        // Run simulation update step
        engine.update(dt);

        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const vp = viewportRef.current;

          // Auto-adjust canvas internal pixel buffer to match display
          const targetW = Math.round(vp.rect.width * dpr);
          const targetH = Math.round(vp.rect.height * dpr);
          if (targetW > 0 && targetH > 0 && (canvas.width !== targetW || canvas.height !== targetH)) {
            canvas.width = targetW;
            canvas.height = targetH;
          }

          // Clear and fill the full canvas buffer cleanly with transit paper background
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          const bgColor = theme === 'dark' ? '#252528' : '#FAF9F6';
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, vp.rect.width, vp.rect.height);

          // Smooth camera zoom & pan toward overcrowded station upon game over (Hinh 6)
          if (engine.state.isGameOver && engine.state.gameOverStationId) {
            const govStation = engine.state.stations.find(s => s.id === engine.state.gameOverStationId);
            if (govStation) {
              const targetZoom = 1.85;
              cameraZoomRef.current += (targetZoom - cameraZoomRef.current) * 0.04;

              const targetTotalScale = vp.scale * cameraZoomRef.current;
              const targetPanX = (vp.rect.width / 2) - vp.offsetX - (govStation.x * targetTotalScale);
              const targetPanY = (vp.rect.height / 2) - vp.offsetY - (govStation.y * targetTotalScale);

              cameraPanRef.current.x += (targetPanX - cameraPanRef.current.x) * 0.04;
              cameraPanRef.current.y += (targetPanY - cameraPanRef.current.y) * 0.04;

              viewportRef.current.cameraZoom = cameraZoomRef.current;
              viewportRef.current.panX = cameraPanRef.current.x;
              viewportRef.current.panY = cameraPanRef.current.y;
            }
          }

          // Apply DPI + Camera Zoom & Pan Transform
          const totalScale = vp.scale * vp.cameraZoom;
          const totalOffsetX = vp.offsetX + vp.panX;
          const totalOffsetY = vp.offsetY + vp.panY;

          ctx.translate(totalOffsetX, totalOffsetY);
          ctx.scale(totalScale, totalScale);

          // Render game scene
          renderScene(
            ctx,
            engine.mapConfig.worldWidth || 2400,
            engine.mapConfig.worldHeight || 1700,
            engine.mapConfig.riverPolygons,
            engine.state.stations,
            engine.state.lines,
            engine.state.trains,
            engine.state.floatingTexts,
            {
              theme,
              selectedLineId,
              selectedStationId: inspectingStation?.id || null,
              dragState: dragStateRef.current.isDragging ? dragStateRef.current : null,
              hoveredStationId: dragStateRef.current.targetStationId || hoveredStationRef.current,
              showStationNames: true,
              trackStyle,
              hideStationIcons,
              hidePassengerCount,
              hideStationUpgrades,
              weather: engine.state.weather,
              timeOfDayHours: engine.state.timeOfDayHours,
              parks: engine.mapConfig.parks,
              bridges: engine.mapConfig.bridges,
              roads: engine.mapConfig.arterialRoads,
              landmarks: engine.mapConfig.landmarks,
              districts: engine.mapConfig.districts,
              inspectorState: engine.state.inspectorState,
              activeSurgeEvent: engine.state.activeSurgeEvent,
              hasTransitAdContract: engine.state.stats?.hasTransitAdContract,
              isGameOver: engine.state.isGameOver,
              gameOverStationId: engine.state.gameOverStationId
            }
          );
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [theme, selectedLineId, inspectingStation, trackStyle, hideStationIcons, hidePassengerCount, hideStationUpgrades]);

  // Handle pointer down (both mouse and touch)
  // Handle pointer down (both mouse and touch)
  const onPointerDown = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const vp = viewportRef.current;

    // CASE: Free Station Placement Mode active ($1,500/station)
    if (isPlacingStation) {
      if (engine.state.money < 1500) {
        soundEngine.playDisconnect();
        engine.addFloatingText(740, 500, lang === 'vi' ? 'Không đủ tiền! Cần $1,500 để xây nhà ga mới.' : 'Need $1,500 to build station!', '#EF4444');
        return;
      }

      const worldPos = clientToWorld(vp, clientX, clientY);
      const nextPoolStation = engine.stationPool.shift();
      const stName = customStationName.trim() || nextPoolStation?.name || `Ga ${engine.state.stations.length + 1}`;
      const res = engine.createCustomStation(stName, placingShape, worldPos.x, worldPos.y, 1500);
      if (res.success) {
        syncSnapshot();
        setCustomStationName('');
      }
      return;
    }

    const clickedStation = findStationNearClient(engine, vp, clientX, clientY, 26);
    const clickedSegment = !clickedStation
      ? findLineSegmentNearClient(engine, vp, clientX, clientY, trackStyle, selectedLineId, 38)
      : null;

    mouseDownRef.current = {
      clientX,
      clientY,
      time: performance.now(),
      stationId: clickedStation ? clickedStation.id : null,
      segmentHit: clickedSegment ? { ...clickedSegment } : null
    };

    setHoveredTrain(null);
    if (clickedStation) {
      const worldPos = clientToWorld(vp, clientX, clientY);
      dragStateRef.current = {
        isDragging: true,
        fromStationId: clickedStation.id,
        toStationId: null,
        currentPos: worldPos,
        targetStationId: null,
        lineId: selectedLineId,
        isSegmentSplit: false
      };
      canvas.style.cursor = 'grabbing';
    } else if (clickedSegment) {
      const worldPos = clientToWorld(vp, clientX, clientY);
      dragStateRef.current = {
        isDragging: true,
        fromStationId: clickedSegment.fromStation.id,
        toStationId: clickedSegment.toStation.id,
        currentPos: worldPos,
        targetStationId: null,
        lineId: clickedSegment.line.id,
        isSegmentSplit: true,
        segmentIndex: clickedSegment.segmentIndex
      };
      setSelectedLineId(clickedSegment.line.id);
      canvas.style.cursor = 'grabbing';
    }
  };

  // Handle pointer move (both mouse and touch)
  const onPointerMove = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const vp = viewportRef.current;
    const stationHover = findStationNearClient(engine, vp, clientX, clientY, 45);
    hoveredStationRef.current = stationHover ? stationHover.id : null;

    if (dragStateRef.current.isDragging) {
      setHoveredTrain(null);
      const fromId = dragStateRef.current.fromStationId;
      const toId = dragStateRef.current.toStationId;
      const isSplit = dragStateRef.current.isSegmentSplit;

      const target = stationHover && stationHover.id !== fromId && (!isSplit || stationHover.id !== toId)
        ? stationHover.id
        : null;

      dragStateRef.current.currentPos = clientToWorld(vp, clientX, clientY);
      dragStateRef.current.targetStationId = target;
      canvas.style.cursor = 'grabbing';
    } else {
      // Check if mouse cursor is hovering over any train
      const trainHit = getTrainAtScreenPos(vp, clientX, clientY, 18);
      if (trainHit) {
        setHoveredTrain({ ...trainHit, clientX, clientY });
      } else {
        setHoveredTrain(null);
      }

      // Cursor styling for instant feedback
      if (!isShiftDown && !isPanningRef.current && !isPlacingStation) {
        if (stationHover) {
          canvas.style.cursor = 'pointer';
        } else {
          const segHover = findLineSegmentNearClient(engine, vp, clientX, clientY, trackStyle, selectedLineId, 32);
          if (segHover) {
            canvas.style.cursor = 'grab';
          } else {
            canvas.style.cursor = 'crosshair';
          }
        }
      }
    }
  };

  // Handle pointer up (both mouse and touch)
  const onPointerUp = (clientX: number, clientY: number) => {
    const downInfo = mouseDownRef.current;
    mouseDownRef.current = null;

    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const moveDist = downInfo ? Math.hypot(clientX - downInfo.clientX, clientY - downInfo.clientY) : 0;

    // CASE 1: Pure Click (moved < 14 screen pixels)
    // -> Double click (press 2 times) on station removes/cancels that station from the line!
    // -> Single click inspects/selects station
    // -> NEVER creates a line when just clicking stations!
    if (moveDist < 14) {
      if (downInfo?.stationId) {
        const stationId = downInfo.stationId;

        // CASE 1A: Inspector Station Selection Mode (Deploy inspector immediately)
        if (engine.state.inspectorState?.status === 'selecting_station') {
          if (singleClickTimerRef.current) {
            clearTimeout(singleClickTimerRef.current);
            singleClickTimerRef.current = null;
          }
          lastStationClickRef.current = null;
          setInspectingStation(null);
          engine.deployInspectorAtStation(stationId);
          syncSnapshot();
          return;
        }

        const now = Date.now();
        const prev = lastStationClickRef.current;

        // Check if this is a double-click / double-tap (within 380ms on the same station)
        if (prev && prev.stationId === stationId && now - prev.time < 380) {
          // Double-click detected! Cancel pending single-click inspect modal
          if (singleClickTimerRef.current) {
            clearTimeout(singleClickTimerRef.current);
            singleClickTimerRef.current = null;
          }
          lastStationClickRef.current = null;

          // Close modal if open
          setInspectingStation(null);

          // Cancel / remove station from route!
          const result = engine.cancelStationFromRoute(stationId, selectedLineId);
          if (result.success) {
            setUiSnapshot(prevSnapshot =>
              prevSnapshot
                ? {
                    ...prevSnapshot,
                    lines: [...engine.state.lines],
                    trains: [...engine.state.trains],
                    inventory: { ...engine.state.inventory }
                  }
                : null
            );
          }
        } else {
          // First click on this station: record and schedule single-click inspect modal
          lastStationClickRef.current = { stationId, time: now };
          if (singleClickTimerRef.current) {
            clearTimeout(singleClickTimerRef.current);
          }
          singleClickTimerRef.current = setTimeout(() => {
            lastStationClickRef.current = null;
            const st = engine.state.stations.find(s => s.id === stationId);
            if (st) {
              setInspectingStation(prevModal => (prevModal?.id === st.id ? null : { ...st }));
            }
          }, 240);
        }
      } else {
        // User clicked empty canvas map -> deselect station and line!
        if (engine.state.inspectorState?.status === 'selecting_station') {
          engine.cancelInspector();
          syncSnapshot();
        }
        if (singleClickTimerRef.current) {
          clearTimeout(singleClickTimerRef.current);
          singleClickTimerRef.current = null;
        }
        lastStationClickRef.current = null;
        setInspectingStation(null);
        setSelectedLineId(null);
      }
    }
    // CASE 2: Dragged to split segment (grabbed line between Station A and Station C, dropped on Station B -> A - B - C)
    else if (
      dragStateRef.current.isDragging &&
      dragStateRef.current.isSegmentSplit &&
      dragStateRef.current.fromStationId &&
      dragStateRef.current.toStationId &&
      dragStateRef.current.lineId &&
      moveDist >= 14
    ) {
      const fromId = dragStateRef.current.fromStationId;
      const toId = dragStateRef.current.toStationId;
      const targetStation = dragStateRef.current.targetStationId
        ? engine.state.stations.find(s => s.id === dragStateRef.current.targetStationId)
        : findStationNearClient(engine, viewportRef.current, clientX, clientY, 45);

      if (targetStation && targetStation.id !== fromId && targetStation.id !== toId) {
        const res = engine.insertStationIntoSegment(
          dragStateRef.current.lineId,
          fromId,
          toId,
          targetStation.id
        );
        if (res.success) {
          syncSnapshot();
          MetroEngine.saveToStorage(engine);
          if (currentUser) {
            saveCityToCloud(
              currentUser.uid,
              engine.mapConfig.id,
              engine.serialize(),
              engine.state.stats.totalPassengersDelivered,
              engine.state.stats.totalDays
            ).catch(() => {});
          }
        }
      }
    }
    // CASE 3: Dragged to connect route (strictly ONLY when dragged >= 14 screen pixels from Station A to Station B)
    else if (dragStateRef.current.isDragging && dragStateRef.current.fromStationId && moveDist >= 14) {
      const fromId = dragStateRef.current.fromStationId;
      const targetStation = dragStateRef.current.targetStationId
        ? engine.state.stations.find(s => s.id === dragStateRef.current.targetStationId)
        : findStationNearClient(engine, viewportRef.current, clientX, clientY, 45);

      if (targetStation && targetStation.id !== fromId) {
        engine.connectStations(
          fromId,
          targetStation.id,
          dragStateRef.current.lineId || selectedLineId
        );
        syncSnapshot();
        MetroEngine.saveToStorage(engine);
        if (currentUser) {
          saveCityToCloud(
            currentUser.uid,
            engine.mapConfig.id,
            engine.serialize(),
            engine.state.stats.totalPassengersDelivered,
            engine.state.stats.totalDays
          ).catch(() => {});
        }
      }
    }

    // Reset drag state
    dragStateRef.current = {
      isDragging: false,
      fromStationId: null,
      toStationId: null,
      currentPos: null,
      targetStationId: null,
      lineId: null,
      isSegmentSplit: false
    };
  };

  // Mouse event wrappers with Shift-drag pan & wheel zoom support
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Hold Shift OR click middle mouse button -> start camera panning
    if (e.shiftKey || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: cameraPanRef.current.x,
        startPanY: cameraPanRef.current.y
      };
      return;
    }

    if (e.button === 0) onPointerDown(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      const newPanX = panStartRef.current.startPanX + dx;
      const newPanY = panStartRef.current.startPanY + dy;
      cameraPanRef.current = { x: newPanX, y: newPanY };
      viewportRef.current.panX = newPanX;
      viewportRef.current.panY = newPanY;
      return;
    }

    onPointerMove(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    onPointerUp(e.clientX, e.clientY);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;

    const clickedStation = findStationNearClient(engine, viewportRef.current, e.clientX, e.clientY, 35);
    if (clickedStation) {
      if (singleClickTimerRef.current) {
        clearTimeout(singleClickTimerRef.current);
        singleClickTimerRef.current = null;
      }
      lastStationClickRef.current = null;
      setInspectingStation(null);

      const result = engine.cancelStationFromRoute(clickedStation.id, selectedLineId);
      if (result.success) {
        setUiSnapshot(prev =>
          prev
            ? {
                ...prev,
                lines: [...engine.state.lines],
                trains: [...engine.state.trains],
                inventory: { ...engine.state.inventory }
              }
            : null
        );
      }
    }
  };

  // Comprehensive Touch Engine for Mobile & Tablet:
  // - Single-finger on empty map -> Smooth Canvas Panning
  // - Single-finger on station (48px hit) -> Route connection / line drawing
  // - Two-finger gesture -> Simultaneous Pinch-to-zoom & Canvas Panning
  const touchStateRef = useRef<{
    mode: 'none' | 'route' | 'pan' | 'pinch';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    startPanX: number;
    startPanY: number;
    startDist: number;
    startZoom: number;
    startMidX: number;
    startMidY: number;
  }>({
    mode: 'none',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startPanX: 0,
    startPanY: 0,
    startDist: 0,
    startZoom: 1.0,
    startMidX: 0,
    startMidY: 0
  });

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const engine = engineRef.current;
    if (!engine) return;
    const vp = viewportRef.current;

    if (e.touches.length === 2) {
      // Two-finger pinch & pan
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // Cancel single finger route drag if any
      dragStateRef.current = {
        isDragging: false,
        fromStationId: null,
        currentPos: null,
        targetStationId: null,
        lineId: null
      };

      touchStateRef.current = {
        mode: 'pinch',
        startX: midX,
        startY: midY,
        lastX: midX,
        lastY: midY,
        startPanX: cameraPanRef.current.x,
        startPanY: cameraPanRef.current.y,
        startDist: Math.max(10, dist),
        startZoom: cameraZoomRef.current,
        startMidX: midX,
        startMidY: midY
      };
      return;
    }

    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      // Check if placing station
      if (isPlacingStation) {
        onPointerDown(clientX, clientY);
        return;
      }

      // Check if touching a station or a line segment
      const clickedStation = findStationNearClient(engine, vp, clientX, clientY, 30);
      const clickedSegment = !clickedStation
        ? findLineSegmentNearClient(engine, vp, clientX, clientY, trackStyle, selectedLineId, 44)
        : null;

      if (clickedStation || clickedSegment) {
        touchStateRef.current = {
          mode: 'route',
          startX: clientX,
          startY: clientY,
          lastX: clientX,
          lastY: clientY,
          startPanX: cameraPanRef.current.x,
          startPanY: cameraPanRef.current.y,
          startDist: 0,
          startZoom: cameraZoomRef.current,
          startMidX: 0,
          startMidY: 0
        };
        onPointerDown(clientX, clientY);
      } else {
        // Touching empty canvas space -> Single-finger Pan!
        touchStateRef.current = {
          mode: 'pan',
          startX: clientX,
          startY: clientY,
          lastX: clientX,
          lastY: clientY,
          startPanX: cameraPanRef.current.x,
          startPanY: cameraPanRef.current.y,
          startDist: 0,
          startZoom: cameraZoomRef.current,
          startMidX: 0,
          startMidY: 0
        };
        mouseDownRef.current = {
          clientX,
          clientY,
          time: performance.now(),
          stationId: null
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchStateRef.current.mode === 'pinch') {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const midX = (t1.clientX + t2.clientX) / 2;
      const midY = (t1.clientY + t2.clientY) / 2;

      // 1. Pinch Zoom calculation
      const ratio = dist / (touchStateRef.current.startDist || 1);
      const newZoom = Math.min(4.0, Math.max(0.4, Number((touchStateRef.current.startZoom * ratio).toFixed(3))));

      // 2. Midpoint Pan calculation
      const dx = midX - touchStateRef.current.startMidX;
      const dy = midY - touchStateRef.current.startMidY;
      const newPanX = touchStateRef.current.startPanX + dx;
      const newPanY = touchStateRef.current.startPanY + dy;

      cameraZoomRef.current = newZoom;
      cameraPanRef.current = { x: newPanX, y: newPanY };
      viewportRef.current.cameraZoom = newZoom;
      viewportRef.current.panX = newPanX;
      viewportRef.current.panY = newPanY;
      setZoomPercent(Math.round(newZoom * 100));
      return;
    }

    if (e.touches.length === 1) {
      const clientX = e.touches[0].clientX;
      const clientY = e.touches[0].clientY;

      if (touchStateRef.current.mode === 'route') {
        onPointerMove(clientX, clientY);
      } else if (touchStateRef.current.mode === 'pan') {
        const dx = clientX - touchStateRef.current.startX;
        const dy = clientY - touchStateRef.current.startY;
        const newPanX = touchStateRef.current.startPanX + dx;
        const newPanY = touchStateRef.current.startPanY + dy;
        cameraPanRef.current = { x: newPanX, y: newPanY };
        viewportRef.current.panX = newPanX;
        viewportRef.current.panY = newPanY;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (touchStateRef.current.mode === 'pinch') {
      if (e.touches.length < 2) {
        touchStateRef.current.mode = 'none';
      }
      return;
    }

    if (touchStateRef.current.mode === 'pan') {
      if (e.changedTouches.length > 0) {
        const clientX = e.changedTouches[0].clientX;
        const clientY = e.changedTouches[0].clientY;
        const moveDist = Math.hypot(clientX - touchStateRef.current.startX, clientY - touchStateRef.current.startY);
        // If finger moved < 8px, it was a tap on empty canvas space -> deselect station/line
        if (moveDist < 8) {
          onPointerUp(clientX, clientY);
        }
      }
      touchStateRef.current.mode = 'none';
      return;
    }

    if (touchStateRef.current.mode === 'route') {
      if (e.changedTouches.length > 0) {
        onPointerUp(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
      touchStateRef.current.mode = 'none';
      return;
    }

    touchStateRef.current.mode = 'none';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if the user is typing in an input, textarea, or contentEditable element
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (
        activeTag === 'input' ||
        activeTag === 'textarea' ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'Space') {
        e.preventDefault();
        engine.setGameSpeed(engine.state.gameSpeed === 0 ? 1 : 0);
      } else if (e.key === '1') {
        engine.setGameSpeed(1);
      } else if (e.key === '2') {
        engine.setGameSpeed(2);
      } else if (e.key === '3') {
        engine.setGameSpeed(3);
      } else if (e.key === 'Escape') {
        // Cancel/deselect station, line and close any open dialogs
        setInspectingStation(null);
        setSelectedLineId(null);
        setIsWeeklyModalOpen(false);
        setIsShopModalOpen(false);
        setIsTutorialOpen(false);
        dragStateRef.current = {
          isDragging: false,
          fromStationId: null,
          currentPos: null,
          targetStationId: null,
          lineId: null
        };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateNewLine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!engine.canCreateLine('metro')) return;
    const metroCount = engine.getStandardLinesCount();
    const nextIdx = metroCount % LINE_PALETTE.length;
    const pal = LINE_PALETTE[nextIdx];
    const created = engine.createLine(
      `Tuyến 0${metroCount + 1}`,
      pal.color,
      pal.darkColor,
      pal.textColor
    );
    if (created) {
      setSelectedLineId(created.id);
    }
    syncSnapshot();
  }, [syncSnapshot]);

  const handleCreateNewBusLine = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (!engine.canCreateBusLine()) return;
    const busCount = engine.getBusLinesCount();
    const nextIdx = busCount % BUS_PALETTE.length;
    const pal = BUS_PALETTE[nextIdx];
    const created = engine.createBusLine(
      `Tuyến Buýt 0${busCount + 1}`,
      pal.color,
      pal.darkColor,
      pal.textColor
    );
    if (created) {
      setSelectedLineId(created.id);
    }
    syncSnapshot();
  }, [syncSnapshot]);

  const handleBuyBus = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.buyBus();
    syncSnapshot();
  }, [syncSnapshot]);

  const handleBuyBusLineSlot = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.buyBusLineSlot();
    syncSnapshot();
  }, [syncSnapshot]);

  const handleDeleteLine = useCallback((lId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.deleteLine(lId);
    if (selectedLineId === lId) {
      setSelectedLineId(null);
    }
    syncSnapshot();
  }, [selectedLineId, syncSnapshot]);

  const handleRequestDeleteLine = useCallback((lineId: string, lineName?: string) => {
    const engine = engineRef.current;
    const targetLine = engine?.state.lines.find(l => l.id === lineId);
    const displayName = lineName || targetLine?.name || (lang === 'vi' ? 'tuyến này' : 'this route');
    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? 'Xác nhận xóa tuyến' : 'Delete Route',
      message: lang === 'vi'
        ? `Bạn có chắc muốn xóa "${displayName}"? Toàn bộ đoàn tàu và toa xe đang chạy trên tuyến sẽ được thu hồi an toàn về kho depot.`
        : `Are you sure you want to delete "${displayName}"? All trains and carriages on this line will be safely returned to depot inventory.`,
      confirmLabel: lang === 'vi' ? 'Xóa tuyến' : 'Delete Route',
      cancelLabel: lang === 'vi' ? 'Hủy' : 'Cancel',
      confirmVariant: 'danger',
      onConfirm: () => {
        handleDeleteLine(lineId);
        setConfirmDialog(null);
      }
    });
  }, [lang, handleDeleteLine]);

  const handleSaveLineColor = useCallback((lineId: string, hexColor: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const colors = computeLineColors(hexColor);
    engine.updateLineColor(lineId, colors.color, colors.darkColor, colors.textColor);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleSaveLineSettings = useCallback((lineId: string, depotStationId: string, dispatchInterval: number) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setLineDepot(lineId, depotStationId);
    engine.setLineDispatchInterval(lineId, dispatchInterval);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleToggleLineDepot = useCallback((lineId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.toggleLineDepotRecall(lineId);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleRenameLine = useCallback((lineId: string, newName: string, newCode?: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.renameLine(lineId, newName, newCode)) {
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleRepairTrain = useCallback((trainId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.repairTrain(trainId);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleDeploySecurity = useCallback((stationId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.deployStationSecurity(stationId);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleToggleCBTC = useCallback((lineId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.toggleLineCBTC(lineId)) {
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleUpgradeStationSmartIC = useCallback((stationId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.upgradeStationSmartIC(stationId)) {
      syncSnapshot();
    }
  }, [syncSnapshot]);

  const handleUpgradeAllStations = useCallback((feature: 'smartIC' | 'coffee' | 'solar' | 'tod' | 'parkAndRide' | 'feeder' | 'all') => {
    const engine = engineRef.current;
    if (!engine) return;
    const res = engine.upgradeAllStationsFeature(feature);
    if (res.success) {
      syncSnapshot();
      MetroEngine.saveToStorage(engine);
      if (inspectingStation) {
        const updated = engine.state.stations.find(s => s.id === inspectingStation.id);
        if (updated) setInspectingStation({ ...updated });
      }
    }
  }, [inspectingStation, syncSnapshot]);

  const handleBuyTransitAdContract = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.toggleTransitAdContract()) {
      syncSnapshot();
      MetroEngine.saveToStorage(engine);
      if (currentUser) {
        saveCityToCloud(
          currentUser.uid,
          engine.mapConfig.id,
          engine.serialize(),
          engine.state.stats.totalPassengersDelivered,
          engine.state.stats.totalDays
        ).catch(() => {});
      }
    }
  }, [syncSnapshot, currentUser]);

  const handleToggleDisableIncidents = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const nextVal = !engine.state.disableIncidents;
    engine.setDisableIncidents(nextVal);
    setDisableIncidents(nextVal);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleClearAllStations = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? 'Xóa tất cả nhà ga' : 'Clear All Stations',
      message: lang === 'vi'
        ? 'Bạn có chắc chắn muốn xóa TẤT CẢ các nhà ga trên bản đồ? Toàn bộ tuyến đường sẽ được làm mới và các đoàn tàu/toa xe sẽ được hoàn trả về kho.'
        : 'Are you sure you want to delete ALL stations? All routes will be reset and fleets returned to depot.',
      confirmLabel: lang === 'vi' ? 'Xóa tất cả' : 'Delete All',
      cancelLabel: lang === 'vi' ? 'Hủy' : 'Cancel',
      onConfirm: () => {
        engine.clearAllStations();
        setInspectingStation(null);
        setSelectedLineId(null);
        syncSnapshot();
        setConfirmDialog(null);
      }
    });
  }, [lang, syncSnapshot]);

  const handleDeleteStation = useCallback((stationId: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.deleteSingleStation(stationId);
    setInspectingStation(null);
    syncSnapshot();
  }, [syncSnapshot]);

  const handleRequestDeleteStation = useCallback((stationId: string, stationName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? 'Xóa nhà ga' : 'Delete Station',
      message: lang === 'vi'
        ? `Bạn có chắc muốn xóa ga "${stationName}" khỏi bản đồ? Tuyến đường đi qua ga này sẽ tự động được ngắt kết nối.`
        : `Are you sure you want to delete station "${stationName}"? Any lines passing through will be disconnected.`,
      confirmLabel: lang === 'vi' ? 'Xóa ga' : 'Delete Station',
      cancelLabel: lang === 'vi' ? 'Hủy' : 'Cancel',
      onConfirm: () => {
        handleDeleteStation(stationId);
        setConfirmDialog(null);
      }
    });
  }, [lang, handleDeleteStation]);

  const handleRequestDeployInspector = useCallback((lineId: string, plannedStationIds: string[]) => {
    const engine = engineRef.current;
    if (!engine) return;
    const line = engine.state.lines.find(l => l.id === lineId);
    if (!line) return;

    if (engine.state.money < 1000) {
      setConfirmDialog({
        isOpen: true,
        title: lang === 'vi' ? 'Không đủ ngân sách' : 'Insufficient Funds',
        message: lang === 'vi'
          ? `Bạn cần ít nhất $1,000 để chi trả chi phí điều động thanh tra tuyến tàu! (Số dư hiện tại: $${engine.state.money.toLocaleString()})`
          : `You need at least $1,000 to deploy a line inspector! (Current balance: $${engine.state.money.toLocaleString()})`,
        confirmLabel: lang === 'vi' ? 'Đã hiểu' : 'Understood',
        cancelLabel: lang === 'vi' ? 'Đóng' : 'Close',
        confirmVariant: 'yellow',
        onConfirm: () => setConfirmDialog(null)
      });
      return;
    }

    const stationCount = plannedStationIds.length;
    const reward = 300 * stationCount;
    const stationNames = plannedStationIds.map(sId => engine.state.stations.find(s => s.id === sId)?.name || sId);

    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? 'Điều động Thanh tra Tuyến tàu' : 'Deploy Line Inspector',
      message: lang === 'vi'
        ? `Bạn có chắc muốn điều động thanh tra trên tuyến "${line.name}"?\n\n• Lộ trình kiểm tra (${stationCount} ga):\n  ${stationNames.join(' ➔ ')}\n\n• Quy trình: Thanh tra đi từ ga đầu đến ga cuối, chỉ lên tàu hướng về điểm cuối và không xuống những ga đã kiểm tra xong.\n• Chi phí xuất phát: $1,000 (trừ ngay vào tài khoản)\n• Thưởng hoàn thành: 300$ × ${stationCount} ga = +$${reward.toLocaleString()} (Lợi nhuận ${reward >= 1000 ? `+$${(reward - 1000).toLocaleString()}` : `-$${(1000 - reward).toLocaleString()}`})\n• Thời gian: 3 phút (180 giây) hoàn thành toàn tuyến (Hồi chiêu 0s)\n• Lưu ý: Chỉ kiểm tra quá tải tại ga thanh tra đang kiểm tra (Chế độ Zen không kiểm tra quá tải). Tại mỗi ga thanh tra chờ tàu tối đa 40s (có timer đếm ngược trên đầu), quá 40s không có tàu đón sẽ thất bại!`
        : `Are you sure you want to deploy the inspector on "${line.name}"?\n\n• Itinerary (${stationCount} stations):\n  ${stationNames.join(' ➔ ')}\n\n• Mechanic: Inspector travels from start to end station, only boards trains heading towards destination, and never alights at stations already inspected.\n• Deployment fee: $1,000\n• Completion reward: $300 × ${stationCount} stations = +$${reward.toLocaleString()} (Profit: ${reward >= 1000 ? `+$${(reward - 1000).toLocaleString()}` : `-$${(1000 - reward).toLocaleString()}`})\n• Time: 3 minutes (180 seconds) to complete route\n• Warning: Only the station currently being inspected is checked for overcrowding (no check in Zen mode). Inspector waits max 40s for a train at each station!`,
      confirmLabel: lang === 'vi' ? 'Xác nhận (-$1,000)' : 'Confirm (-$1,000)',
      cancelLabel: lang === 'vi' ? 'Hủy' : 'Cancel',
      confirmVariant: 'yellow',
      onConfirm: () => {
        const res = engine.deployInspectorOnLine(lineId, plannedStationIds);
        if (res.success) {
          setIsInspectorModalOpen(false);
          syncSnapshot();
        }
        setConfirmDialog(null);
      }
    });
  }, [lang, syncSnapshot]);

  // Request Revert Interchange Hub with Warning Confirmation (No Refund)
  const handleRequestRevertInterchange = useCallback((stationId: string, stationName?: string) => {
    const engine = engineRef.current;
    if (!engine) return;
    const displayName = stationName || engine.state.stations.find(s => s.id === stationId)?.name || '';

    setConfirmDialog({
      isOpen: true,
      title: lang === 'vi' ? '⚠️ Xác nhận Hoàn tác Ga Trung Chuyển' : '⚠️ Confirm Revert Interchange Hub',
      message: lang === 'vi'
        ? `CẢNH BÁO QUAN TRỌNG:\n\nBạn có chắc chắn muốn hoàn tác Ga "${displayName}" từ Ga Trung Chuyển về lại Ga thường không?\n\n• Sức chứa tối đa của ga sẽ giảm từ 14 xuống 6 khách.\n• LƯU Ý: Thao tác này sẽ KHÔNG ĐƯỢC HOÀN LẠI $350 (hoặc token) chi phí nâng cấp đã trả!`
        : `IMPORTANT WARNING:\n\nAre you sure you want to revert Station "${displayName}" from an Interchange Hub back to a standard station?\n\n• Station maximum capacity will decrease from 14 to 6 passengers.\n• NOTE: This action will NOT REFUND the $350 upgrade fee or token!`,
      confirmLabel: lang === 'vi' ? 'Xác nhận Hoàn tác (Không hoàn tiền)' : 'Confirm Revert (No Refund)',
      cancelLabel: lang === 'vi' ? 'Hủy bỏ' : 'Cancel',
      confirmVariant: 'warning',
      onConfirm: () => {
        engine.revertStationInterchange(stationId);
        const updated = engine.state.stations.find(s => s.id === stationId);
        if (updated) setInspectingStation({ ...updated });
        syncSnapshot();
        MetroEngine.saveToStorage(engine);
        setConfirmDialog(null);
      }
    });
  }, [lang, syncSnapshot]);

  const engine = engineRef.current;
  const state = uiSnapshot || engine?.state;

  return (
    <div className={`w-screen h-dvh flex flex-col overflow-hidden select-none ${
      theme === 'dark' ? 'bg-[#252528] text-slate-100' : 'bg-neutral-100 text-slate-900'
    }`}>
      {/* Top Header Bar */}
      {state && !state.isGameOver && (
        <Header
          cityName={engine?.mapConfig.nameVi || 'Thành phố'}
          timeOfDayHours={state.timeOfDayHours}
          currentDayIndex={state.currentDayIndex}
          weekNumber={state.weekNumber}
          money={state.money}
          passengersDelivered={state.stats.totalPassengersDelivered}
          activeTrains={state.trains.length}
          totalTrains={state.trains.length + state.inventory.unassignedTrains}
          gameSpeed={state.gameSpeed}
          isRushHour={state.isRushHour}
          weather={state.weather}
          activeIncident={state.activeIncident}
          gameMode={state.gameMode}
          theme={theme}
          isMuted={isMuted}
          lang={lang}
          cityMaps={allCities}
          currentCityId={currentCityId}
          highScore={MetroEngine.getHighScore(currentCityId)}
          isSaved={true}
          trackStyle={trackStyle}
          hideStationIcons={hideStationIcons}
          hidePassengerCount={hidePassengerCount}
          hideStationUpgrades={hideStationUpgrades}
          disableIncidents={disableIncidents}
          onSetSpeed={(speed) => engine?.setGameSpeed(speed)}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          onToggleMute={() => setIsMuted(m => !m)}
          onToggleLang={() => setLang(l => l === 'vi' ? 'en' : 'vi')}
          onToggleGameMode={() => {
            if (engine) {
              const nextMode = engine.state.gameMode === 'standard' ? 'zen' : 'standard';
              engine.setGameMode(nextMode);
            }
          }}
          onToggleTrackStyle={handleToggleTrackStyle}
          onToggleCreativeToolbar={() => setIsCreativeToolbarOpen(prev => !prev)}
          onToggleHideStationIcons={handleToggleHideStationIcons}
          onToggleHidePassengerCount={handleToggleHidePassengerCount}
          onToggleHideStationUpgrades={handleToggleHideStationUpgrades}
          onToggleDisableIncidents={handleToggleDisableIncidents}
          onUnlockAllStations={() => {
            if (engine) {
              engine.unlockAllStations();
              syncSnapshot();
            }
          }}
          onResetGame={handleResetGame}
          onOpenTutorial={() => setIsTutorialOpen(true)}
          onOpenShop={() => setIsShopModalOpen(true)}
          currentUser={currentUser}
          onOpenStartMenu={() => setIsStartMenuOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenCityManager={() => setIsCityManagerOpen(true)}
          onOpenInspector={() => setIsInspectorModalOpen(true)}
          onDismissIncident={handleDismissIncident}
          citizenSatisfaction={state.stats.citizenSatisfaction}
          activeSurgeEvent={state.activeSurgeEvent}
          onOpenDonation={() => setIsDonationModalOpen(true)}
          onOpenMassUpgradeModal={() => setIsMassUpgradeModalOpen(true)}
          onSelectCity={(cId) => {
            if (engineRef.current) {
              MetroEngine.saveToStorage(engineRef.current);
            }
            setCurrentCityId(cId);
            initEngine(cId);
          }}
        />
      )}

      {/* Main Workspace Layout: Left Scrollable Route Manager Sidebar + Canvas */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        {/* Left Scrollable Route Manager Sidebar (Always rendered with sleek collapse/expand rail) */}
        {state && !state.isGameOver && (
          <RouteManagerSidebar
            lines={state.lines}
            trains={state.trains}
            stations={state.stations}
            inventory={state.inventory}
            stats={state.stats}
            currentDayIndex={state.currentDayIndex}
            selectedLineId={selectedLineId}
            theme={theme}
            lang={lang}
            isCollapsed={isSidebarCollapsed}
            isPlacingStation={isPlacingStation}
            onToggleCollapse={() => setIsSidebarCollapsed(v => !v)}
            onSelectLine={(lId) => setSelectedLineId(lId)}
            onCreateNewLine={handleCreateNewLine}
            onCreateNewBusLine={handleCreateNewBusLine}
            onBuyBus={handleBuyBus}
            onBuyBusLineSlot={handleBuyBusLineSlot}
            money={state.money}
            onDeleteLine={handleRequestDeleteLine}
            onRequestDeleteLine={handleRequestDeleteLine}
            onChangeLineType={(lId, type) => {
              engine?.updateLineType(lId, type);
              syncSnapshot();
            }}
            onDeployTrain={(lId) => {
              engine?.deployTrainToLine(lId);
              syncSnapshot();
            }}
            onRemoveTrain={(lId) => {
              engine?.removeTrainFromLine(lId);
              syncSnapshot();
            }}
            onAddCarriage={(lId) => {
              engine?.addCarriageToLine(lId);
              syncSnapshot();
            }}
            onRemoveCarriage={(lId) => {
              engine?.removeCarriageFromLine(lId);
              syncSnapshot();
            }}
            onRemoveStationFromLine={(lineId, stationId) => {
              engine?.removeStationFromLine(lineId, stationId);
              syncSnapshot();
            }}
            onEditLineColor={(line, idx) => setEditingColorLine({ line, index: idx })}
            onStartPlacingStation={() => setIsPlacingStation(prev => !prev)}
            onClearAllStations={handleClearAllStations}
            onOpenShop={() => setIsShopModalOpen(true)}
            onOpenInspector={() => setIsInspectorModalOpen(true)}
            onOpenLineSettings={(line) => setEditingSettingsLine(line)}
            onToggleLineDepot={handleToggleLineDepot}
            onRenameLine={handleRenameLine}
            onRebalanceHeadway={(lId) => {
              engine?.rebalanceLineHeadway(lId);
              syncSnapshot();
            }}
            onBuyRailGrinder={() => {
              engine?.buyRailGrinderService();
              syncSnapshot();
            }}
            railGrinderBoostUntil={state.stats.railGrinderBoostUntil}
          />
        )}

        {/* Main Game Canvas Viewport */}
        <main className="flex-1 h-full relative overflow-hidden bg-transparent">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full h-full block touch-none select-none ${
              isPanningRef.current
                ? 'cursor-grabbing'
                : isShiftDown
                ? 'cursor-grab'
                : isPlacingStation
                ? 'cursor-cell'
                : 'cursor-crosshair'
            }`}
          />

          {/* Top-Left Map Cards Dock: Passenger Analytics, City Weather (Collapsible vertically) */}
          {state && !state.isGameOver && (
            <TopLeftMapCards
              stations={state.stations}
              trains={state.trains}
              lines={state.lines}
              stats={state.stats}
              currentDayIndex={state.currentDayIndex}
              weather={state.weather}
              activeIncident={state.activeIncident}
              activeSurgeEvent={state.activeSurgeEvent}
              isRushHour={state.isRushHour}
              money={state.money}
              theme={theme}
              lang={lang}
              onDismissIncident={handleDismissIncident}
              onRepairTrain={handleRepairTrain}
              onDeploySecurity={handleDeploySecurity}
            />
          )}

          {/* Floating Camera / Zoom HUD & Controls */}
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 flex items-center gap-2 z-20 pointer-events-auto">
            {/* Shift Pan Indicator (Only shown when Shift is actually held down) */}
            {isShiftDown && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold backdrop-blur-md animate-in fade-in">
                <Move className="w-3.5 h-3.5" />
                <span>{lang === 'vi' ? 'Kéo để di chuyển' : 'Drag to pan'}</span>
              </div>
            )}

            {/* Zoom Controls (Sleek Frosted Glass Pill) */}
            <div className={`flex items-center rounded-xl p-1 border shadow-lg backdrop-blur-xl gap-0.5 ${
              theme === 'dark' ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-white/90 border-slate-200 text-slate-800'
            }`}>
              <button
                onClick={handleZoomOut}
                title={lang === 'vi' ? 'Thu nhỏ bản đồ' : 'Zoom Out'}
                className={`p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleResetCamera}
                title={lang === 'vi' ? 'Đặt lại 100% (Giữ Shift + cuộn để zoom)' : 'Reset 100%'}
                className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold transition cursor-pointer ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-emerald-400' : 'hover:bg-slate-100 text-emerald-600'
                }`}
              >
                {zoomPercent}%
              </button>

              <button
                onClick={handleZoomIn}
                title={lang === 'vi' ? 'Phóng to bản đồ' : 'Zoom In'}
                className={`p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600'
                }`}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <div className={`h-3 w-px mx-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />

              <button
                onClick={handleResetCamera}
                title={lang === 'vi' ? 'Căn giữa bản đồ' : 'Fit Map'}
                className={`p-1.5 rounded-lg transition cursor-pointer active:scale-95 ${
                  theme === 'dark' ? 'hover:bg-slate-800 text-cyan-400 hover:text-cyan-300' : 'hover:bg-slate-100 text-cyan-600'
                }`}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Station Builder Floating Mode Bar */}
          {isPlacingStation && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-2xl bg-neutral-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-md z-30 text-white animate-in slide-in-from-top-2 w-[94vw] max-w-lg">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold text-xs text-emerald-400">
                  {lang === 'vi' ? 'Đặt Ga' : 'Place Station'}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  $1,500
                </span>
              </div>

              {/* Shape Selection */}
              <div className="flex items-center gap-1">
                {(['circle', 'triangle', 'square', 'diamond', 'star', 'cross', 'pentagon'] as StationShape[]).map((shape) => {
                  const glyphs: Record<StationShape, string> = {
                    circle: '●',
                    triangle: '▲',
                    square: '■',
                    diamond: '◆',
                    star: '★',
                    cross: '✚',
                    pentagon: '⬟'
                  };
                  const isSel = placingShape === shape;
                  return (
                    <button
                      key={shape}
                      type="button"
                      onClick={() => setPlacingShape(shape)}
                      title={`Hình ${shape}`}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-sm flex items-center justify-center font-bold transition cursor-pointer active:scale-95 touch-manipulation ${
                        isSel
                          ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300 shadow-md scale-105'
                          : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                      }`}
                    >
                      {glyphs[shape]}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setIsPlacingStation(false)}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition cursor-pointer font-bold border border-neutral-700 active:scale-95"
              >
                ✕ {lang === 'vi' ? 'Xong' : 'Done'}
              </button>
            </div>
          )}

          {/* Onboarding Drag Guide Hint (Modern & Non-intrusive) */}
          {state && state.lines.length === 0 && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-3.5 py-1.5 rounded-full bg-slate-950/85 text-slate-200 border border-slate-800 shadow-xl backdrop-blur-xl text-xs font-medium flex items-center gap-2 pointer-events-none max-w-[90vw] text-center justify-center animate-in fade-in duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {lang === 'vi'
                  ? 'Kéo chuột giữa các ga để xây tuyến • Kéo chỗ trống để di chuyển bản đồ'
                  : 'Drag between stations to connect • Drag space to pan'}
              </span>
            </div>
          )}

          {/* Floating Train Hover Info Box beside Cursor */}
          {hoveredTrain && !dragStateRef.current.isDragging && (() => {
            const line = state?.lines.find(l => l.id === hoveredTrain.lineId);
            const train = state?.trains.find(t => t.id === hoveredTrain.trainId);
            if (!line || !train) return null;

            const lineType = line.type || 'metro';
            const typeConfig = {
              metro: {
                label: 'Metro',
                speedLabel: '1.0x',
                badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                icon: '🚇'
              },
              intercity: {
                label: 'Intercity',
                speedLabel: '+20%',
                badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                icon: '🚆'
              },
              high_speed: {
                label: 'High Speed',
                speedLabel: '+80%',
                badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
                icon: '🚅'
              },
              double_decker: {
                label: 'Tàu 2 Tầng',
                speedLabel: '+20% (2x Chỗ)',
                badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
                icon: '🏢'
              },
              standard_bus: {
                label: 'Buýt Thường',
                speedLabel: '0.80x (6 Chỗ)',
                badgeBg: 'bg-amber-600/20 text-amber-300 border-amber-500/40',
                icon: '🚌'
              },
              feeder_bus: {
                label: 'Buýt BRT',
                speedLabel: '0.90x (4 Chỗ)',
                badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                icon: '⚡'
              }
            }[lineType] || {
              label: 'Metro',
              speedLabel: '1.0x',
              badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
              icon: '🚇'
            };

            return (
              <div
                style={{
                  left: Math.min(window.innerWidth - 240, hoveredTrain.clientX + 16),
                  top: Math.max(16, hoveredTrain.clientY - 26)
                }}
                className="fixed pointer-events-none z-50 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-white text-xs select-none animate-in fade-in duration-75"
              >
                <div
                  className="w-4 h-4 rounded-full shadow-xs shrink-0 ring-2 ring-white/30"
                  style={{ backgroundColor: line.color }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs leading-tight">{line.name}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] border flex items-center gap-0.5 ${typeConfig.badgeBg}`}>
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                      <span className="font-mono text-[8px] opacity-80">({typeConfig.speedLabel})</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    {lang === 'vi' ? 'Khách:' : 'Pax:'} {train.passengers.length}/{train.capacity}
                    {train.carriagesCount > 0 && ` (${1 + train.carriagesCount} ${lang === 'vi' ? 'toa' : 'cars'})`}
                  </span>
                </div>
              </div>
            );
          })()}
        </main>
      </div>

      {/* Station Detail Modal (Instant Upgrade & Inspect & Remove from Line & Delete Station) */}
      {inspectingStation && (
        <StationDetailModal
          station={state?.stations.find(s => s.id === inspectingStation.id) || inspectingStation}
          allStations={state?.stations || []}
          lines={state?.lines || []}
          hasInterchangeToken={(state?.inventory.interchangeTokens || 0) > 0}
          theme={theme}
          lang={lang}
          onClose={() => setInspectingStation(null)}
          onUpgradeToInterchange={(sId) => {
            engine?.upgradeStationToInterchange(sId);
            const updated = engine?.state.stations.find(s => s.id === sId);
            if (updated) setInspectingStation({ ...updated });
            syncSnapshot();
          }}
          onRemoveStationFromLine={(lineId, stationId) => {
            engine?.removeStationFromLine(lineId, stationId);
            const updated = engine?.state.stations.find(s => s.id === stationId);
            if (updated) setInspectingStation({ ...updated });
            syncSnapshot();
          }}
          onChangeShape={(stationId, shape) => {
            engine?.changeStationShape(stationId, shape);
            const updated = engine?.state.stations.find(s => s.id === stationId);
            if (updated) setInspectingStation({ ...updated });
            syncSnapshot();
          }}
          onDeleteStation={(stationId) => {
            handleDeleteStation(stationId);
            syncSnapshot();
          }}
          onRequestDeleteStation={(stationId, stationName) => {
            handleRequestDeleteStation(stationId, stationName);
            setInspectingStation(null);
          }}
          onRequestRevertInterchange={handleRequestRevertInterchange}
          onToggleCloseStation={(stationId) => {
            engine?.toggleCloseStation(stationId);
            const updated = engine?.state.stations.find(s => s.id === stationId);
            if (updated) setInspectingStation({ ...updated });
            syncSnapshot();
          }}
          onUpgradeStationFeature={(stationId, feature) => {
            engine?.upgradeStationFeature(stationId, feature);
            const updated = engine?.state.stations.find(s => s.id === stationId);
            if (updated) setInspectingStation({ ...updated });
            syncSnapshot();
          }}
          onOpenMassUpgradeModal={() => setIsMassUpgradeModalOpen(true)}
          userMoney={state?.money || 0}
        />
      )}

      {/* Line Color Customizer Modal */}
      {editingColorLine && (
        <LineColorModal
          line={editingColorLine.line}
          lineIndex={editingColorLine.index}
          theme={theme}
          lang={lang}
          onClose={() => setEditingColorLine(null)}
          onSaveColor={handleSaveLineColor}
        />
      )}

      {/* Line Settings Modal (Depot & Headway) */}
      {editingSettingsLine && (
        <LineSettingsModal
          line={editingSettingsLine}
          stations={state?.stations || []}
          trains={state?.trains || []}
          theme={theme}
          lang={lang}
          onClose={() => setEditingSettingsLine(null)}
          onSave={handleSaveLineSettings}
          onRenameLine={handleRenameLine}
          onToggleCBTC={handleToggleCBTC}
          onUpgradeStationSmartIC={handleUpgradeStationSmartIC}
        />
      )}

      {/* Weekly Milestone Grant Modal */}
      {isWeeklyModalOpen && state && (
        <WeeklyModal
          weekNumber={state.weekNumber}
          theme={theme}
          lang={lang}
          onSelectReward={(idx) => {
            if (engine) {
              if (idx === 0) {
                engine.state.inventory.availableLines++;
                engine.state.inventory.unassignedTrains++;
              } else if (idx === 1) {
                engine.state.inventory.unassignedTrains += 2;
                engine.state.money += 500;
              } else if (idx === 2) {
                engine.state.inventory.unassignedTrains++;
                engine.state.inventory.carriages++;
                engine.state.money += 400;
              }
              engine.state.pendingWeeklyReward = false;
            }
            setIsWeeklyModalOpen(false);
          }}
        />
      )}

      {/* Equipment Shop Modal */}
      {isShopModalOpen && state && (
        <ShopModal
          money={state.money}
          inventory={state.inventory}
          activeLinesCount={state.lines.filter(l => l.type !== 'feeder_bus' && l.type !== 'double_decker').length}
          totalTrainsCount={state.trains.length + state.inventory.unassignedTrains}
          theme={theme}
          lang={lang}
          onClose={() => setIsShopModalOpen(false)}
          onBuyTrain={() => { engine?.buyTrain(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          onBuyBus={() => { engine?.buyBus(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          onBuyBusLineSlot={handleBuyBusLineSlot}
          onBuyCarriage={() => { engine?.buyCarriage(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          onBuyLine={() => { engine?.buyLine(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          onBuyInterchange={() => { engine?.buyInterchangeUpgrade(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          onBuyTunnel={() => { engine?.buyTunnel(); syncSnapshot(); if (engine) MetroEngine.saveToStorage(engine); }}
          hasTransitAdContract={state.stats?.hasTransitAdContract}
          transitAdDaysRemaining={state.stats?.transitAdDaysRemaining}
          onBuyTransitAdContract={handleBuyTransitAdContract}
          onBuyRailGrinder={() => {
            engine?.buyRailGrinderService();
            syncSnapshot();
            if (engine) MetroEngine.saveToStorage(engine);
          }}
          railGrinderBoostUntil={state.stats?.railGrinderBoostUntil}
        />
      )}

      {/* Charity Donation Modal */}
      {isDonationModalOpen && state && (
        <DonationModal
          isOpen={isDonationModalOpen}
          money={state.money}
          totalDonated={state.stats.totalDonated || 0}
          theme={theme}
          lang={lang}
          onClose={() => setIsDonationModalOpen(false)}
          onDonate={(amount) => {
            if (engine) {
              engine.donateMoney(amount);
              syncSnapshot();
              MetroEngine.saveToStorage(engine);
            }
          }}
        />
      )}

      {/* Mass Station Network Upgrade Modal */}
      {isMassUpgradeModalOpen && state && (
        <MassStationUpgradeModal
          isOpen={isMassUpgradeModalOpen}
          stations={state.stations}
          money={state.money}
          theme={theme}
          lang={lang}
          onClose={() => setIsMassUpgradeModalOpen(false)}
          onUpgradeAll={handleUpgradeAllStations}
        />
      )}

      {/* Game Over Screen (Hinh 6 & Screenshot 6) */}
      {state?.isGameOver && (
        <GameOverModal
          reason={state.gameOverReason}
          stats={state.stats}
          theme={theme}
          lang={lang}
          onRestart={() => {
            MetroEngine.clearSave(currentCityId);
            handleResetCamera();
            initEngine(currentCityId, 'standard', true);
          }}
          onSwitchToEndless={() => {
            if (engine) {
              engine.setGameMode('zen');
              engine.state.isGameOver = false;
              engine.state.gameOverReason = null;
              engine.state.gameOverStationId = null;
              engine.state.stations.forEach(s => {
                s.overcrowdedTimer = 0;
              });
              handleResetCamera();
              syncSnapshot();
            }
          }}
          onSwitchToCreative={() => {
            if (engine) {
              engine.setGameMode('zen');
              engine.isUnlimitedMode = true;
              engine.state.inventory.availableLines = 15;
              engine.state.money += 5000000;
              engine.state.isGameOver = false;
              engine.state.gameOverReason = null;
              engine.state.gameOverStationId = null;
              engine.state.stations.forEach(s => {
                s.overcrowdedTimer = 0;
              });
              setIsCreativeToolbarOpen(true);
              engine.addFloatingText(740, 470, '✨ Đã bật Sáng tạo: +$5.000.000 & 15 tuyến Metro!', '#10B981');
              handleResetCamera();
              syncSnapshot();
            }
          }}
          onOpenMenu={() => {
            setIsStartMenuOpen(true);
          }}
        />
      )}

      {/* How to Play Tutorial Modal */}
      {isTutorialOpen && (
        <TutorialModal
          theme={theme}
          lang={lang}
          onClose={() => setIsTutorialOpen(false)}
        />
      )}

      {/* Metro Line Inspector Modal (Select Line & Min 5 Stations) */}
      {isInspectorModalOpen && state && (
        <InspectorModal
          isOpen={isInspectorModalOpen}
          onClose={() => setIsInspectorModalOpen(false)}
          lines={state.lines}
          stations={state.stations}
          inspectorState={state.inspectorState || engineRef.current?.state.inspectorState || {
            status: 'idle',
            currentStationId: null,
            currentTrainId: null,
            targetLineId: null,
            visitedStationIds: [],
            timeRemaining: 90,
            cooldownRemaining: 0,
            targetCount: 5,
            rewardAmount: 4000
          }}
          money={state.money}
          theme={theme}
          lang={lang}
          onRequestDeploy={handleRequestDeployInspector}
          onDeployOnLine={(lineId, plannedStationIds) => {
            if (engineRef.current) {
              const res = engineRef.current.deployInspectorOnLine(lineId, plannedStationIds);
              if (res.success) {
                syncSnapshot();
              }
            }
          }}
          onCancelInspector={() => {
            if (engineRef.current) {
              engineRef.current.cancelInspector();
              syncSnapshot();
            }
          }}
        />
      )}

      {/* Metro Line Inspector Real-time Active HUD */}
      {state && state.inspectorState && state.inspectorState.status !== 'idle' && (
        <InspectorHUD
          inspectorState={state.inspectorState}
          stations={state.stations}
          trains={state.trains}
          lines={state.lines}
          theme={theme}
          lang={lang}
          onStartSelecting={() => {
            if (engineRef.current) {
              engineRef.current.startSelectingInspectorStation();
              syncSnapshot();
            }
          }}
          onAlightAtStation={() => {
            if (engineRef.current) {
              engineRef.current.alightInspectorAtStation();
              syncSnapshot();
            }
          }}
          onCancel={() => {
            if (engineRef.current) {
              engineRef.current.cancelInspector();
              syncSnapshot();
            }
          }}
        />
      )}

      {/* Campaign Real-time Objectives HUD */}
      {state?.gameMode === 'campaign' && state.campaignState && (
        <CampaignHUD
          campaignState={state.campaignState}
          money={state.money}
          theme={theme}
          lang={lang}
          onRestartScenario={handleRestartCurrentScenario}
          onExitCampaign={handleExitCampaign}
        />
      )}

      {/* Campaign Victory Modal with 1-3 Stars */}
      {state?.campaignState?.isWon && (
        <VictoryModal
          campaignState={state.campaignState}
          stats={state.stats}
          theme={theme}
          lang={lang}
          onNextScenario={handleNextScenario}
          onRestartScenario={handleRestartCurrentScenario}
          onExitToMenu={handleExitCampaign}
        />
      )}

      {/* Welcome Start Menu Modal (Always appears on web reload / open) */}
      <StartMenuModal
        isOpen={isStartMenuOpen}
        onPlay={() => setIsStartMenuOpen(false)}
        onSelectScenario={handleStartScenario}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenTutorial={() => setIsTutorialOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
        cityMaps={allCities}
        currentCityId={currentCityId}
        onSelectCity={(cId) => {
          if (engineRef.current) {
            MetroEngine.saveToStorage(engineRef.current);
          }
          setCurrentCityId(cId);
          initEngine(cId);
        }}
        onOpenCityManager={() => setIsCityManagerOpen(true)}
        highScore={MetroEngine.getHighScore(currentCityId)}
        lang={lang}
        theme={theme}
        isMuted={isMuted}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onToggleMute={() => setIsMuted(m => !m)}
        onToggleLang={() => setLang(l => l === 'vi' ? 'en' : 'vi')}
      />

      {/* City Map Manager Modal (Create, Clone & Delete Custom Cities) */}
      <CityManagerModal
        isOpen={isCityManagerOpen}
        onClose={() => setIsCityManagerOpen(false)}
        cityMaps={allCities}
        currentCityId={currentCityId}
        onSelectCity={(cId) => {
          if (engineRef.current) {
            MetroEngine.saveToStorage(engineRef.current);
          }
          setCurrentCityId(cId);
          initEngine(cId);
        }}
        onRefreshCities={refreshCities}
        lang={lang}
        theme={theme}
      />

      {/* User Login, Register & Account Management Modal (Server Storage) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        currentUser={currentUser}
        onLogout={handleLogout}
        lang={lang}
      />

      {/* Creative Sandbox, Terrain & Weather Toolbar */}
      <CreativeToolbar
        isOpen={isCreativeToolbarOpen}
        theme={theme}
        lang={lang}
        isUnlimitedMode={engine?.isUnlimitedMode || false}
        activeEditorTool="none"
        selectedShape={placingShape}
        stationName={customStationName}
        inProgressPointsCount={0}
        linesCount={state?.lines.length || 0}
        availableLines={state?.inventory.availableLines || 0}
        currentWeather={state?.weather.current || 'sunny'}
        onClose={() => setIsCreativeToolbarOpen(false)}
        onToggleUnlimitedMode={() => {
          if (engine) {
            engine.toggleUnlimitedMode();
            syncSnapshot();
          }
        }}
        onSelectEditorTool={(tool) => {
          if (tool === 'add_station') {
            setIsPlacingStation(true);
            setIsCreativeToolbarOpen(false);
          }
        }}
        onSelectShape={(shape) => setPlacingShape(shape)}
        onChangeStationName={(name) => setCustomStationName(name)}
        onRandomizeStationName={() => {}}
        onSpawnRandomStation={() => {
          if (engine) {
            engine.spawnStation();
            syncSnapshot();
          }
        }}
        onFinishRiverDrawing={() => {}}
        onClearAllRivers={() => {}}
        onResetRivers={() => {}}
        onAddQuickLine={() => {
          if (engine) {
            engine.state.inventory.availableLines = Math.min(15, engine.state.inventory.availableLines + 1);
            syncSnapshot();
          }
        }}
        onAddQuickTrain={() => {
          if (engine) {
            engine.state.inventory.unassignedTrains++;
            syncSnapshot();
          }
        }}
        onAddQuickCarriage={() => {
          if (engine) {
            engine.state.inventory.carriages++;
            syncSnapshot();
          }
        }}
        onSetWeather={(wType) => {
          if (engine) {
            engine.setWeather(wType);
            syncSnapshot();
          }
        }}
        onClearIncident={handleDismissIncident}
        currentTimeHours={state?.timeOfDayHours}
        timeOffsetHours={engine?.timeOffsetHours || 0}
        onAdjustTime={(delta) => {
          if (engine) {
            engine.adjustTimeOfDay(delta);
            syncSnapshot();
          }
        }}
        onSetTimeOffset={(offset) => {
          if (engine) {
            engine.setTimeOffset(offset);
            syncSnapshot();
          }
        }}
        onResetTimeOffset={() => {
          if (engine) {
            engine.resetTimeOffset();
            syncSnapshot();
          }
        }}
        onUnlockAllStations={handleUnlockAllStations}
        onRestoreDefaultStations={handleRestoreDefaultStations}
      />

      {/* Urban Transit Bank Modal */}
      <UrbanBankModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        currentMoney={state?.money || 0}
        activeLoans={state?.activeLoans || []}
        onTakeLoan={handleTakeLoan}
        onRepayLoan={handleRepayLoan}
        theme={theme}
        lang={lang}
      />

      {/* Daily Challenges & Achievements Modal */}
      <DailyChallengeModal
        isOpen={isChallengesModalOpen}
        onClose={() => setIsChallengesModalOpen(false)}
        challenges={state?.dailyChallenges || []}
        onClaimReward={handleClaimChallengeReward}
      />

      {/* Reusable Center Confirmation Modal (Supports Red Delete / Yellow Inspector / Gray Cancel buttons) */}
      {confirmDialog && (
        <ConfirmModal
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          confirmVariant={confirmDialog.confirmVariant}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
          lang={lang}
        />
      )}
    </div>
  );
}
