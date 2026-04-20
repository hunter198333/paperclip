import type { MissionRequiredDocumentKey } from "./constants.js";
import { MISSION_REQUIRED_DOCUMENT_KEYS } from "./constants.js";
import type { MissionDocumentTemplate, MissionTemplateIssueContext } from "./types.js";

function issueReference(issue: Pick<MissionTemplateIssueContext, "identifier" | "id">) {
  if (!issue.identifier) return `\`${issue.id}\``;
  const prefix = issue.identifier.split("-")[0]?.toUpperCase();
  return prefix ? `[${issue.identifier}](/${prefix}/issues/${issue.identifier})` : `\`${issue.id}\``;
}

function missionBillingCode(issue: Pick<MissionTemplateIssueContext, "identifier" | "id" | "billingCode">) {
  return issue.billingCode ?? `mission:${issue.identifier ?? issue.id}`;
}

export function defaultMissionDocument(input: {
  issue: MissionTemplateIssueContext;
  key: MissionRequiredDocumentKey;
}): MissionDocumentTemplate {
  const { issue, key } = input;
  const ref = issueReference(issue);
  const issueTitle = issue.title.trim();

  switch (key) {
    case "plan":
      return {
        key,
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
        key,
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
        key,
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
        key,
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
        key,
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
        key,
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
        key,
        title: "Knowledge Base",
        body: [
          "# Knowledge Base",
          "",
          "- TODO: Add concise discoveries that future workers or validators need.",
        ].join("\n"),
      };
    case "decision-log":
      return {
        key,
        title: "Decision Log",
        body: [
          "# Decision Log",
          "",
          "- Mission initialized from existing issue state.",
        ].join("\n"),
      };
  }
}

export function createDefaultMissionDocumentTemplates(issue: MissionTemplateIssueContext): MissionDocumentTemplate[] {
  return MISSION_REQUIRED_DOCUMENT_KEYS.map((key) => defaultMissionDocument({ issue, key }));
}
