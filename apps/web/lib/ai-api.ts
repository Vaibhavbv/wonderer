import { API_URL, ApiError, authHeaders, unwrap } from "./api";

// AI generation runs through a queue: request a job, then poll it.
// A 403 from the generate endpoints means the user's AI credits are spent.

export type StoryTone = "poetic" | "humorous" | "descriptive" | "journalistic" | "minimal";
export type StoryLength = "short" | "medium" | "long";

export interface GenerateStoryInput {
  tripId: string;
  tone?: StoryTone;
  length?: StoryLength;
  userPrompt?: string;
}

export interface GenerateTitleInput {
  destinations: string[];
  dates?: string;
  theme?: string;
}

export interface QueuedJob {
  jobId: string;
  status: "QUEUED";
  estimatedDuration: string;
}

export interface AiJob {
  id: string;
  type: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  result: Record<string, unknown> | null;
  error: string | null;
}

export interface StoryResult {
  title: string;
  content: string;
  wordCount: number;
}

export interface TitleResult {
  titles: string[];
}

export async function generateStory(token: string, input: GenerateStoryInput): Promise<QueuedJob> {
  const res = await fetch(`${API_URL}/v1/ai/generate-story`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<QueuedJob>(res);
}

export async function generateTitle(token: string, input: GenerateTitleInput): Promise<QueuedJob> {
  const res = await fetch(`${API_URL}/v1/ai/generate-title`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<QueuedJob>(res);
}

export async function getAiJob(token: string, jobId: string): Promise<AiJob> {
  const res = await fetch(`${API_URL}/v1/ai/jobs/${encodeURIComponent(jobId)}`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<AiJob>(res);
}

// Poll until the job completes. Resolves with the job's result payload;
// throws ApiError(500-ish) on FAILED and ApiError(408) on timeout.
export async function pollAiJob<T = Record<string, unknown>>(
  token: string,
  jobId: string,
  { intervalMs = 1500, timeoutMs = 90000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const job = await getAiJob(token, jobId);
    if (job.status === "COMPLETED") return (job.result ?? {}) as T;
    if (job.status === "FAILED" || job.status === "CANCELLED") {
      throw new ApiError(job.error || "AI generation failed", 500);
    }
    if (Date.now() >= deadline) {
      throw new ApiError("AI generation timed out — try again", 408);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
