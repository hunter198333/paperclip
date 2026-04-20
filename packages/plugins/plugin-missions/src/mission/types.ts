import type {
  MissionFeatureKind,
  MissionFeatureStatus,
  MissionFindingSeverity,
  MissionFindingStatus,
  MissionIssueStatus,
  MissionRequiredDocumentKey,
  MissionRoleType,
  MissionValidationAssertionStatus,
  MissionValidationTooling,
} from "./constants.js";

export interface MissionEvidenceRequirement {
  kind: string;
  description: string;
  required: boolean;
}

export interface MissionValidationAssertion {
  id: string;
  title: string;
  user_value: string;
  scope: string;
  setup: string;
  steps: string[];
  oracle: string;
  tooling: MissionValidationTooling[];
  evidence: MissionEvidenceRequirement[];
  claimed_by: string[];
  status: MissionValidationAssertionStatus;
}

export interface MissionValidationContract {
  assertions: MissionValidationAssertion[];
}

export interface MissionFeature {
  id: string;
  title: string;
  kind: MissionFeatureKind;
  summary: string;
  acceptance_criteria: string[];
  claimed_assertion_ids: string[];
  depends_on: string[];
  status: MissionFeatureStatus;
  source_finding_id?: string | null;
}

export interface MissionMilestone {
  id: string;
  title: string;
  summary: string;
  depends_on: string[];
  features: MissionFeature[];
}

export interface MissionFeaturesDocument {
  milestones: MissionMilestone[];
}

export interface MissionFinding {
  id: string;
  severity: MissionFindingSeverity;
  assertion_id?: string | null;
  title: string;
  evidence: string[];
  repro_steps: string[];
  expected: string;
  actual: string;
  suspected_area?: string | null;
  recommended_fix_scope?: string | null;
  status: MissionFindingStatus;
}

export interface MissionValidationReport {
  round: number;
  validator_role: Extract<MissionRoleType, "scrutiny_validator" | "user_testing_validator">;
  summary: string;
  findings: MissionFinding[];
}

export interface MissionFindingWaiver {
  findingId: string;
  rationale: string;
  actorLabel?: string | null;
  recordedAt?: string | null;
}

export interface MissionDecisionLogEntry extends MissionFindingWaiver {
  kind: "finding_waiver";
}

export interface MissionDecisionLog {
  entries: MissionDecisionLogEntry[];
}

export interface MissionTemplateIssueContext {
  id: string;
  identifier?: string | null;
  title: string;
  description?: string | null;
  status: MissionIssueStatus;
  billingCode?: string | null;
}

export interface MissionDocumentTemplate {
  key: MissionRequiredDocumentKey;
  title: string;
  body: string;
}
