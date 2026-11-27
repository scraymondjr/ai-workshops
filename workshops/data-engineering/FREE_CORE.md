# Free core

The public starter gives away the part a learner needs in order to see the before-and-after number.

Included without a cohort seat:

- D0 landing zone, the generator, and the data eval harness
- D1 staging and freshness
- D2 contracts, unit-test shape, and PII meta
- The shared Fernhill seed and the agent scorecard

D3 through D9, the game day, and the capstone are in this same repo as skeletons so the site can teach them. Reference solutions are not on `main`.

Re-run the scorecard after every module, including the free ones:

```bash
python -m evals.score_module --module d1
```

`evals/score_module.py` prints the naive baseline and a delta. The delta stays flat until the governed metrics exist. That is the point of the baseline.
