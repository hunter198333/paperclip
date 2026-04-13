import type { Issue } from "@paperclipai/shared";

type SubIssueDefaultSource = Pick<
  Issue,
  | "id"
  | "identifier"
  | "title"
  | "projectId"
  | "projectWorkspaceId"
  | "goalId"
  | "executionWorkspaceId"
  | "executionWorkspacePreference"
  | "currentExecutionWorkspace"
  | "assigneeAgentId"
  | "assigneeUserId"
>;

export function buildSubIssueDefaults(issue: SubIssueDefaultSource) {
  const parentExecutionWorkspaceLabel =
    issue.currentExecutionWorkspace?.name
    ?? issue.currentExecutionWorkspace?.branchName
    ?? issue.currentExecutionWorkspace?.cwd
    ?? issue.executionWorkspaceId
    ?? null;

  return {
    parentId: issue.id,
    parentIdentifier: issue.identifier ?? undefined,
    parentTitle: issue.title,
    ...(issue.projectId ? { projectId: issue.projectId } : {}),
    ...(issue.projectWorkspaceId ? { projectWorkspaceId: issue.projectWorkspaceId } : {}),
    ...(issue.goalId ? { goalId: issue.goalId } : {}),
    ...(issue.executionWorkspaceId ? { executionWorkspaceId: issue.executionWorkspaceId } : {}),
    ...(issue.executionWorkspaceId
      ? { executionWorkspaceMode: "reuse_existing" }
      : issue.executionWorkspacePreference
        ? { executionWorkspaceMode: issue.executionWorkspacePreference }
        : {}),
    ...(parentExecutionWorkspaceLabel ? { parentExecutionWorkspaceLabel } : {}),
    ...(issue.assigneeAgentId ? { assigneeAgentId: issue.assigneeAgentId } : {}),
    ...(issue.assigneeUserId ? { assigneeUserId: issue.assigneeUserId } : {}),
  };
}
