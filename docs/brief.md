# Brief: Jev GenUI analytics demo

Build a GenUI analytics demo in this repo (Next.js 16, Tailwind 4).

## Concept
A chat panel where the user asks about sales pipeline data in plain English.
One Jev call answers ~7 typed questions in parallel; code turns the answers into
a view spec, queries data deterministically, and renders a card. Jev selects;
it never generates UI or copy.

## Grammar (v1 – coarse)
- metric:    leads | deals | revenue
- chart:     breakdown | ranking | trend | funnel | headline
- splitBy:   channel | rep | source | stage | none
- range:     today | last7 | thisMonth | thisQuarter
- compare:   none | previousPeriod
- nextStep:  save | share | setAlert | drillDown
- followUps: Choice over a bank of ~15 candidate questions; top 2 become chips

Each option gets a clear, mutually distinct description, written as criteria.
A fine-grained v2 grammar (layout primitives + emphasis Scores) comes later.

## Uncertainty behavior
- confidence ≥ 0.8: render silently
- 0.5–0.8: render the top answer, offer the runner-up as a one-click alternative
- < 0.5 on metric or chart: show clarifying chips instead of guessing
- "Thought process" panel: every question, its answer, a confidence meter,
  expandable to the full probability distribution, plus latency and cost
- Override: picking any alternative re-renders from the same spec + data with
  no new Jev call, and marks the field "You"

## Data
Seeded fake CRM: 90 days, ~3k leads, 6 reps, 5 channels, deal stages, revenue.
One pure function: spec → rows. No database.

## Copy
The summary sentence is templated per chart type from the data. No LLM.

## Stack
shadcn/ui primitives, lucide-react icons, hand-built SVG/div charts (5 types),
@typesafe-ai/sdk called server-side only (`TYPESAFE_API_KEY` in `.env.local`).

## Visual
Reference frames: `docs/reference/` (see its README). Borrow **structure and
interaction only**: layout, hierarchy, states, behaviors. The visual skin is our
own: build on design tokens with a neutral default so a direction can be applied
later without touching components. Linked hover between legend rows and chart
segments. Subtle enter animation when a card renders.

## Test set (each should produce a sensible view)
1. Where did leads come from this week?          → breakdown / channel / last7
2. Which reps closed the most deals this quarter? → ranking / rep / quarter
3. How did revenue trend this month?              → trend / none / month
4. Where do leads drop off?                       → funnel / stage
5. How many deals did we close today?             → headline
6. Is email doing better than last month?         → compare: previousPeriod
7. Show me Sara's pipeline                         → ambiguous, should hedge
8. leads                                           → low confidence, should clarify

## Done when
All test questions render correctly, the thought-process panel and override work,
latency is shown, and `npm run build` passes.

## Out of scope
Auth, persistence (Save is local state), real data sources, LLM fallback.

## Process
Read the Next 16 docs in node_modules and the live TypeSafe docs first.
Plan before coding.
