import { describe, it, expect } from 'vitest';
import { validSession, returnPath, IDLE_MS } from './auth';
describe('mock authentication session', () => {
  it('rejects expired, future, corrupted and unknown-account sessions', () => {
    const now = 10000000,
      session = { username: 'quanly', role: 'quanly', lastActivityAt: now };
    expect(validSession(session, now)).toBe(true);
    expect(validSession({ ...session, lastActivityAt: now - IDLE_MS }, now)).toBe(false);
    expect(validSession({ ...session, lastActivityAt: now + 1 }, now)).toBe(false);
    expect(validSession({ ...session, username: 'admin' }, now)).toBe(false);
    expect(validSession(null, now)).toBe(false);
  });
  it('allows local return paths and rejects external or authentication loops', () => {
    expect(returnPath('/plots/T015?tab=overview#logs')).toBe('/plots/T015?tab=overview#logs');
    expect(returnPath('/role-selection')).toBe('/role-selection');
    for (const path of ['//evil.example', 'https://evil.example', '/login?x=y', null])
      expect(returnPath(path)).toBe('/dashboard');
  });
});
