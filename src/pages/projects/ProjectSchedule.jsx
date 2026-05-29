import { useMemo, useState } from "react";
import {
  FiPlus,
  FiCalendar,
  FiUser,
  FiAlertTriangle,
  FiChevronUp,
  FiChevronDown,
  FiCheckCircle,
} from "react-icons/fi";
import Modal from "../../components/Modal";
import CategorySelect from "../../components/CategorySelect";
import { getScheduleConfig, getRoomDefaultDays } from "../../data/scheduleConfig";
import {
  getOrSeedSchedule,
  saveSchedule,
  makeRoom,
  resolveAnchor,
  computeChain,
  getRoomHealth,
  RAG_CHIP,
} from "../../data/scheduleStorage";

const fmt = (date) =>
  date
    ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
    : "—";

const RAG_DOT = {
  green: "bg-emerald-500",
  amber: "bg-amber-500",
  red: "bg-red-500",
  none: "bg-gray-300",
};

// ── Add / edit modal (no start date — dates are auto-sequenced) ───────────────
const RoomModal = ({ room, config, onSave, onDelete, onClose }) => {
  const isNew = !room._existing;
  const [form, setForm] = useState(room);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.room.trim()) return;
    const { _existing, ...clean } = form;
    onSave(clean);
  };

  return (
    <Modal
      title={isNew ? "Add room" : "Edit room"}
      subtitle="Duration drives the auto-sequenced timeline"
      onClose={onClose}
      maxWidth="max-w-[480px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onDelete(form.id)}
            disabled={isNew}
            className="text-sm font-semibold text-red-600 hover:underline disabled:text-text-subtle disabled:no-underline disabled:cursor-not-allowed"
          >
            Delete
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-grey hover:bg-bg-soft transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.room.trim()}
              className="px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Labelled label="Room / category">
          <CategorySelect
            value={form.room}
            onChange={(v) => {
              const d = getRoomDefaultDays(v);
              setForm((f) => ({ ...f, room: v, days: d !== "" ? d : f.days }));
            }}
            className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor bg-white cursor-pointer focus:outline-none focus:border-select-blue"
          />
        </Labelled>

        <Labelled label="Description">
          <input
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Scope for this room"
            className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor focus:outline-none focus:border-select-blue"
          />
        </Labelled>

        <div className="grid grid-cols-2 gap-4">
          <Labelled label="Duration (working days)">
            <input
              type="number"
              min={0}
              value={form.days}
              onChange={(e) => set("days", e.target.value)}
              placeholder="e.g. 20"
              className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor focus:outline-none focus:border-select-blue"
            />
          </Labelled>
          <Labelled label="Status">
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor focus:outline-none focus:border-select-blue bg-white"
            >
              {config.statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Labelled>
        </div>

        <Labelled label="Owner">
          <input
            value={form.owner}
            onChange={(e) => set("owner", e.target.value)}
            placeholder="Assigned to"
            className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor focus:outline-none focus:border-select-blue"
          />
        </Labelled>

        <Labelled label="Note (optional)">
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            rows={2}
            placeholder="Blockers, site notes…"
            className="w-full rounded-lg border border-bordergray px-3 py-2.5 text-sm text-textcolor resize-none focus:outline-none focus:border-select-blue"
          />
        </Labelled>
      </div>
    </Modal>
  );
};

const Labelled = ({ label, children }) => (
  <div>
    <label className="block text-[12px] font-semibold text-textcolor mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

// ── Section ──────────────────────────────────────────────────────────────────
const ProjectSchedule = ({ lead }) => {
  const config = useMemo(() => getScheduleConfig(), []);
  const [schedule, setSchedule] = useState(() => getOrSeedSchedule(lead));
  const [editing, setEditing] = useState(null);

  const persist = (next) => {
    setSchedule(next);
    saveSchedule(lead.proposalId, next);
  };

  const setRooms = (rooms) => persist({ ...schedule, rooms });

  const anchor = useMemo(
    () => resolveAnchor(lead, schedule),
    [lead, schedule],
  );
  const chain = useMemo(
    () => computeChain(schedule.rooms, anchor.date),
    [schedule.rooms, anchor.date],
  );

  const overdue = chain.filter(
    (r) => getRoomHealth(r.end, r.status, config).state === "overdue",
  ).length;

  const handleSaveRoom = (room) => {
    const exists = schedule.rooms.some((r) => r.id === room.id);
    setRooms(
      exists
        ? schedule.rooms.map((r) => (r.id === room.id ? room : r))
        : [...schedule.rooms, room],
    );
    setEditing(null);
  };

  const handleDeleteRoom = (id) => {
    setRooms(schedule.rooms.filter((r) => r.id !== id));
    setEditing(null);
  };

  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= schedule.rooms.length) return;
    const next = [...schedule.rooms];
    [next[idx], next[j]] = [next[j], next[idx]];
    setRooms(next);
  };

  return (
    <div className="bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="flex items-center gap-2 text-[16px] font-bold text-darkgray">
            <FiCalendar size={18} className="text-gray-500" /> Schedule
          </h3>
          <p className="text-[12px] text-text-muted mt-0.5">
            Auto-sequenced from durations · escalation from Master → Schedule
            {overdue > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-red-600 font-semibold">
                <FiAlertTriangle size={12} /> {overdue} overdue
              </span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing({ ...makeRoom(), _existing: false })}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-select-blue text-white text-[12px] font-semibold hover:bg-blue-950 shadow-sm transition-colors"
        >
          <FiPlus size={14} /> Add room
        </button>
      </div>

      {/* Work-start anchor */}
      <div className="px-6 pb-3">
        {anchor.source === "booking" ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3.5 py-2.5">
            <FiCheckCircle size={15} className="text-emerald-600 shrink-0" />
            <p className="text-[12px] text-emerald-800">
              Work started{" "}
              <span className="font-bold">{fmt(anchor.date)}</span> — Booking
              Token paid. Rooms run in the order below.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-bg-soft border border-bordergray rounded-xl px-3.5 py-2.5 flex-wrap">
            <p className="text-[12px] text-text-muted">
              Booking not paid yet. Provisional work start:
            </p>
            <input
              type="date"
              value={schedule.workStart}
              onChange={(e) => persist({ ...schedule, workStart: e.target.value })}
              className="rounded-lg border border-bordergray px-2.5 py-1.5 text-[12px] text-textcolor focus:outline-none focus:border-select-blue"
            />
            <span className="text-[11px] text-text-subtle">
              (Booking payment will override this.)
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-bg-soft">
        {chain.length === 0 ? (
          <div className="text-center py-12 px-8">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
              <FiCalendar size={20} />
            </div>
            <p className="text-[13px] text-gray-500">
              No rooms yet. Add a room, or send a proposal so rooms seed
              automatically with their durations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-bg-soft">
            {chain.map((r, idx) => {
              const h = getRoomHealth(r.end, r.status, config);
              return (
                <div
                  key={r.id}
                  className="px-6 py-3.5 flex items-center gap-3 hover:bg-bg-soft/50 transition-colors group"
                >
                  {/* Reorder */}
                  <div className="flex flex-col -my-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0}
                      className="text-text-subtle hover:text-select-blue disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <FiChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(idx, 1)}
                      disabled={idx === chain.length - 1}
                      className="text-text-subtle hover:text-select-blue disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <FiChevronDown size={14} />
                    </button>
                  </div>

                  <span
                    className={`h-2.5 w-2.5 rounded-full shrink-0 ${RAG_DOT[h.rag]}`}
                  />

                  <button
                    type="button"
                    onClick={() => setEditing({ ...r, _existing: true })}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-[13.5px] font-bold text-darkgray truncate">
                      {r.room || "Untitled room"}
                      {r.days ? (
                        <span className="ml-2 text-[11px] font-medium text-text-subtle">
                          {r.days}d
                        </span>
                      ) : (
                        <span className="ml-2 text-[11px] font-medium text-amber-600">
                          set duration
                        </span>
                      )}
                    </p>
                    {r.description && (
                      <p className="text-[11.5px] text-text-muted truncate">
                        {r.description}
                      </p>
                    )}
                  </button>

                  <div className="hidden sm:block text-[11.5px] text-text-muted shrink-0 w-[150px] text-right tabular-nums">
                    {r.start ? (
                      <>
                        {fmt(r.start)} → {fmt(r.end)}
                      </>
                    ) : anchor.date ? (
                      <span className="text-text-subtle">—</span>
                    ) : (
                      <span className="text-text-subtle">awaiting start</span>
                    )}
                  </div>

                  {r.owner && (
                    <div className="hidden md:flex items-center gap-1.5 text-[11.5px] text-text-muted shrink-0 w-[100px] truncate">
                      <FiUser size={12} className="text-text-subtle" />
                      <span className="truncate">{r.owner}</span>
                    </div>
                  )}

                  <span className="text-[10px] font-semibold text-text-muted bg-bg-soft px-2 py-1 rounded-md shrink-0 hidden lg:inline">
                    {r.status}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold shrink-0 ${RAG_CHIP[h.rag]}`}
                  >
                    {h.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing && (
        <RoomModal
          room={editing}
          config={config}
          onSave={handleSaveRoom}
          onDelete={handleDeleteRoom}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default ProjectSchedule;
