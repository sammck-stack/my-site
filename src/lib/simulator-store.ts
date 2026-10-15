import { createClient } from "@supabase/supabase-js";

/**
 * The decision simulator's memory (Challenge 3).
 *
 * Why this file exists: on Vercel, your API route runs as a short-lived
 * function that forgets everything the moment it finishes answering. But the
 * challenge requires your /simulator page to display the same answer your
 * API just gave. The only way a forgetful function and a separate page can
 * agree is to write the answer down somewhere both can read: your Supabase
 * database, the same one the guestbook uses.
 *
 * Two functions, two callers:
 *   - saveLatest(): called by /api/simulator/decide after every answer.
 *   - loadLatest(): called by the /simulator page to display it.
 *
 * Setup: run supabase/simulator.sql once in your Supabase SQL Editor.
 * No new env vars: this reads the same NEXT_PUBLIC_SUPABASE_* values you
 * set in Chapter 3 for the guestbook.
 */

/** What the simulation found for one candidate stake fraction. */
export interface CandidateSummary {
  fraction: number;
  /** Final balances at five points of the sorted list of simulated paths. */
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
  /** Share of simulated paths that ended below the buy-in. */
  probLoss: number;
}

/** The stored game, answer, and candidate summaries. */
export interface SimulatorLatest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  problem: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  answer: Record<string, any>;
  candidates: CandidateSummary[];
}

// Same client helper as the guestbook route, accepting the same env-var
// name variants so a paste from Supabase's Connect dialog just works.
function supabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Overwrite the one stored "latest" row. upsert means "insert the row, or
 * update it if a row with this primary key already exists". The key is
 * always "latest", so the table never holds more than one row.
 */
export async function saveLatest(
  problem: SimulatorLatest["problem"],
  answer: SimulatorLatest["answer"],
  candidates: CandidateSummary[]
): Promise<void> {
  const client = supabase();
  if (!client) {
    throw new Error("Supabase env vars not set. See .env.example and the README.");
  }
  const { error } = await client.from("simulator_latest").upsert({
    key: "latest",
    problem,
    answer,
    candidates,
    updated_at: new Date().toISOString(),
  });
  if (error) {
    throw new Error(`Could not save the latest game: ${error.message}`);
  }
}

/**
 * Read the stored row back. Returns null when no game has been answered yet,
 * when Supabase isn't configured, or when the table doesn't exist yet: your
 * page shows its coming-soon card instead of crashing.
 */
export async function loadLatest(): Promise<SimulatorLatest | null> {
  const client = supabase();
  if (!client) return null;
  const { data, error } = await client
    .from("simulator_latest")
    .select("problem, answer, candidates")
    .eq("key", "latest")
    .maybeSingle();
  if (error || !data) return null;
  return data as SimulatorLatest;
}
