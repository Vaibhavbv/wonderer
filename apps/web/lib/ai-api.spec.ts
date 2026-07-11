import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateStory, pollAiJob } from './ai-api';
import { ApiError } from './api';

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

describe('ai-api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('generateStory posts the request and returns the queued job', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { jobId: 'job-1', status: 'QUEUED', estimatedDuration: '15s' } }),
    );

    const result = await generateStory('token', { tripId: 'trip-1', tone: 'poetic', length: 'short' });

    expect(result.jobId).toBe('job-1');
    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.body).toBe(JSON.stringify({ tripId: 'trip-1', tone: 'poetic', length: 'short' }));
  });

  it('generateStory surfaces exhausted credits (403) as ApiError with status', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { message: 'AI credits exhausted. Upgrade your plan.' } }, 403),
    );

    await expect(generateStory('token', { tripId: 'trip-1' })).rejects.toMatchObject({ status: 403 });
  });

  it('pollAiJob resolves with the result once the job completes', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 'job-1', status: 'PROCESSING', result: null, error: null } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          data: { id: 'job-1', status: 'COMPLETED', result: { title: 'T', content: 'C' }, error: null },
        }),
      );

    const result = await pollAiJob<{ title: string }>('token', 'job-1', { intervalMs: 1 });

    expect(result.title).toBe('T');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it('pollAiJob rejects with the job error when the job fails', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        success: true,
        data: { id: 'job-1', status: 'FAILED', result: null, error: 'OPENAI_API_KEY is not configured' },
      }),
    );

    await expect(pollAiJob('token', 'job-1', { intervalMs: 1 })).rejects.toThrow(
      'OPENAI_API_KEY is not configured',
    );
  });

  it('pollAiJob rejects with a 408 ApiError on timeout', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: true, data: { id: 'job-1', status: 'QUEUED', result: null, error: null } }),
    );

    await expect(pollAiJob('token', 'job-1', { intervalMs: 1, timeoutMs: 5 })).rejects.toMatchObject({
      status: 408,
    });
  });

  it('pollAiJob rejects when the job status endpoint errors', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ success: false, error: { message: 'Job not found' } }, 404),
    );

    await expect(pollAiJob('token', 'nope', { intervalMs: 1 })).rejects.toThrow(ApiError);
  });
});
