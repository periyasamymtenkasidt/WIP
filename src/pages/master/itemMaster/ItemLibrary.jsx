import { useMemo, useState } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  Edit3,
  X,
  Hash,
  Package,
  TrendingUp,
  Tag,
  IndianRupee,
  AlertTriangle,
  Info,
  RotateCcw,
  CheckCircle2,
  ChefHat,
  Sofa,
  Bed,
  Bath,
  DoorOpen,
  Building2,
} from "lucide-react";
import {
  listLibrary,
  saveLibrary,
  DEFAULT_LIBRARY,
  blankLibraryItem,
} from "../../../data/itemLibrary";
import { UNITS } from "../../../data/boqUnits";
import { formatAmount } from "../../../utils/formatAmount";
import ItemFormModal from "../../../components/ItemFormModal";
import { getScheduleConfig } from "../../../data/scheduleConfig";
import { roomColor } from "../../../data/categoryColors";

const ItemLibrary = () => {
  const [items, setItems] = useState(() => listLibrary());
  const [hasChanges, setHasChanges] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const roomNames = useMemo(
    () => getScheduleConfig().rooms.map((r) => r.name),
    [],
  );

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2400);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (category !== "all" && it.category !== category) return false;
      if (!q) return true;
      return (
        (it.description || "").toLowerCase().includes(q) ||
        (it.hsn || "").toLowerCase().includes(q) ||
        (it.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [items, query, category]);

  const stats = useMemo(() => {
    const byCat = items.reduce((acc, it) => {
      acc[it.category] = (acc[it.category] || 0) + 1;
      return acc;
    }, {});
    const avgRate =
      items.length > 0
        ? Math.round(
            items.reduce((s, it) => s + (Number(it.rate) || 0), 0) / items.length,
          )
        : 0;
    const totalUsage = items.reduce((s, it) => s + (it.usage || 0), 0);
    return {
      total: items.length,
      categories: Object.keys(byCat).length,
      avgRate,
      usage: totalUsage,
    };
  }, [items]);

  const handleSave = (item) => {
    if (item.id) {
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, ...item, updatedAt: new Date().toISOString() } : it))
      );
      showToast("Item updated (unsaved changes)", "success");
    } else {
      const newItem = {
        ...item,
        id: `lib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
        usage: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setItems((prev) => [newItem, ...prev]);
      showToast("Item added (unsaved changes)", "success");
    }
    setHasChanges(true);
    setEditing(null);
  };

  const handleDelete = (item) => {
    setConfirmDialog({
      title: `Delete "${item.description.slice(0, 40)}…"?`,
      message: "This item will be removed from the library. Existing BOQs that used it are unaffected.",
      confirmLabel: "Delete item",
      danger: true,
      onConfirm: () => {
        setItems((prev) => prev.filter((it) => it.id !== item.id));
        setHasChanges(true);
        showToast("Item deleted (unsaved changes)", "info");
      },
    });
  };

  const handleReset = () => {
    setConfirmDialog({
      title: "Reset library to defaults?",
      message: "All custom items will be removed and replaced with the factory catalog.",
      confirmLabel: "Reset library",
      danger: true,
      onConfirm: () => {
        setItems(DEFAULT_LIBRARY);
        setHasChanges(true);
        showToast("Library reset to defaults (unsaved changes)", "success");
      },
    });
  };

  const persistChanges = () => {
    saveLibrary(items);
    setHasChanges(false);
    showToast("All changes saved successfully", "success");
  };

  return (
    <div className="bg-overallbg font-sans h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-bordergray/70 bg-overallbg/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-linear-to-br from-select-blue to-primary text-white flex items-center justify-center shadow-lg shadow-select-blue/20">
              <BookOpen size={18} />
            </div>
            <div>
              <h1 className="text-[20px] font-bold text-textcolor leading-tight">
                Item Master
              </h1>
              <p className="text-[12px] text-text-muted mt-0.5">
                Reusable rate library · click-insert any item into a BOQ with
                materials, HSN, and pricing
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-bordergray rounded-lg text-[12px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor transition-all cursor-pointer"
            >
              <RotateCcw size={12} /> Reset
            </button>
            <button
              type="button"
              onClick={() => setEditing(blankLibraryItem())}
              className="flex items-center gap-1.5 px-4 py-2 bg-linear-to-br from-select-blue to-primary text-white rounded-lg text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus size={13} /> New Item
            </button>
            {hasChanges && (
              <button
                type="button"
                onClick={persistChanges}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold shadow-md transition-all cursor-pointer animate-pulse"
              >
                <CheckCircle2 size={13} strokeWidth={3} /> Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <BentoStat icon={<BookOpen size={13} />} label="Library Items" value={stats.total} tint="blue" />
          <BentoStat icon={<Tag size={13} />} label="Categories" value={stats.categories} tint="purple" />
          <BentoStat icon={<IndianRupee size={13} />} label="Avg Item Rate" value={formatAmount(stats.avgRate)} tint="orange" />
          <BentoStat icon={<TrendingUp size={13} />} label="Total Insertions" value={stats.usage} tint="emerald" />
        </div>
      </div>

      <div className="px-6 py-5">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-1 flex-wrap">
            {["all", ...roomNames].map((value) => {
              const isAll = value === "all";
              const count = isAll
                ? items.length
                : items.filter((it) => it.category === value).length;
              const cm = roomColor(value);
              const active = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all border ${
                    active
                      ? isAll
                        ? "bg-active-bg text-select-blue border-select-blue/40"
                        : `${cm.bg} ${cm.text} ${cm.border}`
                      : "bg-transparent text-text-muted hover:bg-bg-soft border-transparent"
                  }`}
                >
                  {isAll ? (
                    <Package size={11} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                  )}
                  {isAll ? "All" : value}
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, HSN, tag"
              className="bg-bg-soft border border-transparent rounded-lg pl-7 pr-3 py-1.5 text-[11.5px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30 w-[280px]"
            />
          </div>
        </div>

        {/* Item grid */}
        {filtered.length === 0 ? (
          <EmptyState onCreate={() => setEditing(blankLibraryItem())} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                onEdit={() => setEditing(it)}
                onDelete={() => handleDelete(it)}
              />
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ItemFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          title={editing.id ? "Edit Library Item" : "Add to Library"}
          submitLabel={editing.id ? "Save Changes" : "Add to Library"}
        />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div
            className={`text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-2.5 min-w-[260px] max-w-md ${
              toast.type === "error"
                ? "bg-red-500"
                : toast.type === "info"
                  ? "bg-select-blue"
                  : "bg-emerald-500"
            }`}
          >
            <CheckCircle2 size={14} className="shrink-0" />
            <p className="text-[12px] font-medium flex-1">{toast.message}</p>
            <button type="button" onClick={() => setToast(null)} className="text-white/80 hover:text-white shrink-0">
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog
          {...confirmDialog}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            confirmDialog.onConfirm?.();
            setConfirmDialog(null);
          }}
        />
      )}
    </div>
  );
};

const ItemCard = ({ item, onEdit, onDelete }) => {
  const c = roomColor(item.category);
  const unitLabel = UNITS.find((u) => u.code === item.unit)?.label || item.unit;
  const label = item.category || "Uncategorized";
  return (
    <div className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-select-blue/30 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all overflow-hidden group">
      <div className={`px-4 py-2.5 border-b border-bordergray flex items-center justify-between gap-2 ${c.bg}`}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${c.dot}`} />
          <span className={`text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={onEdit}
            className="h-6 w-6 flex items-center justify-center rounded-md text-text-muted hover:text-select-blue hover:bg-white"
            title="Edit"
          >
            <Edit3 size={11} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="h-6 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={11} />
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="w-full text-left p-4 cursor-pointer"
      >
        <p className="text-[12.5px] font-semibold text-textcolor leading-snug line-clamp-2">
          {item.description}
        </p>
        {(item.materials || []).length > 0 && (
          <p className="text-[10.5px] text-text-muted mt-1.5 line-clamp-2">
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 align-middle ${c.dot}`} />
            {item.materials
              .map((m) => `${m.name}${m.spec ? ` (${m.spec})` : ""}`)
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-bordergray">
          <div className="flex items-center gap-3 text-[10.5px] text-text-muted">
            {item.hsn && (
              <span className="flex items-center gap-1">
                <Hash size={9} /> {item.hsn}
              </span>
            )}
            <span className="font-semibold">{unitLabel}</span>
            <span>GST {item.gstPercent}%</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[14px] font-bold text-textcolor tabular-nums leading-tight">
              ₹{Number(item.rate || 0).toLocaleString("en-IN")}
            </span>
            <span className="text-[9.5px] text-text-subtle">per {unitLabel}</span>
          </div>
        </div>
        {item.usage > 0 && (
          <p className="text-[9.5px] text-text-subtle mt-2 flex items-center gap-1">
            <TrendingUp size={9} /> Used {item.usage} time{item.usage === 1 ? "" : "s"}
          </p>
        )}
      </button>
    </div>
  );
};

const BentoStat = ({ icon, label, value, tint }) => {
  const tints = {
    blue: "from-blue-50 to-white text-blue-600 border-blue-100",
    purple: "from-purple-50 to-white text-purple-600 border-purple-100",
    orange: "from-orange-50 to-white text-orange-600 border-orange-100",
    emerald: "from-emerald-50 to-white text-emerald-600 border-emerald-100",
  };
  return (
    <div className={`relative bg-linear-to-br ${tints[tint]} border rounded-xl p-3 overflow-hidden`}>
      <div className="flex items-center justify-between mb-1">
        <span className="opacity-80">{icon}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-70">{label}</span>
      </div>
      <p className="text-[16px] font-bold text-textcolor tabular-nums leading-tight">{value}</p>
    </div>
  );
};

const ConfirmDialog = ({ title, message, confirmLabel, danger, onCancel, onConfirm }) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5 flex items-start gap-3">
        <span
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            danger ? "bg-red-50 text-red-500" : "bg-select-blue/10 text-select-blue"
          }`}
        >
          {danger ? <AlertTriangle size={18} /> : <Info size={18} />}
        </span>
        <div>
          <h3 className="text-[14px] font-bold text-textcolor">{title}</h3>
          <p className="text-[12px] text-text-muted mt-1 leading-relaxed">{message}</p>
        </div>
      </div>
      <div className="px-5 py-3 bg-bg-soft border-t border-bordergray flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white shadow-sm ${
            danger ? "bg-red-500 hover:bg-red-600" : "bg-select-blue hover:bg-primary"
          }`}
        >
          {confirmLabel || "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const EmptyState = ({ onCreate }) => (
  <div className="bg-white rounded-2xl border border-dashed border-bordergray text-center py-16 px-6">
    <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-select-blue/10 to-active-bg flex items-center justify-center mx-auto mb-3 border border-bordergray">
      <BookOpen size={20} className="text-select-blue" />
    </div>
    <p className="text-[14px] font-bold text-textcolor">No items match</p>
    <p className="text-[12px] text-text-muted mt-1 max-w-sm mx-auto">
      Try a different category or search term, or create a new library item.
    </p>
    <button
      type="button"
      onClick={onCreate}
      className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-linear-to-br from-select-blue to-primary text-white rounded-lg text-[12px] font-semibold shadow-md"
    >
      <Plus size={13} /> New Item
    </button>
  </div>
);

export default ItemLibrary;
