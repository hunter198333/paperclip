import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

export const MISSIONS_API_ROUTE_KEYS = [
  "initialize-mission",
  "mission-summary",
  "decompose-mission",
  "advance-mission",
  "waive-mission-finding",
  "missions-list",
] as const;

export const MISSIONS_UI_SLOT_IDS = [
  "missions-page",
  "missions-issue-panel",
  "missions-toolbar-button",
  "missions-settings-page",
] as const;

const manifest: PaperclipPluginManifestV1 = {
  id: "paperclipai.plugin-missions",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Missions",
  description: "First-party Missions plugin scaffold for Paperclip mission orchestration workflows.",
  author: "Paperclip",
  categories: ["automation", "ui"],
  capabilities: [
    "api.routes.register",
    "database.namespace.migrate",
    "database.namespace.read",
    "database.namespace.write",
    "issues.read",
    "issues.create",
    "issues.update",
    "issues.checkout",
    "issues.wakeup",
    "issues.orchestration.read",
    "issue.relations.read",
    "issue.relations.write",
    "issue.documents.read",
    "issue.documents.write",
    "issue.subtree.read",
    "ui.page.register",
    "ui.detailTab.register",
    "ui.action.register",
    "instance.settings.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  database: {
    namespaceSlug: "missions",
    migrationsDir: "migrations",
    coreReadTables: ["issues"],
  },
  apiRoutes: [
    {
      routeKey: "initialize-mission",
      method: "POST",
      path: "/issues/:issueId/missions/init",
      auth: "board-or-agent",
      capability: "api.routes.register",
      checkoutPolicy: "required-for-agent-in-progress",
      companyResolution: { from: "issue", param: "issueId" },
    },
    {
      routeKey: "mission-summary",
      method: "GET",
      path: "/issues/:issueId/missions/summary",
      auth: "board-or-agent",
      capability: "api.routes.register",
      companyResolution: { from: "issue", param: "issueId" },
    },
    {
      routeKey: "decompose-mission",
      method: "POST",
      path: "/issues/:issueId/missions/decompose",
      auth: "board-or-agent",
      capability: "api.routes.register",
      checkoutPolicy: "required-for-agent-in-progress",
      companyResolution: { from: "issue", param: "issueId" },
    },
    {
      routeKey: "advance-mission",
      method: "POST",
      path: "/issues/:issueId/missions/advance",
      auth: "board-or-agent",
      capability: "api.routes.register",
      checkoutPolicy: "required-for-agent-in-progress",
      companyResolution: { from: "issue", param: "issueId" },
    },
    {
      routeKey: "waive-mission-finding",
      method: "POST",
      path: "/issues/:issueId/missions/findings/:findingKey/waive",
      auth: "board-or-agent",
      capability: "api.routes.register",
      checkoutPolicy: "required-for-agent-in-progress",
      companyResolution: { from: "issue", param: "issueId" },
    },
    {
      routeKey: "missions-list",
      method: "GET",
      path: "/missions",
      auth: "board-or-agent",
      capability: "api.routes.register",
      companyResolution: { from: "query", key: "companyId" },
    },
  ],
  ui: {
    slots: [
      {
        type: "page",
        id: "missions-page",
        displayName: "Missions",
        exportName: "MissionsPage",
        routePath: "missions",
      },
      {
        type: "taskDetailView",
        id: "missions-issue-panel",
        displayName: "Mission",
        exportName: "MissionIssuePanel",
        entityTypes: ["issue"],
      },
      {
        type: "toolbarButton",
        id: "missions-toolbar-button",
        displayName: "Mission",
        exportName: "MissionToolbarButton",
        entityTypes: ["issue"],
      },
      {
        type: "settingsPage",
        id: "missions-settings-page",
        displayName: "Missions",
        exportName: "MissionsSettingsPage",
      },
    ],
  },
};

export default manifest;
