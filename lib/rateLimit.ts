// A simple limit on how often something can be tried.
// It remembers attempts in memory, so it resets when the server restarts and is
// not shared between servers. It is a good start, not a full defence.
const attempts = new Map<string, number[]>();

export function tooMany(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    attempts.set(key, recent);
    return true;
  }
  recent.push(now);
  attempts.set(key, recent);
  return false;
}
