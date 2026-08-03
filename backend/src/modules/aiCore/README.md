# AI Core

Reusable infrastructure for running AI-driven work across the platform.
**This module defines zero agents.** It only provides the plumbing that
existing and future agent logic (currently `seoWorkspace/services/
workspaceAgentOrchestrator.service.js`) runs on top of.

## What's here

| Piece | File | What it does |
|---|---|---|
| AI Engine | `services/aiEngine.service.js` | Resolves an AI client per tenant (reuses `AiSettings`, `crypto.js`, `AiClientWrapper` — all existing) and makes a completion call, wrapped in retry + status + logging. |
| Execution Queue | `services/executionQueue.service.js` | Serializes runs per key (e.g. projectId) so two orchestration runs never race on the same project. Global concurrency cap across keys. |
| Task Queue | `services/taskQueue.service.js` | Generic named-job dispatch (`registerHandler(jobType, fn)` / `enqueue(jobType, payload)`), for background work that isn't tied to a single project key. |
| Agent Loader | `services/agentLoader.service.js` | Resolves *configuration* (skills, model, provider) for an existing agent key. Delegates skill-content loading straight to the existing `skillLoader.service.js`. No new agent logic. |
| Logger | `services/logger.service.js` | Leveled console logging + fire-and-forget persisted execution telemetry (`models/executionLog.model.js`, collection `ai_execution_logs`). |
| Retry System | `services/retry.service.js` | Generic exponential-backoff-with-jitter `withRetry(fn, options)`. No AI-specific code. |
| Execution Status | `services/executionStatus.service.js` | In-memory current-state tracker (`pending/running/succeeded/failed`) by executionId, with pruning. |
| Shared Memory | `services/sharedMemory.service.js` | Thin `remember`/`recall` wrapper around the **existing, already-modeled but never-read** `WorkspaceMemory` collection. No new schema. |

## Reuse decisions (so nothing here gets silently duplicated later)

- **No new "agents" collection.** `seo-mongodb-schema-plan.md` proposed a
  `seo_agents` collection to make agent config data-driven. Agent Loader's
  `DEFAULT_AGENTS` mirrors that intent as a static, in-code table for now —
  it takes an optional `overrideLookupFn` so a DB-backed override source can
  be wired in later without changing its shape. Creating that collection is
  a separate decision, not bundled into this pass, per the explicit
  instruction not to create agents.
- **No new memory schema.** `WorkspaceMemory` already exists for exactly
  this purpose and was unused. Its one dangling `ref: 'Agency'` (no such
  model exists anywhere) was fixed to `ref: 'User'`, matching every other
  tenant field in the same module — required for `recall()`'s `.populate()`
  path to ever work, not a stylistic change.
- **`ai_execution_logs` vs. `seo_execution_history`**: the schema doc's
  proposed name is SEO-specific; this collection is written by AI Core
  generically (not just SEO Workspace), so it's named accordingly. If
  `seo_execution_history` is separately approved, only the third argument to
  `mongoose.model()` in `models/executionLog.model.js` would need to change
  — the same low-risk rename pattern the schema doc itself describes for the
  `workspace_*` → `seo_*` renames.
- **No Redis/Bull/Agenda dependency added.** `package.json` has none today;
  Execution Queue and Task Queue are both honestly in-process, matching that
  reality rather than introducing new infra as a side effect of this task.

## Explicitly NOT done in this pass (left for the next phase, per instructions)

- `workspaceAgentOrchestrator.service.js` is **not modified**. It still has
  its own private `_getAiClient` doing the same lookup `aiEngine.getClient`
  now does. Pointing it at AI Core instead is a follow-up, so this pass
  can't break the one thing already running in production.
- `workspaceCron.service.js`'s inline autopilot loop is **not modified** to
  route through Execution Queue / Task Queue yet.
- No routes/controllers were added — this is a services-only module,
  consumed in-process by whichever service chooses to require it.
