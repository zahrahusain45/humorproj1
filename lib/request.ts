export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
export async function readSmallJson(request: Request, maxLength = 4096) {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new Error("Send a JSON request.");
  const text = await request.text();
  if (text.length > maxLength) throw new Error("That request is too long.");
  try { return JSON.parse(text) as unknown; }
  catch { throw new Error("That request could not be read."); }
}
