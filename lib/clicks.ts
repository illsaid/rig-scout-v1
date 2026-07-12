import { databaseBinding } from "./database-binding";

export type OutboundClick = {
  listingId: string;
  retailer: string;
  destinationUrl: string;
  referrer?: string | null;
};

function hostname(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

export async function recordOutboundClick(click: OutboundClick) {
  try {
    const db = await databaseBinding();
    if (!db) return false;
    await db.prepare(`
      INSERT INTO outbound_clicks (
        id, listing_id, retailer, destination_host, referrer_host, clicked_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      click.listingId,
      click.retailer,
      new URL(click.destinationUrl).hostname,
      hostname(click.referrer),
      Date.now(),
    ).run();
    return true;
  } catch (error) {
    console.error("Unable to record outbound click.", error);
    return false;
  }
}
