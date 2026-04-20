import { describe, expect, it } from "vitest";
import {
  advanceMissionSchema,
  buildMissionFindingWaiverEntry,
  createDefaultMissionDocumentTemplates,
  decomposeMissionSchema,
  deriveIssueBackedMissionState,
  getMissionMilestoneSummaryDocumentKey,
  getMissionValidationReportDocumentKey,
  isMissionDocumentKey,
  missionDecisionLogMarkdownFixture,
  missionFeaturesDocumentSchema,
  missionFeaturesFixture,
  missionFeaturesMarkdownFixture,
  missionFindingSchema,
  missionStateDerivationInputSchema,
  missionTemplateIssueFixture,
  missionValidationContractFixture,
  missionValidationContractMarkdownFixture,
  missionValidationContractSchema,
  missionValidationReportFixture,
  missionValidationReportMarkdownFixture,
  missionValidationReportSchema,
  parseMissionDecisionLogDocument,
  parseMissionFeaturesDocument,
  parseMissionFindingWaivers,
  parseMissionValidationContractDocument,
  parseMissionValidationReportDocument,
} from "../src/mission/index.js";

describe("mission document keys", () => {
  it("accepts required and generated mission document keys", () => {
    expect(isMissionDocumentKey("validation-contract")).toBe(true);
    expect(isMissionDocumentKey("validation-report-round-2")).toBe(true);
    expect(isMissionDocumentKey("milestone-summary-foundation")).toBe(true);
    expect(isMissionDocumentKey("mission-final-report")).toBe(true);
    expect(isMissionDocumentKey("unknown")).toBe(false);
  });

  it("builds generated document keys from canonical helpers", () => {
    expect(getMissionValidationReportDocumentKey(3)).toBe("validation-report-round-3");
    expect(getMissionMilestoneSummaryDocumentKey("Foundation_1")).toBe("milestone-summary-foundation_1");
    expect(() => getMissionValidationReportDocumentKey(0)).toThrow("positive integers");
    expect(() => getMissionMilestoneSummaryDocumentKey("not valid")).toThrow("document-key-safe");
  });
});

describe("mission templates", () => {
  it("creates the required mission document bundle inside the plugin package", () => {
    const templates = createDefaultMissionDocumentTemplates(missionTemplateIssueFixture);

    expect(templates).toHaveLength(8);
    expect(templates.map((template) => template.key)).toEqual([
      "plan",
      "mission-brief",
      "validation-contract",
      "features",
      "worker-guidelines",
      "services",
      "knowledge-base",
      "decision-log",
    ]);
    expect(templates.find((template) => template.key === "mission-brief")?.body).toContain("mission:pap-1685");
  });
});

describe("mission validation contract schema", () => {
  it("accepts testable assertions with evidence requirements", () => {
    const parsed = missionValidationContractSchema.parse(missionValidationContractFixture);
    expect(parsed.assertions[0]?.id).toBe("VAL-MISSION-001");
  });

  it("rejects duplicate assertion IDs", () => {
    const result = missionValidationContractSchema.safeParse({
      assertions: [
        missionValidationContractFixture.assertions[0],
        missionValidationContractFixture.assertions[0],
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("Duplicate validation assertion id"))).toBe(true);
    }
  });

  it("parses validation assertions from structured markdown", () => {
    const parsed = parseMissionValidationContractDocument(missionValidationContractMarkdownFixture);
    expect(parsed.assertions[0]?.tooling).toEqual(["api_call", "manual_review"]);
  });
});

describe("mission features document schema", () => {
  it("accepts milestones with assertion-claiming features", () => {
    const parsed = missionFeaturesDocumentSchema.parse(missionFeaturesFixture);
    expect(parsed.milestones[0]?.features[0]?.claimed_assertion_ids).toEqual(["VAL-MISSION-001"]);
  });

  it("rejects original features that claim no assertions", () => {
    const result = missionFeaturesDocumentSchema.safeParse({
      milestones: [
        {
          ...missionFeaturesFixture.milestones[0],
          features: [
            {
              ...missionFeaturesFixture.milestones[0]!.features[0]!,
              claimed_assertion_ids: [],
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("must claim"))).toBe(true);
    }
  });

  it("parses milestone feature lists from structured markdown", () => {
    const parsed = parseMissionFeaturesDocument(missionFeaturesMarkdownFixture);
    expect(parsed.milestones[0]?.id).toBe("MILESTONE-MISSION-001");
    expect(parsed.milestones[0]?.features[0]?.id).toBe("FEAT-MISSION-001");
  });
});

describe("mission finding and report schemas", () => {
  it("accepts structured validation findings in reports", () => {
    const parsed = missionValidationReportSchema.parse(missionValidationReportFixture);
    expect(parsed.findings[0]?.severity).toBe("blocking");
  });

  it("rejects blocking findings without assertion references", () => {
    const result = missionFindingSchema.safeParse({
      ...missionValidationReportFixture.findings[0],
      assertion_id: null,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message.includes("must reference"))).toBe(true);
    }
  });

  it("parses validation reports from structured markdown", () => {
    const parsed = parseMissionValidationReportDocument(missionValidationReportMarkdownFixture);
    expect(parsed.round).toBe(2);
    expect(parsed.findings[0]?.evidence).toHaveLength(2);
  });
});

describe("mission waivers and decision logs", () => {
  it("parses finding waivers from the decision log", () => {
    const parsed = parseMissionDecisionLogDocument(missionDecisionLogMarkdownFixture);
    expect(parsed.entries[0]).toEqual({
      kind: "finding_waiver",
      findingId: "FINDING-MISSION-002",
      rationale: "Acceptable for MVP.",
      actorLabel: "Board",
      recordedAt: "2026-04-20T12:00:00.000Z",
    });
  });

  it("builds waiver entries that round-trip through the decision log parser", () => {
    const entry = buildMissionFindingWaiverEntry({
      findingId: "FINDING-MISSION-003",
      rationale: "Known UX tradeoff.",
      actorLabel: "CTO",
      createdAt: "2026-04-20T13:00:00.000Z",
    });
    const waivers = parseMissionFindingWaivers(["# Decision Log", "", entry].join("\n"));

    expect(waivers.get("FINDING-MISSION-003")).toEqual({
      findingId: "FINDING-MISSION-003",
      rationale: "Known UX tradeoff.",
      actorLabel: "CTO",
      recordedAt: "2026-04-20T13:00:00.000Z",
    });
  });
});

describe("issue-backed mission state and action schemas", () => {
  it("derives draft, active, and terminal mission states from issue/document inputs", () => {
    expect(
      deriveIssueBackedMissionState({
        missionIssueStatus: "in_progress",
        presentDocumentKeys: ["mission-brief"],
      }),
    ).toBe("draft");

    expect(
      deriveIssueBackedMissionState({
        missionIssueStatus: "in_progress",
        presentDocumentKeys: ["mission-brief", "validation-contract", "features"],
        hasActiveValidationIssues: true,
      }),
    ).toBe("validating");

    expect(
      deriveIssueBackedMissionState({
        missionIssueStatus: "done",
        presentDocumentKeys: ["mission-brief", "validation-contract", "features", "mission-final-report"],
      }),
    ).toBe("completed");
  });

  it("validates derivation inputs and mission action schemas", () => {
    expect(() =>
      missionStateDerivationInputSchema.parse({
        missionIssueStatus: "in_progress",
        presentDocumentKeys: ["invalid-key"],
      }),
    ).toThrow("Unknown mission document key");

    expect(decomposeMissionSchema.parse({})).toEqual({ dryRun: false });
    expect(advanceMissionSchema.parse({ budgetLimitCents: 100, maxValidationRounds: 2 })).toEqual({
      budgetLimitCents: 100,
      maxValidationRounds: 2,
    });
  });
});
