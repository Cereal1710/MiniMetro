import { CityMapConfig, StationData, RiverPolygon, StationShape } from '../types/game';
import { CITY_MAPS } from './maps';

export const CUSTOM_CITIES_STORAGE_KEY = 'mini_metro_custom_cities';

export function getCustomCities(): CityMapConfig[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(CUSTOM_CITIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(c => ({ ...c, isCustom: true }));
  } catch (e) {
    console.warn('Failed to parse custom cities from localStorage', e);
    return [];
  }
}

export function saveCustomCities(cities: CityMapConfig[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CUSTOM_CITIES_STORAGE_KEY, JSON.stringify(cities));
  } catch (e) {
    console.warn('Failed to save custom cities to localStorage', e);
  }
}

export function getAllCities(): CityMapConfig[] {
  const custom = getCustomCities();
  return [...CITY_MAPS, ...custom];
}

export interface CreateBlankCityOptions {
  nameVi: string;
  nameEn?: string;
  descriptionVi?: string;
  descriptionEn?: string;
  worldWidth?: number;
  worldHeight?: number;
  terrainStyle?: 'open_river' | 'coastal' | 'twin_river' | 'clean_canvas';
}

export function createBlankCity(options: CreateBlankCityOptions): CityMapConfig {
  const width = options.worldWidth || 2400;
  const height = options.worldHeight || 1700;
  const cx = width / 2;
  const cy = height / 2;

  // Generate river polygons based on terrain style
  let riverPolygons: RiverPolygon[] = [];
  const style = options.terrainStyle || 'open_river';

  if (style === 'open_river') {
    // Gentle sweeping river passing through the city center
    riverPolygons = [
      {
        name: 'Sông Chính',
        points: [
          { x: cx - 50, y: 0 },
          { x: cx + 120, y: height * 0.3 },
          { x: cx - 80, y: height * 0.65 },
          { x: cx + 40, y: height },
          { x: cx + 160, y: height },
          { x: cx + 40, y: height * 0.65 },
          { x: cx + 240, y: height * 0.3 },
          { x: cx + 70, y: 0 }
        ]
      }
    ];
  } else if (style === 'coastal') {
    // Coastal sea water body along the east side
    riverPolygons = [
      {
        name: 'Biển / Vịnh',
        isWaterBody: true,
        points: [
          { x: width * 0.72, y: 0 },
          { x: width * 0.68, y: height * 0.35 },
          { x: width * 0.75, y: height * 0.7 },
          { x: width * 0.70, y: height },
          { x: width, y: height },
          { x: width, y: 0 }
        ]
      }
    ];
  } else if (style === 'twin_river') {
    // Two converging rivers
    riverPolygons = [
      {
        name: 'Nhánh Sông Bắc',
        points: [
          { x: cx - 400, y: 0 },
          { x: cx - 100, y: height * 0.45 },
          { x: cx + 300, y: height },
          { x: cx + 420, y: height },
          { x: cx + 20, y: height * 0.45 },
          { x: cx - 280, y: 0 }
        ]
      }
    ];
  }

  // 3 balanced initial stations
  const initialStations: StationData[] = [
    {
      id: `st-init-1`,
      shape: 'circle',
      x: Math.round(cx - 240),
      y: Math.round(cy - 60),
      name: `${options.nameVi} Trung Tâm`,
      districtVi: 'Quận Trung Tâm'
    },
    {
      id: `st-init-2`,
      shape: 'triangle',
      x: Math.round(cx + 60),
      y: Math.round(cy + 180),
      name: `Chợ ${options.nameVi}`,
      districtVi: 'Khu Thương Mại'
    },
    {
      id: `st-init-3`,
      shape: 'square',
      x: Math.round(cx + 320),
      y: Math.round(cy - 120),
      name: `Ga Đô Thị ${options.nameVi}`,
      districtVi: 'Khu Đô Thị Mới'
    }
  ];

  // Rich station pool with authentic Vietnamese transit hub names
  const shapes: StationShape[] = ['circle', 'triangle', 'square', 'diamond', 'star', 'cross', 'pentagon'];
  const poolNames = [
    'Bến Xe Miền Đông',
    'Sân Bay Quốc Tế',
    'Khu Công Nghệ Cao',
    'Đại Học Quốc Gia',
    'Bệnh Viện Trung Ương',
    'Cảng Đô Thị',
    'Công Viên Trung Tâm',
    'Quảng Trường Hòa Bình',
    'Khu Hành Chính Mới',
    'Trung Tâm Triển Lãm',
    'Khu Thể Thao Phức Hợp',
    'Làng Đại Học',
    'Khu Đô Thị Sinh Thái',
    'Chợ Đầu Mối',
    'Bến Phà Đô Thị',
    'Nhà Hát Thành Phố'
  ];

  const stationPool: StationData[] = poolNames.map((name, i) => {
    // Distribute around the map in an organic radial ring
    const angle = (i / poolNames.length) * Math.PI * 2 + (i % 2 === 0 ? 0.2 : -0.2);
    const radius = 380 + (i % 4) * 140;
    const px = Math.max(160, Math.min(width - 160, Math.round(cx + Math.cos(angle) * radius)));
    const py = Math.max(140, Math.min(height - 140, Math.round(cy + Math.sin(angle) * radius)));
    const shape = shapes[i % shapes.length];

    return {
      id: `pool-${i + 1}`,
      name,
      shape,
      x: px,
      y: py,
      districtVi: `Khu vực ${i + 1}`
    };
  });

  const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newCity: CityMapConfig = {
    id,
    nameVi: options.nameVi.trim(),
    nameEn: (options.nameEn || options.nameVi).trim(),
    descriptionVi: options.descriptionVi || `Bản đồ thành phố tùy chỉnh do người chơi tự thiết kế quy hoạch.`,
    descriptionEn: options.descriptionEn || `Custom player-designed city transit network map.`,
    worldWidth: width,
    worldHeight: height,
    initialStations,
    riverPolygons,
    stationPool,
    landmarks: [
      {
        id: `lm-center-${id}`,
        nameVi: `Tháp Trung Tâm ${options.nameVi}`,
        nameEn: `${options.nameEn || options.nameVi} Central Tower`,
        category: 'modern',
        x: Math.round(cx),
        y: Math.round(cy - 200),
        iconType: 'tower',
        descriptionVi: 'Biểu tượng trung tâm phát triển của đô thị.',
        descriptionEn: 'The iconic central modern skyscraper.'
      }
    ],
    isCustom: true,
    createdAt: Date.now()
  };

  const existing = getCustomCities();
  existing.push(newCity);
  saveCustomCities(existing);

  return newCity;
}

export function cloneCityFromPreset(
  presetId: string,
  newNameVi: string,
  newNameEn?: string,
  newDescriptionVi?: string
): CityMapConfig | null {
  const all = getAllCities();
  const source = all.find(c => c.id === presetId);
  if (!source) return null;

  const id = `custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const clonedCity: CityMapConfig = {
    ...JSON.parse(JSON.stringify(source)),
    id,
    nameVi: newNameVi.trim(),
    nameEn: (newNameEn || newNameVi).trim(),
    descriptionVi: newDescriptionVi || `Thành phố xây dựng dựa trên bản đồ ${source.nameVi}.`,
    descriptionEn: `Custom city created from the foundation of ${source.nameEn}.`,
    isCustom: true,
    createdAt: Date.now()
  };

  const existing = getCustomCities();
  existing.push(clonedCity);
  saveCustomCities(existing);

  return clonedCity;
}

export function deleteCustomCity(cityId: string): boolean {
  const existing = getCustomCities();
  const target = existing.find(c => c.id === cityId);
  if (!target) return false;

  const filtered = existing.filter(c => c.id !== cityId);
  saveCustomCities(filtered);

  // Clear save game & highscore from storage
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`mini_metro_save_${cityId}`);
      localStorage.removeItem(`mini_metro_highscore_${cityId}`);
    }
  } catch {}

  return true;
}
