import { API_URL, authHeaders, unwrap } from "./api";

// A story is an ordered list of blocks stored as JSON. The backend seeds a
// default 'hero' block on first GET; editors must render and PRESERVE any
// block type they don't understand — PUT is a full replace, so dropping an
// unknown block destroys it.
export interface StoryBlock {
  id: string;
  type: "hero" | "heading" | "text" | "photo" | (string & {});
  position: { x: number; y: number; w: number; h: number };
  content: Record<string, unknown>;
}

export interface Story {
  id: string;
  tripId: string;
  template: string;
  theme: Record<string, unknown> | null;
  blocks: StoryBlock[];
  version: number;
  lastEditedBy: string;
  lastEditedAt: string;
  publishedAt: string | null;
}

export interface UpdateStoryInput {
  template?: string;
  theme?: Record<string, unknown>;
  blocks: StoryBlock[];
}

// Get-or-create: first call for a trip creates the story with a hero block.
export async function getStory(token: string, tripId: string): Promise<Story> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/story`, {
    headers: authHeaders(token, false),
    cache: "no-store",
  });
  return unwrap<Story>(res);
}

// Full replace of the block list; the server increments version.
export async function updateStory(
  token: string,
  tripId: string,
  input: UpdateStoryInput,
): Promise<Story> {
  const res = await fetch(`${API_URL}/v1/trips/${encodeURIComponent(tripId)}/story`, {
    method: "PUT",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
  return unwrap<Story>(res);
}
