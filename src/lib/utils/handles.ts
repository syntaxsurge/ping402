const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,31}$/;

export function normalizeHandle(input: string): string {
  return input.trim().replace(/^@/, "").toLowerCase();
}

export function isValidHandle(handle: string): boolean {
  return HANDLE_RE.test(handle);
}

export function parseHandle(input: string): string | null {
  const normalized = normalizeHandle(input);
  if (!normalized) return null;
  if (!isValidHandle(normalized)) return null;
  return normalized;
}
