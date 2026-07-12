import { BestBuyProductsAdapter } from "./best-buy-api.ts";
import { cleanupExpiredRetailerContent, persistBestBuyBatch } from "./store.ts";

export type IngestionEnvironment = {
  DB: D1Database;
  BEST_BUY_API_KEY?: string;
};

export async function refreshBestBuy(env: IngestionEnvironment) {
  if (!env.BEST_BUY_API_KEY) {
    throw new Error("BEST_BUY_API_KEY is not configured");
  }

  const runId = crypto.randomUUID();
  const startedAt = Date.now();
  await env.DB.prepare(`
    INSERT INTO ingestion_runs (id, retailer, status, started_at)
    VALUES (?, 'Best Buy', 'running', ?)
  `).bind(runId, startedAt).run();

  try {
    const batch = await new BestBuyProductsAdapter(env.BEST_BUY_API_KEY).fetch();
    const changedCount = await persistBestBuyBatch(env.DB, batch);
    await cleanupExpiredRetailerContent(env.DB, batch.fetchedAt);
    await env.DB.prepare(`
      UPDATE ingestion_runs
      SET status='succeeded', finished_at=?, fetched_count=?, changed_count=?
      WHERE id=?
    `).bind(Date.now(), batch.products.length, changedCount, runId).run();
    return { runId, fetchedCount: batch.products.length, changedCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";
    await env.DB.prepare(`
      UPDATE ingestion_runs
      SET status='failed', finished_at=?, failed_count=1, error_summary_json=?
      WHERE id=?
    `).bind(Date.now(), JSON.stringify([message]), runId).run();
    throw error;
  }
}
