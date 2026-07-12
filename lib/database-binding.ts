export async function databaseBinding(): Promise<D1Database | null> {
  try {
    const runtime = await import("cloudflare:workers");
    return runtime.env.DB ?? null;
  } catch {
    return null;
  }
}
