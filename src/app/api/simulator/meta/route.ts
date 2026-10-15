import { NextResponse } from "next/server";

/**
 * Challenge 3 handshake. The course platform expects:
 *   { service: "simulator", specVersion: "1", studentToken: "<your token>" }
 *
 * studentToken comes from the SITE_TOKEN env var — the same one /api/health
 * and /api/reasoning/meta already return. Set it in .env.local and in Vercel.
 */
export async function GET() {
  return NextResponse.json({
    service: "simulator",
    specVersion: "1",
    studentToken: process.env.SITE_TOKEN ?? "SITE_TOKEN-env-var-not-set",
  });
}
