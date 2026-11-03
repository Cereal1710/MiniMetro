import { MetroEngine } from '../src/simulation/metroEngine';
import { CITY_MAPS } from '../src/data/maps';

const HANOI_CONFIG = CITY_MAPS[0];

// Mock localStorage
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

console.log('--- Testing Insert Station Into Segment (Mini Metro signature drag mechanic) ---');

const engine = new MetroEngine(HANOI_CONFIG, 'creative');

// Ensure we have at least 3 stations
if (engine.state.stations.length < 3) {
  engine.createCustomStation('Ga A', 'circle', 200, 200, 0);
  engine.createCustomStation('Ga B', 'triangle', 400, 300, 0);
  engine.createCustomStation('Ga C', 'square', 600, 200, 0);
}

const stA = engine.state.stations[0];
const stB = engine.state.stations[1];
const stC = engine.state.stations[2];

console.log(`Using stations: A=${stA.name} (${stA.id}), B=${stB.name} (${stB.id}), C=${stC.name} (${stC.id})`);

// 1. Create a line connecting A directly to C
const line = engine.connectStations(stA.id, stC.id);
if (!line) {
  throw new Error('Failed to create line between A and C');
}

console.log('Initial line route:', line.stationIds);
if (line.stationIds[0] !== stA.id || line.stationIds[1] !== stC.id) {
  throw new Error(`Expected [A, C], got ${JSON.stringify(line.stationIds)}`);
}

// 2. Drag/insert Station B into the segment between A and C
const insertRes = engine.insertStationIntoSegment(line.id, stA.id, stC.id, stB.id);
console.log('insertStationIntoSegment result:', insertRes);
if (!insertRes.success) {
  throw new Error(`Insert failed: ${insertRes.reason}`);
}

console.log('Updated line route after insert:', line.stationIds);
if (line.stationIds.length !== 3 || line.stationIds[0] !== stA.id || line.stationIds[1] !== stB.id || line.stationIds[2] !== stC.id) {
  throw new Error(`Expected route [A, B, C], got ${JSON.stringify(line.stationIds)}`);
}

// 3. Test duplicate insertion prevention
const dupRes = engine.insertStationIntoSegment(line.id, stA.id, stB.id, stB.id);
console.log('Duplicate insertion prevention result:', dupRes);
if (dupRes.success) {
  throw new Error('Duplicate insertion should have been rejected!');
}

// 4. Test persistence after segment insertion
MetroEngine.saveToStorage(engine);
const reloaded = MetroEngine.loadFromStorage(HANOI_CONFIG.id, HANOI_CONFIG);
if (!reloaded) throw new Error('Failed to reload from storage');
const reloadedLine = reloaded.state.lines.find(l => l.id === line.id);
if (!reloadedLine) throw new Error('Reloaded line not found');
console.log('Reloaded line route:', reloadedLine.stationIds);
if (reloadedLine.stationIds.length !== 3 || reloadedLine.stationIds[1] !== stB.id) {
  throw new Error(`Reloaded route mismatch! Expected [A, B, C], got ${JSON.stringify(reloadedLine.stationIds)}`);
}

console.log('✅ ALL INSERT STATION INTO SEGMENT TESTS PASSED!');
