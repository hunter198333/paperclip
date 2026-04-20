import type { Issue, PluginApiRequestInput, PluginContext } from "@paperclipai/plugin-sdk";
import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import manifest, { MISSIONS_API_ROUTE_KEYS, MISSIONS_UI_SLOT_IDS } from "./manifest.js";

const PLUGIN_ORIGIN = `plugin:${manifest.id}` as const;

type PlaceholderResponse = {
  status: "not_configured";
  routeKey: string;
  companyId: string;
  issueId: string | null;
  findingKey: string | null;
  message: string;
};

type SurfaceStatus = {
  status: "ok";
  checkedAt: string;
  companyId: string | null;
  databaseNamespace: string;
  routeKeys: string[];
  uiSlotIds: string[];
  pluginId: string;
  message: string;
};

type MissionSummary = {
  status: "not_configured";
  companyId: string;
  issueId: string;
  missionIssueId: string;
  missionIdentifier: string | null;
  missionTitle: string;
  childIssueCount: number;
  documentCount: number;
  blockerCount: number;
  routeKeys: string[];
  uiSlotIds: string[];
  databaseNamespace: string;
  message: string;
};

type MissionsListItem = {
  issueId: string;
  identifier: string | null;
  title: string;
  status: Issue["status"];
};

type MissionsList = {
  status: "not_configured";
  companyId: string;
  missions: MissionsListItem[];
  routeKeys: string[];
  pageRoute: string;
  message: string;
};

let getSurfaceStatus: ((companyId: string | null) => Promise<SurfaceStatus>) | null = null;
let getMissionSummary: ((companyId: string, issueId: string) => Promise<MissionSummary>) | null = null;
let getMissionsList: ((companyId: string) => Promise<MissionsList>) | null = null;

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

async function requireIssue(ctx: PluginContext, companyId: string, issueId: string) {
  const issue = await ctx.issues.get(issueId, companyId);
  if (!issue) throw new Error(`Issue not found: ${issueId}`);
  return issue;
}

function buildPlaceholderResponse(input: {
  routeKey: string;
  companyId: string;
  issueId?: string | null;
  findingKey?: string | null;
}): PlaceholderResponse {
  return {
    status: "not_configured",
    routeKey: input.routeKey,
    companyId: input.companyId,
    issueId: input.issueId ?? null,
    findingKey: input.findingKey ?? null,
    message: "Missions Phase 0 scaffold is installed. Runtime behavior lands in follow-up issues.",
  };
}

const plugin = definePlugin({
  async setup(ctx) {
    getSurfaceStatus = async (companyId) => ({
      status: "ok",
      checkedAt: new Date().toISOString(),
      companyId,
      databaseNamespace: ctx.db.namespace,
      routeKeys: [...MISSIONS_API_ROUTE_KEYS],
      uiSlotIds: [...MISSIONS_UI_SLOT_IDS],
      pluginId: ctx.manifest.id,
      message: "Missions scaffold loaded successfully.",
    });

    getMissionSummary = async (companyId, issueId) => {
      const issue = await requireIssue(ctx, companyId, issueId);
      const subtree = await ctx.issues.getSubtree(issueId, companyId, { includeRoot: false });
      const documents = await ctx.issues.documents.list(issueId, companyId);
      const relations = await ctx.issues.relations.get(issueId, companyId);

      return {
        status: "not_configured",
        companyId,
        issueId,
        missionIssueId: issue.id,
        missionIdentifier: issue.identifier,
        missionTitle: issue.title,
        childIssueCount: subtree.issueIds.length,
        documentCount: documents.length,
        blockerCount: relations.blockedBy.length,
        routeKeys: [...MISSIONS_API_ROUTE_KEYS],
        uiSlotIds: [...MISSIONS_UI_SLOT_IDS],
        databaseNamespace: ctx.db.namespace,
        message: "Mission summary is a scaffold response until the runtime issues land.",
      };
    };

    getMissionsList = async (companyId) => {
      const issues = await ctx.issues.list({
        companyId,
        originKind: PLUGIN_ORIGIN,
      });

      return {
        status: "not_configured",
        companyId,
        missions: issues.map((issue) => ({
          issueId: issue.id,
          identifier: issue.identifier,
          title: issue.title,
          status: issue.status,
        })),
        routeKeys: [...MISSIONS_API_ROUTE_KEYS],
        pageRoute: "missions",
        message: "Mission list wiring is present. Mission lifecycle behavior is not implemented in Phase 0.",
      };
    };

    ctx.data.register("surface-status", async (params) => {
      if (!getSurfaceStatus) throw new Error("Surface status is not ready");
      const companyId = typeof params.companyId === "string" ? params.companyId : null;
      return getSurfaceStatus(companyId);
    });

    ctx.data.register("mission-summary", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      if (!getMissionSummary) throw new Error("Mission summary is not ready");
      return getMissionSummary(companyId, issueId);
    });

    ctx.data.register("missions-list", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      if (!getMissionsList) throw new Error("Missions list is not ready");
      return getMissionsList(companyId);
    });

    ctx.actions.register("initialize-mission", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      await requireIssue(ctx, companyId, issueId);
      return buildPlaceholderResponse({ routeKey: "initialize-mission", companyId, issueId });
    });

    ctx.actions.register("decompose-mission", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      await requireIssue(ctx, companyId, issueId);
      return buildPlaceholderResponse({ routeKey: "decompose-mission", companyId, issueId });
    });

    ctx.actions.register("advance-mission", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      await requireIssue(ctx, companyId, issueId);
      return buildPlaceholderResponse({ routeKey: "advance-mission", companyId, issueId });
    });

    ctx.actions.register("waive-mission-finding", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      const findingKey = requireString(params.findingKey, "findingKey");
      requireString(params.rationale, "rationale");
      await requireIssue(ctx, companyId, issueId);
      return buildPlaceholderResponse({
        routeKey: "waive-mission-finding",
        companyId,
        issueId,
        findingKey,
      });
    });
  },

  async onApiRequest(input: PluginApiRequestInput) {
    switch (input.routeKey) {
      case "initialize-mission":
        return {
          status: 202,
          body: buildPlaceholderResponse({
            routeKey: input.routeKey,
            companyId: input.companyId,
            issueId: input.params.issueId,
          }),
        };

      case "mission-summary":
        if (!getMissionSummary) throw new Error("Mission summary is not ready");
        return {
          status: 200,
          body: await getMissionSummary(input.companyId, input.params.issueId),
        };

      case "decompose-mission":
      case "advance-mission":
        return {
          status: 202,
          body: buildPlaceholderResponse({
            routeKey: input.routeKey,
            companyId: input.companyId,
            issueId: input.params.issueId,
          }),
        };

      case "waive-mission-finding": {
        const rationale = (input.body as Record<string, unknown> | null)?.rationale;
        if (typeof rationale !== "string" || rationale.trim().length === 0) {
          return {
            status: 422,
            body: { error: "rationale is required" },
          };
        }
        return {
          status: 202,
          body: buildPlaceholderResponse({
            routeKey: input.routeKey,
            companyId: input.companyId,
            issueId: input.params.issueId,
            findingKey: input.params.findingKey,
          }),
        };
      }

      case "missions-list":
        if (!getMissionsList) throw new Error("Missions list is not ready");
        return {
          status: 200,
          body: await getMissionsList(input.companyId),
        };

      default:
        return {
          status: 404,
          body: { error: `Unknown missions route: ${input.routeKey}` },
        };
    }
  },

  async onHealth() {
    return {
      status: "ok",
      message: "Missions plugin scaffold is running",
      details: {
        pluginId: manifest.id,
        routeKeys: [...MISSIONS_API_ROUTE_KEYS],
        uiSlotIds: [...MISSIONS_UI_SLOT_IDS],
        hasDatabaseNamespace: Boolean(manifest.database),
      },
    };
  },
});

export default plugin;

runWorker(plugin, import.meta.url);
