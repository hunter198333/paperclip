import { MISSION_REQUIRED_DOCUMENT_KEYS } from "./constants.js";
import { buildMissionFindingWaiverEntry } from "./parsers.js";
import { createDefaultMissionDocumentTemplates } from "./templates.js";
import type {
  MissionFeaturesDocument,
  MissionTemplateIssueContext,
  MissionValidationContract,
  MissionValidationReport,
} from "./types.js";

export const missionTemplateIssueFixture: MissionTemplateIssueContext = {
  id: "issue-mission-1",
  identifier: "PAP-1685",
  title: "Port mission document contracts into the missions plugin",
  description: "Move the mission document contract into plugin-local modules.",
  status: "in_progress",
  billingCode: "mission:pap-1685",
};

export const missionValidationContractFixture: MissionValidationContract = {
  assertions: [
    {
      id: "VAL-MISSION-001",
      title: "Mission creates issue-backed state",
      user_value: "The board can inspect mission work as normal Paperclip work.",
      scope: "mission initialization",
      setup: "A company with a project and active orchestrator.",
      steps: ["Initialize a mission from an existing issue.", "Inspect mission issue documents."],
      oracle: "Required documents exist and no unscoped work is created.",
      tooling: ["api_call", "manual_review"],
      evidence: [
        {
          kind: "api-response",
          description: "JSON response listing created mission documents.",
          required: true,
        },
      ],
      claimed_by: ["FEAT-MISSION-001"],
      status: "claimed",
    },
  ],
};

export const missionValidationContractMarkdownFixture = `
### VAL-MISSION-001: Mission creates issue-backed state

- User value: The board can inspect mission work as normal Paperclip work.
- Scope: mission initialization
- Setup: A company with a project and active orchestrator.
- Steps: Initialize a mission from an existing issue; inspect mission issue documents.
- Oracle: Required documents exist and no unscoped work is created.
- Tooling: api call, manual review
- Evidence: API response listing created mission documents.
- Claimed by: FEAT-MISSION-001
- Status: claimed
`.trim();

export const missionFeaturesFixture: MissionFeaturesDocument = {
  milestones: [
    {
      id: "MILESTONE-MISSION-001",
      title: "Foundation",
      summary: "Create the mission state contract.",
      depends_on: [],
      features: [
        {
          id: "FEAT-MISSION-001",
          title: "Create mission documents",
          kind: "original",
          summary: "Add required document contracts.",
          acceptance_criteria: ["Plugin-local modules define every required mission document key."],
          claimed_assertion_ids: ["VAL-MISSION-001"],
          depends_on: [],
          status: "planned",
        },
      ],
    },
  ],
};

export const missionFeaturesMarkdownFixture = `
## MILESTONE-MISSION-001: Foundation

- Summary: Create the mission state contract.

### FEAT-MISSION-001: Create mission documents

- Summary: Add required document contracts.
- Acceptance criteria: Plugin-local modules define every required mission document key.
- Claims: VAL-MISSION-001
- Status: planned
`.trim();

export const missionValidationReportFixture: MissionValidationReport = {
  round: 2,
  validator_role: "scrutiny_validator",
  summary: "One blocking finding found.",
  findings: [
    {
      id: "FINDING-MISSION-001",
      severity: "blocking",
      assertion_id: "VAL-MISSION-001",
      title: "Required document missing",
      evidence: ["API response omitted validation-contract.", "Screenshot attached in issue comment."],
      repro_steps: ["Initialize mission.", "List issue documents."],
      expected: "validation-contract exists.",
      actual: "validation-contract is absent.",
      suspected_area: "mission initialization",
      recommended_fix_scope: "Create the missing document idempotently.",
      status: "open",
    },
  ],
};

export const missionValidationReportMarkdownFixture = `
- Round: 2
- Validator role: scrutiny validator
- Summary: One blocking finding found.

### FINDING-MISSION-001: Required document missing

- Severity: blocking
- Assertion: VAL-MISSION-001
- Evidence: API response omitted validation-contract; screenshot attached in issue comment
- Repro steps: Initialize mission; list issue documents
- Expected: validation-contract exists.
- Actual: validation-contract is absent.
- Suspected area: mission initialization
- Recommended fix scope: Create the missing document idempotently.
- Status: open
`.trim();

export const missionFindingWaiverEntryFixture = buildMissionFindingWaiverEntry({
  findingId: "FINDING-MISSION-002",
  rationale: "Acceptable for MVP.",
  actorLabel: "Board",
  createdAt: "2026-04-20T12:00:00.000Z",
});

export const missionDecisionLogMarkdownFixture = [
  "# Decision Log",
  "",
  missionFindingWaiverEntryFixture,
].join("\n");

export const missionTemplateFixtures = Object.fromEntries(
  createDefaultMissionDocumentTemplates(missionTemplateIssueFixture).map((template) => [template.key, template]),
) as Record<(typeof MISSION_REQUIRED_DOCUMENT_KEYS)[number], ReturnType<typeof createDefaultMissionDocumentTemplates>[number]>;
