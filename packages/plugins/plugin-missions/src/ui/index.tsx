import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent, ReactNode } from "react";
import {
  useHostContext,
  usePluginAction,
  usePluginData,
  usePluginToast,
  type PluginDetailTabProps,
  type PluginPageProps,
  type PluginSettingsPageProps,
  type PluginWidgetProps,
} from "@paperclipai/plugin-sdk/ui";
import type {
  MissionCommand,
  MissionListItem,
  MissionPanelData,
  MissionSettings,
  MissionSummary,
} from "../mission-service.js";
import { MISSIONS_PAGE_ROUTE } from "../manifest.js";

type MissionAgentSummary = {
  id: string;
  name: string;
  status: string;
  title: string | null;
};

type MissionFilter = "all" | MissionListItem["state"];

const shellStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  color: "inherit",
};

const sectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  padding: "14px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  background: "color-mix(in srgb, var(--card, transparent) 86%, transparent)",
};

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexWrap: "wrap",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
};

const metricsGridStyle: CSSProperties = {
  display: "grid",
  gap: "10px",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
};

const listGridStyle: CSSProperties = {
  display: "grid",
  gap: "8px",
};

const metricStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  padding: "12px",
  border: "1px solid color-mix(in srgb, var(--border) 76%, transparent)",
  borderRadius: "8px",
};

const buttonStyle: CSSProperties = {
  appearance: "none",
  border: "1px solid var(--border)",
  borderRadius: "999px",
  background: "transparent",
  color: "inherit",
  padding: "6px 12px",
  font: "inherit",
  cursor: "pointer",
};

const primaryButtonStyle: CSSProperties = {
  ...buttonStyle,
  background: "var(--foreground)",
  color: "var(--background)",
  borderColor: "var(--foreground)",
};

const mutedTextStyle: CSSProperties = {
  fontSize: "12px",
  opacity: 0.74,
  lineHeight: 1.45,
};

const codeStyle: CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: "12px",
};

const fieldStyle: CSSProperties = {
  display: "grid",
  gap: "6px",
};

const inputStyle: CSSProperties = {
  width: "100%",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "8px 10px",
  background: "transparent",
  color: "inherit",
  font: "inherit",
};

const checkboxRowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
};

function hostPath(companyPrefix: string | null | undefined, suffix: string): string {
  return companyPrefix ? `/${companyPrefix}${suffix}` : suffix;
}

function pluginPageHref(companyPrefix: string | null | undefined): string {
  return hostPath(companyPrefix, `/${MISSIONS_PAGE_ROUTE}`);
}

function issueHref(companyPrefix: string | null | undefined, issueRef: string): string {
  return hostPath(companyPrefix, `/issues/${issueRef}`);
}

function toneForState(state: MissionSummary["state"] | MissionListItem["state"]): CSSProperties {
  switch (state) {
    case "blocked":
      return {
        background: "color-mix(in srgb, #dc2626 18%, transparent)",
        borderColor: "color-mix(in srgb, #dc2626 60%, var(--border))",
        color: "#fca5a5",
      };
    case "validating":
      return {
        background: "color-mix(in srgb, #2563eb 18%, transparent)",
        borderColor: "color-mix(in srgb, #2563eb 60%, var(--border))",
        color: "#93c5fd",
      };
    case "fixing":
      return {
        background: "color-mix(in srgb, #ea580c 18%, transparent)",
        borderColor: "color-mix(in srgb, #ea580c 60%, var(--border))",
        color: "#fdba74",
      };
    case "running":
      return {
        background: "color-mix(in srgb, #16a34a 18%, transparent)",
        borderColor: "color-mix(in srgb, #16a34a 60%, var(--border))",
        color: "#86efac",
      };
    case "complete":
      return {
        background: "color-mix(in srgb, #0f766e 18%, transparent)",
        borderColor: "color-mix(in srgb, #0f766e 60%, var(--border))",
        color: "#99f6e4",
      };
    case "planning":
      return {
        background: "color-mix(in srgb, #7c3aed 18%, transparent)",
        borderColor: "color-mix(in srgb, #7c3aed 60%, var(--border))",
        color: "#c4b5fd",
      };
    case "draft":
    default:
      return {
        background: "color-mix(in srgb, #6b7280 18%, transparent)",
        borderColor: "color-mix(in srgb, #6b7280 60%, var(--border))",
        color: "#d1d5db",
      };
  }
}

function formatMoney(costCents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(costCents / 100);
}

function formatDate(value: string | null) {
  if (!value) return "n/a";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={sectionStyle}>
      <div style={rowStyle}>
        <strong>{title}</strong>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ label, value, detail }: { label: string; value: ReactNode; detail?: ReactNode }) {
  return (
    <div style={metricStyle}>
      <span style={mutedTextStyle}>{label}</span>
      <strong>{value}</strong>
      {detail ? <span style={mutedTextStyle}>{detail}</span> : null}
    </div>
  );
}

function StateBadge({ state }: { state: MissionSummary["state"] | MissionListItem["state"] }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        border: "1px solid var(--border)",
        borderRadius: "999px",
        padding: "2px 8px",
        fontSize: "11px",
        textTransform: "capitalize",
        ...toneForState(state),
      }}
    >
      {state.replaceAll("_", " ")}
    </span>
  );
}

function CommandButtons({
  commands,
  onInitialize,
  initializePending,
}: {
  commands: MissionCommand[];
  onInitialize?: () => Promise<void>;
  initializePending?: boolean;
}) {
  return (
    <div style={{ ...rowStyle, justifyContent: "flex-start" }}>
      {commands.map((command) => {
        const active = command.key === "initialize" && command.enabled && onInitialize;
        return (
          <button
            key={command.key}
            type="button"
            style={active ? primaryButtonStyle : buttonStyle}
            disabled={!active || initializePending}
            title={!command.enabled ? command.reason ?? undefined : undefined}
            onClick={active ? () => void onInitialize() : undefined}
          >
            {command.key === "initialize" && initializePending ? "Initializing..." : command.label}
          </button>
        );
      })}
    </div>
  );
}

function SummarySections({
  summary,
  companyPrefix,
}: {
  summary: MissionSummary;
  companyPrefix: string | null | undefined;
}) {
  return (
    <>
      <Section title="Overview">
        <div style={rowStyle}>
          <div style={{ display: "grid", gap: "4px" }}>
            <div style={{ ...rowStyle, justifyContent: "flex-start" }}>
              <strong>{summary.missionTitle}</strong>
              <StateBadge state={summary.state} />
            </div>
            <div style={mutedTextStyle}>{summary.nextAction}</div>
          </div>
          <a href={issueHref(companyPrefix, summary.missionIdentifier ?? summary.missionIssueId)} style={buttonStyle}>
            Open Root Issue
          </a>
        </div>
        <div style={metricsGridStyle}>
          <Metric label="Active Work" value={summary.activeWork.length} />
          <Metric label="Blockers" value={summary.blockers.length} />
          <Metric label="Findings" value={summary.validationSummary.counts.total} />
          <Metric label="Governance Stops" value={summary.governanceStops.length} />
          <Metric label="Runs" value={summary.runSummary.total} detail={`${summary.runSummary.active} active`} />
          <Metric label="Cost" value={formatMoney(summary.costSummary.costCents)} detail={summary.costSummary.billingCode ?? "No billing code"} />
        </div>
      </Section>

      <Section title="Documents">
        <div style={listGridStyle}>
          {summary.documentChecklist.map((document) => (
            <div key={document.key} style={rowStyle}>
              <span style={codeStyle}>{document.key}</span>
              <span style={mutedTextStyle}>
                {document.present ? document.title ?? "Present" : "Missing"}
              </span>
            </div>
          ))}
        </div>
        {summary.documentErrors.length > 0 ? (
          <div style={listGridStyle}>
            {summary.documentErrors.map((error) => (
              <div key={`${error.key}:${error.message}`} style={{ ...mutedTextStyle, color: "#fca5a5" }}>
                <span style={codeStyle}>{error.key}</span>: {error.message}
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Issue Tree">
        {summary.milestones.length === 0 ? (
          <div style={mutedTextStyle}>No mission milestones are projected yet.</div>
        ) : (
          <div style={listGridStyle}>
            {summary.milestones.map((milestone) => (
              <div key={milestone.key} style={metricStyle}>
                <div style={rowStyle}>
                  <strong>{milestone.title}</strong>
                  <span style={mutedTextStyle}>{milestone.issue?.identifier ?? milestone.issue?.id ?? milestone.key}</span>
                </div>
                {milestone.summary ? <div style={mutedTextStyle}>{milestone.summary}</div> : null}
                <div style={rowStyle}>
                  <span style={mutedTextStyle}>Features {milestone.features.length}</span>
                  <span style={mutedTextStyle}>Validations {milestone.validations.length}</span>
                  <span style={mutedTextStyle}>Fix Loops {milestone.fixLoops.length}</span>
                  <span style={mutedTextStyle}>Blocked {milestone.blockers.length}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Blockers">
        {summary.blockers.length === 0 ? (
          <div style={mutedTextStyle}>No unresolved issue blockers.</div>
        ) : (
          <div style={listGridStyle}>
            {summary.blockers.map((blocked) => (
              <div key={blocked.issue.id} style={metricStyle}>
                <div style={rowStyle}>
                  <strong>{blocked.issue.title}</strong>
                  <span style={mutedTextStyle}>{blocked.issue.identifier ?? blocked.issue.id}</span>
                </div>
                {blocked.blockers.map((blocker) => (
                  <div key={blocker.id} style={mutedTextStyle}>
                    Blocked by {blocker.identifier ?? blocker.id}: {blocker.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Validation">
        <div style={metricsGridStyle}>
          <Metric label="Reports" value={summary.validationSummary.reports.length} />
          <Metric label="Findings" value={summary.validationSummary.counts.total} />
          <Metric label="Blocking Open" value={summary.validationSummary.openBlockingFindingCount} />
        </div>
        {summary.validationSummary.reports.length > 0 ? (
          <div style={listGridStyle}>
            {summary.validationSummary.reports.map((report) => (
              <div key={report.documentKey} style={metricStyle}>
                <div style={rowStyle}>
                  <strong>Round {report.round}</strong>
                  <span style={mutedTextStyle}>{report.validatorRole.replaceAll("_", " ")}</span>
                </div>
                <div style={mutedTextStyle}>{report.summary}</div>
                <div style={mutedTextStyle}>Updated {formatDate(report.updatedAt)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={mutedTextStyle}>No validation rounds recorded yet.</div>
        )}
        {summary.validationSummary.findings.length > 0 ? (
          <div style={listGridStyle}>
            {summary.validationSummary.findings.map((finding) => (
              <div key={finding.id} style={metricStyle}>
                <div style={rowStyle}>
                  <strong>{finding.title}</strong>
                  <span style={mutedTextStyle}>
                    {finding.severity.replaceAll("_", " ")} / {finding.computedStatus.replaceAll("_", " ")}
                  </span>
                </div>
                <div style={mutedTextStyle}>
                  Round {finding.round} via {finding.validatorRole.replaceAll("_", " ")}
                </div>
                {finding.waiverRationale ? <div style={mutedTextStyle}>Waiver: {finding.waiverRationale}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </Section>

      <Section title="Governance">
        {summary.governanceStops.length === 0 ? (
          <div style={mutedTextStyle}>No active governance stops.</div>
        ) : (
          <div style={listGridStyle}>
            {summary.governanceStops.map((stop) => (
              <div key={`${stop.kind}:${stop.id}`} style={metricStyle}>
                <div style={rowStyle}>
                  <strong>{stop.label}</strong>
                  <span style={mutedTextStyle}>{stop.kind.replaceAll("_", " ")}</span>
                </div>
                <div style={mutedTextStyle}>{stop.detail}</div>
                <div style={mutedTextStyle}>Created {formatDate(stop.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}

function IssuePanelContent({
  companyId,
  companyPrefix,
  issueId,
}: {
  companyId: string;
  companyPrefix: string | null | undefined;
  issueId: string;
}) {
  const panel = usePluginData<MissionPanelData>("mission-panel", { companyId, issueId });
  const initializeMission = usePluginAction("initialize-mission");
  const toast = usePluginToast();
  const [initializePending, setInitializePending] = useState(false);

  const handleInitialize = async () => {
    setInitializePending(true);
    try {
      const nextPanel = await initializeMission({ companyId, issueId }) as MissionPanelData;
      toast({
        title: "Mission initialized",
        body: nextPanel.mode === "mission" ? nextPanel.summary.nextAction : "Mission documents created.",
        tone: "success",
      });
      panel.refresh();
    } finally {
      setInitializePending(false);
    }
  };

  if (panel.loading) return <div style={sectionStyle}>Loading mission summary...</div>;
  if (panel.error) return <div style={sectionStyle}>Mission panel error: {panel.error.message}</div>;
  if (!panel.data) return null;

  if (panel.data.mode === "not_mission") {
    return (
      <div style={shellStyle}>
        <Section title="Mission">
          <div style={mutedTextStyle}>This issue is not initialized as a mission.</div>
          <div style={mutedTextStyle}>{panel.data.issue.title}</div>
          <CommandButtons
            commands={panel.data.availableCommands}
            onInitialize={handleInitialize}
            initializePending={initializePending}
          />
        </Section>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <Section
        title="Mission"
        action={
          <a href={pluginPageHref(companyPrefix)} style={buttonStyle}>
            Company Missions
          </a>
        }
      >
        <div style={rowStyle}>
          <div style={{ display: "grid", gap: "4px" }}>
            <div>
              <strong>{panel.data.currentIssueTitle}</strong>
            </div>
            <div style={mutedTextStyle}>
              Root {panel.data.missionRootIdentifier ?? panel.data.missionRootIssueId}
            </div>
          </div>
          <StateBadge state={panel.data.summary.state} />
        </div>
        <CommandButtons commands={panel.data.summary.availableCommands} />
      </Section>
      <SummarySections summary={panel.data.summary} companyPrefix={companyPrefix} />
    </div>
  );
}

function MissionsPageContent({
  companyId,
  companyPrefix,
}: {
  companyId: string;
  companyPrefix: string | null | undefined;
}) {
  const missions = usePluginData<MissionListItem[]>("mission-list", { companyId });
  const [filter, setFilter] = useState<MissionFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (missions.data ?? []).filter((mission) => {
      if (filter !== "all" && mission.state !== filter) return false;
      if (!normalized) return true;
      return [mission.missionTitle, mission.missionIdentifier ?? "", mission.nextAction]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [filter, missions.data, query]);

  if (missions.loading) return <div style={sectionStyle}>Loading missions...</div>;
  if (missions.error) return <div style={sectionStyle}>Missions page error: {missions.error.message}</div>;

  return (
    <div style={shellStyle}>
      <Section
        title="Missions"
        action={
          <button type="button" style={buttonStyle} onClick={() => missions.refresh()}>
            Refresh
          </button>
        }
      >
        <div style={rowStyle}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search missions"
            style={{ ...inputStyle, maxWidth: "20rem" }}
          />
          <div style={{ ...rowStyle, justifyContent: "flex-start" }}>
            {(["all", "draft", "planning", "running", "blocked", "validating", "fixing", "complete"] as MissionFilter[]).map(
              (candidate) => (
                <button
                  key={candidate}
                  type="button"
                  style={candidate === filter ? primaryButtonStyle : buttonStyle}
                  onClick={() => setFilter(candidate)}
                >
                  {candidate}
                </button>
              ),
            )}
          </div>
        </div>
      </Section>

      {filtered.length === 0 ? (
        <Section title="Empty">
          <div style={mutedTextStyle}>No missions matched this company and filter state.</div>
        </Section>
      ) : (
        <div style={listGridStyle}>
          {filtered.map((mission) => (
            <section key={mission.missionIssueId} style={sectionStyle}>
              <div style={rowStyle}>
                <div style={{ display: "grid", gap: "4px" }}>
                  <a
                    href={issueHref(companyPrefix, mission.missionIdentifier ?? mission.missionIssueId)}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    <strong>{mission.missionTitle}</strong>
                  </a>
                  <div style={mutedTextStyle}>{mission.nextAction}</div>
                </div>
                <StateBadge state={mission.state} />
              </div>
              <div style={metricsGridStyle}>
                <Metric label="Work" value={mission.activeWorkCount} />
                <Metric label="Blockers" value={mission.blockerCount} />
                <Metric label="Milestones" value={mission.milestoneCount} />
                <Metric label="Features" value={mission.featureCount} />
                <Metric label="Findings" value={mission.validationFindingCount} />
                <Metric label="Stops" value={mission.governanceStopCount} />
                <Metric label="Cost" value={formatMoney(mission.costCents)} />
                <Metric label="Updated" value={formatDate(mission.updatedAt)} detail={mission.latestRunStatus ?? "No runs"} />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function DashboardWidgetContent({
  companyId,
  companyPrefix,
}: {
  companyId: string;
  companyPrefix: string | null | undefined;
}) {
  const missions = usePluginData<MissionListItem[]>("mission-list", { companyId });

  const counts = useMemo(() => {
    const rows = missions.data ?? [];
    return {
      total: rows.length,
      blocked: rows.filter((mission) => mission.state === "blocked").length,
      running: rows.filter((mission) => mission.state === "running").length,
      validating: rows.filter((mission) => mission.state === "validating").length,
    };
  }, [missions.data]);

  if (missions.loading) return <div style={sectionStyle}>Loading missions overview...</div>;
  if (missions.error) return <div style={sectionStyle}>Missions overview error: {missions.error.message}</div>;

  return (
    <div style={shellStyle}>
      <div style={rowStyle}>
        <strong>Missions</strong>
        <a href={pluginPageHref(companyPrefix)} style={buttonStyle}>
          Open
        </a>
      </div>
      <div style={metricsGridStyle}>
        <Metric label="Total" value={counts.total} />
        <Metric label="Blocked" value={counts.blocked} />
        <Metric label="Running" value={counts.running} />
        <Metric label="Validating" value={counts.validating} />
      </div>
    </div>
  );
}

function SettingsForm({
  companyId,
}: {
  companyId: string;
}) {
  const settings = usePluginData<MissionSettings>("mission-settings", { companyId });
  const agents = usePluginData<MissionAgentSummary[]>("mission-agents", { companyId });
  const saveSettings = usePluginAction("save-mission-settings");
  const toast = usePluginToast();
  const [draft, setDraft] = useState<MissionSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  if (settings.loading || agents.loading || !draft) return <div style={sectionStyle}>Loading mission settings...</div>;
  if (settings.error) return <div style={sectionStyle}>Missions settings error: {settings.error.message}</div>;
  if (agents.error) return <div style={sectionStyle}>Missions agent list error: {agents.error.message}</div>;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const next = await saveSettings({ companyId, ...draft }) as MissionSettings;
      setDraft(next);
      toast({
        title: "Mission settings saved",
        body: `Max validation rounds: ${next.maxValidationRounds}`,
        tone: "success",
      });
      settings.refresh();
    } finally {
      setSaving(false);
    }
  };

  const agentOptions = agents.data ?? [];

  return (
    <form style={shellStyle} onSubmit={submit}>
      <Section
        title="Mission Settings"
        action={
          <button type="submit" style={primaryButtonStyle} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        }
      >
        <div style={gridStyle}>
          <label style={fieldStyle}>
            <span>Max validation rounds</span>
            <input
              type="number"
              min={1}
              value={draft.maxValidationRounds}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? { ...current, maxValidationRounds: Math.max(1, Number(event.target.value) || 1) }
                    : current,
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={draft.requireBlackBoxValidation}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, requireBlackBoxValidation: event.target.checked } : current,
                )
              }
            />
            <span>Require black-box validation</span>
          </label>

          <label style={checkboxRowStyle}>
            <input
              type="checkbox"
              checked={draft.autoAdvance}
              onChange={(event) =>
                setDraft((current) => (current ? { ...current, autoAdvance: event.target.checked } : current))
              }
            />
            <span>Auto-advance when orchestration is healthy</span>
          </label>

          <label style={fieldStyle}>
            <span>Default worker agent</span>
            <select
              value={draft.defaultWorkerAgentId ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, defaultWorkerAgentId: event.target.value || null } : current,
                )
              }
              style={inputStyle}
            >
              <option value="">None</option>
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Default validator agent</span>
            <select
              value={draft.defaultValidatorAgentId ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current ? { ...current, defaultValidatorAgentId: event.target.value || null } : current,
                )
              }
              style={inputStyle}
            >
              <option value="">None</option>
              {agentOptions.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} ({agent.status})
                </option>
              ))}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Billing code policy</span>
            <select
              value={draft.defaultBillingCodePolicy}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        defaultBillingCodePolicy: event.target.value === "stable-prefix" ? "stable-prefix" : "mission-issue",
                      }
                    : current,
                )
              }
              style={inputStyle}
            >
              <option value="mission-issue">Mission issue derived</option>
              <option value="stable-prefix">Stable prefix</option>
            </select>
          </label>
        </div>
      </Section>
    </form>
  );
}

export function MissionsPage({ context }: PluginPageProps) {
  if (!context.companyId) return <div style={sectionStyle}>Open a company to view missions.</div>;
  return <MissionsPageContent companyId={context.companyId} companyPrefix={context.companyPrefix} />;
}

export function MissionIssuePanel({ context }: PluginDetailTabProps) {
  if (!context.companyId || !context.entityId) {
    return <div style={sectionStyle}>Mission controls require an issue inside a company.</div>;
  }
  return <IssuePanelContent companyId={context.companyId} companyPrefix={context.companyPrefix} issueId={context.entityId} />;
}

export function MissionsGlobalToolbarButton() {
  const context = useHostContext();
  if (!context.companyId) return null;
  return (
    <a href={pluginPageHref(context.companyPrefix)} style={buttonStyle}>
      Missions
    </a>
  );
}

export function MissionsSettingsPage({ context }: PluginSettingsPageProps) {
  if (!context.companyId) return <div style={sectionStyle}>Open a company to configure mission settings.</div>;
  return <SettingsForm companyId={context.companyId} />;
}

export function MissionsDashboardWidget({ context }: PluginWidgetProps) {
  if (!context.companyId) return <div style={sectionStyle}>Open a company to view mission health.</div>;
  return <DashboardWidgetContent companyId={context.companyId} companyPrefix={context.companyPrefix} />;
}
