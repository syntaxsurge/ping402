import { ConvexError } from "convex/values";

const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export function normalizeHandle(input: string): string {
  return input.trim().toLowerCase();
}

export function assertValidHandle(handle: string): void {
  if (!HANDLE_RE.test(handle)) {
    throw new ConvexError(
      "Invalid handle. Use 3-32 chars: letters, numbers, underscores, hyphens."
    );
  }
}

