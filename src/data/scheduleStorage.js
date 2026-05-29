// Per-project room schedule. localStorage-backed (`projectSchedule_<proposalId>`).
//
// Model: the schedule is AUTO-SEQUENCED. Rooms run back-to-back in list order,
// each consuming its `days` (working days). Day 0 = the Booking Token paid date
// (milestone id 1), or a manual `workStart` fallback. Dates are computed, never
// typed per-room. Health/escalation derive from the Master → Schedule config.
//
// Stored shape: { workStart: "YYYY-MM-DD" | "", rooms: [ {id, room, description,
// days, owner, status, note} ] }  — array order IS the sequence.

import { getConfigForType } from "./QuotePresets";
import { getMilestonesForLead } from "./LeadStatusConfig";
import { getScheduleConfig, getEscalationRole } from "./scheduleConfig";

const key = (proposalId) => `projectSchedule_${proposalId}`;

export function getSchedule(proposalId) {
  try {
    const raw = localStorage.getItem(key(proposalId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSchedule(proposalId, schedule) {
  localStorage.setItem(key(proposalId), JSON.stringify(schedule));
  window.dispatchEvent(new Event("scheduleChanged"));
}

let _seq = 0;
const newId = () => `t${Date.now().toString(36)}_${_seq++}`;

export function makeRoom(partial = {}) {
  const cfg = getScheduleConfig();
  return {
    id: newId(),
    room: "",
    description: "",
    days: "",
    owner: "",
    status: cfg.statuses[0] || "Not Started",
    note: "",
    ...partial,
  };
}

// Rooms (name + description + default duration) from the matching proposal preset.
export function seedRoomsFromProposal(lead) {
  if (!lead) return [];
  const cfg = getConfigForType(lead.quotePreset, lead.propertyType);
  const items = cfg?.scopeItems || [];
  const status0 = getScheduleConfig().statuses[0] || "Not Started";
  return items.map((s) =>
    makeRoom({
      room: s.area || "",
      description: s.description || "",
      days: s.days ?? "",
      status: status0,
    }),
  );
}

// Saved schedule, or a seeded (unsaved) one. Pure — no write during render.
export function getOrSeedSchedule(lead) {
  if (!lead) return { workStart: "", rooms: [] };
  const saved = getSchedule(lead.proposalId);
  if (saved) return { workStart: saved.workStart || "", rooms: saved.rooms || [] };
  return { workStart: "", rooms: seedRoomsFromProposal(lead) };
}

// ── Working-day math ─────────────────────────────────────────────────────────
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

function nextWorkingDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  while (isWeekend(d)) d.setDate(d.getDate() + 1);
  return d;
}

// Advance `n` working days from `date` (weekends skipped).
function addWorkingDays(date, n) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    if (!isWeekend(d)) added += 1;
  }
  return d;
}

const parseDDMMYYYY = (s) => {
  const [d, m, y] = (s || "").split(".").map(Number);
  if (!d || !m || !y) return null;
  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

// Day-0 anchor from the Booking Token (milestone id 1) once it's paid.
export function getBookingDate(milestones) {
  const booking = (milestones || []).find(
    (m) => m.id === 1 && m.status === "paid",
  );
  return booking?.paidDate ? parseDDMMYYYY(booking.paidDate) : null;
}

// Resolve Day 0: booking paid date wins; else the manual workStart; else null.
export function resolveAnchor(lead, schedule) {
  const booking = getBookingDate(getMilestonesForLead(lead));
  if (booking) return { date: booking, source: "booking" };
  if (schedule?.workStart) {
    const d = new Date(`${schedule.workStart}T00:00:00`);
    if (!Number.isNaN(d.getTime())) return { date: d, source: "manual" };
  }
  return { date: null, source: null };
}

// Compute each room's start/end by chaining working-day durations from anchor.
// Rooms with no/zero duration are returned unscheduled and don't advance the
// cursor. Returns a new array: [{ ...room, start: Date|null, end: Date|null }].
export function computeChain(rooms, anchorDate) {
  if (!anchorDate) return rooms.map((r) => ({ ...r, start: null, end: null }));
  let cursor = nextWorkingDay(anchorDate);
  return rooms.map((r) => {
    const days = Math.max(0, Number(r.days) || 0);
    if (days <= 0) return { ...r, start: null, end: null };
    const start = new Date(cursor);
    const end = days > 1 ? addWorkingDays(start, days - 1) : new Date(start);
    cursor = addWorkingDays(end, 1);
    return { ...r, start, end };
  });
}

export const RAG_CHIP = {
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-600",
  none: "bg-gray-100 text-gray-500",
};

// Health for a room given its computed end date + status.
export function getRoomHealth(end, status, config = getScheduleConfig()) {
  const isDone = String(status || "").toLowerCase() === "done";
  if (isDone)
    return { rag: "green", state: "done", label: "Done", daysOverdue: 0, role: null };
  if (!end)
    return { rag: "none", state: "unscheduled", label: "—", daysOverdue: 0, role: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((end - today) / 86400000);

  if (diff < 0) {
    const daysOverdue = Math.abs(diff);
    const role = getEscalationRole(daysOverdue, config);
    return {
      rag: "red",
      state: "overdue",
      daysOverdue,
      role,
      label: role ? `${daysOverdue}d overdue → ${role}` : `${daysOverdue}d overdue`,
    };
  }
  if (diff <= (Number(config.amberWindowDays) || 0)) {
    return {
      rag: "amber",
      state: "due-soon",
      daysOverdue: 0,
      role: null,
      label: diff === 0 ? "Due today" : `Due in ${diff}d`,
    };
  }
  return { rag: "green", state: "on-track", daysOverdue: 0, role: null, label: `${diff}d left` };
}

// Roll-up: overdue room count for a project (resolves anchor itself).
export function getProjectOverdueCount(lead) {
  const schedule = getSchedule(lead?.proposalId);
  if (!schedule?.rooms?.length) return 0;
  const { date } = resolveAnchor(lead, schedule);
  const config = getScheduleConfig();
  return computeChain(schedule.rooms, date).filter(
    (r) => getRoomHealth(r.end, r.status, config).state === "overdue",
  ).length;
}
