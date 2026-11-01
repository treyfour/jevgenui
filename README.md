# Operator: generative UI with Jev

A chat panel where you ask about sales-pipeline data in plain English and the interface
builds itself. One call to TypeSafe's **Jev** (a System One model) answers 9 typed questions
in parallel, about 100 ms and $0.00013 per request. Code turns those answers into a view
spec, queries data, and renders a chart. **Jev selects; it never generates UI or copy.**

## Run it

```sh
npm install
echo "TYPESAFE_API_KEY=..." > .env.local
npm run dev            # http://localhost:3000
```

Theme picker: the palette icon in the Operator header (five themes, saved per browser).

## How it works

```
request ──► Jev: 9 parallel questions ──► decision ──► spec ──► query ──► card
            (server action, the only        (+ user      (code      (client,
             network call)                  overrides)   repairs)   pure)
```

- **Grammar** `lib/grammar.ts`: every axis Jev can steer (metric, chart, splitBy, range,
  focus, compare, nextStep, followUp) and every option, with `covers`/`excludes`
  descriptions. This file is the design. A Noul "clear ask" gate catches vague requests.
- **Policy** `lib/policy.ts`: confidence tiers. High renders silently, medium offers the
  runner-up, low on metric/chart asks.
- **Turn** `lib/turn.ts`: everything a turn shows, derived from decision + overrides.
  Clarify questions and alternatives only appear when Jev's runner-up would change the view.
- **Repair** `lib/resolve.ts`: fixes invalid combinations (a funnel always tracks leads) and
  records why, shown as a "Code" badge. Overrides show as "You".
- **Data** `lib/data/`: a seeded fake CRM and `query(spec)`. Copy is templated (`lib/copy.ts`).
- **Jev call** `lib/jev.ts` (server only) and `app/actions.ts`.

## Eval

```sh
npx tsx --conditions=react-server --env-file=.env.local scripts/eval.mts [--shuffle]
```

Runs the test set and prints each axis against expectations, plus the card it would render.
It uses the same functions as the UI. `--shuffle` reverses option order to expose
first-option bias. Currently 36/36.

## Design

- `docs/DESIGN.md`: the token contract and all five themes. Linear Light/Dark were measured
  from linear.app; Jev Sky, Riso, and Night explore typesafe.ai.
- `app/globals.css` (contract), `app/themes/*.css` (one file per theme family).
- `docs/screenshots/`: every theme. `docs/brief.md`: the original brief.
  `docs/reference/`: frames from the demo video that inspired this.

## Gotchas

- Don't run `next build` while `next dev` is running: it breaks dev's CSS hot reload
  (stale styles until you restart dev and clear `.next`).
- `next dev` rewrites `AGENTS.md` (the `agentFeedback` experiment); commit that change.
