import { NextResponse } from "next/server";
import { ingestionHealth } from "@/lib/ingestion/health";

export async function GET() {
  const response = NextResponse.json(await ingestionHealth());
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
