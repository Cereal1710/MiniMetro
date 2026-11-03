import { RiverPolygon, Station } from '../types/game';

export interface Point {
  x: number;
  y: number;
}

export function distance(p1: Point, p2: Point): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates shortest squared distance from point p to line segment vw
 */
export function distToSegmentSquared(p: Point, v: Point, w: Point): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
}

/**
 * Calculates shortest Euclidean distance from point p to line segment vw
 */
export function distToSegment(p: Point, v: Point, w: Point): number {
  return Math.sqrt(distToSegmentSquared(p, v, w));
}

// Line segment intersection
function ccw(A: Point, B: Point, C: Point) {
  return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
}

export function linesIntersect(A: Point, B: Point, C: Point, D: Point): boolean {
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D);
}

// Point in polygon test (ray casting algorithm)
export function isPointInPolygon(pt: Point, polyPts: Point[]): boolean {
  let inside = false;
  const n = polyPts.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polyPts[i].x;
    const yi = polyPts[i].y;
    const xj = polyPts[j].x;
    const yj = polyPts[j].y;
    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check if a point is over water (inside any river and NOT on an island)
export function isPointInWater(pt: Point, rivers: RiverPolygon[]): boolean {
  for (const river of rivers) {
    if (river.isIsland) {
      if (isPointInPolygon(pt, river.points)) return false; // on island => land
    }
  }
  for (const river of rivers) {
    if (!river.isIsland && isPointInPolygon(pt, river.points)) {
      return true;
    }
  }
  return false;
}

// Check if a line segment crosses any polygon edge of a river
export function segmentCrossesRiver(p1: Point, p2: Point, rivers: RiverPolygon[]): boolean {
  for (const river of rivers) {
    const pts = river.points;
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const pA = pts[i];
      const pB = pts[(i + 1) % n];
      if (linesIntersect(p1, p2, pA, pB)) {
        return true;
      }
    }
  }
  return false;
}

// Perpendicular unit vector for parallel lines
export function getPerpendicularOffset(p1: Point, p2: Point, offsetDistance: number): Point {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 0, y: 0 };
  
  // Normal vector (-dy, dx)
  const nx = -dy / len;
  const ny = dx / len;
  return {
    x: nx * offsetDistance,
    y: ny * offsetDistance
  };
}

// Interpolate position along segment
export function lerpPoint(p1: Point, p2: Point, t: number): Point {
  return {
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
  };
}

// Track routing style options
export type TrackRoutingStyle = 'curved' | 'octolinear' | 'straight';

export interface SampledTrackPoint extends Point {
  angle: number;
  cumulativeDist: number;
}

export interface TrackPolyline {
  points: Point[];
  totalLength: number;
  cumDists: number[];
}

/**
 * Generate smooth cubic Bezier sampled points between p0 and p3 with control points p1 and p2
 */
export function sampleCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, steps = 18): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x;
    const y = mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Generate smooth quadratic Bezier sampled points for rounded corners/fillets
 */
export function sampleQuadraticBezier(p0: Point, p1: Point, p2: Point, steps = 8): Point[] {
  const pts: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    const x = mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x;
    const y = mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y;
    pts.push({ x, y });
  }
  return pts;
}

/**
 * Generate smooth curved track between pA and pB with optional tangent hints
 */
export function generateCurvedTrackPoints(
  pA: Point,
  pB: Point,
  tangentA?: Point,
  tangentB?: Point
): Point[] {
  const dx = pB.x - pA.x;
  const dy = pB.y - pA.y;
  const dist = Math.hypot(dx, dy);

  if (dist < 10) {
    return [pA, pB];
  }

  let c1: Point;
  let c2: Point;

  if (tangentA && tangentB) {
    const tension = Math.min(dist * 0.4, 80);
    c1 = { x: pA.x + tangentA.x * tension, y: pA.y + tangentA.y * tension };
    c2 = { x: pB.x - tangentB.x * tension, y: pB.y - tangentB.y * tension };
  } else {
    // Natural organic S-curve along the dominant axis
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx >= absDy) {
      c1 = { x: pA.x + dx * 0.5, y: pA.y };
      c2 = { x: pA.x + dx * 0.5, y: pB.y };
    } else {
      c1 = { x: pA.x, y: pA.y + dy * 0.5 };
      c2 = { x: pB.x, y: pA.y + dy * 0.5 };
    }
  }

  const steps = Math.max(12, Math.min(32, Math.floor(dist / 14)));
  return sampleCubicBezier(pA, c1, c2, pB, steps);
}

/**
 * Generate octolinear (0°, 45°, 90°) track between pA and pB with smooth rounded fillet bends
 */
export function generateOctolinearTrackPoints(
  pA: Point,
  pB: Point,
  filletRadius = 22
): Point[] {
  const dx = pB.x - pA.x;
  const dy = pB.y - pA.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // If already roughly straight or 45-degree aligned
  if (absDx < 4 || absDy < 4 || Math.abs(absDx - absDy) < 6) {
    return [pA, pB];
  }

  // Intermediate bend point M
  let M: Point;
  if (absDx > absDy) {
    // 45° diagonal first, then horizontal
    M = {
      x: pA.x + Math.sign(dx) * absDy,
      y: pA.y + dy
    };
  } else {
    // 45° diagonal first, then vertical
    M = {
      x: pA.x + dx,
      y: pA.y + Math.sign(dy) * absDx
    };
  }

  const d1 = distance(pA, M);
  const d2 = distance(M, pB);
  const r = Math.min(filletRadius, d1 * 0.42, d2 * 0.42);

  if (r < 6) {
    return [pA, M, pB];
  }

  // Smooth fillet corner at M
  const cornerStart = lerpPoint(M, pA, r / d1);
  const cornerEnd = lerpPoint(M, pB, r / d2);
  const filletPts = sampleQuadraticBezier(cornerStart, M, cornerEnd, 8);

  const result: Point[] = [pA];
  for (const pt of filletPts) {
    result.push(pt);
  }
  result.push(pB);
  return result;
}

/**
 * Generate polyline for a segment based on the active routing style
 */
export function generateTrackSegmentPoints(
  pA: Point,
  pB: Point,
  style: TrackRoutingStyle = 'octolinear',
  tangentA?: Point,
  tangentB?: Point
): Point[] {
  if (style === 'straight') {
    return [pA, pB];
  }
  if (style === 'curved') {
    return generateCurvedTrackPoints(pA, pB, tangentA, tangentB);
  }
  // Default: 45-degree octolinear track with smooth rounded bends
  return generateOctolinearTrackPoints(pA, pB);
}

/**
 * Build a TrackPolyline with precomputed cumulative distances
 */
export function buildTrackPolyline(points: Point[]): TrackPolyline {
  if (points.length === 0) {
    return { points: [], totalLength: 0, cumDists: [] };
  }
  const cumDists: number[] = [0];
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    const d = distance(points[i - 1], points[i]);
    totalLength += d;
    cumDists.push(totalLength);
  }
  return { points, totalLength, cumDists };
}

/**
 * Sample exact position and heading angle along a polyline at a given distance
 */
export function samplePolylineAtDistance(
  poly: TrackPolyline,
  targetDist: number
): { x: number; y: number; angle: number } {
  const pts = poly.points;
  const n = pts.length;
  if (n === 0) return { x: 0, y: 0, angle: 0 };
  if (n === 1) return { x: pts[0].x, y: pts[0].y, angle: 0 };

  const totalLen = poly.totalLength;
  const clampedDist = Math.max(0, Math.min(totalLen, targetDist));

  // Find segment containing clampedDist
  const cum = poly.cumDists;
  let idx = 0;
  while (idx < n - 1 && cum[idx + 1] < clampedDist) {
    idx++;
  }

  const p1 = pts[idx];
  const p2 = pts[Math.min(idx + 1, n - 1)];
  const segStart = cum[idx];
  const segEnd = cum[Math.min(idx + 1, n - 1)];
  const segLen = segEnd - segStart;

  const t = segLen > 0.0001 ? (clampedDist - segStart) / segLen : 0;
  const x = p1.x + (p2.x - p1.x) * t;
  const y = p1.y + (p2.y - p1.y) * t;
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

  return { x, y, angle };
}

// Format currency
export function formatMoney(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}

export function computeLineColors(hex: string): { color: string; darkColor: string; textColor: string } {
  let clean = hex.trim();
  if (!clean.startsWith('#')) clean = '#' + clean;

  let r = 239, g = 68, b = 68;
  const raw = clean.replace('#', '');
  if (raw.length === 3) {
    r = parseInt(raw[0] + raw[0], 16) || 0;
    g = parseInt(raw[1] + raw[1], 16) || 0;
    b = parseInt(raw[2] + raw[2], 16) || 0;
  } else if (raw.length === 6) {
    r = parseInt(raw.substring(0, 2), 16) || 0;
    g = parseInt(raw.substring(2, 4), 16) || 0;
    b = parseInt(raw.substring(4, 6), 16) || 0;
  }

  const darkR = Math.max(0, Math.floor(r * 0.65)).toString(16).padStart(2, '0');
  const darkG = Math.max(0, Math.floor(g * 0.65)).toString(16).padStart(2, '0');
  const darkB = Math.max(0, Math.floor(b * 0.65)).toString(16).padStart(2, '0');
  const darkColor = `#${darkR}${darkG}${darkB}`;

  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const textColor = lum > 0.65 ? '#0F172A' : '#FFFFFF';

  return { color: clean, darkColor, textColor };
}

/**
 * Calculate total length of a metro line in kilometers based on station coordinates
 * Scale: 100 pixels ≈ 1.0 km (1 px = 10 meters)
 */
export function calculateLineLengthKm(
  stationIds: string[],
  isLoop: boolean,
  stationMap: Map<string, Station> | Station[]
): number {
  if (!stationIds || stationIds.length < 2) return 0;
  const map = Array.isArray(stationMap) ? new Map(stationMap.map(s => [s.id, s])) : stationMap;
  let totalPixels = 0;
  for (let i = 0; i < stationIds.length - 1; i++) {
    const s1 = map.get(stationIds[i]);
    const s2 = map.get(stationIds[i + 1]);
    if (s1 && s2) {
      totalPixels += distance(s1, s2);
    }
  }
  if (isLoop && stationIds.length >= 3) {
    const sLast = map.get(stationIds[stationIds.length - 1]);
    const sFirst = map.get(stationIds[0]);
    if (sLast && sFirst) {
      totalPixels += distance(sLast, sFirst);
    }
  }
  return Number((totalPixels * 0.01).toFixed(1));
}
