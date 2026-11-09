import {
  Station,
  MetroLine,
  Train,
  FloatingText,
  RiverPolygon,
  StationShape,
  WeatherState,
  MapPark,
  MapBridge,
  MapRoad,
  MapLandmark,
  MapDistrictLabel,
  InspectorState,
  UrbanSurgeEvent
} from '../types/game';
import {
  distance,
  getPerpendicularOffset,
  lerpPoint,
  Point,
  TrackRoutingStyle,
  TrackPolyline,
  generateTrackSegmentPoints,
  buildTrackPolyline,
  samplePolylineAtDistance,
  sampleQuadraticBezier,
  isPointInWater
} from '../utils/geometry';

const textWidthCache = new Map<string, number>();

export interface LayerVisibilityOptions {
  rivers?: boolean;
  landmarks?: boolean;
  parks?: boolean;
  roads?: boolean;
  districts?: boolean;
  bridges?: boolean;
  realLinesRef?: boolean;
}

export interface RenderedTrainInfo {
  trainId: string;
  lineId: string;
  cars: { x: number; y: number }[];
}

let lastRenderedTrains: RenderedTrainInfo[] = [];

export function getTrainAtScreenPos(
  vp: { rect: { left: number; top: number }; scale: number; cameraZoom: number; offsetX: number; offsetY: number; panX: number; panY: number },
  clientX: number,
  clientY: number,
  hitTolerance = 22
): { trainId: string; lineId: string } | null {
  const totalScale = vp.scale * vp.cameraZoom;
  const totalOffsetX = vp.offsetX + vp.panX;
  const totalOffsetY = vp.offsetY + vp.panY;

  for (const t of lastRenderedTrains) {
    for (const car of t.cars) {
      const carScreenX = vp.rect.left + totalOffsetX + car.x * totalScale;
      const carScreenY = vp.rect.top + totalOffsetY + car.y * totalScale;
      if (Math.hypot(clientX - carScreenX, clientY - carScreenY) <= hitTolerance) {
        return { trainId: t.trainId, lineId: t.lineId };
      }
    }
  }
  return null;
}

export interface RenderOptions {
  theme: 'dark' | 'light';
  selectedLineId: string | null;
  dragState: {
    isDragging: boolean;
    fromStationId: string | null;
    toStationId?: string | null;
    currentPos: Point | null;
    targetStationId: string | null;
    lineId: string | null;
    isSegmentSplit?: boolean;
    segmentIndex?: number;
  } | null;
  hoveredStationId: string | null;
  selectedStationId?: string | null;
  showStationNames: boolean;
  trackStyle?: TrackRoutingStyle;
  hideStationIcons?: boolean;
  hidePassengerCount?: boolean;
  hideStationUpgrades?: boolean;
  hideInterchangeDisplay?: boolean;
  weather?: WeatherState;
  timeOfDayHours?: number;
  parks?: MapPark[];
  bridges?: MapBridge[];
  roads?: MapRoad[];
  landmarks?: MapLandmark[];
  districts?: MapDistrictLabel[];
  inspectorState?: InspectorState;
  activeSurgeEvent?: UrbanSurgeEvent | null;
  hasTransitAdContract?: boolean;
  isGameOver?: boolean;
  gameOverStationId?: string | null;
}

export function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: StationShape,
  x: number,
  y: number,
  size: number,
  fillColor: string,
  strokeColor?: string,
  lineWidth = 2.5
) {
  ctx.beginPath();
  switch (shape) {
    case 'circle': {
      ctx.arc(x, y, size, 0, Math.PI * 2);
      break;
    }
    case 'triangle': {
      ctx.moveTo(x, y - size * 1.25);
      ctx.lineTo(x + size * 1.1, y + size * 0.75);
      ctx.lineTo(x - size * 1.1, y + size * 0.75);
      ctx.closePath();
      break;
    }
    case 'square': {
      const r = size * 0.95;
      ctx.rect(x - r, y - r, r * 2, r * 2);
      break;
    }
    case 'diamond': {
      ctx.moveTo(x, y - size * 1.35);
      ctx.lineTo(x + size * 1.15, y);
      ctx.lineTo(x, y + size * 1.35);
      ctx.lineTo(x - size * 1.15, y);
      ctx.closePath();
      break;
    }
    case 'star': {
      const spikes = 5;
      const outerRadius = size * 1.35;
      const innerRadius = size * 0.62;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(x, y - outerRadius);
      for (let i = 0; i < spikes; i++) {
        let px = x + Math.cos(rot) * outerRadius;
        let py = y + Math.sin(rot) * outerRadius;
        ctx.lineTo(px, py);
        rot += step;

        px = x + Math.cos(rot) * innerRadius;
        py = y + Math.sin(rot) * innerRadius;
        ctx.lineTo(px, py);
        rot += step;
      }
      ctx.closePath();
      break;
    }
    case 'cross': {
      const s = size * 0.95;
      const t = size * 0.38;
      ctx.moveTo(x - t, y - s);
      ctx.lineTo(x + t, y - s);
      ctx.lineTo(x + t, y - t);
      ctx.lineTo(x + s, y - t);
      ctx.lineTo(x + s, y + t);
      ctx.lineTo(x + t, y + t);
      ctx.lineTo(x + t, y + s);
      ctx.lineTo(x - t, y + s);
      ctx.lineTo(x - t, y + t);
      ctx.lineTo(x - s, y + t);
      ctx.lineTo(x - s, y - t);
      ctx.lineTo(x - t, y - t);
      ctx.closePath();
      break;
    }
    case 'pentagon': {
      const sides = 5;
      const angle = (Math.PI * 2) / sides;
      ctx.moveTo(x + size * Math.cos(-Math.PI / 2), y + size * Math.sin(-Math.PI / 2));
      for (let i = 1; i <= sides; i++) {
        ctx.lineTo(
          x + size * Math.cos(-Math.PI / 2 + i * angle),
          y + size * Math.sin(-Math.PI / 2 + i * angle)
        );
      }
      ctx.closePath();
      break;
    }
  }

  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
}

export function renderScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rivers: RiverPolygon[],
  stations: Station[],
  lines: MetroLine[],
  trains: Train[],
  floatingTexts: FloatingText[],
  options: RenderOptions
) {
  const isDark = options.theme === 'dark';
  
  // Refined transit paper palette - perfectly aligned with Mini Metro styling
  const bgColor = isDark ? '#252528' : '#FAF9F6'; // authentic dark Mini Metro charcoal / warm ivory paper
  const waterColor = isDark ? '#1a222d' : '#88CAFA'; // soft, vibrant Mini Metro light-blue water
  const waterBorderColor = isDark ? '#283445' : '#64B2F5';
  const stationFillColor = '#FFFFFF'; // Stations in Mini Metro are ALWAYS white inside
  const stationBorderColor = isDark ? '#141416' : '#18181B'; // clean crisp border
  const textColor = isDark ? '#F1F5F9' : '#18181B';

  // Subtle architectural grid dots (single batched path covering wide boundaries for panning & zooming)
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  ctx.beginPath();
  const gridSize = 64;
  const startX = -1280;
  const endX = width + 1280;
  const startY = -1280;
  const endY = height + 1280;
  for (let x = startX; x < endX; x += gridSize) {
    for (let y = startY; y < endY; y += gridSize) {
      ctx.rect(x - 1, y - 1, 2, 2);
    }
  }
  ctx.fill();

  // Time of day calculation for subtle day/night atmosphere
  const timeHours = options.timeOfDayHours ?? 12.0;
  const isNight = timeHours >= 18.5 || timeHours <= 5.5;
  const now = performance.now() / 1000;

  // 1. Draw Parks & Green Spaces (Soft translucent pastel, non-distracting)
  if (options.parks && options.parks.length > 0) {
    const parkFill = isDark ? 'rgba(34, 197, 94, 0.08)' : 'rgba(16, 185, 129, 0.09)';
    const parkStroke = isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(16, 185, 129, 0.20)';
    for (const park of options.parks) {
      if (park.points.length < 3) continue;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(park.points[0].x, park.points[0].y);
      for (let i = 1; i < park.points.length; i++) {
        ctx.lineTo(park.points[i].x, park.points[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = parkFill;
      ctx.fill();
      ctx.strokeStyle = parkStroke;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Subtle muted park name label
      if (park.nameVi && park.points.length >= 3) {
        let cx = 0, cy = 0;
        for (const pt of park.points) {
          cx += pt.x;
          cy += pt.y;
        }
        cx /= park.points.length;
        cy /= park.points.length;
        ctx.font = 'italic 500 8.5px sans-serif';
        ctx.fillStyle = isDark ? 'rgba(110, 231, 183, 0.32)' : 'rgba(5, 150, 105, 0.40)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(park.nameVi.split(' (')[0], cx, cy);
      }
      ctx.restore();
    }
  }

  // 2. Draw Water / Rivers & River Islands
  for (const river of rivers) {
    if (river.points.length < 3) continue;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(river.points[0].x, river.points[0].y);
    for (let i = 1; i < river.points.length; i++) {
      ctx.lineTo(river.points[i].x, river.points[i].y);
    }
    ctx.closePath();

    if (river.isIsland) {
      // River Island (e.g. Bãi Giữa Sông Hồng): lush silt green/sand tone
      ctx.fillStyle = isDark ? '#162822' : '#E6F4EA';
      ctx.fill();
      ctx.strokeStyle = isDark ? '#234438' : '#CEEAD6';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    } else {
      ctx.fillStyle = waterColor;
      ctx.fill();
      ctx.strokeStyle = waterBorderColor;
      ctx.lineWidth = 2.0;
      ctx.stroke();

      // Subtle animated water ripple shimmer along river center
      if (river.points.length >= 6) {
        const midIdx1 = Math.floor(river.points.length * 0.25);
        const midIdx2 = Math.floor(river.points.length * 0.75);
        const pA = river.points[midIdx1];
        const pB = river.points[midIdx2];
        const waveOffset = Math.sin(now * 1.8) * 4;
        ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(14, 165, 233, 0.15)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([14, 20]);
        ctx.beginPath();
        ctx.moveTo(pA.x + waveOffset, pA.y);
        ctx.lineTo(pB.x - waveOffset, pB.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Name label for large water bodies
    if (river.name && !river.isIsland) {
      const mid = river.points[Math.floor(river.points.length / 2)];
      if (mid) {
        ctx.font = 'italic 600 10px sans-serif';
        ctx.fillStyle = isDark ? 'rgba(186, 230, 253, 0.35)' : 'rgba(2, 132, 199, 0.40)';
        ctx.textAlign = 'center';
        ctx.fillText(river.name.split(' (')[0], mid.x, mid.y);
      }
    }
    ctx.restore();
  }

  // 3. Draw Major Arterial Roads & Ring Roads (Very subtle, low contrast)
  if (options.roads && options.roads.length > 0) {
    ctx.save();
    for (const road of options.roads) {
      if (road.points.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(road.points[0].x, road.points[0].y);
      for (let i = 1; i < road.points.length; i++) {
        ctx.lineTo(road.points[i].x, road.points[i].y);
      }
      ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.16)';
      ctx.lineWidth = road.isRing ? 2.4 : 1.4;
      if (road.isRing) {
        ctx.setLineDash([8, 6]);
      } else {
        ctx.setLineDash([]);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 4. Draw Bridges with Iconic Silhouettes & Night LED lights
  if (options.bridges && options.bridges.length > 0) {
    for (const bridge of options.bridges) {
      const { p1, p2 } = bridge;
      ctx.save();

      // Main bridge road span
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = isDark ? 'rgba(203, 213, 225, 0.45)' : 'rgba(71, 85, 105, 0.45)';
      ctx.lineWidth = bridge.width ? Math.min(5.5, bridge.width * 0.32) : 2.8;
      ctx.lineCap = 'round';
      ctx.stroke();

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const bDist = Math.max(1, Math.hypot(dx, dy));
      const perpX = -dy / bDist;
      const perpY = dx / bDist;

      // Type-specific bridge architecture
      if (bridge.type === 'cable_stayed') {
        // Cầu Nhật Tân: 5 diamond towers with stay cables
        const towerCount = bridge.towers || 5;
        for (let t = 1; t <= towerCount; t++) {
          const tFrac = t / (towerCount + 1);
          const tx = p1.x + dx * tFrac;
          const ty = p1.y + dy * tFrac;
          const tHeight = 12;

          // Tower pillar
          ctx.beginPath();
          ctx.moveTo(tx - perpX * tHeight, ty - perpY * tHeight);
          ctx.lineTo(tx + perpX * tHeight, ty + perpY * tHeight);
          ctx.strokeStyle = bridge.color || '#06B6D4';
          ctx.lineWidth = 1.6;
          ctx.stroke();

          // Cable fan lines
          ctx.beginPath();
          ctx.moveTo(tx + perpX * tHeight, ty + perpY * tHeight);
          ctx.lineTo(tx - dx * 0.08, ty - dy * 0.08);
          ctx.moveTo(tx + perpX * tHeight, ty + perpY * tHeight);
          ctx.lineTo(tx + dx * 0.08, ty + dy * 0.08);
          ctx.strokeStyle = isDark ? 'rgba(6, 182, 212, 0.35)' : 'rgba(8, 145, 178, 0.30)';
          ctx.lineWidth = 0.8;
          ctx.stroke();

          // Night illumination light on tower tip
          if (isNight) {
            ctx.beginPath();
            ctx.arc(tx + perpX * tHeight, ty + perpY * tHeight, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#38BDF8';
            ctx.shadowColor = '#38BDF8';
            ctx.shadowBlur = 5;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      } else if (bridge.type === 'cantilever' || bridge.type === 'truss') {
        // Cầu Long Biên / Thăng Long steel truss spans
        const spans = 5;
        ctx.beginPath();
        for (let s = 0; s < spans; s++) {
          const f1 = s / spans;
          const f2 = (s + 0.5) / spans;
          const f3 = (s + 1) / spans;
          const x1 = p1.x + dx * f1, y1 = p1.y + dy * f1;
          const x2 = p1.x + dx * f2, y2 = p1.y + dy * f2;
          const x3 = p1.x + dx * f3, y3 = p1.y + dy * f3;
          const trussH = 6;
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2 + perpX * trussH, y2 + perpY * trussH);
          ctx.lineTo(x3, y3);
        }
        ctx.strokeStyle = isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(225, 29, 72, 0.35)';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // Night LED bridge deck line
      if (isNight) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Bridge name text
      const midX = (p1.x + p2.x) / 2 + perpX * 8;
      const midY = (p1.y + p2.y) / 2 + perpY * 8;
      ctx.font = '600 8px sans-serif';
      ctx.fillStyle = isDark ? 'rgba(226, 232, 240, 0.50)' : 'rgba(51, 65, 85, 0.55)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bridge.nameVi.split(' (')[0], midX, midY);

      ctx.restore();
    }
  }

  // 5. Draw District Labels (Muted, elegant, low-contrast cartographic background)
  if (options.districts && options.districts.length > 0) {
    ctx.save();
    ctx.font = '800 10.5px sans-serif';
    ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.15)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const d of options.districts) {
      ctx.fillText(d.nameVi, d.x, d.y);
    }
    ctx.restore();
  }

  // 6. Draw Cultural & Heritage Landmarks (Small discrete badges)
  if (options.landmarks && options.landmarks.length > 0) {
    ctx.save();
    for (const lm of options.landmarks) {
      // Discrete landmark marker dot
      ctx.beginPath();
      ctx.arc(lm.x, lm.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(251, 191, 36, 0.40)' : 'rgba(217, 119, 6, 0.40)';
      ctx.fill();

      // Tiny badge label
      if (lm.badgeText || lm.nameVi) {
        ctx.font = '500 8px sans-serif';
        ctx.fillStyle = isDark ? 'rgba(203, 213, 225, 0.35)' : 'rgba(100, 116, 139, 0.40)';
        ctx.textAlign = 'center';
        ctx.fillText(lm.badgeText || lm.nameVi.split(' — ')[0], lm.x, lm.y + 8);
      }
    }
    ctx.restore();
  }

  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  // Build canonical segment-to-lines mapping to separate parallel corridors
  // Maps canonical `${minId}_${maxId}` -> list of line IDs sharing this corridor
  const segmentLinesMap = new Map<string, string[]>();

  lines.forEach(line => {
    if (line.stationIds.length < 2) return;
    const sIds = line.stationIds;
    const segCount = line.isLoop ? sIds.length : sIds.length - 1;
    for (let i = 0; i < segCount; i++) {
      const u = sIds[i];
      const v = (i === sIds.length - 1 && line.isLoop) ? sIds[0] : sIds[i + 1];
      const key = u < v ? `${u}_${v}` : `${v}_${u}`;
      const list = segmentLinesMap.get(key) || [];
      if (!list.includes(line.id)) {
        list.push(line.id);
        segmentLinesMap.set(key, list);
      }
    }
  });

  // Calculate deterministic parallel offset for any line segment
  // Canonical station ordering ensures normal vector is invariant of traversal direction
  const getLineSegmentOffset = (lineId: string, st1: Station, st2: Station): Point => {
    const key = st1.id < st2.id ? `${st1.id}_${st2.id}` : `${st2.id}_${st1.id}`;
    const lineList = segmentLinesMap.get(key);
    if (!lineList || lineList.length <= 1) return { x: 0, y: 0 };

    const total = lineList.length;
    const idx = lineList.indexOf(lineId);
    if (idx === -1) return { x: 0, y: 0 };

    const spacing = 9.5;
    const offsetDist = (idx - (total - 1) / 2) * spacing;

    const canonicalA = st1.id < st2.id ? st1 : st2;
    const canonicalB = st1.id < st2.id ? st2 : st1;

    return getPerpendicularOffset(canonicalA, canonicalB, offsetDist);
  };

  const trackStyle = options.trackStyle || 'octolinear';

  // Build full line geometries with smooth curves, octolinear bends, and anti-overlap station bridges
  interface LineTrackGeometry {
    lineId: string;
    segments: {
      polyline: TrackPolyline;
      uId: string;
      vId: string;
    }[];
    renderPolylines: Point[][];
    terminusStart?: Point;
    terminusEnd?: Point;
  }

  const lineGeometries = new Map<string, LineTrackGeometry>();

  lines.forEach(line => {
    if (line.stationIds.length < 2) return;
    const sIds = line.stationIds;
    const totalSegs = line.isLoop ? sIds.length : sIds.length - 1;
    const segments: { polyline: TrackPolyline; uId: string; vId: string }[] = [];
    const renderPolylines: Point[][] = [];

    for (let i = 0; i < totalSegs; i++) {
      const uId = sIds[i];
      const vId = (i === sIds.length - 1 && line.isLoop) ? sIds[0] : sIds[i + 1];
      const s1 = stationMap.get(uId);
      const s2 = stationMap.get(vId);
      if (!s1 || !s2) continue;

      const perp = getLineSegmentOffset(line.id, s1, s2);
      const pA = { x: s1.x + perp.x, y: s1.y + perp.y };
      const pB = { x: s2.x + perp.x, y: s2.y + perp.y };

      // Compute continuous smooth tangents for C1 curvature
      let tangentA: Point | undefined;
      let tangentB: Point | undefined;

      if (trackStyle === 'curved') {
        let prevId: string | null = null;
        if (i > 0) prevId = sIds[i - 1];
        else if (line.isLoop) prevId = sIds[sIds.length - 1];

        if (prevId) {
          const sPrev = stationMap.get(prevId);
          if (sPrev) {
            const dx = s2.x - sPrev.x;
            const dy = s2.y - sPrev.y;
            const len = Math.hypot(dx, dy);
            if (len > 0.001) tangentA = { x: dx / len, y: dy / len };
          }
        }

        let nextId: string | null = null;
        if (i + 1 < sIds.length - 1) nextId = sIds[i + 2];
        else if (line.isLoop) nextId = sIds[(i + 2) % sIds.length];

        if (nextId) {
          const sNext = stationMap.get(nextId);
          if (sNext) {
            const dx = sNext.x - s1.x;
            const dy = sNext.y - s1.y;
            const len = Math.hypot(dx, dy);
            if (len > 0.001) tangentB = { x: dx / len, y: dy / len };
          }
        }
      }

      const segPts = generateTrackSegmentPoints(pA, pB, trackStyle, tangentA, tangentB);
      const poly = buildTrackPolyline(segPts);
      segments.push({ polyline: poly, uId, vId });
      renderPolylines.push(segPts);

      // Direct smooth platform bridge preserving line's assigned parallel corridor offset
      if (segments.length > 1) {
        const prevPolyPts = segments[segments.length - 2].polyline.points;
        const prevEndPt = prevPolyPts[prevPolyPts.length - 1];
        if (distance(prevEndPt, pA) > 0.5) {
          renderPolylines.push([prevEndPt, pA]);
        }
      }
    }

    // Connect loop closure at origin station preserving parallel offset
    if (line.isLoop && segments.length > 2) {
      const lastPolyPts = segments[segments.length - 1].polyline.points;
      const firstPolyPts = segments[0].polyline.points;
      const lastEndPt = lastPolyPts[lastPolyPts.length - 1];
      const firstStartPt = firstPolyPts[0];
      const s0 = stationMap.get(sIds[0]);
      if (s0 && distance(lastEndPt, firstStartPt) > 0.5) {
        renderPolylines.push([lastEndPt, firstStartPt]);
      }
    }

    let terminusStart: Point | undefined;
    let terminusEnd: Point | undefined;
    if (!line.isLoop && segments.length > 0) {
      const firstPts = segments[0].polyline.points;
      const lastPts = segments[segments.length - 1].polyline.points;
      if (firstPts.length > 0) terminusStart = firstPts[0];
      if (lastPts.length > 0) terminusEnd = lastPts[lastPts.length - 1];
    }

    lineGeometries.set(line.id, {
      lineId: line.id,
      segments,
      renderPolylines,
      terminusStart,
      terminusEnd
    });
  });

  // Helper to segment polyline into land and water subsegments for authentic Mini Metro tunnel rendering (Hinh 1)
  interface TrackSubSegment {
    pA: Point;
    pB: Point;
    inWater: boolean;
  }

  const subdividePolyline = (pts: Point[]): TrackSubSegment[] => {
    const subs: TrackSubSegment[] = [];
    if (pts.length < 2) return subs;

    for (let k = 1; k < pts.length; k++) {
      const p1 = pts[k - 1];
      const p2 = pts[k];
      const segD = distance(p1, p2);
      const stepDist = 8;
      const count = Math.max(1, Math.ceil(segD / stepDist));

      for (let s = 0; s < count; s++) {
        const t1 = s / count;
        const t2 = (s + 1) / count;
        const ptA = lerpPoint(p1, p2, t1);
        const ptB = lerpPoint(p1, p2, t2);
        const mid = lerpPoint(ptA, ptB, 0.5);
        const inWater = isPointInWater(mid, rivers);
        subs.push({ pA: ptA, pB: ptB, inWater });
      }
    }
    return subs;
  };

  // Track, Train, and Station rendering helpers for selective layer ordering & focus mode
  const drawSingleTrack = (line: MetroLine, isSelected: boolean) => {
    const geom = lineGeometries.get(line.id);
    if (!geom || geom.renderPolylines.length === 0) return;

    const casingColor = isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.85)';
    const solidLineWidth = isSelected ? 7 : 6;
    const casingLineWidth = isSelected ? 9.5 : 8;

    // Process all renderPolylines: land is drawn solid, water crossing is drawn as double dashed lines (Hinh 1)
    for (const pts of geom.renderPolylines) {
      if (pts.length < 2) continue;
      const subsegments = subdividePolyline(pts);

      // 1. Group consecutive subsegments with same inWater state
      let currentRun: { inWater: boolean; segments: { pA: Point; pB: Point }[] } | null = null;
      const runs: { inWater: boolean; segments: { pA: Point; pB: Point }[] }[] = [];

      for (const sub of subsegments) {
        if (!currentRun || currentRun.inWater !== sub.inWater) {
          currentRun = { inWater: sub.inWater, segments: [{ pA: sub.pA, pB: sub.pB }] };
          runs.push(currentRun);
        } else {
          currentRun.segments.push({ pA: sub.pA, pB: sub.pB });
        }
      }

      // 2. Render each run
      for (const run of runs) {
        if (run.segments.length === 0) continue;

        if (!run.inWater) {
          // --- LAND: Solid track with outer casing ---
          // A. Casing
          ctx.save();
          ctx.strokeStyle = casingColor;
          ctx.lineWidth = casingLineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(run.segments[0].pA.x, run.segments[0].pA.y);
          for (const s of run.segments) {
            ctx.lineTo(s.pB.x, s.pB.y);
          }
          ctx.stroke();
          ctx.restore();

          // B. Main line
          ctx.save();
          ctx.strokeStyle = line.color;
          ctx.lineWidth = solidLineWidth;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          if (line.type === 'feeder_bus' || line.type === 'standard_bus') {
            ctx.setLineDash([10, 5]);
          }
          ctx.beginPath();
          ctx.moveTo(run.segments[0].pA.x, run.segments[0].pA.y);
          for (const s of run.segments) {
            ctx.lineTo(s.pB.x, s.pB.y);
          }
          ctx.stroke();
          ctx.restore();
        } else {
          // Feature 8: Feeder Bus uses road bridges across rivers
          if (line.type === 'feeder_bus' || line.type === 'standard_bus') {
            ctx.save();
            ctx.strokeStyle = casingColor;
            ctx.lineWidth = solidLineWidth + 3;
            ctx.beginPath();
            ctx.moveTo(run.segments[0].pA.x, run.segments[0].pA.y);
            for (const s of run.segments) ctx.lineTo(s.pB.x, s.pB.y);
            ctx.stroke();

            ctx.strokeStyle = line.color;
            ctx.lineWidth = solidLineWidth;
            ctx.setLineDash([10, 5]);
            ctx.beginPath();
            ctx.moveTo(run.segments[0].pA.x, run.segments[0].pA.y);
            for (const s of run.segments) ctx.lineTo(s.pB.x, s.pB.y);
            ctx.stroke();
            ctx.restore();
            continue;
          }

          // --- WATER: Two parallel dashed lines (Hinh 1 & Screenshot 1, 4, 5) ---
          const dashPattern = [6, 4.5];
          const offsetDist = 2.4;

          // Build two parallel polylines
          const line1Pts: Point[] = [];
          const line2Pts: Point[] = [];

          for (let idx = 0; idx < run.segments.length; idx++) {
            const seg = run.segments[idx];
            const dx = seg.pB.x - seg.pA.x;
            const dy = seg.pB.y - seg.pA.y;
            const len = Math.hypot(dx, dy);
            if (len < 0.001) continue;
            const nx = -dy / len;
            const ny = dx / len;

            if (idx === 0) {
              line1Pts.push({ x: seg.pA.x + nx * offsetDist, y: seg.pA.y + ny * offsetDist });
              line2Pts.push({ x: seg.pA.x - nx * offsetDist, y: seg.pA.y - ny * offsetDist });
            }
            line1Pts.push({ x: seg.pB.x + nx * offsetDist, y: seg.pB.y + ny * offsetDist });
            line2Pts.push({ x: seg.pB.x - nx * offsetDist, y: seg.pB.y - ny * offsetDist });
          }

          // Casing for dashed lines
          ctx.save();
          ctx.strokeStyle = casingColor;
          ctx.lineWidth = 3.6;
          ctx.setLineDash(dashPattern);
          ctx.lineCap = 'butt';

          if (line1Pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(line1Pts[0].x, line1Pts[0].y);
            for (let i = 1; i < line1Pts.length; i++) ctx.lineTo(line1Pts[i].x, line1Pts[i].y);
            ctx.stroke();
          }
          if (line2Pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(line2Pts[0].x, line2Pts[0].y);
            for (let i = 1; i < line2Pts.length; i++) ctx.lineTo(line2Pts[i].x, line2Pts[i].y);
            ctx.stroke();
          }

          // Main double dashed lines in line.color
          ctx.strokeStyle = line.color;
          ctx.lineWidth = 2.0;

          if (line1Pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(line1Pts[0].x, line1Pts[0].y);
            for (let i = 1; i < line1Pts.length; i++) ctx.lineTo(line1Pts[i].x, line1Pts[i].y);
            ctx.stroke();
          }
          if (line2Pts.length >= 2) {
            ctx.beginPath();
            ctx.moveTo(line2Pts[0].x, line2Pts[0].y);
            for (let i = 1; i < line2Pts.length; i++) ctx.lineTo(line2Pts[i].x, line2Pts[i].y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
    }

    // Terminus T-Bar Bumper Cap (Mini Metro authentic terminus end cap - Image 2)
    // Non-loop lines extend outward past terminal stations and terminate with a perpendicular T-bar crossbar
    // Circular loop lines have NO endpoints and must NEVER have any buffer stops
    const isClosedLoop = Boolean(
      line.isLoop ||
      (line.stationIds.length >= 3 && line.stationIds[0] === line.stationIds[line.stationIds.length - 1])
    );

    if (!isClosedLoop && geom.segments.length > 0 && line.stationIds.length >= 2) {
      const barHalf = 12; // 24px crossbar width
      const stemExtension = 24; // extends 24px past station radius for clear visibility

      const drawTBar = (pStation: Point, dirX: number, dirY: number, stationRadius = 15) => {
        const len = Math.hypot(dirX, dirY);
        if (len < 0.001) return;
        const dx = dirX / len;
        const dy = dirY / len;

        const perpX = -dy;
        const perpY = dx;

        // Stem extends beyond station radius so the T-bar is clearly visible extending from the station
        const totalStemLength = stationRadius + stemExtension;
        const stemEnd = { x: pStation.x + dx * totalStemLength, y: pStation.y + dy * totalStemLength };
        const bar1 = { x: stemEnd.x - perpX * barHalf, y: stemEnd.y - perpY * barHalf };
        const bar2 = { x: stemEnd.x + perpX * barHalf, y: stemEnd.y + perpY * barHalf };

        ctx.save();
        ctx.lineCap = 'square';

        // 1. Casing
        ctx.strokeStyle = casingColor;
        ctx.lineWidth = casingLineWidth;
        ctx.beginPath();
        ctx.moveTo(pStation.x, pStation.y);
        ctx.lineTo(stemEnd.x, stemEnd.y);
        ctx.stroke();

        ctx.lineWidth = casingLineWidth + 1.6;
        ctx.beginPath();
        ctx.moveTo(bar1.x, bar1.y);
        ctx.lineTo(bar2.x, bar2.y);
        ctx.stroke();

        // 2. Main color
        ctx.strokeStyle = line.color;
        ctx.lineWidth = solidLineWidth;
        ctx.beginPath();
        ctx.moveTo(pStation.x, pStation.y);
        ctx.lineTo(stemEnd.x, stemEnd.y);
        ctx.stroke();

        ctx.lineWidth = solidLineWidth + 0.8;
        ctx.beginPath();
        ctx.moveTo(bar1.x, bar1.y);
        ctx.lineTo(bar2.x, bar2.y);
        ctx.stroke();

        ctx.restore();
      };

      // 1. Start terminus (Station 0)
      const firstSeg = geom.segments[0];
      const firstPts = firstSeg.polyline.points;
      if (firstPts.length >= 2) {
        const s0 = stationMap.get(line.stationIds[0]);
        const s0Radius = (s0?.isInterchange && !options.hideInterchangeDisplay) ? 20 : 15;
        let nextPt = firstPts[1];
        for (let k = 1; k < firstPts.length; k++) {
          if (distance(firstPts[0], firstPts[k]) >= 6) {
            nextPt = firstPts[k];
            break;
          }
        }
        let dx0 = firstPts[0].x - nextPt.x;
        let dy0 = firstPts[0].y - nextPt.y;
        if (Math.hypot(dx0, dy0) < 0.001) {
          const s1 = stationMap.get(line.stationIds[1]);
          if (s0 && s1) {
            dx0 = s0.x - s1.x;
            dy0 = s0.y - s1.y;
          }
        }
        drawTBar(firstPts[0], dx0, dy0, s0Radius);
      }

      // 2. End terminus (Station N-1)
      const lastSeg = geom.segments[geom.segments.length - 1];
      const lastPts = lastSeg.polyline.points;
      if (lastPts.length >= 2) {
        const sEnd = stationMap.get(line.stationIds[line.stationIds.length - 1]);
        const sEndRadius = (sEnd?.isInterchange && !options.hideInterchangeDisplay) ? 20 : 15;
        const endPt = lastPts[lastPts.length - 1];
        let prevPt = lastPts[lastPts.length - 2];
        for (let k = lastPts.length - 2; k >= 0; k--) {
          if (distance(endPt, lastPts[k]) >= 6) {
            prevPt = lastPts[k];
            break;
          }
        }
        let dxEnd = endPt.x - prevPt.x;
        let dyEnd = endPt.y - prevPt.y;
        if (Math.hypot(dxEnd, dyEnd) < 0.001) {
          const sPrev = stationMap.get(line.stationIds[line.stationIds.length - 2]);
          if (sEnd && sPrev) {
            dxEnd = sEnd.x - sPrev.x;
            dyEnd = sEnd.y - sPrev.y;
          }
        }
        drawTBar(endPt, dxEnd, dyEnd, sEndRadius);
      }
    }
  };

  const drawDragPreview = () => {
    if (options.dragState && options.dragState.isDragging && options.dragState.fromStationId && options.dragState.currentPos) {
      const fromStation = stationMap.get(options.dragState.fromStationId);
      if (fromStation) {
        const targetStation = options.dragState.targetStationId ? stationMap.get(options.dragState.targetStationId) : null;
        const toPos = targetStation ? { x: targetStation.x, y: targetStation.y } : options.dragState.currentPos;
        const activeLine = lines.find(l => l.id === options.dragState?.lineId);
        const dragColor = activeLine ? activeLine.color : '#3B82F6';

        // Segment Split mode: user grabbed existing segment between fromStation and toStation
        if (options.dragState.isSegmentSplit && options.dragState.toStationId) {
          const toStation = stationMap.get(options.dragState.toStationId);
          if (toStation) {
            const previewPts1 = generateTrackSegmentPoints(fromStation, toPos, trackStyle);
            const previewPts2 = generateTrackSegmentPoints(toPos, toStation, trackStyle);

            ctx.save();
            ctx.strokeStyle = dragColor;
            ctx.lineWidth = 5.5;
            ctx.setLineDash([10, 6]);

            // Draw segment 1: fromStation -> toPos
            ctx.beginPath();
            if (previewPts1.length > 0) {
              ctx.moveTo(previewPts1[0].x, previewPts1[0].y);
              for (let k = 1; k < previewPts1.length; k++) {
                ctx.lineTo(previewPts1[k].x, previewPts1[k].y);
              }
            }
            ctx.stroke();

            // Draw segment 2: toPos -> toStation
            ctx.beginPath();
            if (previewPts2.length > 0) {
              ctx.moveTo(previewPts2[0].x, previewPts2[0].y);
              for (let k = 1; k < previewPts2.length; k++) {
                ctx.lineTo(previewPts2[k].x, previewPts2[k].y);
              }
            }
            ctx.stroke();
            ctx.setLineDash([]);

            // Magnet handle at toPos
            ctx.fillStyle = dragColor;
            ctx.beginPath();
            ctx.arc(toPos.x, toPos.y, targetStation ? 16 : 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2.5;
            ctx.stroke();
            ctx.restore();
            return;
          }
        }

        const previewPts = generateTrackSegmentPoints(fromStation, toPos, trackStyle);

        ctx.save();
        // Outer glow
        ctx.strokeStyle = dragColor;
        ctx.lineWidth = 5.5;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        if (previewPts.length > 0) {
          ctx.moveTo(previewPts[0].x, previewPts[0].y);
          for (let k = 1; k < previewPts.length; k++) {
            ctx.lineTo(previewPts[k].x, previewPts[k].y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Magnet handle
        ctx.fillStyle = dragColor;
        ctx.beginPath();
        ctx.arc(toPos.x, toPos.y, targetStation ? 16 : 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  };

  const carLength = 30;
  const carWidth = 15;
  const gap = 5;
  const carSpacing = carLength + gap;
  const renderedTrainsList: RenderedTrainInfo[] = [];

  const drawSingleTrain = (train: Train) => {
    const line = lines.find(l => l.id === train.lineId);
    if (!line || line.stationIds.length < 2) return;

    const isBus = line.type === 'feeder_bus' || line.type === 'standard_bus';
    const isBrt = line.type === 'feeder_bus';
    const isDouble = !!train.isDoubleDecker || line.type === 'double_decker';

    const carLength = isDouble ? 34 : isBrt ? 26 : isBus ? 32 : 30;
    const carWidth = isDouble ? 16.5 : isBus ? 13.5 : 14.5;
    const gap = isBus ? 4.5 : 5.0;
    const carSpacing = carLength + gap;

    const geom = lineGeometries.get(train.lineId);
    if (!geom || !geom.segments || geom.segments.length === 0) return;

    const totalSegments = geom.segments.length;
    const segIdx = Math.max(0, Math.min(train.segmentIndex ?? 0, totalSegments - 1));
    const currSeg = geom.segments[segIdx];
    if (!currSeg || !currSeg.polyline || !currSeg.polyline.points || currSeg.polyline.points.length === 0) return;

    const segPoly = currSeg.polyline;
    const segLen = Math.max(1, segPoly.totalLength);

    const progress = Math.max(0, Math.min(1, train.progress ?? 0));
    const leadDist = train.direction === 1
      ? progress * segLen
      : (1 - progress) * segLen;

    const totalCars = isBus ? 1 : 1 + (train.carriagesCount || 0);
    interface CarTransform {
      x: number;
      y: number;
      angle: number;
    }
    const carTransforms: CarTransform[] = [];

    for (let c = 0; c < totalCars; c++) {
      const carDistBehindLead = c * carSpacing;
      const targetDist = train.direction === 1
        ? leadDist - carDistBehindLead
        : leadDist + carDistBehindLead;

      if (targetDist >= 0 && targetDist <= segLen) {
        const sampled = samplePolylineAtDistance(segPoly, targetDist);
        const angle = train.direction === 1 ? sampled.angle : sampled.angle + Math.PI;
        carTransforms.push({
          x: sampled.x,
          y: sampled.y,
          angle
        });
      } else {
        let remDist = targetDist < 0 ? -targetDist : targetDist - segLen;
        let scanSeg = segIdx;
        let found = false;

        for (let step = 0; step < 8; step++) {
          let prevSeg: number;
          if (train.direction === 1) {
            prevSeg = line.isLoop ? (scanSeg - 1 + totalSegments) % totalSegments : scanSeg - 1;
          } else {
            prevSeg = line.isLoop ? (scanSeg + 1) % totalSegments : scanSeg + 1;
          }

          if (prevSeg < 0 || prevSeg >= totalSegments || !geom.segments[prevSeg]) {
            const clampedDist = train.direction === 1 ? 0 : segLen;
            const sampled = samplePolylineAtDistance(segPoly, clampedDist);
            const angle = train.direction === 1 ? sampled.angle : sampled.angle + Math.PI;
            carTransforms.push({
              x: sampled.x,
              y: sampled.y,
              angle
            });
            found = true;
            break;
          }

          const prevSegPoly = geom.segments[prevSeg].polyline;
          const pLen = Math.max(1, prevSegPoly.totalLength);

          if (remDist <= pLen) {
            const pDist = train.direction === 1 ? pLen - remDist : remDist;
            const sampled = samplePolylineAtDistance(prevSegPoly, pDist);
            const angle = train.direction === 1 ? sampled.angle : sampled.angle + Math.PI;
            carTransforms.push({
              x: sampled.x,
              y: sampled.y,
              angle
            });
            found = true;
            break;
          } else {
            remDist -= pLen;
            scanSeg = prevSeg;
          }
        }

        if (!found) {
          const fallback = samplePolylineAtDistance(segPoly, train.direction === 1 ? 0 : segLen);
          const angle = train.direction === 1 ? fallback.angle : fallback.angle + Math.PI;
          carTransforms.push({
            x: fallback.x,
            y: fallback.y,
            angle
          });
        }
      }
    }

    if (carTransforms.length === 0) {
      const fallback = samplePolylineAtDistance(segPoly, leadDist);
      const angle = train.direction === 1 ? fallback.angle : fallback.angle + Math.PI;
      carTransforms.push({
        x: fallback.x,
        y: fallback.y,
        angle
      });
    }

    renderedTrainsList.push({
      trainId: train.id,
      lineId: train.lineId,
      cars: carTransforms.map(ct => ({ x: ct.x, y: ct.y }))
    });

    // Carriage connector links
    for (let c = 1; c < carTransforms.length; c++) {
      const prevCar = carTransforms[c - 1];
      const currCar = carTransforms[c];

      const prevRearX = prevCar.x - Math.cos(prevCar.angle) * (carLength / 2);
      const prevRearY = prevCar.y - Math.sin(prevCar.angle) * (carLength / 2);
      const currFrontX = currCar.x + Math.cos(currCar.angle) * (carLength / 2);
      const currFrontY = currCar.y + Math.sin(currCar.angle) * (carLength / 2);

      if (isBus) {
        // Articulated rubber accordion bellows for bendy BRT buses
        const midX = (prevRearX + currFrontX) / 2;
        const midY = (prevRearY + currFrontY) / 2;
        ctx.strokeStyle = '#0F172A';
        ctx.lineWidth = carWidth * 0.72;
        ctx.lineCap = 'butt';
        ctx.beginPath();
        ctx.moveTo(prevRearX, prevRearY);
        ctx.lineTo(currFrontX, currFrontY);
        ctx.stroke();

        // Ribbed pleats on the bellows
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(midX - 1.0, midY - 3.5);
        ctx.lineTo(midX - 1.0, midY + 3.5);
        ctx.moveTo(midX + 1.0, midY - 3.5);
        ctx.lineTo(midX + 1.0, midY + 3.5);
        ctx.stroke();
      } else {
        // Black metal coupler link
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(prevRearX, prevRearY);
        ctx.lineTo(currFrontX, currFrontY);
        ctx.stroke();
      }
    }

    // Soft dim warm yellow headlight beam projecting in front of the lead car (direction indicator)
    if (carTransforms.length > 0) {
      const lead = carTransforms[0];
      const frontX = carLength / 2;
      const beamLength = isBus ? 22 : isDouble ? 34 : 28;
      const beamHalfWidth = isBus ? 7.5 : isDouble ? 11.5 : 9.5;

      ctx.save();
      ctx.translate(lead.x, lead.y);
      ctx.rotate(lead.angle);

      // Conical headlight beam with soft, muted warm yellow gradient
      const beamGrad = ctx.createRadialGradient(frontX, 0, 2, frontX + beamLength * 0.75, 0, beamLength);
      beamGrad.addColorStop(0, isBus ? 'rgba(245, 158, 11, 0.35)' : 'rgba(217, 160, 24, 0.32)');
      beamGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.16)');
      beamGrad.addColorStop(1, 'rgba(234, 179, 8, 0.0)');

      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(frontX, -2.5);
      ctx.lineTo(frontX + beamLength, -beamHalfWidth);
      ctx.arcTo(frontX + beamLength + 4, 0, frontX + beamLength, beamHalfWidth, 6);
      ctx.lineTo(frontX + beamLength, beamHalfWidth);
      ctx.lineTo(frontX, 2.5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Authentic minimalist Mini Metro train bodies & carriages with black outline
    carTransforms.forEach((car, c) => {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      if (isBus) {
        // --- 🚌 FEEDER BUS (BRT) DEDICATED DESIGN ---
        // 1. Exterior black rubber tires protruding on sides
        ctx.fillStyle = '#0F172A';
        // Front tires
        ctx.fillRect(carLength / 2 - 7.5, -carWidth / 2 - 1.2, 5.2, 2.0);
        ctx.fillRect(carLength / 2 - 7.5, carWidth / 2 - 0.8, 5.2, 2.0);
        // Rear tires
        ctx.fillRect(-carLength / 2 + 3.0, -carWidth / 2 - 1.2, 5.2, 2.0);
        ctx.fillRect(-carLength / 2 + 3.0, carWidth / 2 - 0.8, 5.2, 2.0);

        // 2. Bus body in route color with rounded front cab
        ctx.fillStyle = line.color;
        ctx.beginPath();
        ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, [2.5, 5.0, 5.0, 2.5]);
        ctx.fill();

        // Solid crisp outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // 3. Panoramic curved windshield (dark tinted glass)
        ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
        ctx.beginPath();
        ctx.roundRect(carLength / 2 - 5.5, -carWidth / 2 + 1.8, 3.8, carWidth - 3.6, [1, 3, 3, 1]);
        ctx.fill();

        // 4. Amber LED destination route head-sign on front windscreen
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(carLength / 2 - 4.5, -3.2, 1.2, 6.4);

        // 5. Rear window & dual red brake lights
        ctx.fillStyle = 'rgba(15, 23, 42, 0.70)';
        ctx.fillRect(-carLength / 2 + 1.0, -carWidth / 2 + 2.2, 1.8, carWidth - 4.4);
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(-carLength / 2 + 0.3, -carWidth / 2 + 1.8, 1.2, 2.2);
        ctx.fillRect(-carLength / 2 + 0.3, carWidth / 2 - 4.0, 1.2, 2.2);

        // 6. Roof air-conditioner pod
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.roundRect(-4.5, -3.0, 9.0, 6.0, 1.5);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.7;
        ctx.stroke();

        // 7. Dual corner yellow fog/headlamps on lead bus
        if (c === 0) {
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(carLength / 2 - 1.5, -carWidth / 2 + 2.8, 1.5, 0, Math.PI * 2);
          ctx.arc(carLength / 2 - 1.5, carWidth / 2 - 2.8, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (isDouble) {
        // --- 🏢 DOUBLE-DECKER TRAIN DEDICATED DESIGN ---
        // 1. High-capacity aerodynamic dual-tier railcar body
        ctx.fillStyle = line.color;
        ctx.beginPath();
        if (c === 0) {
          // Streamlined bullet nose on lead locomotive
          ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, [3.0, 7.5, 7.5, 3.0]);
        } else {
          ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 3.2);
        }
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2.0;
        ctx.stroke();

        // 2. Upper and lower tinted panoramic observation window bands
        ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
        ctx.fillRect(-carLength / 2 + 3.0, -carWidth / 2 + 1.2, carLength - 7.5, 1.8);
        ctx.fillRect(-carLength / 2 + 3.0, carWidth / 2 - 3.0, carLength - 7.5, 1.8);

        // 3. Dual-deck dividing stripe along center
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(-carLength / 2 + 2.0, 0);
        ctx.lineTo(carLength / 2 - 3.5, 0);
        ctx.stroke();

        // 4. White aerodynamic roof rib
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-carLength / 2 + 4.0, -0.6);
        ctx.lineTo(carLength / 2 - 5.0, -0.6);
        ctx.stroke();

        // 5. High-speed diamond pantograph on locomotive roof
        if (c === 0) {
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-carLength / 2 + 5, 0);
          ctx.lineTo(-carLength / 2 + 8, -2.5);
          ctx.lineTo(-carLength / 2 + 11, 0);
          ctx.lineTo(-carLength / 2 + 8, 2.5);
          ctx.closePath();
          ctx.stroke();

          // Piercing dual projector headlights
          ctx.fillStyle = '#FEF08A';
          ctx.beginPath();
          ctx.arc(carLength / 2 - 1.8, -3.2, 1.6, 0, Math.PI * 2);
          ctx.arc(carLength / 2 - 1.8, 3.2, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // --- 🚇 STANDARD METRO TRAIN CLASSIC DESIGN ---
        ctx.fillStyle = line.color;
        ctx.beginPath();
        ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 3.2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Central headlight lamp on lead car
        if (c === 0) {
          const noseX = carLength / 2 - 1.5;
          ctx.fillStyle = 'rgba(250, 204, 21, 0.88)';
          ctx.beginPath();
          ctx.arc(noseX, 0, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Feature 2: CBTC Driverless Telemetry Signal Beacon on locomotive
      if ((train.isCBTC || line.hasCBTC) && c === 0) {
        const cbtcPulse = (Math.sin(performance.now() / 200) + 1) * 0.5;
        ctx.fillStyle = `rgba(6, 182, 212, ${0.55 + 0.45 * cbtcPulse})`;
        ctx.beginPath();
        ctx.arc(-carLength / 2 + 3.0, 0, 1.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(6, 182, 212, ${0.45 + 0.55 * cbtcPulse})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(-carLength / 2 + 3.0, 0, 3.2, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();
      }

      // Feature 19: Transit Advertising Livery on BOTH sides of the train body (Sky Blue - màu xanh da trời)
      if (options.hasTransitAdContract) {
        const adSkyBlue = '#0EA5E9'; // Sky Blue (xanh da trời)
        const adWhite = 'rgba(255, 255, 255, 0.95)';
        const decalWidth = carLength - (isBus ? 8 : 6);
        const decalStartX = -carLength / 2 + (isBus ? 4 : 3);

        // Side 1: Top flank (-carWidth / 2)
        ctx.fillStyle = adWhite;
        ctx.fillRect(decalStartX, -carWidth / 2 + 0.6, decalWidth, 1.8);
        ctx.fillStyle = adSkyBlue;
        ctx.fillRect(decalStartX + 1, -carWidth / 2 + 1.0, decalWidth - 2, 1.0);

        // Side 2: Bottom flank (+carWidth / 2)
        ctx.fillStyle = adWhite;
        ctx.fillRect(decalStartX, carWidth / 2 - 2.4, decalWidth, 1.8);
        ctx.fillStyle = adSkyBlue;
        ctx.fillRect(decalStartX + 1, carWidth / 2 - 2.0, decalWidth - 2, 1.0);
      }

      // Feature 10: Night Maintenance Train beacon
      if (train.isMaintenanceTrain && c === 0) {
        const pulse = (Math.sin(performance.now() / 150) + 1) * 0.5;
        ctx.fillStyle = `rgba(245, 158, 11, ${0.45 + 0.55 * pulse})`;
        ctx.beginPath();
        ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Passengers inside vehicle:
      // Lead cars & BRT buses carry 6 passengers; double-deckers carry 12 (8 in carriages); trailing cars carry 4.
      let carCapacity = 4;
      if (isDouble) {
        carCapacity = c === 0 ? 12 : 8;
      } else if (isBus) {
        carCapacity = line.type === 'feeder_bus' ? 4 : 6;
      } else {
        carCapacity = c === 0 ? 6 : 4;
      }

      let startPassengerIdx = 0;
      for (let prev = 0; prev < c; prev++) {
        if (isDouble) startPassengerIdx += (prev === 0 ? 12 : 8);
        else if (isBus) startPassengerIdx += (line.type === 'feeder_bus' ? 4 : 6);
        else startPassengerIdx += (prev === 0 ? 6 : 4);
      }

      const endPassengerIdx = Math.min(train.passengers.length, startPassengerIdx + carCapacity);
      const carPassengerCount = Math.max(0, endPassengerIdx - startPassengerIdx);

      for (let pIdx = startPassengerIdx; pIdx < endPassengerIdx; pIdx++) {
        const passenger = train.passengers[pIdx];
        const localPIdx = pIdx - startPassengerIdx;

        let px: number;
        let py: number;

        if (isDouble) {
          // Upper deck (even idx) and lower deck (odd idx)
          const isUpper = localPIdx % 2 === 0;
          const tierIdx = Math.floor(localPIdx / 2);
          const tierTotal = Math.ceil(carPassengerCount / 2);
          const spacing = carLength / (Math.max(1, tierTotal) + 1);
          px = -carLength / 2 + spacing * (tierIdx + 1);
          py = isUpper ? -3.0 : 3.0;
        } else if (isBus) {
          // 🚌 BRT Bus: 1 BRT carries 6 passengers (2 rows of 3 seats along window sides)
          const isTopRow = localPIdx % 2 === 0;
          const colIdx = Math.floor(localPIdx / 2); // 0, 1, 2
          const colTotal = Math.ceil(carPassengerCount / 2);
          const spacing = (carLength - 10) / (Math.max(1, colTotal) + 1);
          px = -carLength / 2 + 3.2 + spacing * (colIdx + 1);
          py = isTopRow ? -2.7 : 2.7;
        } else {
          // Standard metro train car
          if (carCapacity > 4 && carPassengerCount > 4) {
            // Staggered layout for 5-6 passengers
            const isTopRow = localPIdx % 2 === 0;
            const colIdx = Math.floor(localPIdx / 2);
            const colTotal = Math.ceil(carPassengerCount / 2);
            const spacing = (carLength - 8) / (Math.max(1, colTotal) + 1);
            px = -carLength / 2 + 3.0 + spacing * (colIdx + 1);
            py = isTopRow ? -2.2 : 2.2;
          } else {
            const spacing = carLength / (carPassengerCount + 1);
            px = -carLength / 2 + spacing * (localPIdx + 1);
            py = 0;
          }
        }

        const shapeRadius = isDouble ? 2.2 : isBus ? 2.05 : 2.6;
        drawShape(ctx, passenger.targetShape, px, py, shapeRadius, '#FFFFFF', '#0F172A', 0.9);

        // Feature 19 (cũ): Minimalist suitcase icon next to luggage passenger
        if (passenger.hasLuggage) {
          ctx.fillStyle = '#F59E0B';
          ctx.fillRect(px + (isDouble || isBus ? 1.6 : 2.4), py - 1.0, 1.5, 1.6);
        } else if (passenger.isStudent) {
          // Feature 13: Student amber backpack
          ctx.fillStyle = '#EAB308';
          ctx.beginPath();
          ctx.arc(px + (isDouble || isBus ? 1.5 : 2.2), py - 1.1, 0.95, 0, Math.PI * 2);
          ctx.fill();
        } else if (passenger.isTourist) {
          // Feature 14: Tourist camera / cyan lanyard
          ctx.fillStyle = '#06B6D4';
          ctx.fillRect(px + (isDouble || isBus ? 1.5 : 2.2), py - 0.9, 1.3, 1.3);
        }
      }

      ctx.restore();
    });

    if (train.breakdownTimer && train.breakdownTimer > 0 && carTransforms.length > 0) {
      const lead = carTransforms[0];
      ctx.save();
      ctx.translate(lead.x, lead.y - 22);
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.roundRect(-36, -9, 72, 18, 4);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`🔧 HỎNG (${Math.ceil(train.breakdownTimer)}s)`, 0, 0);
      ctx.restore();
    }

    // Stuck Train Indicator (train is immobilized at station)
    if (train.isStuck && carTransforms.length > 0) {
      const lead = carTransforms[0];
      ctx.save();
      ctx.translate(lead.x, lead.y - 22);
      
      // Pulsing red warning indicator
      const pulse = (Math.sin(Date.now() / 200) + 1) * 0.5;
      ctx.fillStyle = `rgba(239, 68, 68, ${0.7 + pulse * 0.3})`;
      ctx.beginPath();
      ctx.roundRect(-36, -9, 72, 18, 4);
      ctx.fill();
      
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 8.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🛑 BỊ ỴTại GA', 0, 0);
      ctx.restore();
    }
  };

  const drawSingleStation = (station: Station) => {
    const isHovered = options.hoveredStationId === station.id;
    const isSelected = options.selectedStationId === station.id;
    const baseRadius = (station.isInterchange && !options.hideInterchangeDisplay) ? 20 : 15;

    // Detect if this station is a terminus of any non-loop line, and check T-bar outward direction
    let terminusDirX = 0;
    let terminusDirY = 0;
    for (const l of lines) {
      if (l.isLoop || l.stationIds.length < 2) continue;
      if (l.stationIds[0] === l.stationIds[l.stationIds.length - 1]) continue;
      const geom = lineGeometries.get(l.id);
      if (!geom || geom.segments.length === 0) continue;

      if (l.stationIds[0] === station.id && geom.segments[0].polyline.points.length >= 2) {
        const pts = geom.segments[0].polyline.points;
        const next = pts[Math.min(1, pts.length - 1)];
        const dx = pts[0].x - next.x;
        const dy = pts[0].y - next.y;
        const len = Math.hypot(dx, dy);
        if (len > 0.001) { terminusDirX = dx / len; terminusDirY = dy / len; }
      } else if (l.stationIds[l.stationIds.length - 1] === station.id) {
        const lastPts = geom.segments[geom.segments.length - 1].polyline.points;
        if (lastPts.length >= 2) {
          const endPt = lastPts[lastPts.length - 1];
          const prev = lastPts[Math.max(0, lastPts.length - 2)];
          const dx = endPt.x - prev.x;
          const dy = endPt.y - prev.y;
          const len = Math.hypot(dx, dy);
          if (len > 0.001) { terminusDirX = dx / len; terminusDirY = dy / len; }
        }
      }
    }

    ctx.save();

    // Night station warm radial ambient glow
    if (isNight) {
      const glow = ctx.createRadialGradient(station.x, station.y, 2, station.x, station.y, baseRadius + 14);
      glow.addColorStop(0, 'rgba(254, 240, 138, 0.16)');
      glow.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Selected Station beacon / glowing double ring
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 14, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#06B6D4';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Hover halo
    if (isHovered && !isSelected) {
      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 9, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.08)';
      ctx.fill();
    }

    // Flooded station water puddle & ripple wave effect
    if (station.isFlooded) {
      const nowTs = performance.now() / 1000;
      const ripple1 = baseRadius + 14 + (Math.sin(nowTs * 3.5) + 1) * 4;
      const ripple2 = baseRadius + 22 + (Math.cos(nowTs * 2.8) + 1) * 6;

      ctx.save();
      ctx.beginPath();
      ctx.arc(station.x, station.y, ripple2, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(station.x, station.y, ripple1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.roundRect(station.x - 24, station.y - baseRadius - 28, 48, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌊 NGẬP', station.x, station.y - baseRadius - 20);
      ctx.restore();
    }

    // Interchange Hub double ring & amber star badge
    if (station.isInterchange && !options.hideInterchangeDisplay) {
      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 7, 0, Math.PI * 2);
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      ctx.fill();
    }

    // Closed station barrier & badge
    if (station.isClosed) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(station.x, station.y, baseRadius + 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.fill();
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.roundRect(station.x - 28, station.y - baseRadius - 24, 56, 16, 4);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⛔ ĐÓNG', station.x, station.y - baseRadius - 16);
      ctx.restore();
    }

    // Dual-Stage Circular Progress Gauges:
    // When hideStationIcons is toggled, also hide the occupancy ring and the red circular overcrowding indicators
    if (!options.hideStationIcons) {
      const passengerCount = station.passengers.length;
      const maxCap = station.maxCapacity;
      const occupancy = Math.min(1.0, passengerCount / maxCap);
      const gaugeRadius = baseRadius + 6;

      // 1. Early-warning Passenger Occupancy Ring (Visible whenever passengers are waiting)
      if (!options.hidePassengerCount && passengerCount > 0) {
        ctx.beginPath();
        ctx.arc(station.x, station.y, gaugeRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 3.5;
        ctx.stroke();

        const startAngle = -Math.PI / 2;
        const endAngle = startAngle + Math.PI * 2 * occupancy;

        let arcColor = '#10B981';
        if (occupancy >= 0.85) {
          arcColor = '#EF4444';
        } else if (occupancy >= 0.6) {
          arcColor = '#F59E0B';
        }

        ctx.beginPath();
        ctx.arc(station.x, station.y, gaugeRadius, startAngle, endAngle);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 2. Critical Overcrowding Countdown Ring (Mini Metro game-over timer)
      if (station.overcrowdedTimer > 0.02 || station.isOvercrowded) {
        const dangerRadius = baseRadius + 11.5;
        const timerProgress = Math.min(1.0, Math.max(0.05, station.overcrowdedTimer));
        const isUrgent = station.overcrowdedTimer > 0.65;

        ctx.beginPath();
        ctx.arc(station.x, station.y, dangerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(
          station.x,
          station.y,
          dangerRadius,
          -Math.PI / 2,
          -Math.PI / 2 + Math.PI * 2 * timerProgress
        );
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        if (isUrgent) {
          const pulse = 1 + Math.sin(Date.now() / 120) * 0.15;
          ctx.beginPath();
          ctx.arc(station.x, station.y, dangerRadius * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }

        if (!options.hidePassengerCount) {
          const badgeY = station.y - baseRadius - 14;
          const badgeText = `${passengerCount}/${maxCap}`;

          ctx.font = '800 10px "JetBrains Mono", monospace';
          const badgeW = ctx.measureText(badgeText).width + 10;

          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.roundRect(station.x - badgeW / 2, badgeY - 7, badgeW, 14, 7);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeText, station.x, badgeY);
        }
      }
    }

    // Station Drop Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;

    // Station Main Geometry: If hideStationIcons is true, render a clean circular stop marker
    if (options.hideStationIcons) {
      ctx.beginPath();
      ctx.arc(station.x, station.y, (station.isInterchange && !options.hideInterchangeDisplay) ? 13 : 9.5, 0, Math.PI * 2);
      ctx.fillStyle = stationFillColor;
      ctx.fill();
      ctx.strokeStyle = stationBorderColor;
      ctx.lineWidth = (station.isInterchange && !options.hideInterchangeDisplay) ? 4.2 : 3.2;
      ctx.stroke();
    } else {
      drawShape(
        ctx,
        station.shape,
        station.x,
        station.y,
        baseRadius,
        stationFillColor,
        stationBorderColor,
        (station.isInterchange && !options.hideInterchangeDisplay) ? 4.5 : 3.8
      );
    }

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;


    // Station Name Tag
    if (options.showStationNames) {
      ctx.font = '700 11.5px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';

      const name = station.name;
      let textW = textWidthCache.get(name);
      if (textW === undefined) {
        textW = ctx.measureText(name).width + 12;
        textWidthCache.set(name, textW);
      }
      const tagY = station.y + baseRadius + (terminusDirY > 0.25 ? 32 : 7);

      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.94)';
      ctx.beginPath();
      ctx.roundRect(station.x - textW / 2, tagY - 2, textW, 18, 5);
      ctx.fill();

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(name, station.x, tagY);

      // Render station amenities mini pills below name tag
      if (!options.hideStationUpgrades) {
        const amenities: string[] = [];
        if (station.hasCoffeeKiosk) amenities.push('☕');
        if (station.hasSolarRoof) amenities.push('☀️');
        if (station.isTodHub) amenities.push('🏢');
        if (station.hasParkAndRide) amenities.push('🅿️');
        if (station.hasFeederStation) amenities.push('🛵');

        if (amenities.length > 0) {
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(amenities.join(' '), station.x, tagY + 18);
        }
      }
    }

    // Waiting Passengers Grouped Display: <logo ga> <so khach> (e.g. ▲ 6, ■ 2)
    if (!options.hidePassengerCount && station.passengers.length > 0) {
      const shapeCounts = new Map<StationShape, number>();
      for (const p of station.passengers) {
        shapeCounts.set(p.targetShape, (shapeCounts.get(p.targetShape) || 0) + 1);
      }

      ctx.save();
      const badgeH = 15;
      const iconSize = 3.6;
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      let curY = station.y - baseRadius;
      const startX = station.x + baseRadius + (terminusDirX > 0.25 ? 30 : 7);

      shapeCounts.forEach((count, shape) => {
        const countStr = `${count}`;
        const numW = ctx.measureText(countStr).width;
        const totalW = iconSize * 2 + 10 + numW;

        // Badge pill background
        ctx.beginPath();
        ctx.roundRect(startX, curY - badgeH / 2, totalW, badgeH, 4);
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)';
        ctx.fill();
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Station target shape icon
        const iconX = startX + 5 + iconSize;
        drawShape(
          ctx,
          shape,
          iconX,
          curY,
          iconSize,
          isDark ? '#F8FAFC' : '#0F172A',
          isDark ? '#090D16' : '#FFFFFF',
          1.2
        );

        // Passenger count text
        ctx.fillStyle = isDark ? '#F8FAFC' : '#0F172A';
        ctx.fillText(countStr, iconX + iconSize + 4, curY + 0.5);

        curY += badgeH + 3;
      });

      ctx.restore();
    }

    // Special Hub Badge (Airport / Seaport: 2.5x fare & intermodal status)
    if (station.specialHubType) {
      ctx.save();
      const isAirport = station.specialHubType === 'airport';
      const hubLabel = isAirport ? '✈️ SÂN BAY (+150%)' : '🚢 CẢNG BIỂN (+150%)';
      const hubColor = isAirport ? '#38BDF8' : '#34D399';
      const badgeY = station.y + baseRadius + (options.showStationNames ? 24 : 10);
      ctx.font = 'bold 8.5px sans-serif';
      const textW = ctx.measureText(hubLabel).width;
      const totalW = textW + 10;

      ctx.beginPath();
      ctx.roundRect(station.x - totalW / 2, badgeY - 7, totalW, 14, 4);
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.94)';
      ctx.fill();
      ctx.strokeStyle = hubColor;
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.fillStyle = hubColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.restore();
    }

    // Feature 24: Smart IC Card contactless ticket gate badge
    if (station.hasSmartIC && !options.hideStationUpgrades) {
      ctx.save();
      const icLabel = '💳 IC CARD';
      const badgeY = station.y - baseRadius - (station.isFlooded ? 44 : 18);
      ctx.font = 'bold 7.5px sans-serif';
      const textW = ctx.measureText(icLabel).width;
      const totalW = textW + 8;

      ctx.beginPath();
      ctx.roundRect(station.x - totalW / 2, badgeY - 5.5, totalW, 11, 3);
      ctx.fillStyle = isDark ? 'rgba(6, 78, 59, 0.94)' : 'rgba(209, 250, 229, 0.96)';
      ctx.fill();
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 1.0;
      ctx.stroke();

      ctx.fillStyle = isDark ? '#A7F3D0' : '#065F46';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(icLabel, station.x, badgeY);
      ctx.restore();
    }

    // Feature 28: Expo Centre Radiant Aura & Golden Badge
    if (station.isExpoCentre) {
      ctx.save();
      const pulse = 1 + Math.sin(performance.now() / 250) * 0.08;
      const expoRadius = (baseRadius + 16) * pulse;

      // Radiant rotating golden dashed halo
      ctx.beginPath();
      ctx.arc(station.x, station.y, expoRadius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([7, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      const daysLeft = station.expoRemainingDays ?? 7;
      const expoLabel = `🌟 EXPO (${daysLeft}d - $15K)`;
      const badgeY = station.y + baseRadius + (station.specialHubType ? 36 : options.showStationNames ? 24 : 12);
      ctx.font = 'bold 8.5px sans-serif';
      const textW = ctx.measureText(expoLabel).width;
      const totalW = textW + 12;

      ctx.beginPath();
      ctx.roundRect(station.x - totalW / 2, badgeY - 7, totalW, 15, 4);
      ctx.fillStyle = '#D97706';
      ctx.fill();
      ctx.strokeStyle = '#FEF3C7';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(expoLabel, station.x, badgeY);
      ctx.restore();
    }

    // Active Urban Surge Event Ring & Badge
    if (options.activeSurgeEvent && options.activeSurgeEvent.stationId === station.id) {
      ctx.save();
      const pulse = 1 + Math.sin(Date.now() / 150) * 0.12;
      const surgeRadius = (baseRadius + 14) * pulse;

      // Glowing pulsing aura
      ctx.beginPath();
      ctx.arc(station.x, station.y, surgeRadius, 0, Math.PI * 2);
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Surge Event Pill Badge
      const surgeLabel = `🔥 ${options.activeSurgeEvent.titleVi} (3x VÉ)`;
      const badgeY = station.y - baseRadius - (station.isFlooded ? 42 : 24);
      ctx.font = 'bold 9px sans-serif';
      const textW = ctx.measureText(surgeLabel).width;
      const totalW = textW + 12;

      ctx.beginPath();
      ctx.roundRect(station.x - totalW / 2, badgeY - 8, totalW, 16, 5);
      ctx.fillStyle = '#EA580C';
      ctx.fill();
      ctx.strokeStyle = '#FED7AA';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(surgeLabel, station.x, badgeY);
      ctx.restore();
    }

    // Depot Station Badge on Map
    const depotLines = lines.filter(l => (l.depotStationId && l.depotStationId === station.id) || (!l.depotStationId && l.stationIds[0] === station.id && l.stationIds.length >= 2));
    if (depotLines.length > 0) {
      ctx.save();
      const badgeY = station.y - baseRadius - (station.isFlooded ? 40 : (terminusDirY < -0.25 ? 36 : 20));
      const label = '🏢 DEPOT';
      ctx.font = 'bold 8.5px sans-serif';
      const textW = ctx.measureText(label).width;
      const totalBadgeW = textW + 12 + Math.min(3, depotLines.length) * 8;

      ctx.fillStyle = isDark ? '#0F172A' : '#FFFFFF';
      ctx.beginPath();
      ctx.roundRect(station.x - totalBadgeW / 2, badgeY - 7, totalBadgeW, 14, 4);
      ctx.fill();

      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.fillStyle = '#F59E0B';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, station.x - totalBadgeW / 2 + 5, badgeY);

      let dotX = station.x - totalBadgeW / 2 + 5 + textW + 5;
      depotLines.slice(0, 3).forEach(dl => {
        ctx.beginPath();
        ctx.arc(dotX, badgeY, 3, 0, Math.PI * 2);
        ctx.fillStyle = dl.color;
        ctx.fill();
        dotX += 7;
      });

      ctx.restore();
    }

    // --- Metro Line Inspector Visual Highlights on Station ---
    const insp = options.inspectorState;
    if (insp) {
      if (insp.visitedStationIds && insp.visitedStationIds.includes(station.id)) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(station.x, station.y, baseRadius + 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 2.6;
        ctx.stroke();

        const badgeX = station.x + baseRadius + 4;
        const badgeY = station.y - baseRadius - 2;
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, 6.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', badgeX, badgeY);
        ctx.restore();
      }

      // Planned Station route indicator (dashed amber target ring)
      if (
        insp.status === 'patrolling' &&
        insp.plannedStationIds &&
        insp.plannedStationIds.includes(station.id) &&
        (!insp.visitedStationIds || !insp.visitedStationIds.includes(station.id))
      ) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(station.x, station.y, baseRadius + 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([4, 3]);
        ctx.stroke();
        ctx.restore();
      }

      if (insp.status === 'selecting_station') {
        const pulse = 1 + Math.sin(now * 5) * 0.12;
        ctx.save();
        ctx.beginPath();
        ctx.arc(station.x, station.y, (baseRadius + 11) * pulse, 0, Math.PI * 2);
        ctx.strokeStyle = isHovered ? '#F59E0B' : 'rgba(245, 158, 11, 0.45)';
        ctx.lineWidth = isHovered ? 3.5 : 2.0;
        if (!isHovered) {
          ctx.setLineDash([6, 4]);
        }
        ctx.stroke();

        if (isHovered) {
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.roundRect(station.x - 45, station.y - baseRadius - 26, 90, 18, 4);
          ctx.fill();
          ctx.fillStyle = '#0F172A';
          ctx.font = 'bold 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('👮 CHỌN XUẤT PHÁT', station.x, station.y - baseRadius - 17);
        }
        ctx.restore();
      }

      if (
        insp.status === 'patrolling' &&
        insp.currentStationId === station.id &&
        !insp.currentTrainId
      ) {
        const isInspecting = !!(insp.dwellAtStationTimer && insp.dwellAtStationTimer > 0);
        const bob = Math.sin(now * 5) * 3;
        ctx.save();
        ctx.translate(station.x, station.y - baseRadius - 22 + bob);

        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fillStyle = isInspecting ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';
        ctx.fill();

        ctx.fillStyle = isInspecting ? '#10B981' : '#F59E0B';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👮', 0, 1);

        // Circular countdown ring around inspector avatar
        const waitSec = Math.max(0, Math.ceil(insp.stationWaitTimer ?? 40));
        const waitFraction = Math.max(0, Math.min(1, (insp.stationWaitTimer ?? 40) / 40));
        const isUrgent = (insp.stationWaitTimer ?? 40) <= 10;

        ctx.beginPath();
        ctx.arc(0, 0, 14.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * waitFraction);
        ctx.strokeStyle = isUrgent ? (Math.floor(now * 6) % 2 === 0 ? '#EF4444' : '#FFFFFF') : (isInspecting ? '#10B981' : '#F59E0B');
        ctx.lineWidth = 2.4;
        ctx.stroke();

        // Platform status badge (KIỂM TRA GA / CHỜ TÀU KẾ)
        const badgeText = isInspecting ? 'KIỂM TRA GA' : 'CHỜ TÀU KẾ';
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-36, -18, 72, 14, 4);
        ctx.fill();
        ctx.strokeStyle = isInspecting ? '#10B981' : '#F59E0B';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = isInspecting ? '#6EE7B7' : '#FCD34D';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(badgeText, 0, -10.5);

        // Timer badge on top of inspector head:
        // "sẽ hiện ra 1 timer trên đầu thanh tra"
        const timerPillY = -37;
        const timerPillH = 15;
        const timerPillW = 56;
        ctx.fillStyle = '#0F172A';
        ctx.beginPath();
        ctx.roundRect(-timerPillW / 2, timerPillY, timerPillW, timerPillH, 5);
        ctx.fill();
        ctx.strokeStyle = isUrgent
          ? (Math.floor(now * 5) % 2 === 0 ? '#EF4444' : '#FCA5A5')
          : (isInspecting ? '#10B981' : '#F59E0B');
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Progress bar inside timer pill
        ctx.fillStyle = isUrgent ? '#EF4444' : (isInspecting ? '#10B981' : '#F59E0B');
        ctx.fillRect(-timerPillW / 2 + 3, timerPillY + timerPillH - 3, (timerPillW - 6) * waitFraction, 1.8);

        // Timer text
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isUrgent ? '#FCA5A5' : '#FEF08A';
        ctx.fillText(`⏳ ${waitSec}s`, 0, timerPillY + 7);

        ctx.restore();
      }
    }

    ctx.restore();
  };

  // Focus Mode Check: when a line is chosen or actively being drawn, darken map by 50%
  // except for the chosen line's stations, railway track, and trains.
  const isDragging = Boolean(options.dragState && options.dragState.isDragging);
  const activeLineId = (options.dragState && options.dragState.isDragging && options.dragState.lineId)
    || options.selectedLineId
    || null;
  const activeLine = activeLineId ? lines.find(l => l.id === activeLineId) : null;
  const isFocusMode = Boolean(activeLine || isDragging);

  const activeStationIds = new Set<string>();
  if (activeLine) {
    activeLine.stationIds.forEach(id => activeStationIds.add(id));
  }
  if (options.dragState && options.dragState.isDragging) {
    if (options.dragState.fromStationId) activeStationIds.add(options.dragState.fromStationId);
    if (options.dragState.targetStationId) activeStationIds.add(options.dragState.targetStationId);
  }
  if (isDragging && options.hoveredStationId) {
    activeStationIds.add(options.hoveredStationId);
  }

  if (isFocusMode) {
    // 1. Draw inactive lines, trains, and stations behind the 50% dark veil
    lines.filter(l => l.id !== activeLineId).forEach(line => drawSingleTrack(line, false));
    trains.filter(t => t.lineId !== activeLineId).forEach(train => drawSingleTrain(train));
    stations.filter(s => !activeStationIds.has(s.id)).forEach(station => drawSingleStation(station));

    // 2. Darken entire map by 50%
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
    ctx.fillRect(-6000, -6000, width + 12000, height + 12000);
    ctx.restore();

    // 3. Draw active line track, route drag preview, active trains, and active stations at 100% full vibrant brightness
    if (activeLine) {
      drawSingleTrack(activeLine, true);
    }
    drawDragPreview();
    if (activeLineId) {
      trains.filter(t => t.lineId === activeLineId).forEach(train => drawSingleTrain(train));
    }
    stations.filter(s => activeStationIds.has(s.id)).forEach(station => drawSingleStation(station));
  } else {
    // Normal rendering
    lines.forEach(line => drawSingleTrack(line, options.selectedLineId === line.id));
    drawDragPreview();
    trains.forEach(train => drawSingleTrain(train));
    stations.forEach(station => drawSingleStation(station));
  }

  lastRenderedTrains = renderedTrainsList;

  // 5. Draw Floating Money / Reward Pings
  floatingTexts.forEach(ft => {
    ctx.save();
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.fillStyle = ft.color;
    ctx.globalAlpha = Math.max(0, Math.min(1, ft.life));
    ctx.textAlign = 'center';
    ctx.shadowColor = ft.color;
    ctx.shadowBlur = 8;
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  });

  // 6. Draw Weather Overlays (slanted rain streaks & atmospheric storm mist)
  if (options.weather && options.weather.rainIntensity > 0) {
    const intensity = options.weather.rainIntensity;
    const now = performance.now() / 1000;
    const dropCount = Math.floor(intensity * 140);
    ctx.save();
    ctx.strokeStyle = isDark ? 'rgba(186, 230, 253, 0.42)' : 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = options.weather.current === 'storm' ? 1.6 : 1.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const slant = 18;
    const dropLength = 24 * intensity;
    for (let i = 0; i < dropCount; i++) {
      const seed = i * 997.3;
      const speed = 780 + (i % 5) * 110;
      const startX = ((seed * 13.7 + now * 140) % (width + 300)) - 150;
      const startY = ((seed * 29.1 + now * speed) % (height + 150)) - 75;
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX - slant * 0.4, startY + dropLength);
    }
    ctx.stroke();

    // Ambient mood tint during storm / flood
    if (options.weather.current === 'storm' || options.weather.current === 'flooded') {
      ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.12)' : 'rgba(30, 41, 59, 0.08)';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  // 7. Day / Night Ambient Atmospheric Lighting (Subtle, non-distracting)
  if (timeHours >= 16.5 && timeHours < 18.5) {
    // Golden Hour Dusk: subtle warm amber tint
    const duskIntensity = (timeHours - 16.5) / 2.0;
    ctx.save();
    ctx.fillStyle = `rgba(245, 158, 11, ${0.02 + duskIntensity * 0.03})`;
    ctx.fillRect(-1000, -1000, width + 2000, height + 2000);
    ctx.restore();
  } else if (timeHours >= 18.5 || timeHours <= 5.0) {
    // Night Atmosphere: very soft indigo/navy tint
    ctx.save();
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.10)' : 'rgba(30, 41, 59, 0.06)';
    ctx.fillRect(-1000, -1000, width + 2000, height + 2000);
    ctx.restore();
  } else if (timeHours > 5.0 && timeHours < 6.5) {
    // Dawn / Twilight: soft rose-gold tint
    ctx.save();
    ctx.fillStyle = 'rgba(244, 114, 182, 0.03)';
    ctx.fillRect(-1000, -1000, width + 2000, height + 2000);
    ctx.restore();
  }

  // 8. Game Over Overcrowding Focus Vignette (Hinh 6 & Screenshot 6)
  if (options.isGameOver && options.gameOverStationId) {
    const govStation = stations.find(s => s.id === options.gameOverStationId);
    if (govStation) {
      ctx.save();
      const grad = ctx.createRadialGradient(
        govStation.x, govStation.y, 14,
        govStation.x, govStation.y, 170
      );
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      grad.addColorStop(0.40, 'rgba(15, 23, 42, 0.72)');
      grad.addColorStop(0.80, 'rgba(15, 23, 42, 0.90)');
      grad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = grad;
      ctx.fillRect(-2000, -2000, width + 4000, height + 4000);

      // Glowing danger ring around the station
      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(govStation.x, govStation.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

