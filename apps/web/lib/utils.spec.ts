import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  cn,
  formatDate,
  formatRelativeDate,
  formatFileSize,
  generateTripSlug,
  mediaSrc,
  easeOutCubic,
  easeInOutCubic,
  lerp,
  clamp,
  mapRange,
} from './utils';

describe('cn', () => {
  it('merges class names and resolves tailwind conflicts', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });
});

describe('formatDate', () => {
  it('formats a date as a long US-style date', () => {
    expect(formatDate('2024-03-15T00:00:00Z')).toBe('March 15, 2024');
  });
});

describe('formatRelativeDate', () => {
  const now = new Date('2024-03-15T12:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for the current day', () => {
    expect(formatRelativeDate(now)).toBe('Today');
  });

  it('returns "Yesterday" for one day ago', () => {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(yesterday)).toBe('Yesterday');
  });

  it('returns "N days ago" for less than a week', () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns "N weeks ago" for less than a month', () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
  });

  it('falls back to formatDate for a month or more', () => {
    const monthsAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
    expect(formatRelativeDate(monthsAgo)).toBe(formatDate(monthsAgo));
  });
});

describe('formatFileSize', () => {
  it('returns "0 B" for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2 KB');
  });

  it('formats megabytes with decimals', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
  });
});

describe('generateTripSlug', () => {
  it('lowercases and hyphenates a title', () => {
    expect(generateTripSlug('My Trip to Japan')).toBe('my-trip-to-japan');
  });

  it('strips punctuation', () => {
    expect(generateTripSlug("Italy: Rome & Venice!")).toBe('italy-rome-venice');
  });

  it('collapses repeated separators and trims leading/trailing hyphens', () => {
    expect(generateTripSlug('  --Paris__France--  ')).toBe('paris-france');
  });
});

describe('mediaSrc', () => {
  const original = 'https://cdn.example.com/original.jpg';

  it('falls back to originalUrl when there are no variants (real uploads)', () => {
    expect(mediaSrc({ variants: null, originalUrl: original })).toBe(original);
    expect(mediaSrc({ originalUrl: original })).toBe(original);
  });

  it('prefers the requested variant when present', () => {
    const media = {
      originalUrl: original,
      variants: {
        large: { url: 'l.jpg' },
        medium: { url: 'm.jpg' },
        thumbnail: { url: 't.jpg' },
      },
    };
    expect(mediaSrc(media)).toBe('l.jpg');
    expect(mediaSrc(media, 'medium')).toBe('m.jpg');
    expect(mediaSrc(media, 'thumbnail')).toBe('t.jpg');
  });

  it('falls through to the next available size before originalUrl', () => {
    const media = { originalUrl: original, variants: { medium: { url: 'm.jpg' } } };
    expect(mediaSrc(media, 'large')).toBe('m.jpg');
    expect(mediaSrc(media, 'thumbnail')).toBe('m.jpg');
  });
});

describe('easeOutCubic', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });
});

describe('easeInOutCubic', () => {
  it('starts at 0, hits the midpoint at 0.5, and ends at 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });
});

describe('lerp', () => {
  it('interpolates linearly between start and end', () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
  });
});

describe('clamp', () => {
  it('clamps values within the given range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('mapRange', () => {
  it('maps a value from one range to another', () => {
    expect(mapRange(5, 0, 10, 0, 100)).toBe(50);
    expect(mapRange(0, 0, 10, 0, 100)).toBe(0);
    expect(mapRange(10, 0, 10, 0, 100)).toBe(100);
  });
});
