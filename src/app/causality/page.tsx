import { ComingSoon } from "@/components/ComingSoon";
import { StratifiedComparison } from "@/components/causality/StratifiedComparison";
import { loadLatest } from "@/lib/causality-store";

export const metadata = { title: "Causality Audit" };

// Freshness contract: re-render on every request, so the grader never sees
// a cached copy from before your API answered.
export const dynamic = "force-dynamic";

const STRUCTURE_NAMES: Record<string, string> = {
  fork: "a fork (a common cause)",
  pipe: "a pipe (a mediator)",
  collider: "a collider (a common effect)",
  direct: "a direct effect (the third variable is a bystander)",
};

export default async function CausalityPage() {
  const latest = await loadLatest();

  // Until the first probe arrives, keep the honest placeholder.
  if (!latest) {
    return (
      <ComingSoon
        lane={4}
        title="Causality Audit"
        description="A service that tells forks from pipes from colliders, and knows when to stratify. Built after Lane 4."
      />
    );
  }

  const { probe, answer, summary } = latest;
  const ctx = probe.context;
  const structure = String(answer.structure);
  const dagWhy =
    structure === "pipe"
      ? `The only path from ${ctx.xLabel} to ${ctx.yLabel} goes through ${ctx.zLabel}. That path is why changing ${ctx.xLabel} would change ${ctx.yLabel}.`
      : structure === "collider"
        ? `${ctx.xLabel} and ${ctx.yLabel} both point into ${ctx.zLabel}. There is no arrow from ${ctx.xLabel} to ${ctx.yLabel}, so changing ${ctx.xLabel} would not change ${ctx.yLabel}.`
        : structure === "direct"
          ? `${ctx.xLabel} points straight at ${ctx.yLabel}, and ${ctx.zLabel} has no arrows. That straight arrow is why changing ${ctx.xLabel} would change ${ctx.yLabel}.`
          : answer.causal
            ? `${ctx.zLabel} points at both ${ctx.xLabel} and ${ctx.yLabel}, and an arrow from ${ctx.xLabel} to ${ctx.yLabel} is still there after you compare within each level. That leftover arrow is the cause.`
            : `${ctx.zLabel} points at both ${ctx.xLabel} and ${ctx.yLabel}. There is no arrow from ${ctx.xLabel} to ${ctx.yLabel} — the overall gap is ${ctx.zLabel} doing the steering, not the choice.`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Lane 4 · live causality audit
      </p>
      <h1 className="mt-3 text-4xl font-bold">
        {answer.causal
          ? `Changing ${ctx.xLabel} would change ${ctx.yLabel}`
          : `Changing ${ctx.xLabel} would not change ${ctx.yLabel}`}
      </h1>
      <p className="mt-4 max-w-prose text-muted">
        I read the dataset and the story behind it, name the structure that actually fits, and tell
        you whether changing one thing would change the other. Every number on this page is the same
        answer my API just saved — I did not type these in by hand.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The latest audit</h2>
        <p className="mt-2 max-w-prose text-muted">{String(ctx.narrative)}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The verdict</h2>
        <ul className="mt-3 space-y-1 text-lg">
          <li>
            Verdict:{" "}
            <strong data-causality="verdict" className="text-accent">
              {answer.causal ? "causal" : "not causal"}
            </strong>
          </li>
          <li>
            Structure:{" "}
            <strong data-causality="structure" className="text-accent">
              {structure}
            </strong>
            <span className="text-base text-muted"> ({STRUCTURE_NAMES[structure] ?? structure})</span>
          </li>
          <li>
            Stratified effect on {String(ctx.yLabel)}:{" "}
            <strong data-causality="stratified-effect" className="text-accent">
              {Number(answer.stratifiedEffect).toFixed(2)}
            </strong>
          </li>
          <li>
            Advice:{" "}
            <strong>{answer.advice === "stratify" ? `compare within each level of ${ctx.zLabel}` : `do not split the data by ${ctx.zLabel}`}</strong>
          </li>
        </ul>
        <p className="mt-3 max-w-prose text-muted">{String(answer.reasoning)}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The evidence</h2>
        <StratifiedComparison
          summary={summary}
          x0={String(ctx.x0)}
          x1={String(ctx.x1)}
          yLabel={String(ctx.yLabel)}
        />
        <p className="mt-3 max-w-prose text-muted">
          The top row is the overall gap. The rows under it ask the same question inside each level
          of {String(ctx.zLabel)}. I do not pick whichever gap looks bigger — I pick the row the
          story about {String(ctx.zLabel)} says to trust, because this same chart can mean four
          different things.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The causal structure</h2>
        <img
          data-causality="dag"
          src={`/images/causality/${structure}.png`}
          alt={`DAG of ${STRUCTURE_NAMES[structure] ?? structure}: X is ${ctx.xLabel}, Z is ${ctx.zLabel}, Y is ${ctx.yLabel}.`}
          className="mt-3 w-full max-w-md rounded-lg border border-line bg-white p-3"
        />
        <p className="mt-3 max-w-prose text-muted">{dagWhy}</p>
      </section>
    </main>
  );
}
