import { Station, MetroLine, StationShape } from '../types/game';

export interface RouteStep {
  stationId: string;
  lineId: string;
}

/**
 * Finds the best next station and line for a passenger at currentStationId
 * to reach any station with targetShape.
 * Uses Breadth-First Search (BFS) over the line network.
 */
export function findNextTransitStep(
  currentStationId: string,
  targetShape: StationShape,
  stations: Station[],
  lines: MetroLine[]
): { nextStationId: string; lineId: string; isFinalDestination: boolean } | null {
  const stationMap = new Map<string, Station>(stations.map(s => [s.id, s]));
  const currentStation = stationMap.get(currentStationId);
  if (!currentStation) return null;

  // If already at target shape (rare edge case)
  if (currentStation.shape === targetShape) return null;

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
    // If closed loop
    if (line.isLoop && sIds.length > 2) {
      const u = sIds[sIds.length - 1];
      const v = sIds[0];
      adj.get(u)?.push({ neighborId: v, lineId: line.id });
      adj.get(v)?.push({ neighborId: u, lineId: line.id });
    }
  }

  // BFS Queue: [stationId, firstStep: { nextStationId, lineId } | null]
  const visited = new Set<string>();
  visited.add(currentStationId);

  const queue: {
    stationId: string;
    firstStep: { nextStationId: string; lineId: string } | null;
  }[] = [{ stationId: currentStationId, firstStep: null }];

  while (queue.length > 0) {
    const { stationId, firstStep } = queue.shift()!;
    const st = stationMap.get(stationId);

    // If reached a station with the desired target shape
    if (st && st.shape === targetShape && firstStep) {
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
