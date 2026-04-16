import { describe, it, expect } from 'vitest';
import { getBadgeColor } from '../utils/badge';

describe('getBadgeColor', () => {
  it('returns green for 10 or fewer tabs', () => {
    expect(getBadgeColor(0)).toBe('#4DAB9A');
    expect(getBadgeColor(5)).toBe('#4DAB9A');
    expect(getBadgeColor(10)).toBe('#4DAB9A');
  });

  it('returns amber for 11-20 tabs', () => {
    expect(getBadgeColor(11)).toBe('#DFAB01');
    expect(getBadgeColor(15)).toBe('#DFAB01');
    expect(getBadgeColor(20)).toBe('#DFAB01');
  });

  it('returns red for 21+ tabs', () => {
    expect(getBadgeColor(21)).toBe('#EB5757');
    expect(getBadgeColor(100)).toBe('#EB5757');
  });
});
