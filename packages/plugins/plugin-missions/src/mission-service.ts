import type {
  Issue,
  IssueDocumentSummary,
  PluginContext,
  PluginIssueApprovalSummary,
  PluginIssueInvocationBlockSummary,
  PluginIssueOrchestrationSummary,
  PluginIssueRelationSummary,
  PluginIssueRunSummary,
} from "@paperclipai/plugin-sdk";

type PluginIssueOriginKind = `plugin:${string}`;
type IssueDocument = IssueDocumentSummary & {
  body: string;
};

export const REQUIRED_DOCUMENT_KEYS = [
  "plan",
  "mission-brief",
  "validation-contract",
  "features",
  "worker-guidelines",
  "services",
  "knowledge-base",
  "decision-log",
] as const;

export type RequiredDocumentKey = (typeof REQUIRED_DOCUMENT_KEYS)[number];

export type MissionState =
  | "draft"
  | "planning"
  | "running"
  | "validating"
  | "fixing"
  | "blocked"
  | "complete";

export type MissionSeverity = "blocking" | "non_blocking" | "suggestion";
export type MissionFindingStatus = "open" | "fix_created" | "waived" | "resolved";

export type MissionSettings = {
  maxValidationRounds: number;
  requireBlackBoxValidation: boolean;
  defaultWorkerAgentId: string | null;
  defaultValidatorAgentId: string | null;
  defaultBillingCodePolicy: "mission-issue" | "stable-prefix";
  autoAdvance: boolean;
};

export const DEFAULT_SETTINGS: MissionSettings = {
  maxValidationRounds: 2,
  requireBlackBoxValidation: true,
  defaultWorkerAgentId: null,
  defaultValidatorAgentId: null,
  defaultBillingCodePolicy: "mission-issue",
  autoAdvance: false,
};

export type MissionIssueLite = {
  id: string;
  identifier: string | null;
  title: string;
  status: Issue["status"];
  priority: Issue["priority"];
  originKind: string | null;
  originId: string | null;
  assigneeAgentId: string | null;
  assigneeUserId: string | null;
  blockedBy: PluginIssueRelationSummary["blockedBy"];
};

export type MissionDocumentChecklistItem = {
  key: RequiredDocumentKey;
  title: string | null;
  present: boolean;
  latestRevisionNumber: number | null;
  updatedAt: string | null;
};

export type MissionDocumentError = {
  key: string;
  message: string;
};

export type MissionBlockedWorkItem = {
  issue: MissionIssueLite;
  blockers: PluginIssueRelationSummary["blockedBy"];
};

export type MissionMilestoneProjection = {
  key: string;
  title: string;
  summary: string | null;
  issue: MissionIssueLite | null;
  features: MissionIssueLite[];
  validations: MissionIssueLite[];
  fixLoops: MissionIssueLite[];
  blockers: MissionBlockedWorkItem[];
};

export type MissionValidationReportProjection = {
  round: number;
  validatorRole: "scrutiny_validator" | "user_testing_validator";
  summary: string;
  findings: MissionFindingProjection[];
  documentKey: string;
  documentTitle: string | null;
  updatedAt: string | null;
};

export type MissionFindingProjection = {
  id: string;
  severity: MissionSeverity;
  assertionId: string | null;
  title: string;
  evidence: string[];
  reproSteps: string[];
  expected: string;
  actual: string;
  suspectedArea: string | null;
  recommendedFixScope: string | null;
  status: MissionFindingStatus;
  sourceReportKey: string;
  sourceReportTitle: string | null;
  round: number;
  validatorRole: "scrutiny_validator" | "user_testing_validator";
  computedStatus: MissionFindingStatus;
  fixIssue: MissionIssueLite | null;
  waiverRationale: string | null;
};

export type MissionValidationSummary = {
  reports: MissionValidationReportProjection[];
  findings: MissionFindingProjection[];
  counts: {
    total: number;
    bySeverity: Record<MissionSeverity, number>;
    byStatus: Record<MissionFindingStatus, number>;
  };
  openBlockingFindingCount: number;
};

export type MissionRunSummary = {
  total: number;
  active: number;
  latestRunId: string | null;
  latestRunStatus: string | null;
};

export type MissionCostSummary = {
  costCents: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  billingCode: string | null;
};

export type MissionGovernanceStop =
  | {
      kind: "approval";
      id: string;
      label: string;
      detail: string;
      issueId: string;
      createdAt: string;
    }
  | {
      kind: "budget";
      id: string;
      label: string;
      detail: string;
      createdAt: string;
    }
  | {
      kind: "invocation_block";
      id: string;
      label: string;
      detail: string;
      createdAt: string | null;
      issueId: string;
    };

export type MissionCommand = {
  key: "initialize" | "decompose" | "advance" | "waive";
  label: string;
  enabled: boolean;
  reason: string | null;
};

export type MissionSummary = {
  missionIssueId: string;
  missionIdentifier: string | null;
  missionTitle: string;
  state: MissionState;
  documentChecklist: MissionDocumentChecklistItem[];
  missingDocumentKeys: RequiredDocumentKey[];
  documentErrors: MissionDocumentError[];
  milestones: MissionMilestoneProjection[];
  blockers: MissionBlockedWorkItem[];
  activeWork: MissionIssueLite[];
  validationSummary: MissionValidationSummary;
  runSummary: MissionRunSummary;
  costSummary: MissionCostSummary;
  approvals: PluginIssueApprovalSummary[];
  governanceStops: MissionGovernanceStop[];
  nextAction: string;
  availableCommands: MissionCommand[];
};

export type MissionListItem = {
  missionIssueId: string;
  missionIdentifier: string | null;
  missionTitle: string;
  state: MissionState;
  nextAction: string;
  activeWorkCount: number;
  blockerCount: number;
  milestoneCount: number;
  featureCount: number;
  validationFindingCount: number;
  governanceStopCount: number;
  documentHealth: {
    present: number;
    total: number;
    errors: number;
  };
  costCents: number;
  latestRunStatus: string | null;
  updatedAt: string;
};

export type MissionPanelData =
  | {
      mode: "not_mission";
      issue: MissionIssueLite;
      availableCommands: MissionCommand[];
    }
  | {
      mode: "mission";
      currentIssueId: string;
      currentIssueIdentifier: string | null;
      currentIssueTitle: string;
      missionRootIssueId: string;
      missionRootIdentifier: string | null;
      summary: MissionSummary;
    };

type ValidationAssertion = {
  id: string;
  title: string;
  user_value: string;
  scope: string;
  setup: string;
  steps: string[];
  oracle: string;
  tooling: string[];
  evidence: Array<{ kind: string; description: string; required: boolean }>;
  claimed_by: string[];
  status: string;
};

type ValidationContract = {
  assertions: ValidationAssertion[];
};

type FeaturePlan = {
  milestones: Array<{
    id: string;
    title: string;
    summary: string;
    features: Array<{
      id: string;
      title: string;
      kind: "original" | "fix";
      summary: string;
      acceptance_criteria: string[];
      claimed_assertion_ids: string[];
      status: string;
      source_finding_id?: string | null;
    }>;
  }>;
};

type ValidationReport = {
  round: number;
  validator_role: "scrutiny_validator" | "user_testing_validator";
  summary: string;
  findings: Array<{
    id: string;
    severity: MissionSeverity;
    assertion_id?: string | null;
    title: string;
    evidence: string[];
    repro_steps: string[];
    expected: string;
    actual: string;
    suspected_area?: string | null;
    recommended_fix_scope?: string | null;
    status: MissionFindingStatus;
  }>;
};

type BuildMissionSummaryInput = {
  pluginId: string;
  rootIssue: Issue;
  subtreeIssues: Issue[];
  relations: Record<string, PluginIssueRelationSummary>;
  orchestration: PluginIssueOrchestrationSummary;
  documentSummaries: IssueDocumentSummary[];
  requiredDocuments: Partial<Record<RequiredDocumentKey, IssueDocument | null>>;
  validationReports: IssueDocument[];
  decisionLog: IssueDocument | null;
};

type LoadMissionSummaryInput = {
  ctx: PluginContext;
  companyId: string;
  missionRootIssueId: string;
};

const ACTIVE_RUN_STATUSES = new Set(["queued", "running"]);
const TERMINAL_ISSUE_STATUSES = new Set(["done", "cancelled"]);

const VALIDATION_ID_RE = /\bVAL-[A-Z0-9][A-Z0-9-]*-[0-9]{3,}\b/gi;
const FEATURE_ID_RE = /\bFEAT-[A-Z0-9][A-Z0-9-]*-[0-9]{3,}\b/gi;
const MILESTONE_ID_RE = /\bMILESTONE-[A-Z0-9][A-Z0-9-]*-[0-9]{3,}\b/gi;
const FINDING_ID_RE = /\bFINDING-[A-Z0-9][A-Z0-9-]*-[0-9]{3,}\b/gi;

function normalizeId(value: string) {
  return value.trim().toUpperCase();
}

function toIsoDateString(value: Date | string | null | undefined): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date(0).toISOString();
}

function rootMissionOrigin(pluginId: string) {
  return `plugin:${pluginId}`;
}

function childMissionOrigin(pluginId: string, kind: "milestone" | "feature" | "validation" | "fix_loop") {
  return `plugin:${pluginId}:${kind}`;
}

export function isMissionOrigin(pluginId: string, originKind: string | null | undefined) {
  if (!originKind) return false;
  return originKind === rootMissionOrigin(pluginId) || originKind.startsWith(`${rootMissionOrigin(pluginId)}:`);
}

function isRootMission(pluginId: string, issue: Pick<Issue, "originKind">) {
  return issue.originKind === rootMissionOrigin(pluginId);
}

function issueReference(issue: Pick<Issue, "identifier" | "id">) {
  return issue.identifier ?? issue.id;
}

function missionBillingCode(issue: Pick<Issue, "identifier" | "id" | "billingCode">) {
  return issue.billingCode ?? `mission:${issue.identifier ?? issue.id}`;
}

function defaultMissionDocument(input: {
  issue: Issue;
  key: RequiredDocumentKey;
}): { title: string; body: string } {
  const { issue, key } = input;
  const ref = issueReference(issue);
  const issueTitle = issue.title.trim();
  switch (key) {
    case "plan":
      return {
        title: "Plan",
        body: [
          "# Plan",
          "",
          `Mission issue: ${ref}`,
          "",
          "## Objective",
          "",
          issue.description?.trim() || issueTitle,
          "",
          "## Milestones",
          "",
          "- TODO: Decompose the mission into bounded milestones.",
          "",
          "## Verification",
          "",
          "- TODO: Link validation assertions from `validation-contract` before implementation starts.",
        ].join("\n"),
      };
    case "mission-brief":
      return {
        title: "Mission Brief",
        body: [
          "# Mission Brief",
          "",
          `Mission issue: ${ref}`,
          `Current status: \`${issue.status}\``,
          `Billing code: \`${missionBillingCode(issue)}\``,
          "",
          "## Goal",
          "",
          issueTitle,
          "",
          "## Scope",
          "",
          "- TODO: Define the work that is in scope.",
          "",
          "## Non-Goals",
          "",
          "- TODO: Define what this mission will not do.",
          "",
          "## Assumptions",
          "",
          "- TODO: Record assumptions that need validation.",
        ].join("\n"),
      };
    case "validation-contract":
      return {
        title: "Validation Contract",
        body: [
          "# Validation Contract",
          "",
          "Define finite, testable assertions before feature decomposition.",
          "",
          "```json",
          JSON.stringify({ assertions: [] }, null, 2),
          "```",
        ].join("\n"),
      };
    case "features":
      return {
        title: "Features",
        body: [
          "# Features",
          "",
          "Group implementation features by milestone after the validation contract is written.",
          "",
          "```json",
          JSON.stringify({ milestones: [] }, null, 2),
          "```",
        ].join("\n"),
      };
    case "worker-guidelines":
      return {
        title: "Worker Guidelines",
        body: [
          "# Worker Guidelines",
          "",
          "- Work only on the assigned child issue.",
          "- Preserve normal checkout, ownership, testing, and handoff rules.",
          "- Do not decide final correctness; validators judge against the validation contract.",
          "- Leave concise evidence in comments, work products, or attachments.",
        ].join("\n"),
      };
    case "services":
      return {
        title: "Services",
        body: [
          "# Services",
          "",
          "## Commands",
          "",
          "- TODO: Document local server, test, and preview commands.",
          "",
          "## Environment",
          "",
          "- TODO: Document required accounts, seeded data, secrets, and setup costs.",
        ].join("\n"),
      };
    case "knowledge-base":
      return {
        title: "Knowledge Base",
        body: [
          "# Knowledge Base",
          "",
          "- TODO: Add concise discoveries that future workers or validators need.",
        ].join("\n"),
      };
    case "decision-log":
      return {
        title: "Decision Log",
        body: [
          "# Decision Log",
          "",
          "- Mission initialized from existing issue state.",
        ].join("\n"),
      };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function parseJsonDocument<T>(document: IssueDocument | null): T | null {
  if (!document) return null;
  const trimmed = document.body.trim();
  if (!trimmed) return null;
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(trimmed);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  if (!candidate.startsWith("{") && !candidate.startsWith("[")) return null;
  return JSON.parse(candidate) as T;
}

function parseHeading(line: string) {
  const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line.trim());
  if (!match) return null;
  return { level: match[1]!.length, text: match[2]!.trim() };
}

function parseField(line: string): { key: string; value: string } | null {
  const match = /^[-*]\s+([A-Za-z][A-Za-z0-9 _/-]{1,48}):\s*(.*?)\s*$/.exec(line.trim());
  if (!match) return null;
  return {
    key: match[1]!.trim().toLowerCase().replace(/[\s/-]+/g, "_"),
    value: match[2]!.trim(),
  };
}

function uniqueIds(values: string[]) {
  return [...new Set(values.map(normalizeId))];
}

function extractIds(value: string, re: RegExp) {
  return uniqueIds(value.match(re) ?? []);
}

function parseKeyedHeading(text: string, re: RegExp) {
  const [rawId] = text.match(re) ?? [];
  if (!rawId) return null;
  const id = normalizeId(rawId);
  const escaped = rawId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const title = text
    .replace(new RegExp(`\\b${escaped}\\b`, "i"), "")
    .replace(/^[\s:.-]+/, "")
    .trim();
  return { id, title: title || id };
}

function splitList(value: string) {
  return value
    .split(/(?:\s*;\s*|\s*,\s*)/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeEnumValue(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export function parseMissionValidationContractDocument(document: IssueDocument | null): ValidationContract {
  const parsedJson = parseJsonDocument<unknown>(document);
  if (parsedJson) {
    const record = asRecord(parsedJson);
    const assertions = Array.isArray(record?.assertions) ? record!.assertions : [];
    return {
      assertions: assertions
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => ({
          id: typeof item.id === "string" ? normalizeId(item.id) : "VAL-MISSION-001",
          title: typeof item.title === "string" ? item.title : "Untitled assertion",
          user_value: typeof item.user_value === "string" ? item.user_value : "",
          scope: typeof item.scope === "string" ? item.scope : "",
          setup: typeof item.setup === "string" ? item.setup : "",
          steps: stringList(item.steps),
          oracle: typeof item.oracle === "string" ? item.oracle : "",
          tooling: stringList(item.tooling),
          evidence: Array.isArray(item.evidence)
            ? item.evidence.map((entry, index) => {
                const recordEntry = asRecord(entry);
                return {
                  kind: typeof recordEntry?.kind === "string" ? recordEntry.kind : `evidence-${index + 1}`,
                  description: typeof recordEntry?.description === "string" ? recordEntry.description : "",
                  required: recordEntry?.required !== false,
                };
              })
            : [],
          claimed_by: stringList(item.claimed_by).map(normalizeId),
          status: typeof item.status === "string" ? item.status : "unclaimed",
        })),
    };
  }

  const assertions: ValidationAssertion[] = [];
  let current: ValidationAssertion | null = null;
  for (const line of (document?.body ?? "").split(/\r?\n/)) {
    const heading = parseHeading(line);
    if (heading) {
      const parsed = parseKeyedHeading(heading.text, VALIDATION_ID_RE);
      if (parsed) {
        current = {
          id: parsed.id,
          title: parsed.title,
          user_value: "",
          scope: "",
          setup: "",
          steps: [],
          oracle: "",
          tooling: ["manual_review"],
          evidence: [],
          claimed_by: [],
          status: "unclaimed",
        };
        assertions.push(current);
        continue;
      }
    }
    if (!current) continue;
    const field = parseField(line);
    if (!field) continue;
    if (field.key === "user_value") current.user_value = field.value;
    if (field.key === "scope") current.scope = field.value;
    if (field.key === "setup") current.setup = field.value;
    if (field.key === "steps") current.steps = splitList(field.value);
    if (field.key === "oracle") current.oracle = field.value;
    if (field.key === "tooling") current.tooling = splitList(field.value).map(normalizeEnumValue);
    if (field.key === "evidence") {
      current.evidence = splitList(field.value).map((description, index) => ({
        kind: index === 0 ? "primary" : `supporting-${index}`,
        description,
        required: true,
      }));
    }
    if (["claimed_by", "claimed", "claims", "features"].includes(field.key)) {
      current.claimed_by = uniqueIds([...current.claimed_by, ...extractIds(field.value, FEATURE_ID_RE)]);
    }
    if (field.key === "status") current.status = normalizeEnumValue(field.value);
  }
  return { assertions };
}

export function parseMissionFeaturesDocument(document: IssueDocument | null): FeaturePlan {
  const parsedJson = parseJsonDocument<unknown>(document);
  if (parsedJson) {
    const record = asRecord(parsedJson);
    const milestones = Array.isArray(record?.milestones) ? record!.milestones : [];
    return {
      milestones: milestones
        .map((milestone) => asRecord(milestone))
        .filter((milestone): milestone is Record<string, unknown> => Boolean(milestone))
        .map((milestone, milestoneIndex) => ({
          id: typeof milestone.id === "string" ? normalizeId(milestone.id) : `MILESTONE-MISSION-${milestoneIndex + 1}`,
          title: typeof milestone.title === "string" ? milestone.title : `Milestone ${milestoneIndex + 1}`,
          summary: typeof milestone.summary === "string" ? milestone.summary : "",
          features: Array.isArray(milestone.features)
            ? milestone.features
                .map((feature) => asRecord(feature))
                .filter((feature): feature is Record<string, unknown> => Boolean(feature))
                .map((feature, featureIndex) => ({
                  id: typeof feature.id === "string" ? normalizeId(feature.id) : `FEAT-MISSION-${featureIndex + 1}`,
                  title: typeof feature.title === "string" ? feature.title : `Feature ${featureIndex + 1}`,
                  kind: feature.kind === "fix" ? "fix" : "original",
                  summary: typeof feature.summary === "string" ? feature.summary : "",
                  acceptance_criteria: stringList(feature.acceptance_criteria),
                  claimed_assertion_ids: stringList(feature.claimed_assertion_ids).map(normalizeId),
                  status: typeof feature.status === "string" ? feature.status : "planned",
                  source_finding_id:
                    typeof feature.source_finding_id === "string" ? normalizeId(feature.source_finding_id) : null,
                }))
            : [],
        })),
    };
  }

  const milestoneById = new Map<string, FeaturePlan["milestones"][number]>();
  let currentMilestone: FeaturePlan["milestones"][number] | null = null;
  let currentFeature: FeaturePlan["milestones"][number]["features"][number] | null = null;

  function ensureMilestone(id: string, title: string) {
    const normalizedId = normalizeId(id);
    const existing = milestoneById.get(normalizedId);
    if (existing) return existing;
    const milestone = {
      id: normalizedId,
      title: title.trim() || normalizedId,
      summary: title.trim() || normalizedId,
      features: [],
    };
    milestoneById.set(normalizedId, milestone);
    return milestone;
  }

  for (const line of (document?.body ?? "").split(/\r?\n/)) {
    const heading = parseHeading(line);
    if (heading) {
      const featureHeading = parseKeyedHeading(heading.text, FEATURE_ID_RE);
      if (featureHeading) {
        currentMilestone ??= ensureMilestone("MILESTONE-MISSION-001", "Mission milestone");
        currentFeature = {
          id: featureHeading.id,
          title: featureHeading.title,
          kind: "original",
          summary: "",
          acceptance_criteria: [],
          claimed_assertion_ids: [],
          status: "planned",
          source_finding_id: null,
        };
        currentMilestone.features.push(currentFeature);
        continue;
      }
      const milestoneHeading = parseKeyedHeading(heading.text, MILESTONE_ID_RE);
      if (milestoneHeading) {
        currentMilestone = ensureMilestone(milestoneHeading.id, milestoneHeading.title);
        currentFeature = null;
        continue;
      }
    }
    const field = parseField(line);
    if (!field) continue;
    if (currentFeature) {
      if (field.key === "kind") currentFeature.kind = field.value.toLowerCase() === "fix" ? "fix" : "original";
      if (["summary", "description"].includes(field.key)) currentFeature.summary = field.value;
      if (["acceptance_criteria", "success_criteria"].includes(field.key)) {
        currentFeature.acceptance_criteria = splitList(field.value);
      }
      if (["claimed_assertion_ids", "claimed_by", "claims", "assertions", "validation"].includes(field.key)) {
        currentFeature.claimed_assertion_ids = uniqueIds([
          ...currentFeature.claimed_assertion_ids,
          ...extractIds(field.value, VALIDATION_ID_RE),
        ]);
      }
      if (field.key === "source_finding_id") currentFeature.source_finding_id = field.value || null;
      if (field.key === "status") currentFeature.status = normalizeEnumValue(field.value);
      continue;
    }
    if (currentMilestone && ["summary", "description"].includes(field.key)) {
      currentMilestone.summary = field.value;
    }
  }

  return { milestones: [...milestoneById.values()] };
}

export function validationReportRoundFromKey(key: string) {
  const match = /^validation-report-round-([1-9][0-9]*)$/.exec(key);
  return match ? Number.parseInt(match[1]!, 10) : null;
}

export function isMissionValidationReportKey(key: string) {
  return validationReportRoundFromKey(key) !== null;
}

export function parseMissionValidationReportDocument(document: IssueDocument): ValidationReport {
  const parsedJson = parseJsonDocument<unknown>(document);
  if (parsedJson) {
    const record = asRecord(parsedJson);
    return {
      round: typeof record?.round === "number" ? record.round : validationReportRoundFromKey(document.key) ?? 1,
      validator_role:
        record?.validator_role === "user_testing_validator" ? "user_testing_validator" : "scrutiny_validator",
      summary: typeof record?.summary === "string" ? record.summary : "",
      findings: Array.isArray(record?.findings)
        ? record!.findings
            .map((finding) => asRecord(finding))
            .filter((finding): finding is Record<string, unknown> => Boolean(finding))
            .map((finding, index) => ({
              id: typeof finding.id === "string" ? normalizeId(finding.id) : `FINDING-MISSION-${index + 1}`,
              severity:
                finding.severity === "blocking" || finding.severity === "non_blocking" ? finding.severity : "suggestion",
              assertion_id:
                typeof finding.assertion_id === "string" ? normalizeId(finding.assertion_id) : null,
              title: typeof finding.title === "string" ? finding.title : `Finding ${index + 1}`,
              evidence: stringList(finding.evidence),
              repro_steps: stringList(finding.repro_steps),
              expected: typeof finding.expected === "string" ? finding.expected : "",
              actual: typeof finding.actual === "string" ? finding.actual : "",
              suspected_area: typeof finding.suspected_area === "string" ? finding.suspected_area : null,
              recommended_fix_scope:
                typeof finding.recommended_fix_scope === "string" ? finding.recommended_fix_scope : null,
              status:
                finding.status === "fix_created" || finding.status === "waived" || finding.status === "resolved"
                  ? finding.status
                  : "open",
            }))
        : [],
    };
  }

  const report: ValidationReport = {
    round: validationReportRoundFromKey(document.key) ?? 1,
    validator_role: "scrutiny_validator",
    summary: "",
    findings: [],
  };
  let currentFinding: ValidationReport["findings"][number] | null = null;

  for (const line of document.body.split(/\r?\n/)) {
    const heading = parseHeading(line);
    if (heading) {
      const findingHeading = parseKeyedHeading(heading.text, FINDING_ID_RE);
      if (findingHeading) {
        currentFinding = {
          id: findingHeading.id,
          severity: "suggestion",
          assertion_id: null,
          title: findingHeading.title,
          evidence: [],
          repro_steps: [],
          expected: "",
          actual: "",
          suspected_area: null,
          recommended_fix_scope: null,
          status: "open",
        };
        report.findings.push(currentFinding);
        continue;
      }
    }
    const field = parseField(line);
    if (!field) continue;
    if (!currentFinding) {
      if (field.key === "round") report.round = Number.parseInt(field.value, 10) || report.round;
      if (["validator_role", "role"].includes(field.key)) {
        report.validator_role =
          normalizeEnumValue(field.value) === "user_testing_validator"
            ? "user_testing_validator"
            : "scrutiny_validator";
      }
      if (field.key === "summary") report.summary = field.value;
      continue;
    }
    if (field.key === "severity") {
      const severity = normalizeEnumValue(field.value);
      currentFinding.severity = severity === "blocking" || severity === "non_blocking" ? severity : "suggestion";
    }
    if (["assertion_id", "assertion", "validation"].includes(field.key)) {
      currentFinding.assertion_id = extractIds(field.value, VALIDATION_ID_RE)[0] ?? null;
    }
    if (field.key === "title") currentFinding.title = field.value;
    if (field.key === "evidence") currentFinding.evidence = splitList(field.value);
    if (["repro_steps", "steps", "reproduction"].includes(field.key)) currentFinding.repro_steps = splitList(field.value);
    if (field.key === "expected") currentFinding.expected = field.value;
    if (field.key === "actual") currentFinding.actual = field.value;
    if (field.key === "suspected_area") currentFinding.suspected_area = field.value || null;
    if (field.key === "recommended_fix_scope") currentFinding.recommended_fix_scope = field.value || null;
    if (field.key === "status") {
      const next = normalizeEnumValue(field.value);
      currentFinding.status =
        next === "fix_created" || next === "waived" || next === "resolved" ? next : "open";
    }
  }

  return report;
}

function parseMissionFindingWaivers(decisionLogBody: string | null | undefined) {
  const waivers = new Map<string, string>();
  if (!decisionLogBody) return waivers;
  const markerRe = /<!--\s*paperclip:mission-finding-waiver:(FINDING-[A-Z0-9][A-Z0-9-]*-[0-9]{3,})\s*-->/g;
  const matches = [...decisionLogBody.matchAll(markerRe)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const findingId = match[1]!;
    const start = match.index! + match[0].length;
    const end = matches[index + 1]?.index ?? decisionLogBody.length;
    const block = decisionLogBody.slice(start, end);
    const rationale =
      /^\s*-\s+Rationale:\s*(.+?)\s*$/im.exec(block)?.[1]?.trim() ??
      block.trim().split(/\r?\n/).find((line) => line.trim())?.trim() ??
      "";
    waivers.set(findingId, rationale);
  }
  return waivers;
}

function toIssueLite(issue: Issue, relation: PluginIssueRelationSummary | undefined): MissionIssueLite {
  return {
    id: issue.id,
    identifier: issue.identifier ?? null,
    title: issue.title,
    status: issue.status,
    priority: issue.priority,
    originKind: issue.originKind ?? null,
    originId: issue.originId ?? null,
    assigneeAgentId: issue.assigneeAgentId,
    assigneeUserId: issue.assigneeUserId,
    blockedBy: relation?.blockedBy ?? [],
  };
}

function isTerminalIssue(status: string) {
  return TERMINAL_ISSUE_STATUSES.has(status);
}

function rootKindFor(pluginId: string, kind: "milestone" | "feature" | "validation" | "fix_loop") {
  return childMissionOrigin(pluginId, kind);
}

function originKey(issue: Pick<Issue, "originId">, kind: string) {
  const value = issue.originId ?? "";
  const prefix = `${kind}:`;
  const last = value.split(prefix);
  return last.length > 1 ? last[last.length - 1] ?? null : null;
}

function buildMilestones(input: {
  pluginId: string;
  rootIssue: Issue;
  descendants: Issue[];
  relations: Record<string, PluginIssueRelationSummary>;
  featurePlan: FeaturePlan | null;
}): MissionMilestoneProjection[] {
  const milestoneByKey = new Map<string, MissionMilestoneProjection>();
  const milestoneKeyByIssueId = new Map<string, string>();
  const milestoneKeyByFeatureKey = new Map<string, string>();
  const summaryByIssueId = new Map<string, MissionIssueLite>();

  for (const planned of input.featurePlan?.milestones ?? []) {
    milestoneByKey.set(planned.id, {
      key: planned.id,
      title: planned.title,
      summary: planned.summary,
      issue: null,
      features: [],
      validations: [],
      fixLoops: [],
      blockers: [],
    });
    for (const feature of planned.features) {
      milestoneKeyByFeatureKey.set(feature.id, planned.id);
    }
  }

  for (const issue of input.descendants) {
    summaryByIssueId.set(issue.id, toIssueLite(issue, input.relations[issue.id]));
  }

  for (const issue of input.descendants.filter((candidate) => candidate.originKind === rootKindFor(input.pluginId, "milestone"))) {
    const key = originKey(issue, "milestone") ?? issue.id;
    const existing = milestoneByKey.get(key);
    const summaryIssue = summaryByIssueId.get(issue.id) ?? toIssueLite(issue, input.relations[issue.id]);
    const next = existing ?? {
      key,
      title: issue.title,
      summary: issue.description ?? null,
      issue: null,
      features: [],
      validations: [],
      fixLoops: [],
      blockers: [],
    };
    next.issue = summaryIssue;
    milestoneByKey.set(key, next);
    milestoneKeyByIssueId.set(issue.id, key);
  }

  function ensureUngrouped() {
    const key = "ungrouped";
    const existing = milestoneByKey.get(key);
    if (existing) return existing;
    const projection: MissionMilestoneProjection = {
      key,
      title: "Ungrouped mission work",
      summary: "Generated mission work that is not tied to a parsed milestone.",
      issue: null,
      features: [],
      validations: [],
      fixLoops: [],
      blockers: [],
    };
    milestoneByKey.set(key, projection);
    return projection;
  }

  for (const issue of input.descendants) {
    const lite = summaryByIssueId.get(issue.id);
    if (!lite) continue;
    const featureKey =
      issue.originKind === rootKindFor(input.pluginId, "feature") ? originKey(issue, "feature") : null;
    const validationKey =
      issue.originKind === rootKindFor(input.pluginId, "validation") ? originKey(issue, "validation") : null;
    const fixLoopKey =
      issue.originKind === rootKindFor(input.pluginId, "fix_loop") ? originKey(issue, "fix_loop") : null;
    const milestoneKey =
      (featureKey ? milestoneKeyByFeatureKey.get(featureKey) : null) ??
      (validationKey ? validationKey.replace(/:round-[1-9][0-9]*$/, "") : null) ??
      fixLoopKey ??
      (issue.parentId ? milestoneKeyByIssueId.get(issue.parentId) : null);
    const milestone = milestoneKey ? milestoneByKey.get(milestoneKey) ?? ensureUngrouped() : ensureUngrouped();

    if (issue.originKind === rootKindFor(input.pluginId, "feature")) milestone.features.push(lite);
    if (issue.originKind === rootKindFor(input.pluginId, "validation")) milestone.validations.push(lite);
    if (issue.originKind === rootKindFor(input.pluginId, "fix_loop")) milestone.fixLoops.push(lite);
  }

  for (const milestone of milestoneByKey.values()) {
    const work = [
      ...(milestone.issue ? [milestone.issue] : []),
      ...milestone.features,
      ...milestone.validations,
      ...milestone.fixLoops,
    ];
    const blocked = work
      .map((issue) => ({
        issue,
        blockers: issue.blockedBy.filter((blocker) => !isTerminalIssue(blocker.status)),
      }))
      .filter((item) => item.issue.status === "blocked" || item.blockers.length > 0);
    const seen = new Set<string>();
    milestone.blockers = blocked.filter((item) => {
      if (seen.has(item.issue.id)) return false;
      seen.add(item.issue.id);
      return true;
    });
  }

  return [...milestoneByKey.values()];
}

function buildValidationSummary(input: {
  descendants: Issue[];
  relations: Record<string, PluginIssueRelationSummary>;
  reportDocuments: IssueDocument[];
  decisionLog: IssueDocument | null;
}) : MissionValidationSummary {
  const byIssueId = new Map<string, MissionIssueLite>();
  for (const issue of input.descendants) {
    byIssueId.set(issue.id, toIssueLite(issue, input.relations[issue.id]));
  }

  const fixIssueByFindingId = new Map<string, MissionIssueLite>();
  for (const issue of input.descendants) {
    const match = /fix:(FINDING-[A-Z0-9][A-Z0-9-]*-[0-9]{3,})/.exec(issue.originId ?? "");
    if (match) {
      const lite = byIssueId.get(issue.id);
      if (lite) fixIssueByFindingId.set(match[1]!, lite);
    }
  }

  const waivers = parseMissionFindingWaivers(input.decisionLog?.body);
  const reports: MissionValidationReportProjection[] = [];
  const findings: MissionFindingProjection[] = [];

  for (const document of input.reportDocuments) {
    const report = parseMissionValidationReportDocument(document);
    const reportProjection: MissionValidationReportProjection = {
      round: report.round,
      validatorRole: report.validator_role,
      summary: report.summary,
      findings: [],
      documentKey: document.key,
      documentTitle: document.title ?? null,
      updatedAt: document.updatedAt?.toISOString?.() ?? String(document.updatedAt ?? ""),
    };

    for (const finding of report.findings) {
      const fixIssue = fixIssueByFindingId.get(finding.id) ?? null;
      const waiverRationale = waivers.get(finding.id) ?? null;
      const computedStatus: MissionFindingStatus = waiverRationale
        ? "waived"
        : fixIssue
          ? fixIssue.status === "done"
            ? "resolved"
            : "fix_created"
          : finding.status;
      const projection: MissionFindingProjection = {
        id: finding.id,
        severity: finding.severity,
        assertionId: finding.assertion_id ?? null,
        title: finding.title,
        evidence: finding.evidence,
        reproSteps: finding.repro_steps,
        expected: finding.expected,
        actual: finding.actual,
        suspectedArea: finding.suspected_area ?? null,
        recommendedFixScope: finding.recommended_fix_scope ?? null,
        status: finding.status,
        sourceReportKey: document.key,
        sourceReportTitle: document.title ?? null,
        round: report.round,
        validatorRole: report.validator_role,
        computedStatus,
        fixIssue,
        waiverRationale,
      };
      reportProjection.findings.push(projection);
      findings.push(projection);
    }

    reports.push(reportProjection);
  }

  const counts = {
    total: findings.length,
    bySeverity: { blocking: 0, non_blocking: 0, suggestion: 0 } as Record<MissionSeverity, number>,
    byStatus: { open: 0, fix_created: 0, waived: 0, resolved: 0 } as Record<MissionFindingStatus, number>,
  };
  for (const finding of findings) {
    counts.bySeverity[finding.severity] += 1;
    counts.byStatus[finding.computedStatus] += 1;
  }

  return {
    reports,
    findings,
    counts,
    openBlockingFindingCount: findings.filter(
      (finding) => finding.severity === "blocking" && finding.computedStatus === "open",
    ).length,
  };
}

function buildGovernanceStops(input: {
  approvals: PluginIssueApprovalSummary[];
  openBudgetIncidents: PluginIssueOrchestrationSummary["openBudgetIncidents"];
  invocationBlocks: PluginIssueInvocationBlockSummary[];
}): MissionGovernanceStop[] {
  const approvalStops = input.approvals
    .filter((approval) => approval.status !== "approved")
    .map<MissionGovernanceStop>((approval) => ({
      kind: "approval",
      id: approval.id,
      label: "Approval pending",
      detail: `${approval.type} is ${approval.status}.`,
      issueId: approval.issueId,
      createdAt: approval.createdAt,
    }));
  const budgetStops = input.openBudgetIncidents.map<MissionGovernanceStop>((incident) => ({
    kind: "budget",
    id: incident.id,
    label: "Budget stop",
    detail: `${incident.scopeType} ${incident.thresholdType} ${incident.metric} limit hit (${incident.amountObserved}/${incident.amountLimit}).`,
    createdAt: incident.createdAt,
  }));
  const invocationStops = input.invocationBlocks.map<MissionGovernanceStop>((block) => ({
    kind: "invocation_block",
    id: `${block.issueId}:${block.scopeId}`,
    label: "Invocation blocked",
    detail: block.reason,
    createdAt: null,
    issueId: block.issueId,
  }));
  return [...approvalStops, ...budgetStops, ...invocationStops];
}

function deriveMissionState(input: {
  rootIssue: Issue;
  presentDocumentKeys: string[];
  activeWork: MissionIssueLite[];
  blockers: MissionBlockedWorkItem[];
  validationSummary: MissionValidationSummary;
  governanceStops: MissionGovernanceStop[];
  hasFinalReport: boolean;
}) : MissionState {
  if (input.rootIssue.status === "done" || input.hasFinalReport) return "complete";
  if (input.rootIssue.status === "blocked" || input.governanceStops.length > 0 || input.blockers.length > 0) return "blocked";
  const present = new Set(input.presentDocumentKeys);
  if (!present.has("mission-brief") || !present.has("validation-contract")) return "draft";
  if (!present.has("features")) return "planning";
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":fix_loop"))) return "fixing";
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":validation"))) return "validating";
  if (input.validationSummary.openBlockingFindingCount > 0) return "blocked";
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":feature"))) return "running";
  return "planning";
}

function deriveNextAction(input: {
  missingDocumentKeys: RequiredDocumentKey[];
  documentErrors: MissionDocumentError[];
  blockers: MissionBlockedWorkItem[];
  activeWork: MissionIssueLite[];
  validationSummary: MissionValidationSummary;
  hasGeneratedWork: boolean;
  hasFinalReport: boolean;
  governanceStops: MissionGovernanceStop[];
}) {
  if (input.governanceStops.length > 0) return "Clear mission governance stops before advancing work.";
  if (input.documentErrors.length > 0) return "Fix mission document parsing errors.";
  if (input.missingDocumentKeys.length > 0) return `Complete required mission documents: ${input.missingDocumentKeys.join(", ")}.`;
  if (input.blockers.length > 0) return "Resolve blocking issues before advancing mission work.";
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":validation"))) {
    return "Review active validation work and capture findings.";
  }
  if (input.validationSummary.openBlockingFindingCount > 0) {
    return "Create bounded fix issues for open blocking validation findings.";
  }
  if (input.validationSummary.counts.byStatus.open > 0) {
    return "Triage open validation findings or record waivers.";
  }
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":fix_loop"))) {
    return "Drive fix work to completion and re-run validation.";
  }
  if (input.activeWork.some((issue) => issue.originKind?.endsWith(":feature"))) {
    return "Continue active feature work and collect implementation evidence.";
  }
  if (!input.hasGeneratedWork) return "Decompose the mission into milestone and feature issues.";
  if (!input.hasFinalReport) return "Write the final mission report.";
  return "Review mission state and choose the next controlled transition.";
}

function buildCommands(input: {
  isMission: boolean;
  missingDocumentKeys: RequiredDocumentKey[];
  documentErrors: MissionDocumentError[];
  hasGeneratedWork: boolean;
  validationSummary: MissionValidationSummary;
}) : MissionCommand[] {
  if (!input.isMission) {
    return [{ key: "initialize", label: "Initialize mission", enabled: true, reason: null }];
  }
  const planningHealthy = input.missingDocumentKeys.length === 0 && input.documentErrors.length === 0;
  return [
    {
      key: "initialize",
      label: "Initialize mission",
      enabled: false,
      reason: "This issue is already initialized as a mission.",
    },
    {
      key: "decompose",
      label: input.hasGeneratedWork ? "Sync plan" : "Decompose",
      enabled: false,
      reason: planningHealthy ? "Decomposition wiring lands in PAP-1687." : "Fix document health before decomposing.",
    },
    {
      key: "advance",
      label: "Advance",
      enabled: false,
      reason: planningHealthy ? "Advance loop lands in PAP-1689." : "Fix document health before advancing.",
    },
    {
      key: "waive",
      label: "Waive finding",
      enabled: false,
      reason: input.validationSummary.findings.length > 0 ? "Finding waivers land in PAP-1689." : "No findings available.",
    },
  ];
}

export function buildMissionSummary(input: BuildMissionSummaryInput): MissionSummary {
  const rootDocuments = input.documentSummaries;
  const documentChecklist = REQUIRED_DOCUMENT_KEYS.map((key) => {
    const document = rootDocuments.find((candidate) => candidate.key === key);
    return {
      key,
      title: document?.title ?? null,
      present: Boolean(document),
      latestRevisionNumber: document?.latestRevisionNumber ?? null,
      updatedAt: document?.updatedAt?.toISOString?.() ?? (document?.updatedAt ? String(document.updatedAt) : null),
    };
  });
  const missingDocumentKeys = REQUIRED_DOCUMENT_KEYS.filter(
    (key) => !rootDocuments.some((document) => document.key === key),
  );
  const documentErrors: MissionDocumentError[] = [];

  try {
    parseMissionValidationContractDocument(input.requiredDocuments["validation-contract"] ?? null);
  } catch (error) {
    documentErrors.push({ key: "validation-contract", message: error instanceof Error ? error.message : "Invalid document." });
  }

  let featurePlan: FeaturePlan | null = null;
  try {
    featurePlan = parseMissionFeaturesDocument(input.requiredDocuments.features ?? null);
  } catch (error) {
    documentErrors.push({ key: "features", message: error instanceof Error ? error.message : "Invalid document." });
  }

  const descendants = input.subtreeIssues.filter((issue) => issue.id !== input.rootIssue.id);
  const rootLite = toIssueLite(input.rootIssue, input.relations[input.rootIssue.id]);
  const descendantLites = descendants.map((issue) => toIssueLite(issue, input.relations[issue.id]));
  const activeWork = descendantLites.filter((issue) => !isTerminalIssue(issue.status));
  const blockers = [rootLite, ...descendantLites]
    .map((issue) => ({
      issue,
      blockers: issue.blockedBy.filter((blocker) => !isTerminalIssue(blocker.status)),
    }))
    .filter((item) => item.issue.status === "blocked" || item.blockers.length > 0);
  const dedupedBlockers: MissionBlockedWorkItem[] = [];
  const seenBlockers = new Set<string>();
  for (const item of blockers) {
    if (seenBlockers.has(item.issue.id)) continue;
    seenBlockers.add(item.issue.id);
    dedupedBlockers.push(item);
  }

  const validationSummary = buildValidationSummary({
    descendants,
    relations: input.relations,
    reportDocuments: input.validationReports,
    decisionLog: input.decisionLog,
  });
  const milestones = buildMilestones({
    pluginId: input.pluginId,
    rootIssue: input.rootIssue,
    descendants,
    relations: input.relations,
    featurePlan,
  });
  const governanceStops = buildGovernanceStops({
    approvals: input.orchestration.approvals,
    openBudgetIncidents: input.orchestration.openBudgetIncidents,
    invocationBlocks: input.orchestration.invocationBlocks,
  });
  const state = deriveMissionState({
    rootIssue: input.rootIssue,
    presentDocumentKeys: rootDocuments.map((document) => document.key),
    activeWork,
    blockers: dedupedBlockers,
    validationSummary,
    governanceStops,
    hasFinalReport: rootDocuments.some((document) => document.key === "mission-final-report"),
  });
  const hasGeneratedWork = descendants.some((issue) => isMissionOrigin(input.pluginId, issue.originKind));
  const nextAction = deriveNextAction({
    missingDocumentKeys,
    documentErrors,
    blockers: dedupedBlockers,
    activeWork,
    validationSummary,
    hasGeneratedWork,
    hasFinalReport: rootDocuments.some((document) => document.key === "mission-final-report"),
    governanceStops,
  });
  const sortedRuns = [...input.orchestration.runs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    missionIssueId: input.rootIssue.id,
    missionIdentifier: input.rootIssue.identifier ?? null,
    missionTitle: input.rootIssue.title,
    state,
    documentChecklist,
    missingDocumentKeys,
    documentErrors,
    milestones,
    blockers: dedupedBlockers,
    activeWork,
    validationSummary,
    runSummary: {
      total: input.orchestration.runs.length,
      active: input.orchestration.runs.filter((run) => ACTIVE_RUN_STATUSES.has(run.status)).length,
      latestRunId: sortedRuns[0]?.id ?? null,
      latestRunStatus: sortedRuns[0]?.status ?? null,
    },
    costSummary: {
      costCents: input.orchestration.costs.costCents,
      inputTokens: input.orchestration.costs.inputTokens,
      cachedInputTokens: input.orchestration.costs.cachedInputTokens,
      outputTokens: input.orchestration.costs.outputTokens,
      billingCode: input.orchestration.costs.billingCode,
    },
    approvals: input.orchestration.approvals,
    governanceStops,
    nextAction,
    availableCommands: buildCommands({
      isMission: true,
      missingDocumentKeys,
      documentErrors,
      hasGeneratedWork,
      validationSummary,
    }),
  };
}

async function getRootDocuments(ctx: PluginContext, companyId: string, issueId: string) {
  const summaries = await ctx.issues.documents.list(issueId, companyId);
  const relevantKeys = summaries
    .map((document) => document.key)
    .filter((key) => (REQUIRED_DOCUMENT_KEYS as readonly string[]).includes(key) || isMissionValidationReportKey(key) || key === "mission-final-report");
  const docs = await Promise.all(
    relevantKeys.map(async (key) => [key, await ctx.issues.documents.get(issueId, key, companyId)] as const),
  );
  const docMap = new Map<string, IssueDocument>();
  for (const [key, document] of docs) {
    if (document) docMap.set(key, document);
  }
  return {
    summaries,
    documents: docMap,
    decisionLog: (await ctx.issues.documents.get(issueId, "decision-log", companyId)) ?? null,
  };
}

export async function loadMissionSummary(input: LoadMissionSummaryInput): Promise<MissionSummary> {
  const rootIssue = await input.ctx.issues.get(input.missionRootIssueId, input.companyId);
  if (!rootIssue) {
    throw new Error(`Mission root issue not found: ${input.missionRootIssueId}`);
  }
  const [subtree, orchestration, rootDocuments] = await Promise.all([
    input.ctx.issues.getSubtree(rootIssue.id, input.companyId, {
      includeRelations: true,
      includeDocuments: true,
      includeActiveRuns: true,
      includeAssignees: true,
    }),
    input.ctx.issues.summaries.getOrchestration({
      issueId: rootIssue.id,
      companyId: input.companyId,
      includeSubtree: true,
      billingCode: rootIssue.billingCode ?? null,
    }),
    getRootDocuments(input.ctx, input.companyId, rootIssue.id),
  ]);

  return buildMissionSummary({
    pluginId: input.ctx.manifest.id,
    rootIssue,
    subtreeIssues: subtree.issues,
    relations: subtree.relations ?? {},
    orchestration,
    documentSummaries: rootDocuments.summaries,
    requiredDocuments: {
      plan: rootDocuments.documents.get("plan") ?? null,
      "mission-brief": rootDocuments.documents.get("mission-brief") ?? null,
      "validation-contract": rootDocuments.documents.get("validation-contract") ?? null,
      features: rootDocuments.documents.get("features") ?? null,
      "worker-guidelines": rootDocuments.documents.get("worker-guidelines") ?? null,
      services: rootDocuments.documents.get("services") ?? null,
      "knowledge-base": rootDocuments.documents.get("knowledge-base") ?? null,
      "decision-log": rootDocuments.documents.get("decision-log") ?? null,
    },
    validationReports: [...rootDocuments.documents.values()].filter((document) => isMissionValidationReportKey(document.key)),
    decisionLog: rootDocuments.decisionLog,
  });
}

export async function readMissionSettings(ctx: PluginContext, companyId: string): Promise<MissionSettings> {
  const stored = await ctx.state.get({ scopeKind: "company", scopeId: companyId, stateKey: "mission-settings" });
  const record = asRecord(stored);
  return {
    maxValidationRounds:
      typeof record?.maxValidationRounds === "number" && record.maxValidationRounds > 0
        ? Math.floor(record.maxValidationRounds)
        : DEFAULT_SETTINGS.maxValidationRounds,
    requireBlackBoxValidation:
      typeof record?.requireBlackBoxValidation === "boolean"
        ? record.requireBlackBoxValidation
        : DEFAULT_SETTINGS.requireBlackBoxValidation,
    defaultWorkerAgentId:
      typeof record?.defaultWorkerAgentId === "string" && record.defaultWorkerAgentId.trim()
        ? record.defaultWorkerAgentId
        : null,
    defaultValidatorAgentId:
      typeof record?.defaultValidatorAgentId === "string" && record.defaultValidatorAgentId.trim()
        ? record.defaultValidatorAgentId
        : null,
    defaultBillingCodePolicy:
      record?.defaultBillingCodePolicy === "stable-prefix" ? "stable-prefix" : DEFAULT_SETTINGS.defaultBillingCodePolicy,
    autoAdvance: typeof record?.autoAdvance === "boolean" ? record.autoAdvance : DEFAULT_SETTINGS.autoAdvance,
  };
}

export async function writeMissionSettings(
  ctx: PluginContext,
  companyId: string,
  patch: Partial<MissionSettings>,
): Promise<MissionSettings> {
  const next = { ...(await readMissionSettings(ctx, companyId)), ...patch };
  await ctx.state.set({ scopeKind: "company", scopeId: companyId, stateKey: "mission-settings" }, next);
  return next;
}

export async function initializeMission(
  ctx: PluginContext,
  companyId: string,
  issueId: string,
): Promise<MissionPanelData> {
  const issue = await ctx.issues.get(issueId, companyId);
  if (!issue) throw new Error("Issue not found");

  const existing = await ctx.issues.documents.list(issue.id, companyId);
  const existingKeys = new Set(existing.map((document) => document.key));
  for (const key of REQUIRED_DOCUMENT_KEYS) {
    if (existingKeys.has(key)) continue;
    const template = defaultMissionDocument({ issue, key });
    await ctx.issues.documents.upsert({
      issueId: issue.id,
      key,
      companyId,
      title: template.title,
      format: "markdown",
      body: template.body,
      changeSummary: "Initialize mission document bundle",
    });
  }

  const nextOriginKind = rootMissionOrigin(ctx.manifest.id) as PluginIssueOriginKind;
  const nextOriginId = issue.originId ?? issue.identifier ?? issue.id;
  const nextBillingCode = missionBillingCode(issue);
  if (issue.originKind !== nextOriginKind || issue.originId !== nextOriginId || issue.billingCode !== nextBillingCode) {
    await ctx.issues.update(
      issue.id,
      {
        originKind: nextOriginKind,
        originId: nextOriginId,
        billingCode: nextBillingCode,
      },
      companyId,
    );
  }

  return loadMissionPanelData(ctx, companyId, issueId);
}

export async function resolveMissionRootIssue(
  ctx: PluginContext,
  companyId: string,
  issueId: string,
): Promise<Issue | null> {
  let current = await ctx.issues.get(issueId, companyId);
  while (current) {
    if (isRootMission(ctx.manifest.id, current)) return current;
    if (!current.parentId) return null;
    current = await ctx.issues.get(current.parentId, companyId);
  }
  return null;
}

export async function loadMissionPanelData(
  ctx: PluginContext,
  companyId: string,
  issueId: string,
): Promise<MissionPanelData> {
  const currentIssue = await ctx.issues.get(issueId, companyId);
  if (!currentIssue) throw new Error("Issue not found");
  const missionRoot = await resolveMissionRootIssue(ctx, companyId, issueId);
  if (!missionRoot) {
    return {
      mode: "not_mission",
      issue: toIssueLite(currentIssue, { blockedBy: [], blocks: [] }),
      availableCommands: buildCommands({
        isMission: false,
        missingDocumentKeys: [...REQUIRED_DOCUMENT_KEYS],
        documentErrors: [],
        hasGeneratedWork: false,
        validationSummary: {
          reports: [],
          findings: [],
          counts: {
            total: 0,
            bySeverity: { blocking: 0, non_blocking: 0, suggestion: 0 },
            byStatus: { open: 0, fix_created: 0, waived: 0, resolved: 0 },
          },
          openBlockingFindingCount: 0,
        },
      }),
    };
  }
  return {
    mode: "mission",
    currentIssueId: currentIssue.id,
    currentIssueIdentifier: currentIssue.identifier ?? null,
    currentIssueTitle: currentIssue.title,
    missionRootIssueId: missionRoot.id,
    missionRootIdentifier: missionRoot.identifier ?? null,
    summary: await loadMissionSummary({ ctx, companyId, missionRootIssueId: missionRoot.id }),
  };
}

export async function listMissionSummaries(ctx: PluginContext, companyId: string): Promise<MissionListItem[]> {
  const roots = await ctx.issues.list({
    companyId,
    originKind: rootMissionOrigin(ctx.manifest.id) as PluginIssueOriginKind,
    limit: 200,
  });
  const summaries = await Promise.all(
    roots.map(async (root) => ({
      root,
      summary: await loadMissionSummary({ ctx, companyId, missionRootIssueId: root.id }),
    })),
  );
  return summaries
    .map(({ root, summary }) => ({
      missionIssueId: summary.missionIssueId,
      missionIdentifier: summary.missionIdentifier,
      missionTitle: summary.missionTitle,
      state: summary.state,
      nextAction: summary.nextAction,
      activeWorkCount: summary.activeWork.length,
      blockerCount: summary.blockers.length,
      milestoneCount: summary.milestones.length,
      featureCount: summary.milestones.reduce((total, milestone) => total + milestone.features.length, 0),
      validationFindingCount: summary.validationSummary.counts.total,
      governanceStopCount: summary.governanceStops.length,
      documentHealth: {
        present: summary.documentChecklist.filter((item) => item.present).length,
        total: summary.documentChecklist.length,
        errors: summary.documentErrors.length,
      },
      costCents: summary.costSummary.costCents,
      latestRunStatus: summary.runSummary.latestRunStatus,
      updatedAt: toIsoDateString(root.updatedAt),
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
