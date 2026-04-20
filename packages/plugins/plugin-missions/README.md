# @paperclipai/plugin-missions

First-party Missions plugin package for the current Paperclip alpha plugin runtime.

This package now carries the installable mission workflow surface:

- manifest id `paperclip.missions`
- scoped plugin API routes under `/api/plugins/:pluginId/api/*`
- namespace migrations for mission-owned tables
- worker handlers for mission initialization, decomposition, summary, advance, and waivers
- package-local typecheck, test, and build verification

## Declared Surfaces

- API routes
  - `POST /issues/:issueId/missions/init`
  - `POST /issues/:issueId/decompose`
  - `GET /issues/:issueId/mission/summary`
  - `POST /issues/:issueId/mission/advance`
  - `POST /issues/:issueId/mission/findings/:findingId/waive`
- UI slots
  - issue `taskDetailView`
  - issue `toolbarButton`
  - plugin `dashboardWidget`

## Verify

From the repo root:

```bash
pnpm --filter @paperclipai/plugin-missions typecheck
pnpm --filter @paperclipai/plugin-missions test
pnpm --filter @paperclipai/plugin-missions build
```

Install the local package into a running Paperclip instance after a successful
build:

```bash
pnpm paperclipai plugin install ./packages/plugins/plugin-missions
```

The host loads `dist/manifest.js`, `dist/worker.js`, and `dist/ui/`, so install
after building.
