import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Agent, Issue } from "@paperclipai/plugin-sdk";
import { createTestHarness } from "@paperclipai/plugin-sdk/testing";
import manifest, { MISSIONS_PAGE_ROUTE, MISSIONS_UI_EXPORTS } from "../src/manifest.js";
import plugin from "../src/worker.js";

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

function agent(input: Partial<Agent> & Pick<Agent, "id" | "companyId" | "name" | "status">): Agent {
  const now = new Date();
  const { id, companyId, name, status, ...rest } = input;
  return {
    id,
    companyId,
    name,
    urlKey: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    role: "engineer",
    title: null,
    icon: null,
    status,
    reportsTo: null,
    capabilities: null,
    adapterType: "codex_local",
    adapterConfig: {},
    runtimeConfig: {},
    budgetMonthlyCents: 100000,
    spentMonthlyCents: 0,
    pauseReason: null,
    pausedAt: null,
    permissions: { canCreateAgents: false },
    lastHeartbeatAt: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...rest,
  };
}

describe("missions plugin manifest", () => {
  it("declares the page, issue panel, global toolbar, settings, and dashboard surfaces", () => {
    expect(manifest.id).toBe("paperclip.missions");
    expect(manifest.capabilities).toEqual(
      expect.arrayContaining([
        "issues.read",
        "issues.update",
        "issue.documents.read",
        "issue.documents.write",
        "issue.subtree.read",
        "issues.orchestration.read",
        "plugin.state.read",
        "plugin.state.write",
        "ui.page.register",
        "ui.detailTab.register",
        "ui.action.register",
        "ui.dashboardWidget.register",
        "instance.settings.register",
      ]),
    );
    expect(manifest.ui?.slots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "page", routePath: MISSIONS_PAGE_ROUTE, exportName: MISSIONS_UI_EXPORTS.page }),
        expect.objectContaining({ type: "taskDetailView", exportName: MISSIONS_UI_EXPORTS.taskDetailView }),
        expect.objectContaining({ type: "globalToolbarButton", exportName: MISSIONS_UI_EXPORTS.globalToolbarButton }),
        expect.objectContaining({ type: "settingsPage", exportName: MISSIONS_UI_EXPORTS.settingsPage }),
        expect.objectContaining({ type: "dashboardWidget", exportName: MISSIONS_UI_EXPORTS.dashboardWidget }),
      ]),
    );
  });
});

describe("missions plugin worker", () => {
  it("initializes missions, projects summaries, and persists company mission settings", async () => {
    const companyId = randomUUID();
    const rootIssueId = randomUUID();
    const workerAgentId = randomUUID();
    const validatorAgentId = randomUUID();
    const harness = createTestHarness({ manifest });

    harness.seed({
      issues: [
        issue({
          id: rootIssueId,
          companyId,
          title: "Ship plugin mission surfaces",
          identifier: "PAP-1688",
        }),
      ],
      agents: [
        agent({ id: workerAgentId, companyId, name: "Worker One", status: "idle" }),
        agent({ id: validatorAgentId, companyId, name: "Validator One", status: "active" }),
      ],
    });

    await plugin.definition.setup(harness.ctx);

    const before = await harness.getData("mission-panel", { companyId, issueId: rootIssueId });
    expect(before).toMatchObject({
      mode: "not_mission",
      issue: {
        id: rootIssueId,
        title: "Ship plugin mission surfaces",
      },
      availableCommands: [expect.objectContaining({ key: "initialize", enabled: true })],
    });

    const initialized = await harness.performAction<Record<string, unknown>>("initialize-mission", {
      companyId,
      issueId: rootIssueId,
    });
    expect(initialized).toMatchObject({
      mode: "mission",
      missionRootIssueId: rootIssueId,
      summary: {
        missionIssueId: rootIssueId,
        missionTitle: "Ship plugin mission surfaces",
        state: "planning",
      },
    });

    const summary = await harness.getData<Record<string, unknown>>("mission-summary", {
      companyId,
      issueId: rootIssueId,
    });
    expect(summary).toMatchObject({
      missionIssueId: rootIssueId,
      missionTitle: "Ship plugin mission surfaces",
      state: "planning",
      documentChecklist: expect.any(Array),
      blockers: expect.any(Array),
      validationSummary: expect.objectContaining({
        counts: expect.objectContaining({
          total: 0,
        }),
      }),
      runSummary: expect.objectContaining({
        total: 0,
      }),
      costSummary: expect.objectContaining({
        costCents: 0,
      }),
      governanceStops: expect.any(Array),
      nextAction: expect.any(String),
    });

    const list = await harness.getData<Array<Record<string, unknown>>>("mission-list", { companyId });
    expect(list).toEqual([
      expect.objectContaining({
        missionIssueId: rootIssueId,
        missionTitle: "Ship plugin mission surfaces",
        state: "planning",
      }),
    ]);

    const savedSettings = await harness.performAction<Record<string, unknown>>("save-mission-settings", {
      companyId,
      maxValidationRounds: 4,
      requireBlackBoxValidation: false,
      defaultWorkerAgentId: workerAgentId,
      defaultValidatorAgentId: validatorAgentId,
      defaultBillingCodePolicy: "stable-prefix",
      autoAdvance: true,
    });
    expect(savedSettings).toMatchObject({
      maxValidationRounds: 4,
      requireBlackBoxValidation: false,
      defaultWorkerAgentId: workerAgentId,
      defaultValidatorAgentId: validatorAgentId,
      defaultBillingCodePolicy: "stable-prefix",
      autoAdvance: true,
    });

    const storedSettings = await harness.getData<Record<string, unknown>>("mission-settings", { companyId });
    expect(storedSettings).toMatchObject(savedSettings);

    const listedAgents = await harness.getData<Array<Record<string, unknown>>>("mission-agents", { companyId });
    expect(listedAgents).toEqual([
      expect.objectContaining({ id: validatorAgentId, name: "Validator One" }),
      expect.objectContaining({ id: workerAgentId, name: "Worker One" }),
    ]);
  });
});
