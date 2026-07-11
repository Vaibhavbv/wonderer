import { describe, it, expect, beforeEach, vi } from 'vitest';
import { likeTrip, unlikeTrip, createTrip, getTrip, deleteTrip, addLocation, reorderLocations } from './trip-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('trip-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('likeTrip', () => {
    it('POSTs to the like endpoint with auth header and returns liked data', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { liked: true } }));

      const result = await likeTrip('token-123', 'trip-1');

      expect(result).toEqual({ liked: true });
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(url).toContain('/v1/trips/trip-1/like');
      expect(init?.method).toBe('POST');
      expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer token-123');
    });

    it('throws ApiError with the server message when the request fails', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ success: false, error: { message: 'Already liked' } }, 409),
      );

      await expect(likeTrip('token-123', 'trip-1')).rejects.toThrow(ApiError);
      await expect(likeTrip('token-123', 'trip-1')).rejects.toThrow('Already liked');
    });

    it('falls back to a generic message when the body has no error message', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse(null, 500));

      await expect(likeTrip('token-123', 'trip-1')).rejects.toThrow('Request failed (500)');
    });
  });

  describe('unlikeTrip', () => {
    it('DELETEs the like endpoint and returns liked:false', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { liked: false } }));

      const result = await unlikeTrip('token-123', 'trip-1');

      expect(result).toEqual({ liked: false });
      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(init?.method).toBe('DELETE');
    });
  });

  describe('createTrip', () => {
    it('sends a JSON-encoded body with content-type and auth headers', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 'trip-1' } }));

      await createTrip('token-123', { title: 'Japan' });

      const [, init] = vi.mocked(fetch).mock.calls[0];
      expect(init?.method).toBe('POST');
      expect(init?.body).toBe(JSON.stringify({ title: 'Japan' }));
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    });

    it('throws ApiError on a non-success response', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ success: false, error: { message: 'Quota exceeded' } }, 403),
      );

      await expect(createTrip('token-123', { title: 'Japan' })).rejects.toThrow('Quota exceeded');
    });
  });

  describe('deleteTrip', () => {
    it('resolves on a body-less 204 response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('no body');
        },
      } as unknown as Response);

      await expect(deleteTrip('token-123', 'trip-1')).resolves.toBeUndefined();
    });

    it('throws ApiError when the delete is forbidden', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ success: false, error: { message: 'Only the owner can delete a trip' } }, 403),
      );

      await expect(deleteTrip('token-123', 'trip-1')).rejects.toThrow('Only the owner can delete a trip');
    });
  });

  describe('locations', () => {
    it('addLocation POSTs the location payload to the trip locations route', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: { id: 'loc-1', order: 0 } }));

      const result = await addLocation('token-123', 'trip-1', {
        name: 'Kyoto',
        latitude: 35.01,
        longitude: 135.76,
      });

      expect(result.id).toBe('loc-1');
      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(String(url)).toContain('/v1/trips/trip-1/locations');
      expect(init?.method).toBe('POST');
    });

    it('reorderLocations PUTs the full id list', async () => {
      vi.mocked(fetch).mockResolvedValue(jsonResponse({ success: true, data: [] }));

      await reorderLocations('token-123', 'trip-1', ['loc-2', 'loc-1']);

      const [url, init] = vi.mocked(fetch).mock.calls[0];
      expect(String(url)).toContain('/v1/trips/trip-1/locations/order');
      expect(init?.method).toBe('PUT');
      expect(init?.body).toBe(JSON.stringify({ locationIds: ['loc-2', 'loc-1'] }));
    });
  });

  describe('getTrip', () => {
    it('returns the unwrapped trip data on success', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ success: true, data: { id: 'trip-1', title: 'Japan' } }),
      );

      const result = await getTrip('token-123', 'trip-1');

      expect(result).toEqual({ id: 'trip-1', title: 'Japan' });
    });

    it('throws ApiError with the response status when the trip is not found', async () => {
      vi.mocked(fetch).mockResolvedValue(
        jsonResponse({ success: false, error: { message: 'Trip not found' } }, 404),
      );

      try {
        await getTrip('token-123', 'missing');
        expect.unreachable();
      } catch (err) {
        expect(err).toBeInstanceOf(ApiError);
        expect((err as ApiError).status).toBe(404);
      }
    });
  });
});
