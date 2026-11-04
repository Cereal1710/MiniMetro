import { Station, MetroLine, StationShape } from '../types/game';

export interface RouteStep {
  stationId: string;
  lineId: string;
}

/**
 * Checks if a station matches the passenger's destination.
 * Matches exact targetStationId if specified, or targetShape.
 */
export function isMatchingDestination(
  station: Station,
  targetShape: StationShape,
  targetStationId?: string
): boolean {
  if (targetStationId && station.id === targetStationId) return true;
  return station.shape === targetShape;
}

/**
 * Checks if a train heading in `trainDirection` can reach `targetStationId` along `line`.
 * If it's a loop line, train can reach all stations.
 * If linear line:
 * - Forward direction check: `(targetIdx - currIdx) * trainDirection > 0`
 * - Terminus turnaround: if destination is behind, but train is within 2 stops of terminus,
 *   or line is short (<= 4 stations), or only 1 train on the line, turnaround is imminent.
 */
export function canTrainReachStationOnLine(
  line: MetroLine,
  trainDirection: 1 | -1,
  currentStationId: string,
  targetStationId: string,
  trainCountOnLine: number = 1
): boolean {
  if (line.isLoop) return true;

  const currIdx = line.stationIds.indexOf(currentStationId);
  const targetIdx = line.stationIds.indexOf(targetStationId);
  if (currIdx === -1 || targetIdx === -1) return false;

  // Direct forward direction along the track
  if ((targetIdx - currIdx) * trainDirection > 0) {
    return true;
  }

  // Target is behind in index, check if turnaround at terminus is near
  const distToTerminus = trainDirection === 1
    ? (line.stationIds.length - 1 - currIdx)
    : currIdx;

  if (distToTerminus <= 2 || line.stationIds.length <= 4 || trainCountOnLine <= 1) {
    return true;
  }

  return false;
}

/**
 * Checks if a passenger waiting at `currentStationId` can board the arriving train on `line`.
 */
export function canPassengerBoard(
  currentStationId: string,
  line: MetroLine,
  trainDirection: 1 | -1,
  passenger: { targetShape: StationShape; targetStationId?: string },
  stations: Station[],
  lines: MetroLine[],
  trainCountOnLine: number = 1
): boolean {
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));
  const currentStation = stationMap.get(currentStationId);
  if (!currentStation) return false;

  // Already at destination
  if (isMatchingDestination(currentStation, passenger.targetShape, passenger.targetStationId)) {
    return false;
  }

  // 1. Direct Route Check: Does this line directly have a station matching destination?
  const matchingStationIds = line.stationIds.filter(sId => {
    if (sId === currentStationId) return false;
    const st = stationMap.get(sId);
    return st && isMatchingDestination(st, passenger.targetShape, passenger.targetStationId);
  });

  if (matchingStationIds.length > 0) {
    // If any matching station can be reached in this travel direction or imminent turnaround
    const canReach = matchingStationIds.some(targetId =>
      canTrainReachStationOnLine(line, trainDirection, currentStationId, targetId, trainCountOnLine)
    );
    if (canReach) return true;
  }

  // 2. Transfer Route Check: Does this line connect to an interchange station
  // that can transfer to another line leading to the destination?
  const lineInterchangeStationIds = line.stationIds.filter(sId => {
    if (sId === currentStationId) return false;
    // Check if reachable by this train
    if (!canTrainReachStationOnLine(line, trainDirection, currentStationId, sId, trainCountOnLine)) {
      return false;
    }
    // Has other lines passing through it
    return lines.some(l => l.id !== line.id && l.stationIds.includes(sId));
  });

  if (lineInterchangeStationIds.length === 0) {
    return false;
  }

  // BFS from interchange stations to find if destination is reachable via other lines
  const visitedLines = new Set<string>();
  visitedLines.add(line.id);

  let currentTierLines: MetroLine[] = [];
  for (const xStationId of lineInterchangeStationIds) {
    for (const l of lines) {
      if (!visitedLines.has(l.id) && l.stationIds.includes(xStationId)) {
        visitedLines.add(l.id);
        currentTierLines.push(l);
      }
    }
  }

  // Check up to 3 transfer tiers
  for (let tier = 0; tier < 3; tier++) {
    if (currentTierLines.length === 0) break;

    // Check if any line in currentTier reaches the destination directly
    for (const l of currentTierLines) {
      const hasDest = l.stationIds.some(sId => {
        const st = stationMap.get(sId);
        return st && isMatchingDestination(st, passenger.targetShape, passenger.targetStationId);
      });
      if (hasDest) return true;
    }

    // Next tier: expand to connecting lines
    const nextTierLines: MetroLine[] = [];
    for (const l of currentTierLines) {
      for (const sId of l.stationIds) {
        for (const nextLine of lines) {
          if (!visitedLines.has(nextLine.id) && nextLine.stationIds.includes(sId)) {
            visitedLines.add(nextLine.id);
            nextTierLines.push(nextLine);
          }
        }
      }
    }
    currentTierLines = nextTierLines;
  }

  return false;
}

/**
 * Checks if a passenger currently on `currentLine` arriving at `stationId` should alight to transfer.
 * Returns false if the current line already directly reaches the destination!
 */
export function shouldPassengerAlightToTransfer(
  stationId: string,
  currentLine: MetroLine,
  passenger: { targetShape: StationShape; targetStationId?: string },
  stations: Station[],
  lines: MetroLine[]
): boolean {
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));

  // 1. NEVER alight to transfer if current line already reaches the destination!
  const hasDirectOnThisLine = currentLine.stationIds.some(sId => {
    if (sId === stationId) return false;
    const st = stationMap.get(sId);
    return st && isMatchingDestination(st, passenger.targetShape, passenger.targetStationId);
  });

  if (hasDirectOnThisLine) {
    return false;
  }

  // 2. We need to transfer. Are there other lines at this station that can take passenger closer?
  const otherLinesAtStation = lines.filter(l => l.id !== currentLine.id && l.stationIds.includes(stationId));
  if (otherLinesAtStation.length === 0) {
    return false; // No transfers available here, stay on train
  }

  // Check if any of these other lines reaches the destination (directly or via transfers)
  for (const otherLine of otherLinesAtStation) {
    const otherHasDirect = otherLine.stationIds.some(sId => {
      const st = stationMap.get(sId);
      return st && isMatchingDestination(st, passenger.targetShape, passenger.targetStationId);
    });
    if (otherHasDirect) return true;

    // Check if otherLine connects to destination via transfers
    const canReach = canPassengerBoard(
      stationId,
      otherLine,
      1,
      passenger,
      stations,
      lines,
      otherLine.trains?.length || 1
    );
    if (canReach) return true;
  }

  return false;
}

/**
 * Legacy compatibility: Finds the best next station and line for a passenger at currentStationId
 * to reach targetShape or targetStationId.
 */
export function findNextTransitStep(
  currentStationId: string,
  targetShape: StationShape,
  stations: Station[],
  lines: MetroLine[],
  targetStationId?: string
): { nextStationId: string; lineId: string; isFinalDestination: boolean } | null {
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));
  const currentStation = stationMap.get(currentStationId);
  if (!currentStation) return null;

  if (isMatchingDestination(currentStation, targetShape, targetStationId)) return null;

  // Build adjacency graph: stationId -> list of { neighborId, lineId }
  const adj = new Map<string, { neighborId: string; lineId: string }[]>();
  for (const s of stations) {
    adj.set(s.id, []);
  }

  for (const line of lines) {
    const sIds = line.stationIds;
    for (let i = 0; i < sIds.length - 1; i++) {
      const u = sIds[i];
      const v = sIds[i + 1];
      adj.get(u)?.push({ neighborId: v, lineId: line.id });
      adj.get(v)?.push({ neighborId: u, lineId: line.id });
    }
    if (line.isLoop && sIds.length > 2) {
      const u = sIds[sIds.length - 1];
      const v = sIds[0];
      adj.get(u)?.push({ neighborId: v, lineId: line.id });
      adj.get(v)?.push({ neighborId: u, lineId: line.id });
    }
  }

  const visited = new Set<string>();
  visited.add(currentStationId);

  const queue: {
    stationId: string;
    firstStep: { nextStationId: string; lineId: string } | null;
  }[] = [{ stationId: currentStationId, firstStep: null }];

  while (queue.length > 0) {
    const { stationId, firstStep } = queue.shift()!;
    const st = stationMap.get(stationId);

    if (st && isMatchingDestination(st, targetShape, targetStationId) && firstStep) {
      const isFinal = firstStep.nextStationId === stationId;
      return {
        nextStationId: firstStep.nextStationId,
        lineId: firstStep.lineId,
        isFinalDestination: isFinal
      };
    }

    const neighbors = adj.get(stationId) || [];
    for (const { neighborId, lineId } of neighbors) {
      if (!visited.has(neighborId)) {
        visited.add(neighborId);
        queue.push({
          stationId: neighborId,
          firstStep: firstStep || { nextStationId: neighborId, lineId }
        });
      }
    }
  }

  return null;
}
