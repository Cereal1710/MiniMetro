import { MetroEngine } from '../src/simulation/metroEngine';
import { CITY_MAPS } from '../src/data/maps';

const HANOI_CONFIG = CITY_MAPS[0];

// Mock localStorage for Node test environment
const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); }
};

console.log('--- Testing Transit Ad Contract Persistence ---');

// 1. Create engine and buy contract
const engine1 = new MetroEngine(HANOI_CONFIG, 'creative');
console.log('Initial contract:', engine1.state.stats.hasTransitAdContract, 'days:', engine1.state.stats.transitAdDaysRemaining);
if (engine1.state.stats.hasTransitAdContract) {
  throw new Error('Initial contract should be false');
}

const buyOk = engine1.buyTransitAdContract();
console.log('Purchased contract successfully:', buyOk);
if (!buyOk || !engine1.state.stats.hasTransitAdContract || engine1.state.stats.transitAdDaysRemaining !== 7) {
  throw new Error('Contract purchase failed or days != 7');
}

// 2. Save to storage
MetroEngine.saveToStorage(engine1);
const savedRaw = localStorage.getItem(`mini_metro_save_${HANOI_CONFIG.id}`);
console.log('Saved to storage payload exists:', !!savedRaw);
if (!savedRaw) {
  throw new Error('Failed to save to localStorage');
}

// 3. Simulate reload via loadFromStorage
const engine2 = MetroEngine.loadFromStorage(HANOI_CONFIG.id, HANOI_CONFIG);
if (!engine2) {
  throw new Error('Failed to loadFromStorage');
}

console.log('Reloaded contract state:', engine2.state.stats.hasTransitAdContract);
console.log('Reloaded days remaining:', engine2.state.stats.transitAdDaysRemaining);

if (!engine2.state.stats.hasTransitAdContract) {
  throw new Error('FAIL: hasTransitAdContract was NOT restored after reload!');
}
if (engine2.state.stats.transitAdDaysRemaining !== 7) {
  throw new Error(`FAIL: transitAdDaysRemaining is ${engine2.state.stats.transitAdDaysRemaining}, expected 7`);
}

// 4. Test day advance in reloaded engine
(engine2 as any).state.timeOfDayHours = 23.99;
engine2.update(1.0);
console.log('After passing midnight, remaining days:', engine2.state.stats.transitAdDaysRemaining);
if (engine2.state.stats.transitAdDaysRemaining !== 6) {
  throw new Error(`FAIL: transitAdDaysRemaining should be 6 after 1 day, got ${engine2.state.stats.transitAdDaysRemaining}`);
}

// 5. Save again and reload again
MetroEngine.saveToStorage(engine2);
const engine3 = MetroEngine.loadFromStorage(HANOI_CONFIG.id, HANOI_CONFIG);
if (!engine3) throw new Error('Failed to reload second time');
if (engine3.state.stats.transitAdDaysRemaining !== 6) {
  throw new Error(`FAIL: Second reload days remaining should be 6, got ${engine3.state.stats.transitAdDaysRemaining}`);
}

console.log('✅ ALL TRANSIT AD CONTRACT PERSISTENCE TESTS PASSED!');
