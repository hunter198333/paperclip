export {
  MISSION_FINDING_WAIVER_MARKER_PREFIX,
  MISSION_REQUIRED_DOCUMENT_KEYS,
  buildMissionFindingWaiverEntry,
  parseMissionFeaturesDocument,
  parseMissionValidationContractDocument,
  parseMissionValidationReportDocument,
  type MissionFeature,
  type MissionFeaturesDocument,
  type MissionFinding,
  type MissionMilestone,
  type MissionRequiredDocumentKey,
  type MissionValidationContract,
  type MissionValidationReport,
} from "./mission/index.js";
export { isMissionRequiredDocumentKey } from "./mission/index.js";

import {
  isMissionValidationReportKey,
  missionFindingWaiverMarker,
  parseMissionFindingWaivers as parseMissionFindingWaiversBase,
  validationReportRoundFromKey,
  type MissionFindingWaiverModel,
} from "./mission/index.js";

export type MissionState =
  | "draft"
  | "ready"
  | "working"
  | "validating"
  | "fixing"
  | "paused"
  | "complete";

export type MissionFindingWaiverRecord = {
  findingId: string;
  rationale: string;
  actorLabel: string | null;
  createdAt: string | null;
};

export function isValidationReportDocumentKey(key: string) {
  return isMissionValidationReportKey(key);
}

export function parseValidationReportRound(key: string) {
  return validationReportRoundFromKey(key);
}

export function parseMissionFindingWaivers(decisionLogBody: string | null | undefined): Map<string, MissionFindingWaiverRecord> {
  const waivers = new Map<string, MissionFindingWaiverRecord>();
  for (const [findingId, waiver] of parseMissionFindingWaiversBase(decisionLogBody)) {
    waivers.set(findingId, {
      findingId,
      rationale: waiver.rationale,
      actorLabel: waiver.actorLabel ?? null,
      createdAt: toCreatedAt(waiver),
    });
  }
  return waivers;
}

export function buildMissionEventEntry(input: {
  markerKey: string;
  title: string;
  lines: string[];
}) {
  const marker = `paperclip:mission-event:${input.markerKey}`;
  return {
    marker,
    body: [
      `<!-- ${marker} -->`,
      `### ${input.title}`,
      "",
      ...input.lines.map((line) => `- ${line}`),
    ].join("\n"),
  };
}

export function appendDecisionLogEntry(
  existingBody: string | null | undefined,
  entry: { marker: string; body: string },
) {
  const trimmed = existingBody?.trim() ?? "";
  const header = trimmed.length > 0 ? trimmed : "# Decision Log";
  if (header.includes(entry.marker)) return header;
  return [header, entry.body.trim()].filter(Boolean).join("\n\n");
}

function toCreatedAt(waiver: MissionFindingWaiverModel) {
  return "recordedAt" in waiver ? waiver.recordedAt ?? null : null;
}

export function missionFindingWaiverCommentMarker(findingId: string) {
  return missionFindingWaiverMarker(findingId);
}
