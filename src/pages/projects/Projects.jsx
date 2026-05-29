import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Table from "../../components/Table";
import { TableData } from "../../data/TableData";
import {
  getAllProjects,
  getBadgeClass,
} from "../../data/LeadStatusConfig";

const SUB_TABS = ["In Sales", "In Delivery", "Handover Complete"];

const formatRelative = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

const summarizeActivity = (entry) => {
  if (!entry) return "—";
  switch (entry.type) {
    case "email":
      return `Email: ${entry.subject || "Proposal sent"}`;
    case "call":
      return `Call ${entry.direction || "outbound"}${entry.duration ? ` • ${entry.duration}m` : ""}`;
    case "note":
      return `Note: ${entry.text?.slice(0, 40) || "—"}`;
    case "negotiation":
      return `Moved to Negotiation`;
    case "milestone":
      return `Milestone: ${entry.milestoneName} ${entry.action}`;
    case "status":
      return `Status → ${entry.to}`;
    case "quote":
      return `Quote ${entry.quoteId || ""}: ${entry.subject || "sent"}`.trim();
    default:
      return entry.type;
  }
};

const buildRows = () => {
  // Combine static mock leads with localStorage overrides (mirroring how
  // Leads.jsx merges them) so a Project surfaces regardless of source.
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem("newLeadsData") || "[]");
  } catch {
    stored = [];
  }
  const overriddenIds = new Set(stored.map((l) => l.proposalId));
  const merged = [
    ...stored,
    ...TableData.filter((l) => !overriddenIds.has(l.proposalId)),
  ];
  return getAllProjects(merged).map((p, idx) => ({
    sno: String(idx + 1).padStart(2, "0"),
    proposalId: p.lead.proposalId,
    clientName: p.lead.clientName,
    status: p.lead.status,
    stageLabel: p.stage.label,
    progress: p.progress,
    lastActivity: p.lastActivity,
    investment: p.lead.investment,
    possessionDate: p.lead.possessionDate,
    phase: p.stage.phase,
    isHandoverComplete:
      p.stage.phase === "closed" && p.stage.label === "Handover Complete",
    isLost: p.lead.status?.toLowerCase() === "lost",
  }));
};

const Projects = () => {
  const navigate = useNavigate();
  const [allRows, setAllRows] = useState(() => buildRows());
  const [activeSubTab, setActiveSubTab] = useState(0);

  useEffect(() => {
    const handler = () => setAllRows(buildRows());
    window.addEventListener("focus", handler);
    window.addEventListener("leadDataChanged", handler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("leadDataChanged", handler);
    };
  }, []);

  const data = useMemo(() => {
    const filtered = allRows.filter((row) => {
      switch (activeSubTab) {
        case 0:
          return row.phase === "sales" && !row.isLost;
        case 1:
          return row.phase === "delivery";
        case 2:
          return row.isHandoverComplete;
        case 3:
          return row.isLost;
        default:
          return true;
      }
    });
    // Re-number after filter
    return filtered.map((r, i) => ({ ...r, sno: String(i + 1).padStart(2, "0") }));
  }, [allRows, activeSubTab]);

  const columns = [
    { key: "sno", label: "Sno" },
    {
      key: "proposalId",
      label: "Project ID",
      render: (_, item) => (
        <span
          className="cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${item.proposalId}`);
          }}
        >
          {item.proposalId}
        </span>
      ),
    },
    {
      key: "clientName",
      label: "Client Name",
      render: (_, item) => (
        <span
          className="cursor-pointer hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/projects/${item.proposalId}`);
          }}
        >
          {item.clientName}
        </span>
      ),
    },
    {
      key: "stageLabel",
      label: "Stage",
      render: (_, item) => (
        <span className="text-[13px] font-semibold text-darkgray">
          {item.stageLabel}
        </span>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      render: (_, item) => (
        <span className="text-[12px] text-text-muted">{item.progress}</span>
      ),
    },
    {
      key: "lastActivity",
      label: "Last Activity",
      render: (_, item) => (
        <div className="flex flex-col">
          <span className="text-[12px] text-gray-700 max-w-[220px] truncate">
            {summarizeActivity(item.lastActivity)}
          </span>
          <span className="text-[10px] text-text-subtle mt-0.5">
            {formatRelative(item.lastActivity?.at)}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (_, item) => (
        <span
          className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${getBadgeClass(item.status)}`}
        >
          {item.status}
        </span>
      ),
    },
    { key: "investment", label: "Investment" },
    { key: "possessionDate", label: "Possession" },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Table
        title="Projects"
        subtitle={`Projects - ${SUB_TABS[activeSubTab]}`}
        columns={columns}
        data={data}
        emptyMessage="No projects in this stage. Send a proposal from a lead to get started."
        rowsPerPage={8}
        activeRowKey="proposalId"
        onRowClick={(row) => navigate(`/projects/${row.proposalId}`)}
        subTabs={SUB_TABS}
        onSubTabChange={setActiveSubTab}
        sortFields={[
          { key: "clientName", label: "Client Name" },
          { key: "proposalId", label: "Project ID" },
          { key: "investment", label: "Investment" },
        ]}
        filterFields={[
          {
            key: "status",
            label: "Status",
            options: [
              "Proposal",
              "Negotiation",
              "Won",
              "Lost",
              "On Hold",
            ],
          },
        ]}
        exportConfig={{
          filename: "projects_export",
          columns: [
            { label: "Sno", key: "sno" },
            { label: "Project ID", key: "proposalId" },
            { label: "Client", key: "clientName" },
            { label: "Stage", key: "stageLabel" },
            { label: "Progress", key: "progress" },
            { label: "Status", key: "status" },
            { label: "Investment", key: "investment" },
            { label: "Possession", key: "possessionDate" },
          ],
        }}
      />
    </div>
  );
};

export default Projects;
