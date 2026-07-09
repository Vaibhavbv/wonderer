import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getStory, updateStory } from './story-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

const heroBlock = {
  id: 'block_hero',
  type: 'hero',
  position: { x: 0, y: 0, w: 12, h: 6 },
  content: { title: 'Japan', subtitle: '', overlayOpacity: 0.4 },
};

describe('story-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('getStory returns the story with its blocks', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { id: 's1', tripId: 'trip-1', blocks: [heroBlock], version: 1 } }),
    );

    const story = await getStory('token', 'trip-1');

    expect(story.blocks[0].type).toBe('hero');
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('/v1/trips/trip-1/story');
  });

  it('updateStory PUTs the full block list and returns the bumped version', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { id: 's1', blocks: [heroBlock], version: 2 } }),
    );

    const story = await updateStory('token', 'trip-1', { blocks: [heroBlock] });

    expect(story.version).toBe(2);
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify({ blocks: [heroBlock] }));
  });

  it('updateStory surfaces permission errors as ApiError', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { message: 'Forbidden' } }, 403),
    );

    await expect(updateStory('token', 'trip-1', { blocks: [] })).rejects.toThrow(ApiError);
  });
});
