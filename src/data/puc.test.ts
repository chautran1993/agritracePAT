import { describe, expect, it } from 'vitest';
import { generatePUC, changePucMarket, pucPattern } from './puc';
describe('PUC allocation', () => {
  it('allocates the first export code', () => {
    expect(generatePUC({ provinceCode: '80', cropCode: 'LUA001', market: 'USA' })).toBe(
      '80-PUC-LUA001-000001-USA',
    );
  });
  it('allocates a domestic code', () => {
    expect(generatePUC({ provinceCode: '80', cropCode: 'LUA001' })).toBe('80-PUC-LUA001-000001');
  });
  it('never reuses a revoked sequence', () => {
    expect(
      generatePUC({ provinceCode: '80', cropCode: 'LUA001' }, [
        { puc_code: '80-PUC-LUA001-000001-USA', status: 'revoked' },
      ]),
    ).toBe('80-PUC-LUA001-000002');
  });
  it('changes only the export suffix', () => {
    const code = changePucMarket('80-PUC-LUA001-000001-USA', 'CHN');
    expect(code).toBe('80-PUC-LUA001-000001-CHN');
    expect(pucPattern.test(code)).toBe(true);
  });
});
