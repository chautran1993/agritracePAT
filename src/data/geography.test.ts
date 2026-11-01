import { expect, it } from 'vitest';
import { resolveAdministrativeArea } from './geography';
it('resolves the supplied Tan Hung coordinate to the two-level address', () => {
  expect(resolveAdministrativeArea(10.8629774, 105.6600599)).toEqual({
    province: 'Tây Ninh',
    provinceCode: '80',
    commune: 'Tân Hưng',
  });
});
it('does not invent an address outside configured coverage', () => {
  expect(() => resolveAdministrativeArea(0, 0)).toThrow();
});
