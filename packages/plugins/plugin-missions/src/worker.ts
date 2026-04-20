import { definePlugin, runWorker } from "@paperclipai/plugin-sdk";
import type { Agent } from "@paperclipai/plugin-sdk";
import type { MissionSettings } from "./mission-service.js";
import {
  initializeMission,
  listMissionSummaries,
  loadMissionPanelData,
  loadMissionSummary,
  readMissionSettings,
  writeMissionSettings,
} from "./mission-service.js";

type MissionAgentSummary = {
  id: string;
  name: string;
  status: Agent["status"];
  title: string | null;
};

function requireString(value: unknown, field: string): string {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  throw new Error(`${field} is required`);
}

function optionalInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  return undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function nullableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  return undefined;
}

function settingsPatchFromParams(params: Record<string, unknown>): Partial<MissionSettings> {
  const patch: Partial<MissionSettings> = {};

  const maxValidationRounds = optionalInteger(params.maxValidationRounds);
  if (maxValidationRounds !== undefined) patch.maxValidationRounds = maxValidationRounds;

  const requireBlackBoxValidation = optionalBoolean(params.requireBlackBoxValidation);
  if (requireBlackBoxValidation !== undefined) patch.requireBlackBoxValidation = requireBlackBoxValidation;

  const defaultWorkerAgentId = nullableString(params.defaultWorkerAgentId);
  if (defaultWorkerAgentId !== undefined) patch.defaultWorkerAgentId = defaultWorkerAgentId;

  const defaultValidatorAgentId = nullableString(params.defaultValidatorAgentId);
  if (defaultValidatorAgentId !== undefined) patch.defaultValidatorAgentId = defaultValidatorAgentId;

  if (params.defaultBillingCodePolicy === "mission-issue" || params.defaultBillingCodePolicy === "stable-prefix") {
    patch.defaultBillingCodePolicy = params.defaultBillingCodePolicy;
  }

  const autoAdvance = optionalBoolean(params.autoAdvance);
  if (autoAdvance !== undefined) patch.autoAdvance = autoAdvance;

  return patch;
}

const plugin = definePlugin({
  async setup(ctx) {
    ctx.data.register("mission-panel", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      return loadMissionPanelData(ctx, companyId, issueId);
    });

    ctx.data.register("mission-summary", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      return loadMissionSummary({ ctx, companyId, missionRootIssueId: issueId });
    });

    ctx.data.register("mission-list", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      return listMissionSummaries(ctx, companyId);
    });

    ctx.data.register("mission-settings", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      return readMissionSettings(ctx, companyId);
    });

    ctx.data.register("mission-agents", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const agents = await ctx.agents.list({ companyId, limit: 200 });
      return agents
        .map<MissionAgentSummary>((agent) => ({
          id: agent.id,
          name: agent.name,
          status: agent.status,
          title: agent.title,
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
    });

    ctx.actions.register("initialize-mission", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      const issueId = requireString(params.issueId, "issueId");
      return initializeMission(ctx, companyId, issueId);
    });

    ctx.actions.register("save-mission-settings", async (params) => {
      const companyId = requireString(params.companyId, "companyId");
      return writeMissionSettings(ctx, companyId, settingsPatchFromParams(params));
    });
  },

  async onHealth() {
    return {
      status: "ok",
      message: "Missions plugin worker is running",
      details: {
        dataKeys: ["mission-panel", "mission-summary", "mission-list", "mission-settings", "mission-agents"],
        actionKeys: ["initialize-mission", "save-mission-settings"],
      },
    };
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
