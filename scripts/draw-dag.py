#!/usr/bin/env python3
"""
Draw Chapter 13's investment-game DAG and save it as public/images/dag.png.

The stake fraction f is a decision (rectangle). Each year a fair coin sets the
return R_t, which — together with f and last year's wealth — makes W_t.
A plate around the year means that structure repeats for t = 1, ..., T.
"""

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import daft

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images" / "dag.png"

pgm = daft.PGM()

# Decision: one stake fraction for the whole game (not redrawn each year).
pgm.add_node("f", r"$f$", 2.0, 2.35, shape="rectangle", aspect=1.35)

# Chance nodes inside the year-plate.
pgm.add_node("R", r"$R_t$", 3.1, 1.15)
pgm.add_node("W", r"$W_t$", 2.0, 1.15)

# Starting wealth is the known buy-in.
pgm.add_node("W0", r"$W_0$", 0.9, 1.15, observed=True)

pgm.add_edge("f", "W")
pgm.add_edge("R", "W")
pgm.add_edge("W0", "W")

pgm.add_plate([1.35, 0.45, 2.35, 1.35], label=r"$t = 1, \ldots, T$", shift=-0.05)

pgm.render()
OUT.parent.mkdir(parents=True, exist_ok=True)
pgm.savefig(str(OUT), dpi=160)
print(f"wrote {OUT.relative_to(ROOT)}")
