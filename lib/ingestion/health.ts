import { databaseBinding } from "../database-binding";

type RunRow = {
  retailer: string;
  status: "running" | "succeeded" | "failed";
  started_at: number;
  finished_at: number | null;
  fetched_count: number;
  changed_count: number;
  failed_count: number;
};

export async function ingestionHealth() {
  try {
    const db = await databaseBinding();
    if (!db) return { status: "database-unavailable" as const };

    const run = await db.prepare(`
      SELECT retailer, status, started_at, finished_at, fetched_count,
        changed_count, failed_count
      FROM ingestion_runs
      ORDER BY started_at DESC
      LIMIT 1
    `).first<RunRow>();
    const inventory = await db.prepare(`
      SELECT COUNT(*) AS count
      FROM listings
      WHERE available = 1 AND expires_at > ?
    `).bind(Date.now()).first<{ count: number }>();

    if (!run) {
      return {
        status: "awaiting-first-run" as const,
        liveListings: inventory?.count ?? 0,
      };
    }

    return {
      status: run.status,
      retailer: run.retailer,
      startedAt: new Date(run.started_at).toISOString(),
      finishedAt: run.finished_at ? new Date(run.finished_at).toISOString() : null,
      fetchedCount: run.fetched_count,
      changedCount: run.changed_count,
      failedCount: run.failed_count,
      liveListings: inventory?.count ?? 0,
    };
  } catch (error) {
    console.error("Unable to read ingestion health.", error);
    return { status: "database-error" as const };
  }
}
