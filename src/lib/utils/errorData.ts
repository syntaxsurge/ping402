export function getErrorData(error: unknown): unknown {
  if (typeof error !== "object" || error === null) return null;
  if (!("data" in error)) return null;
  return (error as { data?: unknown }).data ?? null;
}

export function getErrorCode(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const code = (data as Record<string, unknown>).code;
  return typeof code === "string" ? code : null;
}

