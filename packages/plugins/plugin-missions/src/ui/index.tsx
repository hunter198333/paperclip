import {
  usePluginAction,
  usePluginData,
  usePluginToast,
  type PluginHostContext,
  type PluginPageProps,
  type PluginSettingsPageProps,
} from "@paperclipai/plugin-sdk/ui";
import type React from "react";

type EntitySlotProps = {
  context: PluginHostContext & {
    entityId: string;
    entityType: string;
  };
};

type SurfaceStatus = {
  status: "ok";
  checkedAt: string;
  companyId: string | null;
  databaseNamespace: string;
  routeKeys: string[];
  uiSlotIds: string[];
  pluginId: string;
  message: string;
};

type MissionSummary = {
  status: "not_configured";
  companyId: string;
  issueId: string;
  missionIssueId: string;
  missionIdentifier: string | null;
  missionTitle: string;
  childIssueCount: number;
  documentCount: number;
  blockerCount: number;
  routeKeys: string[];
  uiSlotIds: string[];
  databaseNamespace: string;
  message: string;
};

type MissionsList = {
  status: "not_configured";
  companyId: string;
  missions: Array<{
    issueId: string;
    identifier: string | null;
    title: string;
    status: string;
  }>;
  routeKeys: string[];
  pageRoute: string;
  message: string;
};

const panelStyle = {
  display: "grid",
  gap: 12,
  padding: 16,
  border: "1px solid #d1d5db",
  borderRadius: 8,
  background: "#ffffff",
  color: "#111827",
} satisfies React.CSSProperties;

const gridStyle = {
  display: "grid",
  gap: 8,
} satisfies React.CSSProperties;

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
} satisfies React.CSSProperties;

const buttonStyle = {
  border: "1px solid #111827",
  background: "#111827",
  color: "#ffffff",
  borderRadius: 6,
  padding: "6px 10px",
  font: "inherit",
  cursor: "pointer",
} satisfies React.CSSProperties;

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "#ffffff",
  color: "#111827",
} satisfies React.CSSProperties;

function IssueScopedPanel({
  data,
  onAdvance,
}: {
  data: MissionSummary;
  onAdvance: () => Promise<void>;
}) {
  return (
    <div style={panelStyle}>
      <div style={rowStyle}>
        <strong>Mission Scaffold</strong>
        <button style={buttonStyle} type="button" onClick={() => void onAdvance()}>
          Advance
        </button>
      </div>
      <div style={gridStyle}>
        <div style={rowStyle}><span>Issue</span><code>{data.missionIdentifier ?? data.issueId}</code></div>
        <div style={rowStyle}><span>Children</span><strong>{data.childIssueCount}</strong></div>
        <div style={rowStyle}><span>Documents</span><strong>{data.documentCount}</strong></div>
        <div style={rowStyle}><span>Blockers</span><strong>{data.blockerCount}</strong></div>
        <div style={rowStyle}><span>Namespace</span><code>{data.databaseNamespace}</code></div>
      </div>
      <div>{data.message}</div>
    </div>
  );
}

export function MissionsPage({ context }: PluginPageProps) {
  const companyId = context.companyId;
  const { data, loading, error, refresh } = usePluginData<MissionsList>("missions-list", {
    companyId,
  });

  if (!companyId) return <div style={panelStyle}>Open a company to view missions.</div>;
  if (loading) return <div style={panelStyle}>Loading missions scaffold...</div>;
  if (error) return <div style={panelStyle}>Missions page error: {error.message}</div>;
  if (!data) return null;

  return (
    <div style={panelStyle}>
      <div style={rowStyle}>
        <strong>Missions</strong>
        <button style={secondaryButtonStyle} type="button" onClick={() => refresh()}>
          Refresh
        </button>
      </div>
      <div>{data.message}</div>
      {data.missions.length === 0 ? (
        <div>No mission issues are registered yet.</div>
      ) : (
        <div style={gridStyle}>
          {data.missions.map((mission) => (
            <div key={mission.issueId} style={{ ...rowStyle, borderTop: "1px solid #e5e7eb", paddingTop: 8 }}>
              <span>{mission.identifier ?? mission.issueId}</span>
              <strong>{mission.status}</strong>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MissionIssuePanel({ context }: EntitySlotProps) {
  const { data, loading, error, refresh } = usePluginData<MissionSummary>("mission-summary", {
    companyId: context.companyId,
    issueId: context.entityId,
  });
  const advanceMission = usePluginAction("advance-mission");
  const toast = usePluginToast();

  if (!context.companyId || !context.entityId) {
    return <div style={panelStyle}>Mission controls need an issue context.</div>;
  }
  if (loading) return <div style={panelStyle}>Loading mission scaffold...</div>;
  if (error) return <div style={panelStyle}>Mission panel error: {error.message}</div>;
  if (!data) return null;

  return (
    <IssueScopedPanel
      data={data}
      onAdvance={async () => {
        await advanceMission({ companyId: context.companyId, issueId: context.entityId });
        toast({
          title: "Mission route reserved",
          body: "Advance is wired, but runtime behavior lands in a follow-up issue.",
          tone: "info",
        });
        refresh();
      }}
    />
  );
}

export function MissionToolbarButton({ context }: EntitySlotProps) {
  const initializeMission = usePluginAction("initialize-mission");
  const toast = usePluginToast();

  return (
    <button
      style={buttonStyle}
      type="button"
      onClick={async () => {
        if (!context.companyId || !context.entityId) return;
        await initializeMission({ companyId: context.companyId, issueId: context.entityId });
        toast({
          title: "Mission scaffold ready",
          body: "Initialization is wired to the worker shell.",
          tone: "success",
        });
      }}
    >
      Init Mission
    </button>
  );
}

export function MissionsSettingsPage({ context }: PluginSettingsPageProps) {
  const { data, loading, error } = usePluginData<SurfaceStatus>("surface-status", {
    ...(context.companyId ? { companyId: context.companyId } : {}),
  });

  if (loading) return <div style={panelStyle}>Loading missions settings...</div>;
  if (error) return <div style={panelStyle}>Missions settings error: {error.message}</div>;
  if (!data) return null;

  return (
    <div style={panelStyle}>
      <strong>Missions Settings Surface</strong>
      <div style={gridStyle}>
        <div style={rowStyle}><span>Plugin</span><code>{data.pluginId}</code></div>
        <div style={rowStyle}><span>Namespace</span><code>{data.databaseNamespace}</code></div>
        <div style={rowStyle}><span>Routes</span><strong>{data.routeKeys.length}</strong></div>
        <div style={rowStyle}><span>UI Slots</span><strong>{data.uiSlotIds.length}</strong></div>
      </div>
      <div>{data.message}</div>
    </div>
  );
}
