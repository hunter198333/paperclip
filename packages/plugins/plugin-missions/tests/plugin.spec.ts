import { readFileSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Issue } from "@paperclipai/plugin-sdk";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest, { MISSIONS_API_ROUTE_KEYS, MISSIONS_UI_SLOT_IDS } from "../src/manifest.js";
import plugin from "../src/worker.js";

const PLUGIN_ORIGIN = `plugin:${manifest.id}` as const;

function issue(input: Partial<Issue> & Pick<Issue, "id" | "companyId" | "title">): Issue {
  const now = new Date();
  const { id, companyId, title, ...rest } = input;
  return {
    id,
    companyId,
    projectId: null,
    projectWorkspaceId: null,
    goalId: null,
    parentId: null,
    title,
    description: null,
    status: "todo",
    priority: "medium",
    assigneeAgentId: null,
    assigneeUserId: null,
    checkoutRunId: null,
    executionRunId: null,
    executionAgentNameKey: null,
    executionLockedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    issueNumber: null,
    identifier: null,
    originKind: "manual",
    originId: null,
    originRunId: null,
    requestDepth: 0,
    billingCode: null,
    assigneeAdapterOverrides: null,
    executionWorkspaceId: null,
    executionWorkspacePreference: null,
    executionWorkspaceSettings: null,
    startedAt: null,
    completedAt: null,
    cancelledAt: null,
    hiddenAt: null,
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
}

describe("missions plugin scaffold", () => {
  it("declares the phase 0 routes, slots, and namespace migration contract", () => {
    expect(manifest).toMatchObject({
      id: "paperclipai.plugin-missions",
      apiVersion: 1,
      database: {
        namespaceSlug: "missions",
        migrationsDir: "migrations",
        coreReadTables: ["issues"],
      },
    });

    expect(manifest.apiRoutes?.map((route) => route.routeKey)).toEqual(MISSIONS_API_ROUTE_KEYS);
    expect(manifest.ui?.slots?.map((slot) => slot.id)).toEqual(MISSIONS_UI_SLOT_IDS);
    expect(manifest.ui?.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "page", routePath: "missions" }),
        expect.objectContaining({ type: "taskDetailView", entityTypes: ["issue"] }),
        expect.objectContaining({ type: "toolbarButton", entityTypes: ["issue"] }),
        expect.objectContaining({ type: "settingsPage" }),
      ]),
    );

    const migrationsDir = path.resolve(import.meta.dirname, "../migrations");
    const firstMigration = readFileSync(path.join(migrationsDir, "001_mission_issue_links.sql"), "utf8");
    const secondMigration = readFileSync(path.join(migrationsDir, "002_missions.sql"), "utf8");
    expect(firstMigration).toContain("plugin_missions_8ceb7cd69c.mission_issue_links");
    expect(secondMigration).toContain("plugin_missions_8ceb7cd69c.missions");
    expect(secondMigration).toContain("plugin_missions_8ceb7cd69c.mission_findings");
    expect(secondMigration).toContain("plugin_missions_8ceb7cd69c.mission_events");
  });

  it("registers placeholder data and action handlers backed by the worker shell", async () => {
    const companyId = randomUUID();
    const missionIssueId = randomUUID();
    const childIssueId = randomUUID();
    const blockerIssueId = randomUUID();
    const harness = createTestHarness({ manifest });

    harness.seed({
      issues: [
        issue({
          id: missionIssueId,
          companyId,
          title: "Mission root",
          identifier: "PAP-1684",
          originKind: PLUGIN_ORIGIN,
        }),
        issue({
          id: childIssueId,
          companyId,
          parentId: missionIssueId,
          title: "Mission child",
          originKind: `${PLUGIN_ORIGIN}:feature`,
        }),
        issue({
          id: blockerIssueId,
          companyId,
          title: "Upstream blocker",
        }),
      ],
    });
    await harness.ctx.issues.documents.upsert({
      issueId: missionIssueId,
      companyId,
      key: "mission-brief",
      title: "Mission Brief",
      body: "# Mission Brief\n",
      changeSummary: "Seed mission brief",
    });
    await harness.ctx.issues.relations.setBlockedBy(missionIssueId, [blockerIssueId], companyId);
    await plugin.definition.setup(harness.ctx);

    const surfaceStatus = await harness.getData<{
      pluginId: string;
      routeKeys: string[];
      uiSlotIds: string[];
      databaseNamespace: string;
    }>("surface-status", { companyId });
    expect(surfaceStatus).toMatchObject({
      pluginId: manifest.id,
      routeKeys: [...MISSIONS_API_ROUTE_KEYS],
      uiSlotIds: [...MISSIONS_UI_SLOT_IDS],
    });
    expect(surfaceStatus.databaseNamespace).toContain("test_paperclipai_plugin_missions");

    const summary = await harness.getData<{
      missionIssueId: string;
      childIssueCount: number;
      documentCount: number;
      blockerCount: number;
      status: string;
    }>("mission-summary", { companyId, issueId: missionIssueId });
    expect(summary).toMatchObject({
      missionIssueId,
      childIssueCount: 1,
      documentCount: 1,
      blockerCount: 1,
      status: "not_configured",
    });

    const missionsList = await harness.getData<MissionsListResult>("missions-list", { companyId });
    expect(missionsList).toMatchObject({
      companyId,
      pageRoute: "missions",
      status: "not_configured",
      routeKeys: [...MISSIONS_API_ROUTE_KEYS],
      message: "Mission list wiring is present. Mission lifecycle behavior is not implemented in Phase 0.",
    });
    expect(missionsList.missions).toEqual([
      {
        issueId: missionIssueId,
        identifier: "PAP-1684",
        title: "Mission root",
        status: "todo",
      },
    ]);

    await expect(
      harness.performAction("initialize-mission", { companyId, issueId: missionIssueId }),
    ).resolves.toMatchObject({
      routeKey: "initialize-mission",
      issueId: missionIssueId,
      status: "not_configured",
    });

    await expect(plugin.definition.onHealth?.()).resolves.toMatchObject({
      status: "ok",
      details: {
        pluginId: manifest.id,
        routeKeys: [...MISSIONS_API_ROUTE_KEYS],
        uiSlotIds: [...MISSIONS_UI_SLOT_IDS],
      },
    });
  });

  it("dispatches scoped api routes with placeholder bodies and validates waiver input", async () => {
    const companyId = randomUUID();
    const missionIssueId = randomUUID();
    const harness = createTestHarness({ manifest });

    harness.seed({
      issues: [
        issue({
          id: missionIssueId,
          companyId,
          title: "Mission root",
          identifier: "PAP-1684",
          originKind: PLUGIN_ORIGIN,
        }),
      ],
    });
    await plugin.definition.setup(harness.ctx);

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "initialize-mission",
        method: "POST",
        path: `/issues/${missionIssueId}/missions/init`,
        params: { issueId: missionIssueId },
        query: {},
        body: {},
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 202,
      body: {
        routeKey: "initialize-mission",
        issueId: missionIssueId,
        status: "not_configured",
      },
    });

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "mission-summary",
        method: "GET",
        path: `/issues/${missionIssueId}/missions/summary`,
        params: { issueId: missionIssueId },
        query: {},
        body: null,
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        missionIssueId,
        status: "not_configured",
      },
    });

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "missions-list",
        method: "GET",
        path: "/missions",
        params: {},
        query: { companyId },
        body: null,
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 200,
      body: {
        missions: [
          {
            issueId: missionIssueId,
            identifier: "PAP-1684",
            title: "Mission root",
            status: "todo",
          },
        ],
        status: "not_configured",
      },
    });

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "waive-mission-finding",
        method: "POST",
        path: `/issues/${missionIssueId}/missions/findings/FINDING-001/waive`,
        params: { issueId: missionIssueId, findingKey: "FINDING-001" },
        query: {},
        body: {},
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 422,
      body: { error: "rationale is required" },
    });

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "waive-mission-finding",
        method: "POST",
        path: `/issues/${missionIssueId}/missions/findings/FINDING-001/waive`,
        params: { issueId: missionIssueId, findingKey: "FINDING-001" },
        query: {},
        body: { rationale: "Defer to follow-up issue" },
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 202,
      body: {
        routeKey: "waive-mission-finding",
        issueId: missionIssueId,
        findingKey: "FINDING-001",
        status: "not_configured",
      },
    });

    await expect(
      plugin.definition.onApiRequest?.({
        routeKey: "unknown-route",
        method: "GET",
        path: "/unknown",
        params: {},
        query: {},
        body: null,
        actor: {
          actorType: "user",
          actorId: "board",
          userId: "board",
          agentId: null,
          runId: null,
        },
        companyId,
        headers: {},
      }),
    ).resolves.toMatchObject({
      status: 404,
      body: { error: "Unknown missions route: unknown-route" },
    });
  });
});

type MissionsListResult = {
  status: string;
  companyId: string;
  missions: Array<{
    issueId: string;
    identifier: string | null;
    title: string;
    status: string;
  }>;
  routeKeys: string[];
  pageRoute: string;
  message: string;
};
