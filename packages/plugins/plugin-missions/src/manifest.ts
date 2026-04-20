import type { PaperclipPluginManifestV1 } from "@paperclipai/plugin-sdk";

export const MISSIONS_PAGE_ROUTE = "missions";

export const MISSIONS_UI_SLOT_IDS = {
  page: "missions-page",
  taskDetailView: "missions-issue-panel",
  globalToolbarButton: "missions-global-toolbar-button",
  settingsPage: "missions-settings-page",
  dashboardWidget: "missions-dashboard-widget",
} as const;

export const MISSIONS_UI_EXPORTS = {
  page: "MissionsPage",
  taskDetailView: "MissionIssuePanel",
  globalToolbarButton: "MissionsGlobalToolbarButton",
  settingsPage: "MissionsSettingsPage",
  dashboardWidget: "MissionsDashboardWidget",
} as const;

const manifest: PaperclipPluginManifestV1 = {
  id: "paperclip.missions",
  apiVersion: 1,
  version: "0.1.0",
  displayName: "Missions",
  description: "First-party Missions plugin for mission progress projection and board UI surfaces.",
  author: "Paperclip",
  categories: ["automation", "ui"],
  capabilities: [
    "plugin.state.read",
    "plugin.state.write",
    "issues.read",
    "issues.update",
    "issues.orchestration.read",
    "issue.relations.read",
    "issue.documents.read",
    "issue.documents.write",
    "issue.subtree.read",
    "agents.read",
    "ui.page.register",
    "ui.detailTab.register",
    "ui.action.register",
    "ui.dashboardWidget.register",
    "instance.settings.register",
  ],
  entrypoints: {
    worker: "./dist/worker.js",
    ui: "./dist/ui",
  },
  ui: {
    slots: [
      {
        type: "page",
        id: MISSIONS_UI_SLOT_IDS.page,
        displayName: "Missions",
        exportName: MISSIONS_UI_EXPORTS.page,
        routePath: MISSIONS_PAGE_ROUTE,
      },
      {
        type: "taskDetailView",
        id: MISSIONS_UI_SLOT_IDS.taskDetailView,
        displayName: "Mission",
        exportName: MISSIONS_UI_EXPORTS.taskDetailView,
        entityTypes: ["issue"],
      },
      {
        type: "globalToolbarButton",
        id: MISSIONS_UI_SLOT_IDS.globalToolbarButton,
        displayName: "Missions",
        exportName: MISSIONS_UI_EXPORTS.globalToolbarButton,
      },
      {
        type: "settingsPage",
        id: MISSIONS_UI_SLOT_IDS.settingsPage,
        displayName: "Missions",
        exportName: MISSIONS_UI_EXPORTS.settingsPage,
      },
      {
        type: "dashboardWidget",
        id: MISSIONS_UI_SLOT_IDS.dashboardWidget,
        displayName: "Missions",
        exportName: MISSIONS_UI_EXPORTS.dashboardWidget,
      },
    ],
  },
};

export default manifest;
