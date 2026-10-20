export async function readJsonLimited(request: Request, maxBytes: number): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) throw new Error("invalid_content_type");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid_body");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new Error("body_too_large"); }
    chunks.push(value);
  }
  const joined = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { joined.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(joined)); }
  catch { throw new Error("invalid_json"); }
}
