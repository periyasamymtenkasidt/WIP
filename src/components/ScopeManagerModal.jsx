import { useState, useMemo } from "react";
import { Plus, Trash2, Save, X, Check, Package, Pipette, Search, Pencil, Layers } from "lucide-react";
import { listLibrary, computeLibraryItemAmount } from "../data/itemLibrary";
import { getScheduleConfig, getRoomDefaultDays } from "../data/scheduleConfig";
import { roomColor } from "../data/categoryColors";
import ItemFormModal from "./ItemFormModal";

const genId = () => `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const ScopeManagerModal = ({ onAddAll, onClose, existingEntries = [] }) => {
  const [entries, setEntries] = useState(() =>
    existingEntries.map((e) => ({ ...e, _id: genId() }))
  );
  const [editingId, setEditingId] = useState(null);
  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const openNewForm = () => { setEditingId(null); setItemFormOpen(true); };

  const openEditForm = (id) => { setEditingId(id); setItemFormOpen(true); };

  const handleFormSave = (form) => {
    const computed = computeLibraryItemAmount(form);
    const amount = computed || Number(form.rate) || 0;
    const area = form.description || "";
    const days = form.days !== "" && form.days != null ? Number(form.days) : getRoomDefaultDays(area);
    const entry = {
      _id: editingId || genId(),
      area,
      description: form.spec || "",
      amount,
      length: Number(form.length) || 0,
      breadth: Number(form.breadth) || 0,
      height: Number(form.height) || 0,
      unit: form.unit || "ls",
      rate: Number(form.rate) || 0,
      qty: Number(form.qty) || 0,
      days,
      materials: form.materials ? form.materials.map((m) => ({ ...m })) : [],
    };
    if (editingId) {
      setEntries((prev) => prev.map((e) => (e._id === editingId ? entry : e)));
    } else {
      setEntries((prev) => [...prev, entry]);
    }
    setItemFormOpen(false);
    setEditingId(null);
  };

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e._id !== id));
    if (editingId === id) { setEditingId(null); setItemFormOpen(false); }
  };

  const handlePickMultiple = (items) => {
    const newEntries = items.map((lib) => ({
      _id: genId(),
      area: lib.category || lib.description || "",
      description: [lib.description, lib.spec].filter(Boolean).join(" — "),
      amount: computeLibraryItemAmount(lib) || Number(lib.rate) || 0,
      length: Number(lib.length) || 0,
      breadth: Number(lib.breadth) || 0,
      height: Number(lib.height) || 0,
      unit: lib.unit || "ls",
      rate: Number(lib.rate) || 0,
      qty: Number(lib.qty) || 0,
      days: getRoomDefaultDays(lib.category || ""),
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
    }));
    setEntries((prev) => [...prev, ...newEntries]);
    setPickerOpen(false);
  };

  const handleAddAll = () => {
    if (entries.length === 0) return;
    onAddAll(entries.map(({ _id, ...rest }) => rest));
  };

  const entryToForm = (e) => ({
    ...e,
    description: e.area || "",
    spec: e.description || "",
    rate: e.unit && e.unit !== "ls" ? (Number(e.rate) || 0) : (Number(e.amount) || 0),
    qty: e.unit && e.unit !== "ls" ? (Number(e.qty) || 0) : 0,
    unit: e.unit || "ls",
    days: e.days ?? "",
    materials: e.materials ? e.materials.map((m) => ({ ...m })) : [],
  });

  const totalAmount = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center"><Layers size={14} /></span>
            <div>
              <h3 className="text-[14px] font-bold text-textcolor">Scope Manager</h3>
              <p className="text-[10.5px] text-text-muted">{entries.length} draft {entries.length === 1 ? "entry" : "entries"} · ₹{totalAmount.toLocaleString("en-IN")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPickerOpen(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg transition-all">
              <Pipette size={12} /> Pick from Library
            </button>
            <button type="button" onClick={onClose} className="text-text-subtle hover:text-textcolor"><X size={16} /></button>
          </div>
        </div>

        {/* Entry list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-12 px-6">
              <div className="h-12 w-12 rounded-2xl bg-bg-soft border border-bordergray flex items-center justify-center mx-auto mb-3">
                <Package size={18} className="text-text-subtle" />
              </div>
              <p className="text-[13px] font-bold text-textcolor">No scope entries yet</p>
              <p className="text-[11px] text-text-muted mt-1">Add entries manually or pick from the library</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry._id} className={`rounded-xl border px-3.5 py-2.5 flex items-center gap-3 cursor-pointer transition-all group ${editingId === entry._id ? "border-select-blue bg-active-bg/40 shadow-sm" : "border-bordergray bg-white hover:border-select-blue/40 hover:shadow-sm"}`}
                onClick={() => openEditForm(entry._id)}>
                <span className="h-7 w-7 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center shrink-0">
                  <Package size={12} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-textcolor truncate">{entry.area || "Untitled"}</p>
                  <p className="text-[10px] text-text-muted truncate">{entry.description || "No description"}</p>
                </div>
                <span className="text-[11px] font-bold text-textcolor tabular-nums shrink-0">₹{(Number(entry.amount) || 0).toLocaleString("en-IN")}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); deleteEntry(entry._id); }}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all" title="Delete entry">
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-bordergray bg-bg-soft flex items-center justify-between gap-2">
          <button type="button" onClick={openNewForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:border-select-blue hover:text-select-blue transition-all">
            <Plus size={12} /> New Entry
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor">
              Cancel
            </button>
            <button type="button" onClick={handleAddAll} disabled={entries.length === 0}
              className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
              <Check size={12} /> Add {entries.length} Scope{entries.length !== 1 ? "s" : ""}
            </button>
          </div>
        </div>
      </div>

      {/* ItemFormModal for editing individual entries */}
      {itemFormOpen && (
        <ItemFormModal
          initial={editingId ? entryToForm(entries.find((e) => e._id === editingId)) : {}}
          onSave={handleFormSave}
          onClose={() => { setItemFormOpen(false); setEditingId(null); }}
          title={editingId ? "Edit Scope Entry" : "New Scope Entry"}
          submitLabel={editingId ? "Save Entry" : "Add Entry"}
          roomCategoryMode
          showCategory={false}
          showTags={false}
        />
      )}

      {/* Multi-select library picker */}
      {pickerOpen && (
        <MultiLibraryPicker onClose={() => setPickerOpen(false)} onPickMultiple={handlePickMultiple} />
      )}
    </div>
  );
};

const MultiLibraryPicker = ({ onClose, onPickMultiple }) => {
  const [items] = useState(() => listLibrary());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState([]);
  const roomNames = useMemo(() => getScheduleConfig().rooms.map((r) => r.name), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (!q) return true;
      return (it.description || "").toLowerCase().includes(q) || (it.tags || []).some((t) => t.toLowerCase().includes(q));
    });
  }, [items, query, category]);

  const toggle = (it) => {
    setSelected((prev) => prev.some((s) => s.id === it.id) ? prev.filter((s) => s.id !== it.id) : [...prev, it]);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center"><Pipette size={14} /></span>
            <div>
              <h3 className="text-[13px] font-bold text-textcolor">Pick from Library</h3>
              <p className="text-[10.5px] text-text-muted">{selected.length} selected</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-text-subtle hover:text-textcolor"><X size={16} /></button>
        </div>
        <div className="px-5 py-3 border-b border-bordergray space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search items..."
              className="bg-bg-soft border border-transparent rounded-lg pl-7 pr-3 py-1.5 text-[11.5px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30 w-full" />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {["all", ...roomNames].map((v) => {
              const active = category === v;
              return (
                <button key={v} type="button" onClick={() => setCategory(v)}
                  className={`px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all border ${active ? "bg-active-bg text-select-blue border-select-blue/40" : "bg-transparent text-text-muted hover:bg-bg-soft border-transparent"}`}>
                  {v === "all" ? "All" : v}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[11.5px] text-text-subtle py-8">No items match</p>
          ) : filtered.map((it) => {
            const isSelected = selected.some((s) => s.id === it.id);
            const c = roomColor(it.category);
            return (
              <button key={it.id} type="button" onClick={() => toggle(it)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-all flex items-center gap-3 ${isSelected ? "border-select-blue bg-active-bg/40 shadow-sm" : "border-bordergray bg-white hover:border-select-blue hover:bg-active-bg/30"}`}>
                <span className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-select-blue border-select-blue text-white" : "border-bordergray bg-white"}`}>
                  {isSelected && <Check size={10} strokeWidth={3} />}
                </span>
                <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[11.5px] font-semibold text-textcolor truncate">{it.description}</p>
                  <p className="text-[10px] text-text-muted">₹{Number(it.rate || 0).toLocaleString("en-IN")}</p>
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t border-bordergray bg-bg-soft flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted">Cancel</button>
          <button type="button" onClick={() => { onPickMultiple(selected); }} disabled={selected.length === 0}
            className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md flex items-center gap-1.5 disabled:opacity-40">
            <Check size={12} /> Add {selected.length} Item{selected.length !== 1 ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScopeManagerModal;
