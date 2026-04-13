# QMD Memory Plugin Plan

Status: proposed implementation plan
Date: 2026-04-12
Related issues: `PAP-1279`, `PAP-1247`, `PAP-530`

## Goal

Add a minimal first-party memory provider plugin that uses QMD for retrieval, fits the implemented Paperclip memory service, and stays local-first, file-backed, and Node/TypeScript-native.

## Recommendation In One Sentence

Build a first-party `qmd_memory` plugin package that stores canonical memory records as markdown files in the plugin data directory, shells out to the `qmd` CLI for indexing and retrieval, and plugs into Paperclip's existing memory binding and operation-audit layer through a small new plugin-provider runtime bridge.

## Why This Plan Changed

The original direction for a QMD-backed provider was good, but the repo now has a concrete memory control plane that did not exist when the earlier discussion started:

- company-scoped bindings and agent overrides already exist
- capture/query/forget routes already exist
- memory operations, provenance, and direct cost attribution already exist
- heartbeat hooks already call `preRunHydrate`, run-summary capture, comment capture, and document capture

That means the QMD plan should not invent a parallel memory system. It should implement a provider that fits the current service surface.

## Current Baseline In This Repo

### What already exists

- `server/src/services/memory.ts` implements binding resolution, capture, query, forget, browse, and heartbeat hooks.
- `server/src/routes/memory.ts` exposes the memory API with company access checks and activity logging.
- `packages/db/src/schema/memory_*.ts` already stores bindings, targets, operations, extraction jobs, and built-in local records.
- `packages/shared/src/types/memory.ts` and `packages/shared/src/validators/memory.ts` define the public contract.
- Plugin manifests can already declare `memoryProviders`, and the plugin SDK already exports `PluginMemoryProvider` types.

### What does not exist yet

- The memory service only recognizes the built-in `local_basic` provider.
- Plugin-declared memory providers are validated in manifests but are not registered into the server memory service.
- The plugin worker runtime has no way to register a provider implementation during `setup()`.
- There is no host-to-worker RPC for memory provider operations.

This is the main implementation gap. The QMD plan should solve that gap once and then implement QMD on top of it.

## Design Principles

1. Keep Paperclip core responsible for binding resolution, company scoping, audit, provenance, and cost attribution.
2. Keep QMD responsible for indexing and retrieval, not governance.
3. Treat markdown files as the provider's source of truth.
4. Keep the first version local-first and explicit. No hidden background crawling of arbitrary repos.
5. Do not require a native Node binding to QMD. Shell out to the CLI from Node.
6. Do not overload `memory_local_records` for plugin providers. That table is the built-in provider's storage.

## What To Borrow From OpenClaw

OpenClaw's current memory docs are useful in three narrow ways:

- QMD should be treated as a local indexing and retrieval engine, not as Paperclip's governance layer.
- The operational model should stay simple: point QMD at a concrete filesystem collection and call the CLI from the host runtime.
- Refresh behavior can stay explicit and local-first instead of introducing a heavyweight service dependency.

What Paperclip should not copy:

- OpenClaw-specific memory provider taxonomy
- OpenClaw's broader agent runtime assumptions
- any design that bypasses Paperclip bindings, provenance, or activity/cost logging

## Proposed Architecture

### 1. Add a real memory provider runtime abstraction in core

Refactor `server/src/services/memory.ts` so the built-in `local_basic` provider is one implementation of a shared runtime contract:

```ts
interface MemoryProviderRuntime {
  descriptor: MemoryProviderDescriptor;
  validateConfig(config: Record<string, unknown>): Promise<Record<string, unknown>>;
  query(input: MemoryProviderQueryInput): Promise<MemoryProviderQueryOutput>;
  capture(input: MemoryProviderCaptureInput): Promise<MemoryProviderCaptureOutput>;
  list?(input: MemoryProviderListInput): Promise<MemoryRecord[]>;
  get?(input: MemoryProviderGetInput): Promise<MemoryRecord | null>;
  forget?(input: MemoryProviderForgetInput): Promise<MemoryProviderForgetOutput>;
}
```

Core still does:

- resolve company default vs agent override
- reject disabled bindings
- enforce company/agent authz
- write `memory_operations`
- create cost events from returned usage
- run heartbeat hooks

Providers do:

- validate provider config
- store/query/delete provider-owned records
- return provider-scoped records plus usage metadata

### 2. Add a plugin memory-provider bridge

The plugin system needs one new worker registration surface:

- extend `PluginContext` with `memoryProviders.register(key, impl)`
- require the key to match a manifest-declared `memoryProviders[].key`
- keep descriptor metadata in the manifest
- keep executable behavior in the worker

Host/runtime changes:

- plugin loader collects manifest-declared memory providers from active plugins
- a plugin-provider registry exposes descriptors alongside built-ins
- memory service resolves `providerKey` to either a built-in runtime or a plugin runtime
- host-to-worker RPC adds one generic method such as `invokeMemoryProvider`

Recommended RPC shape:

```ts
type InvokeMemoryProviderParams =
  | { providerKey: string; action: "query"; input: ... }
  | { providerKey: string; action: "capture"; input: ... }
  | { providerKey: string; action: "list"; input: ... }
  | { providerKey: string; action: "get"; input: ... }
  | { providerKey: string; action: "forget"; input: ... };
```

One generic method is simpler than adding five separate host-to-worker methods.

### 3. Implement QMD as a first-party plugin package

Create a real package, not an example:

- `packages/plugins/plugin-qmd-memory/`

The package should ship:

- `src/manifest.ts`
- `src/worker.ts`
- `src/lib/qmd.ts`
- `src/lib/storage.ts`
- `src/lib/frontmatter.ts`
- `README.md`
- tests for file layout, CLI invocation, and provider behavior

This should be treated as a first-party plugin in the repo, but still installed through the normal plugin runtime model.

## QMD Provider Shape

### Provider key and name

- provider key: `qmd_memory`
- display name: `QMD Memory`
- kind: plugin

### Binding config

Keep the first binding schema small:

```ts
{
  searchMode?: "query" | "search" | "vsearch";
  topK?: number;
  autoIndexOnWrite?: boolean;
  qmdBinaryPath?: string | null;
}
```

Defaults:

- `searchMode = "query"`
- `topK = 5`
- `autoIndexOnWrite = true`
- `qmdBinaryPath = null` meaning use `qmd` from `PATH`

Do not add provider-specific ontology, profile synthesis, or multi-collection routing in the first version.

### Storage layout

Store files under the plugin data directory, not inside the git checkout:

```text
~/.paperclip/instances/<instance>/data/plugins/<plugin-id>/
  companies/<company-id>/
    bindings/<binding-key>/
      records/
        <record-id>.md
      .qmd/
        collection.json
```

Reasons:

- matches the plugin runtime's persistence model
- avoids dirtying project repos
- keeps company data scoped and removable
- makes the provider inspectable on disk

Each markdown file should contain YAML frontmatter plus body content:

```md
---
recordId: <uuid>
companyId: <uuid>
bindingKey: default
providerKey: qmd_memory
scope:
  agentId: ...
  projectId: ...
  issueId: ...
  runId: ...
  subjectId: ...
source:
  kind: issue_comment
  issueId: ...
  commentId: ...
title: ...
summary: ...
createdAt: ...
updatedAt: ...
deletedAt: null
metadata: {}
---

<content>
```

This gives us:

- deterministic file paths
- direct record reconstruction without a side table
- stable provenance
- easy browse/get support

### Query behavior

The plugin shells out to `qmd` against the binding directory and maps hits back to `MemoryRecord` objects by reading the matching markdown files.

Recommended mapping:

- `query` uses `qmd query`
- `search` uses `qmd search`
- `vsearch` uses `qmd vsearch`

For the first version, bind the command to the configured `searchMode` and return:

- `records`
- optional `usage` as empty or best-effort local metrics
- optional plugin-native result metadata in `details`

### Capture behavior

On capture:

1. generate or reuse the provider record id
2. write `<record-id>.md`
3. refresh the QMD index for that binding directory
4. return a `MemoryRecord` reconstructed from the written file

This keeps the file tree canonical and QMD derived.

### Forget behavior

Do not physically delete files in V1.

Instead:

1. mark `deletedAt` in frontmatter
2. move the file to `records/_deleted/` or rewrite it in place with deleted metadata
3. refresh the index

The cleaner first version is "rewrite in place with `deletedAt` and exclude deleted files from list/get/query results". That preserves provenance and matches the existing soft-delete shape in core.

## How This Fits The Implemented Memory Hooks

The QMD provider should work with the hooks already present in the repo:

- `pre_run_hydrate`
- `post_run_capture`
- `issue_comment_capture`
- `issue_document_capture`

No QMD-specific hook types are needed.

The only behavioral change is that when a binding points to `qmd_memory`, those hooks route through the plugin runtime instead of `local_basic`.

## Minimal Implementation Sequence

### Phase 1: make plugin providers real

1. Introduce the server-side memory provider runtime abstraction.
2. Move `local_basic` onto that abstraction without behavior changes.
3. Add plugin-provider registration to the worker SDK.
4. Add host-to-worker RPC for provider operations.
5. Expose active plugin providers from `GET /companies/:companyId/memory/providers`.
6. Validate binding configs against provider-declared JSON schema.

Success condition: a trivial test plugin can declare a provider and answer `query/capture/forget`.

### Phase 2: implement first-party QMD plugin

1. Scaffold `packages/plugins/plugin-qmd-memory`.
2. Add manifest with `memory.providers.register`.
3. Implement file storage helpers and frontmatter parsing.
4. Implement QMD CLI wrapper with robust error mapping and timeouts.
5. Implement provider methods.
6. Add package-level tests.

Success condition: bindings can point at `qmd_memory`, writes create markdown files, and queries return relevant results through QMD.

### Phase 3: wire health and operator UX

1. Add plugin health checks for missing `qmd` binary or failed indexing.
2. Show provider config schema in the existing memory binding UI.
3. Add basic docs for installing `qmd` and enabling the plugin.

Success condition: an operator can install the plugin, create a binding, set it as default, and inspect the resulting files.

## Testing Plan

### Host/runtime tests

- plugin provider descriptors appear in the provider list
- binding creation accepts plugin provider keys
- memory operations route to plugin providers
- operations still log to `memory_operations`
- heartbeat hooks still work when the resolved binding is plugin-backed

### QMD plugin tests

- capture writes deterministic markdown files
- query shells out with the expected command
- query results map back to full `MemoryRecord` objects
- forget marks records deleted and removes them from live queries
- invalid `qmd` binary path surfaces a clear health/config error

### Integration smoke

- install the plugin from local path
- create a binding using `qmd_memory`
- set company default binding
- capture a run summary or manual record
- query it back through `/api/companies/:companyId/memory/query`

## Non-Goals For V1

- no automatic crawling of arbitrary repos or agent homes
- no provider-managed extraction pipeline
- no multimodal memory
- no per-project binding override
- no background scheduler for compaction or dedupe
- no attempt to sync QMD files into `memory_local_records`
- no bespoke QMD UI before the provider path works end-to-end

## Risks And Mitigations

### Risk: plugin provider support grows the runtime too much

Mitigation: keep the provider bridge narrowly scoped to the existing memory API verbs and reuse existing operation logging in core.

### Risk: QMD CLI process management becomes flaky

Mitigation: wrap shell-outs with short timeouts, explicit stderr capture, and a health check that fails fast when `qmd` is unavailable.

### Risk: indexing on every write is too slow

Mitigation: start with synchronous reindexing because it is simpler and correct, then add debounced background refresh only if real usage shows it is needed.

### Risk: file-backed records diverge from Paperclip metadata

Mitigation: keep frontmatter schema close to `MemoryRecord` and regenerate returned records from files, not from a second cache.

## Recommended Final Scope

The smallest good version is:

- one plugin-backed provider path in core
- one first-party `qmd_memory` plugin
- one file-backed storage layout under plugin data
- one QMD CLI wrapper
- existing Paperclip hooks and audits reused unchanged

That gives Paperclip a real plugin-backed memory provider without bloating the memory core or locking the system into QMD-specific semantics.
