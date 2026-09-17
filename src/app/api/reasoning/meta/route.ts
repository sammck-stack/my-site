import { NextResponse } from "next/server";

/**
 * Challenge 2 handshake. The course platform (and npm run selfcheck) expect:
 *   { service: "reasoning", specVersion: "1", studentToken: "<your token>" }
 *
 * studentToken comes from the SITE_TOKEN env var — the same one /api/health
 * already returns. Set it in .env.local and in Vercel.
 */
export async function GET() {
  return NextResponse.json({
    service: "reasoning",
    specVersion: "1",
    studentToken: process.env.SITE_TOKEN ?? "SITE_TOKEN-env-var-not-set",
  });
}
