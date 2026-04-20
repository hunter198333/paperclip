export const MISSION_REQUIRED_DOCUMENT_KEYS = [
  "plan",
  "mission-brief",
  "validation-contract",
  "features",
  "worker-guidelines",
  "services",
  "knowledge-base",
  "decision-log",
] as const;
export type MissionRequiredDocumentKey = (typeof MISSION_REQUIRED_DOCUMENT_KEYS)[number];

export const MISSION_GENERATED_DOCUMENT_KEY_PREFIXES = [
  "validation-report-round-",
  "milestone-summary-",
  "mission-final-report",
] as const;

export const MISSION_STATES = [
  "draft",
  "planning",
  "ready_for_approval",
  "running",
  "validating",
  "fixing",
  "blocked",
  "paused",
  "completed",
  "cancelled",
] as const;
export type MissionState = (typeof MISSION_STATES)[number];

export const MISSION_ROLE_TYPES = [
  "orchestrator",
  "worker",
  "scrutiny_validator",
  "user_testing_validator",
  "board",
] as const;
export type MissionRoleType = (typeof MISSION_ROLE_TYPES)[number];

export const MISSION_VALIDATION_ASSERTION_STATUSES = [
  "unclaimed",
  "claimed",
  "passing",
  "failing",
  "blocked",
  "waived",
] as const;
export type MissionValidationAssertionStatus = (typeof MISSION_VALIDATION_ASSERTION_STATUSES)[number];

export const MISSION_VALIDATION_TOOLING = [
  "unit_test",
  "api_call",
  "browser",
  "screenshot",
  "log_inspection",
  "code_review",
  "cli_command",
  "manual_review",
  "other",
] as const;
export type MissionValidationTooling = (typeof MISSION_VALIDATION_TOOLING)[number];

export const MISSION_FEATURE_KINDS = ["original", "fix"] as const;
export type MissionFeatureKind = (typeof MISSION_FEATURE_KINDS)[number];

export const MISSION_FEATURE_STATUSES = [
  "planned",
  "in_progress",
  "implemented",
  "validating",
  "validated",
  "blocked",
  "cancelled",
] as const;
export type MissionFeatureStatus = (typeof MISSION_FEATURE_STATUSES)[number];

export const MISSION_FINDING_SEVERITIES = ["blocking", "non_blocking", "suggestion"] as const;
export type MissionFindingSeverity = (typeof MISSION_FINDING_SEVERITIES)[number];

export const MISSION_FINDING_STATUSES = ["open", "fix_created", "resolved", "waived"] as const;
export type MissionFindingStatus = (typeof MISSION_FINDING_STATUSES)[number];

export const MISSION_HOST_ISSUE_STATUSES = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled",
] as const;
export type MissionIssueStatus = (typeof MISSION_HOST_ISSUE_STATUSES)[number];
