import { CityMapConfig } from '../types/game';
import { HANOI_DETAILED_MAP } from './hanoiDetailedMap';

export const CITY_MAPS: CityMapConfig[] = [
  HANOI_DETAILED_MAP,
  {
    id: 'saigon',
    nameVi: 'TP. Hồ Chí Minh',
    nameEn: 'Ho Chi Minh City',
    descriptionVi: 'Mạng lưới quanh Bán đảo Thủ Thiêm và uốn lượn theo dòng Sông Sài Gòn sôi động.',
    descriptionEn: 'Network embracing Thu Thiem Peninsula and the dynamic loops of Saigon River.',
    riverPolygons: [
      // Sông Sài Gòn generous sweeping loops
      {
        points: [
          { x: 590, y: 0 },
          { x: 650, y: 180 },
          { x: 500, y: 310 },
          { x: 630, y: 490 },
          { x: 910, y: 550 },
          { x: 1010, y: 740 },
          { x: 870, y: 920 },
          { x: 680, y: 990 },
          { x: 710, y: 1200 },
          // other side
          { x: 810, y: 1200 },
          { x: 780, y: 1030 },
          { x: 970, y: 950 },
          { x: 1110, y: 740 },
          { x: 990, y: 480 },
          { x: 710, y: 420 },
          { x: 610, y: 290 },
          { x: 740, y: 170 },
          { x: 670, y: 0 },
        ]
      }
    ],
    // Initial stations with generous spacing
    initialStations: [
      { id: 'sg-1', shape: 'circle', x: 490, y: 650, name: 'Bến Thành' },
      { id: 'sg-2', shape: 'triangle', x: 710, y: 630, name: 'Ba Son' },
      { id: 'sg-3', shape: 'square', x: 960, y: 680, name: 'Thủ Thiêm' },
    ],
    stationPool: [
      { shape: 'diamond', x: 1140, y: 510, name: 'Thảo Điền' },
      { shape: 'circle', x: 360, y: 550, name: 'Phú Nhuận' },
      { shape: 'square', x: 280, y: 720, name: 'Quận 10' },
      { shape: 'triangle', x: 480, y: 850, name: 'Quận 4' },
      { shape: 'star', x: 810, y: 810, name: 'Cầu Ba Son' },
      { shape: 'circle', x: 1170, y: 860, name: 'An Khánh' },
      { shape: 'cross', x: 220, y: 450, name: 'Tân Bình' },
      { shape: 'triangle', x: 430, y: 400, name: 'Bình Thạnh' },
      { shape: 'diamond', x: 640, y: 1060, name: 'Quận 7' },
      { shape: 'square', x: 1280, y: 650, name: 'An Phú' },
      { shape: 'pentagon', x: 940, y: 340, name: 'Bình An' },
      { shape: 'circle', x: 190, y: 650, name: 'Quận 3' },
      { shape: 'star', x: 590, y: 890, name: 'Khánh Hội' },
      { shape: 'star', x: 210, y: 360, name: 'Sân Bay Tân Sơn Nhất', specialHubType: 'airport' },
      { shape: 'pentagon', x: 1350, y: 920, name: 'Cảng Cát Lái', specialHubType: 'seaport' },
      { shape: 'circle', x: 820, y: 1120, name: 'Phú Mỹ Hưng' },
    ]
  },
  {
    id: 'tokyo',
    nameVi: 'Tokyo',
    nameEn: 'Tokyo',
    descriptionVi: 'Đô thị đông đúc nhất thế giới. Dòng khách khổng lồ qua Shinjuku, Shibuya và Vịnh Tokyo.',
    descriptionEn: 'The world’s busiest metropolis. Huge commuter tides through Shinjuku, Shibuya, and Tokyo Bay.',
    riverPolygons: [
      // Tokyo Bay water body
      {
        isWaterBody: true,
        points: [
          { x: 890, y: 800 },
          { x: 1050, y: 680 },
          { x: 1310, y: 710 },
          { x: 1540, y: 800 },
          { x: 1540, y: 1200 },
          { x: 740, y: 1200 },
          { x: 770, y: 990 },
        ]
      },
      // Sumida River
      {
        points: [
          { x: 960, y: 0 },
          { x: 930, y: 230 },
          { x: 990, y: 430 },
          { x: 1070, y: 650 },
          { x: 1130, y: 630 },
          { x: 1050, y: 410 },
          { x: 1010, y: 220 },
          { x: 1020, y: 0 },
        ]
      }
    ],
    initialStations: [
      { id: 'ty-1', shape: 'circle', x: 400, y: 540, name: 'Shinjuku' },
      { id: 'ty-2', shape: 'triangle', x: 430, y: 730, name: 'Shibuya' },
      { id: 'ty-3', shape: 'square', x: 800, y: 560, name: 'Tokyo Central' },
    ],
    stationPool: [
      { shape: 'circle', x: 710, y: 710, name: 'Ginza' },
      { shape: 'diamond', x: 820, y: 370, name: 'Akihabara' },
      { shape: 'star', x: 790, y: 230, name: 'Ueno' },
      { shape: 'triangle', x: 590, y: 830, name: 'Roppongi' },
      { shape: 'square', x: 1080, y: 320, name: 'Asakusa' },
      { shape: 'circle', x: 590, y: 420, name: 'Ikebukuro' },
      { shape: 'cross', x: 1020, y: 860, name: 'Odaiba' },
      { shape: 'pentagon', x: 660, y: 990, name: 'Shinagawa' },
      { shape: 'diamond', x: 1160, y: 490, name: 'Ryogoku' },
      { shape: 'circle', x: 910, y: 740, name: 'Tsukiji' },
      { shape: 'triangle', x: 1250, y: 800, name: 'Toyosu' },
      { shape: 'square', x: 310, y: 340, name: 'Nakano' },
      { shape: 'star', x: 1200, y: 250, name: 'Oshiage (Skytree)' },
    ]
  }
];

export const LINE_PALETTE = [
  { color: '#EF4444', darkColor: '#B91C1C', textColor: '#FFFFFF', name: 'Tuyến 01 - Đỏ / Red' },
  { color: '#3B82F6', darkColor: '#1D4ED8', textColor: '#FFFFFF', name: 'Tuyến 02 - Lam / Blue' },
  { color: '#10B981', darkColor: '#047857', textColor: '#FFFFFF', name: 'Tuyến 03 - Lục / Green' },
  { color: '#F59E0B', darkColor: '#B45309', textColor: '#FFFFFF', name: 'Tuyến 04 - Vàng Cam / Amber' },
  { color: '#8B5CF6', darkColor: '#6D28D9', textColor: '#FFFFFF', name: 'Tuyến 05 - Tím / Purple' },
  { color: '#EC4899', darkColor: '#BE185D', textColor: '#FFFFFF', name: 'Tuyến 06 - Hồng / Pink' },
  { color: '#06B6D4', darkColor: '#0E7490', textColor: '#FFFFFF', name: 'Tuyến 07 - Lam Lơ / Cyan' },
  { color: '#84CC16', darkColor: '#4D7C0F', textColor: '#FFFFFF', name: 'Tuyến 08 - Xanh Chanh / Lime' },
  { color: '#6366F1', darkColor: '#4338CA', textColor: '#FFFFFF', name: 'Tuyến 09 - Chàm / Indigo' },
  { color: '#F97316', darkColor: '#C2410C', textColor: '#FFFFFF', name: 'Tuyến 10 - Cam San Hô / Coral' },
  { color: '#14B8A6', darkColor: '#0F766E', textColor: '#FFFFFF', name: 'Tuyến 11 - Ngọc Bích / Teal' },
  { color: '#D946EF', darkColor: '#A21CAF', textColor: '#FFFFFF', name: 'Tuyến 12 - Tía Hồng / Fuchsia' },
  { color: '#E11D48', darkColor: '#9F1239', textColor: '#FFFFFF', name: 'Tuyến 13 - Hồng Ngọc / Ruby' },
  { color: '#0EA5E9', darkColor: '#0369A1', textColor: '#FFFFFF', name: 'Tuyến 14 - Da Trời / Sky' },
  { color: '#D97706', darkColor: '#92400E', textColor: '#FFFFFF', name: 'Tuyến 15 - Hoàng Kim / Bronze' },
];

export const BUS_PALETTE = [
  { color: '#F59E0B', darkColor: '#B45309', textColor: '#FFFFFF', name: 'Buýt 01 - Vàng Nghệ / Amber' },
  { color: '#06B6D4', darkColor: '#0E7490', textColor: '#FFFFFF', name: 'Buýt 02 - Lục Lam / Teal Cyan' },
  { color: '#F97316', darkColor: '#C2410C', textColor: '#FFFFFF', name: 'Buýt 03 - Cam Đậm / Tangerine' },
  { color: '#84CC16', darkColor: '#4D7C0F', textColor: '#FFFFFF', name: 'Buýt 04 - Xanh Mạ / Lime' },
  { color: '#EC4899', darkColor: '#BE185D', textColor: '#FFFFFF', name: 'Buýt 05 - Hồng Sen / Rose Pink' },
  { color: '#6366F1', darkColor: '#4338CA', textColor: '#FFFFFF', name: 'Buýt 06 - Chàm Sâu / Indigo' },
  { color: '#14B8A6', darkColor: '#0F766E', textColor: '#FFFFFF', name: 'Buýt 07 - Ngọc Bích / Jade' },
  { color: '#A855F7', darkColor: '#7E22CE', textColor: '#FFFFFF', name: 'Buýt 08 - Tím Oải Hương / Violet' },
];
