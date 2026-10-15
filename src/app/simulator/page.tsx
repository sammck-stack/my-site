import { ComingSoon } from "@/components/ComingSoon";
import { CandidateOutcomes } from "@/components/simulator/CandidateOutcomes";
import { loadLatest } from "@/lib/simulator-store";

export const metadata = { title: "Decision Simulator" };

// Freshness contract: without this line, Next.js may serve a cached copy of
// this page, and the grader would see stale numbers seconds after your API
// answered. force-dynamic re-renders the page on every request.
export const dynamic = "force-dynamic";

export default async function SimulatorPage() {
  const latest = await loadLatest();

  if (!latest) {
    return (
      <ComingSoon
        lane={3}
        title="Decision Simulator"
        description="A service that simulates investment games and recommends the growth-optimal stake. Built after Lane 3."
      />
    );
  }

  const { problem, answer, candidates } = latest;
  const recommended = Number(answer.recommendedFraction);
  const median = Number(answer.medianFinalBalance);
  const probLoss = Number(answer.probLoss);
  const buyIn = Number(problem.buyIn);
  const stakePct = Math.round(recommended * 100);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Lane 3 · live decision service
      </p>
      <h1 className="mt-3 text-4xl font-bold">{`Stake ${stakePct}% each year`}</h1>
      <p className="mt-4 max-w-prose text-muted">
        I simulated thousands of investors at every stake on the list and picked the one
        that left the typical investor (the median path) best off — not the average.
        The numbers below are whatever my API just answered.
      </p>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">The latest game</h2>
        <p className="mt-3 max-w-prose text-muted">{String(problem.scenario)}</p>
        <p className="mt-4 text-lg">
          Recommended stake:{" "}
          <strong data-simulator="recommended-fraction" className="text-accent">
            {String(recommended)}
          </strong>
        </p>
        <p className="mt-2 text-lg">
          Typical final balance:{" "}
          <strong data-simulator="median-final" className="text-accent">
            {`$${Math.round(median).toLocaleString("en-US")}`}
          </strong>
        </p>
        <p className="mt-2 text-lg">
          Chance of ending below the buy-in:{" "}
          <strong data-simulator="prob-loss" className="text-accent">
            {String(probLoss)}
          </strong>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Every candidate stake</h2>
        <CandidateOutcomes
          candidates={candidates}
          buyIn={buyIn}
          recommended={recommended}
        />
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">The model</h2>
        <p className="mt-3 max-w-prose text-sm text-muted">
          The rectangle is the decision: the stake fraction. The coin sets each year&apos;s
          return, and wealth follows from that plus the buy-in.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          data-simulator="dag"
          src="/images/dag.png"
          alt="Investment-game DAG: stake fraction f is a decision; each year return R_t updates wealth W_t"
          className="mt-4 w-full max-w-lg rounded-lg border border-line bg-surface p-4"
        />
      </section>
    </main>
  );
}
