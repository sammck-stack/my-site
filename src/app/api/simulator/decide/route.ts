import { NextResponse } from "next/server";
import {
  saveLatest,
  type CandidateSummary,
} from "@/lib/simulator-store";

const N_PATHS = 20_000;

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
}

/**
 * Chapter 13: each year a fair coin moves only the STAKED slice. Cash sits
 * still. One year is W *= (1 + f * R) with R = +up or -down.
 */
function simulateFinals(
  buyIn: number,
  fraction: number,
  up: number,
  down: number,
  years: number
): number[] {
  const finals = new Array<number>(N_PATHS);
  for (let i = 0; i < N_PATHS; i++) {
    let wealth = buyIn;
    for (let t = 0; t < years; t++) {
      const r = Math.random() < 0.5 ? up : -down;
      wealth *= 1 + fraction * r;
      if (wealth <= 0) {
        wealth = 0;
        break;
      }
    }
    finals[i] = wealth;
  }
  return finals;
}

function summarize(
  fraction: number,
  finals: number[],
  buyIn: number
): CandidateSummary {
  finals.sort((a, b) => a - b);
  let below = 0;
  for (const w of finals) if (w < buyIn) below += 1;
  return {
    fraction,
    p5: percentile(finals, 0.05),
    p25: percentile(finals, 0.25),
    median: percentile(finals, 0.5),
    p75: percentile(finals, 0.75),
    p95: percentile(finals, 0.95),
    probLoss: below / finals.length,
  };
}

export async function POST(req: Request) {
  const problem = await req.json().catch(() => null);
  if (!problem || problem.type !== "investment-game") {
    return NextResponse.json(
      { error: "expected a JSON investment-game with a `type` field" },
      { status: 400 }
    );
  }

  const upPct = asNumber(problem.upPct);
  const downPct = asNumber(problem.downPct);
  const horizonYears = asNumber(problem.horizonYears);
  const buyIn = asNumber(problem.buyIn);
  const fractions = Array.isArray(problem.candidateFractions)
    ? problem.candidateFractions.map(asNumber)
    : [];

  if (
    upPct === null ||
    downPct === null ||
    horizonYears === null ||
    buyIn === null ||
    fractions.length === 0 ||
    fractions.some((f) => f === null)
  ) {
    return NextResponse.json(
      { error: "investment-game is missing numeric fields" },
      { status: 400 }
    );
  }

  const up = upPct / 100;
  const down = downPct / 100;
  const years = Math.round(horizonYears);

  const candidates: CandidateSummary[] = (fractions as number[]).map((f) =>
    summarize(f, simulateFinals(buyIn, f, up, down, years), buyIn)
  );

  // The typical investor is the median path, not the average one.
  let best = candidates[0];
  for (const c of candidates) {
    if (c.median > best.median) best = c;
  }

  const answer = {
    recommendedFraction: best.fraction,
    medianFinalBalance: best.median,
    probLoss: best.probLoss,
    reasoning:
      "I pick the stake whose typical (median) investor finished highest, not the one with the best average.",
  };

  await saveLatest(problem, answer, candidates);

  return NextResponse.json(answer);
}
