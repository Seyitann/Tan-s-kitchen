export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

// Only accepts JSON bodies. Browsers cannot send JSON from another website
// without permission, which also protects these routes from forged requests.
export async function readJson(
  request: Request
): Promise<Record<string, unknown> | null> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  try {
    const body = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
}
