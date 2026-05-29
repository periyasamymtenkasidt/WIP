import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  RotateCcw,
  Save,
  Check,
  X,
  Copy,
  ChevronDown,
  ChevronRight,
  Layers,
  Package,
  FileText,
  Search,
  Home,
  Ruler,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  Hash,
  IndianRupee,
  GripVertical,
  ChefHat,
  Sofa,
  Bed,
  Bath,
  DoorOpen,
  BookOpen,
  Building2,
  Command,
  BarChart3,
  Wallet,
  ArrowUpDown,
  AlertTriangle,
  Info,
  Wand2,
  Keyboard,
  Pencil,
  Eye,
} from "lucide-react";
import {
  getMaster,
  saveMaster,
  computeTotals,
  GST_RATE,
  DEFAULT_PRESETS,
} from "../../../data/QuotePresets";
import { formatAmount } from "../../../utils/formatAmount";
import ItemFormModal from "../../../components/ItemFormModal";
import Modal from "../../../components/Modal";
import ScopeManagerModal from "../../../components/ScopeManagerModal";
import { getRoomDefaultDays } from "../../../data/scheduleConfig";
import { computeLibraryItemAmount, computeLibraryItemQty } from "../../../data/itemLibrary";
import { PROPERTY_TYPES, removeGlobalPropertyType } from "../../../helperConfigData/helperData";

const blankScope = () => ({
  area: "",
  description: "",
  amount: 0,
  // Optional default duration (days) — seeds the project schedule estimate.
  days: "",
  materials: [],
});

const blankPreset = (propertyType = "Apartment") => ({
  label: "New Preset",
  configurations: [
    {
      propertyType,
      multiplier: 1,
      sizeRange: "",
      scopeItems: [],
      inclusions: [],
      exclusions: [],
    },
  ],
});

const inputBase =
  "bg-white border border-bordergray text-[12px] text-textcolor rounded-lg px-3 py-2 w-full focus:outline-none focus:border-select-blue focus:ring-2 focus:ring-select-blue/15 transition-all placeholder:text-text-subtle";

const CATEGORY_STYLES = {
  kitchen: { color: "orange", icon: ChefHat },
  living: { color: "blue", icon: Sofa },
  dining: { color: "blue", icon: Sofa },
  bedroom: { color: "purple", icon: Bed },
  master: { color: "purple", icon: Bed },
  bath: { color: "teal", icon: Bath },
  foyer: { color: "amber", icon: DoorOpen },
  passage: { color: "amber", icon: DoorOpen },
  study: { color: "indigo", icon: BookOpen },
  office: { color: "indigo", icon: BookOpen },
  stair: { color: "slate", icon: Building2 },
  utility: { color: "slate", icon: Package },
};

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    bar: "bg-blue-500",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  orange: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    bar: "bg-orange-500",
    dot: "bg-orange-500",
    border: "border-orange-200",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    bar: "bg-purple-500",
    dot: "bg-purple-500",
    border: "border-purple-200",
  },
  teal: {
    bg: "bg-teal-50",
    text: "text-teal-700",
    bar: "bg-teal-500",
    dot: "bg-teal-500",
    border: "border-teal-200",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  indigo: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
    dot: "bg-indigo-500",
    border: "border-indigo-200",
  },
  slate: {
    bg: "bg-slate-100",
    text: "text-slate-700",
    bar: "bg-slate-500",
    dot: "bg-slate-500",
    border: "border-slate-200",
  },
  gray: {
    bg: "bg-bg-soft",
    text: "text-text-muted",
    bar: "bg-text-subtle",
    dot: "bg-text-subtle",
    border: "border-bordergray",
  },
};

const getCategory = (area) => {
  const a = (area || "").toLowerCase();
  for (const key of Object.keys(CATEGORY_STYLES)) {
    if (a.includes(key)) return CATEGORY_STYLES[key];
  }
  return { color: "gray", icon: Package };
};

const extractAvgSqft = (sizeRange) => {
  const nums = (sizeRange || "").match(/\d+/g);
  if (!nums || nums.length === 0) return null;
  if (nums.length === 1) return parseInt(nums[0]);
  return Math.round((parseInt(nums[0]) + parseInt(nums[1])) / 2);
};

// Quick-add chips: common rooms users add most often.
const QUICK_AREAS = [
  {
    name: "Living Room",
    icon: Sofa,
    hint: "False ceiling, TV unit, accent wall",
  },
  { name: "Kitchen", icon: ChefHat, hint: "Modular kitchen, granite, chimney" },
  {
    name: "Master Bedroom",
    icon: Bed,
    hint: "Wardrobe, bed back panel, dresser",
  },
  { name: "Bedroom", icon: Bed, hint: "Wardrobe, study unit, lighting" },
  { name: "Bathroom", icon: Bath, hint: "Vanity, mirror, shower partition" },
  {
    name: "Foyer & Passage",
    icon: DoorOpen,
    hint: "Shoe rack, console, accent paint",
  },
  {
    name: "Study / Office",
    icon: BookOpen,
    hint: "Built-in desk, storage, lighting",
  },
];

// Common material presets per category — one-click add to a scope row.
const COMMON_MATERIALS = {
  kitchen: [
    { name: "Plywood", spec: "BWP 19mm" },
    { name: "Hardware", spec: "Hettich / Hafele" },
    { name: "Counter", spec: "Granite slab" },
  ],
  living: [
    { name: "Plywood", spec: "MR 18mm" },
    { name: "Laminate", spec: "Greenply / Century" },
    { name: "Lighting", spec: "Philips / Wipro LED" },
  ],
  bedroom: [
    { name: "Plywood", spec: "MR 16mm" },
    { name: "Laminate", spec: "Century / Greenply" },
    { name: "Hardware", spec: "Hafele soft-close" },
  ],
  bath: [
    { name: "Vanity", spec: "Marine ply + laminate" },
    { name: "Mirror", spec: "Saint-Gobain 5mm" },
    { name: "Hardware", spec: "Jaquar / Hindware" },
  ],
  foyer: [
    { name: "Plywood", spec: "MR 16mm" },
    { name: "Laminate", spec: "Greenply" },
  ],
};

const ProposalMaster = () => {
  const [master, setMaster] = useState(() => getMaster());
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitial, setIsInitial] = useState(true);
  const [activeKey, setActiveKey] = useState(() => {
    const keys = Object.keys(getMaster());
    return keys[0] || "2BHK";
  });
  const [showAddPreset, setShowAddPreset] = useState(false);
  const [newPresetKey, setNewPresetKey] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [presetSearch, setPresetSearch] = useState("");
  const [sortBy, setSortBy] = useState("order");
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Whether the shared Item Form modal is open for adding a new scope row.
  const [scopeFormOpen, setScopeFormOpen] = useState(false);
  // Index of the scope row being edited via the modal, or null when adding new.
  const [editingScopeIdx, setEditingScopeIdx] = useState(null);
  // Detailed read-only preview of the whole preset, grouped by room.
  const [previewOpen, setPreviewOpen] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [modalSelectedTypes, setModalSelectedTypes] = useState([]);

  const openAddScope = () => {
    setScopeFormOpen(true);
  };
  const openEditScope = (idx) => {
    setEditingScopeIdx(idx);
  };

  // Map a scope row → the flat form shape ItemFormModal expects. The lump-sum
  // amount is fed in as the rate (qty 0 → amount falls back to rate on save).
  const scopeRowToForm = (item) => ({
    ...item,
    description: item.area || "",
    spec: item.description || "",
    rate: item.unit && item.unit !== "ls" ? (Number(item.rate) || 0) : (Number(item.amount) || 0),
    qty: item.unit && item.unit !== "ls" ? (Number(item.qty) || 0) : 0,
    unit: item.unit || "ls",
    days: item.days ?? "",
    materials: item.materials ? item.materials.map((m) => ({ ...m })) : [],
  });
  // Rename mode for the active preset's key.
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const presetKeys = Object.keys(master);
  const active = master[activeKey];
  const [activeConfigIdx, setActiveConfigIdx] = useState(0);

  // Reset config tab when switching presets
  useEffect(() => {
    setActiveConfigIdx(0);
  }, [activeKey]);

  // Derived: the currently-active property-type configuration
  const visibleConfigs = useMemo(() => {
    return (active?.configurations || []).filter((c) => !c.hidden);
  }, [active]);

  const activeConfig = useMemo(() => {
    if (!active) return null;
    const cfg = active.configurations?.[activeConfigIdx];
    if (cfg && !cfg.hidden) return cfg;
    // Fall back to first visible one
    return visibleConfigs[0] || null;
  }, [active, activeConfigIdx, visibleConfigs]);

  // Auto-adjust activeConfigIdx when configurations change/hide
  useEffect(() => {
    if (active) {
      const visibleIndices = [];
      (active.configurations || []).forEach((c, idx) => {
        if (!c.hidden) visibleIndices.push(idx);
      });
      if (visibleIndices.length > 0 && !visibleIndices.includes(activeConfigIdx)) {
        setActiveConfigIdx(visibleIndices[0]);
      }
    }
  }, [active, activeConfigIdx]);

  const handleApplyTypes = () => {
    setMaster((prev) => {
      const preset = prev[activeKey];
      const configs = [...(preset.configurations || [])];

      // Mark unchecked types as hidden: true
      const nextConfigs = configs.map((c) => {
        const isChecked = modalSelectedTypes.includes(c.propertyType);
        return {
          ...c,
          hidden: !isChecked,
        };
      });

      // Add new configurations for checked types that don't exist yet
      modalSelectedTypes.forEach((type) => {
        const exists = nextConfigs.some((c) => c.propertyType === type);
        if (!exists) {
          const baseConfig = configs[0] || {};
          nextConfigs.push({
            propertyType: type,
            multiplier: 1,
            sizeRange: baseConfig.sizeRange || "",
            scopeItems: (baseConfig.scopeItems || []).map((s) => ({
              ...s,
              materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
            })),
            inclusions: [...(baseConfig.inclusions || [])],
            exclusions: [...(baseConfig.exclusions || [])],
            hidden: false,
          });
        }
      });

      return {
        ...prev,
        [activeKey]: { ...preset, configurations: nextConfigs },
      };
    });

    setShowAddTypeModal(false);
    showToast("Property types updated successfully", "success");
  };

  useEffect(() => {
    if (isInitial) {
      setIsInitial(false);
      return;
    }
    setHasChanges(true);
  }, [master]);

  const showToast = (message, type = "success") => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const askConfirm = (cfg) => setConfirmDialog(cfg);

  // Preset-level updates (e.g. label)
  const updateActive = (changes) => {
    setMaster((prev) => ({
      ...prev,
      [activeKey]: { ...prev[activeKey], ...changes },
    }));
  };

  // Automatically update the preset label based on key and active config property type
  useEffect(() => {
    if (active && activeConfig?.propertyType) {
      const formattedKey = activeKey.replace(/^(\d+)(BHK)$/i, "$1 BHK");
      const generatedLabel = `${formattedKey} / ${activeConfig.propertyType}`;
      if (active.label !== generatedLabel) {
        updateActive({ label: generatedLabel });
      }
    }
  }, [activeKey, activeConfig?.propertyType, active]);

  // Config-level updates (scope, inclusions, exclusions, sizeRange, etc.)
  const setConfigField = (updater) => {
    setMaster((prev) => {
      const preset = prev[activeKey];
      const configs = [...(preset.configurations || [])];
      configs[activeConfigIdx] = updater({ ...configs[activeConfigIdx] });
      return { ...prev, [activeKey]: { ...preset, configurations: configs } };
    });
  };

  const updateScope = (idx, key, value) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === idx ? { ...s, [key]: value } : s,
      ),
    }));
  };

  const addScopeRow = (preset) => {
    const newRow = preset
      ? {
          area: preset.name,
          description: preset.hint || "",
          amount: 0,
          days: "",
          materials: [],
        }
      : blankScope();
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: [newRow, ...cfg.scopeItems],
    }));
    setExpanded((p) => ({
      ...p,
      [0]: false,
    }));
    if (preset) showToast(`Added "${preset.name}"`, "success");
  };

  // Save handler for inline single-scope edit (clicking area name on existing row).
  const handleScopeFormSave = (form) => {
    const computed = computeLibraryItemAmount(form);
    const amount = computed || Number(form.rate) || 0;
    const materials = form.materials
      ? form.materials.map((m) => ({ ...m }))
      : [];
    const area = form.description || "";
    const days =
      form.days !== "" && form.days != null
        ? Number(form.days)
        : getRoomDefaultDays(area);

    if (editingScopeIdx != null) {
      setConfigField((cfg) => ({
        ...cfg,
        scopeItems: cfg.scopeItems.map((s, i) =>
          i === editingScopeIdx
            ? {
                ...s,
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
                materials,
              }
            : s,
        ),
      }));
      showToast(`Updated "${area || "scope"}"`, "success");
    }
    setEditingScopeIdx(null);
  };

  // Handler for multi-entry ScopeManagerModal — adds all draft entries at once.
  const handleScopeManagerAddAll = (entries) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: [...entries, ...cfg.scopeItems],
    }));
    setScopeFormOpen(false);
    showToast(`Added ${entries.length} scope item${entries.length !== 1 ? "s" : ""}`, "success");
  };

  const removeScopeRow = (idx) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.filter((_, i) => i !== idx),
    }));
    showToast("Scope item removed", "info");
  };

  const updateMaterial = (scopeIdx, matIdx, key, value) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).map((m, j) =>
                j === matIdx ? { ...m, [key]: value } : m,
              ),
            }
          : s,
      ),
    }));
  };

  const addMaterial = (scopeIdx, preset) => {
    const newMat = preset ?? { name: "", spec: "" };
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: [...(s.materials || []), newMat] }
          : s,
      ),
    }));
    setExpanded((p) => ({ ...p, [scopeIdx]: true }));
  };

  const applyMaterialKit = (scopeIdx) => {
    const item = activeConfig.scopeItems[scopeIdx];
    const cat = getCategory(item.area);
    const kit =
      COMMON_MATERIALS[cat.color === "purple" ? "bedroom" : ""] ||
      COMMON_MATERIALS[
        Object.keys(CATEGORY_STYLES).find((k) =>
          (item.area || "").toLowerCase().includes(k),
        ) || ""
      ];
    if (!kit) {
      showToast(
        "Set the area first (e.g. Kitchen) to use the material kit",
        "info",
      );
      return;
    }
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? { ...s, materials: [...(s.materials || []), ...kit] }
          : s,
      ),
    }));
    setExpanded((p) => ({ ...p, [scopeIdx]: true }));
    showToast(`Added ${kit.length} typical materials`, "success");
  };

  const removeMaterial = (scopeIdx, matIdx) => {
    setConfigField((cfg) => ({
      ...cfg,
      scopeItems: cfg.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).filter((_, j) => j !== matIdx),
            }
          : s,
      ),
    }));
  };

  const handleAddPreset = () => {
    const trimmed = newPresetKey.trim();
    if (!trimmed) return;
    if (master[trimmed]) {
      showToast("A preset with that name already exists", "error");
      return;
    }
    // Prepend new preset as the first entry
    setMaster((prev) => ({ [trimmed]: blankPreset(), ...prev }));
    setActiveKey(trimmed);
    setNewPresetKey("");
    setShowAddPreset(false);
    showToast(`Preset "${trimmed}" created`, "success");
  };

  // Rename the active preset's key. Rebuilds the master object preserving
  // insertion order so the preset rail doesn't jump around after rename.
  const handleRenamePreset = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      showToast("Name can't be empty", "error");
      return;
    }
    if (trimmed === activeKey) {
      setRenaming(false);
      return;
    }
    if (master[trimmed]) {
      showToast("A preset with that name already exists", "error");
      return;
    }
    setMaster((prev) => {
      const next = {};
      for (const k of Object.keys(prev)) {
        next[k === activeKey ? trimmed : k] = prev[k];
      }
      return next;
    });
    setActiveKey(trimmed);
    setRenaming(false);
    setRenameValue("");
    showToast(`Renamed to "${trimmed}"`, "success");
  };

  const startRename = () => {
    setRenameValue(activeKey);
    setRenaming(true);
  };

  const handleDuplicatePreset = () => {
    let i = 2;
    let candidate = `${activeKey} Copy`;
    while (master[candidate]) {
      candidate = `${activeKey} Copy ${i++}`;
    }
    setMaster((prev) => ({
      ...prev,
      [candidate]: {
        ...JSON.parse(JSON.stringify(prev[activeKey])),
        label: `${prev[activeKey].label} (Copy)`,
      },
    }));
    setActiveKey(candidate);
    showToast(`Duplicated as "${candidate}"`, "success");
  };

  const handleDeletePreset = () => {
    if (presetKeys.length <= 1) {
      showToast("Keep at least one preset", "error");
      return;
    }
    askConfirm({
      title: `Delete "${activeKey}"?`,
      message:
        "This preset and all its scope items will be permanently removed. This cannot be undone.",
      confirmLabel: "Delete preset",
      danger: true,
      onConfirm: () => {
        setMaster((prev) => {
          const next = { ...prev };
          delete next[activeKey];
          return next;
        });
        setActiveKey(presetKeys.find((k) => k !== activeKey));
        showToast(`Preset "${activeKey}" deleted`, "info");
      },
    });
  };

  const handleReset = () => {
    askConfirm({
      title: "Reset all presets?",
      message:
        "All your custom presets will be replaced with the factory defaults. Custom edits will be lost.",
      confirmLabel: "Reset to defaults",
      danger: true,
      onConfirm: () => {
        setMaster(DEFAULT_PRESETS);
        setActiveKey(Object.keys(DEFAULT_PRESETS)[0]);
        setHasChanges(true);
        showToast("Reset to factory defaults (unsaved changes)", "success");
      },
    });
  };

  const handleManualSave = () => {
    saveMaster(master);
    setHasChanges(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
    showToast("All changes saved successfully", "success");
  };

  const toggleExpanded = (idx) => {
    setExpanded((p) => ({ ...p, [idx]: !p[idx] }));
  };

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.key === "Escape") {
        setConfirmDialog(null);
        setShowShortcuts(false);
      }
      if (e.key === "?" && !e.target.matches("input, textarea")) {
        setShowShortcuts((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredKeys = useMemo(() => {
    const q = presetSearch.trim().toLowerCase();
    if (!q) return presetKeys;
    return presetKeys.filter(
      (k) =>
        k.toLowerCase().includes(q) ||
        (master[k]?.label || "").toLowerCase().includes(q),
    );
  }, [presetKeys, presetSearch, master]);

  const globalStats = useMemo(() => {
    const allItems = presetKeys.flatMap((k) =>
      (master[k]?.configurations || [])
        .filter((c) => !c.hidden)
        .flatMap((c) => c.scopeItems || []),
    );
    const totalAmount = allItems.reduce(
      (s, it) => s + (Number(it.amount) || 0),
      0,
    );
    const totalMaterials = allItems.reduce(
      (s, it) => s + (it.materials?.length || 0),
      0,
    );
    return {
      presets: presetKeys.length,
      items: allItems.length,
      materials: totalMaterials,
      avgQuote:
        presetKeys.length > 0 ? Math.round(totalAmount / presetKeys.length) : 0,
    };
  }, [presetKeys, master]);

  const sortedScope = useMemo(() => {
    if (!activeConfig) return [];
    const copy = (activeConfig.scopeItems || []).map((item, idx) => ({
      item,
      idx,
    }));
    if (sortBy === "amount-desc") {
      copy.sort(
        (a, b) => (Number(b.item.amount) || 0) - (Number(a.item.amount) || 0),
      );
    } else if (sortBy === "amount-asc") {
      copy.sort(
        (a, b) => (Number(a.item.amount) || 0) - (Number(b.item.amount) || 0),
      );
    } else if (sortBy === "area") {
      copy.sort((a, b) => (a.item.area || "").localeCompare(b.item.area || ""));
    }
    return copy;
  }, [activeConfig, sortBy]);

  // Group scope rows by room so each room shows as one block in the list.
  const groupedScope = useMemo(() => {
    const groups = [];
    const byRoom = new Map();
    sortedScope.forEach(({ item, idx }) => {
      const room = item.area || "Unassigned";
      if (!byRoom.has(room)) {
        const g = { room, rows: [], total: 0 };
        byRoom.set(room, g);
        groups.push(g);
      }
      const g = byRoom.get(room);
      g.rows.push({ item, idx });
      g.total += Number(item.amount) || 0;
    });
    return groups;
  }, [sortedScope]);

  if (!active) {
    return (
      <div className="p-8 text-text-muted text-sm">No preset selected.</div>
    );
  }

  const scopeItems = activeConfig?.scopeItems || [];
  const totals = computeTotals(scopeItems);
  const maxScope = Math.max(1, ...scopeItems.map((s) => Number(s.amount) || 0));
  const avgSqft = extractAvgSqft(activeConfig?.sizeRange);
  const costPerSqft =
    avgSqft && totals.grandTotal
      ? Math.round(totals.grandTotal / avgSqft)
      : null;

  return (
    <div className="bg-overallbg font-sans h-full overflow-hidden flex flex-col">
      {/* ── Top header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 z-30 bg-overallbg/80 backdrop-blur-xl border-b border-bordergray/70">
        <div className="px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 rounded-xl bg-linear-to-br from-select-blue to-primary text-white flex items-center justify-center shadow-lg shadow-select-blue/20">
              <FileText size={18} />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-overallbg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-textcolor leading-tight">
                  Proposal Master
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">
                Quotation templates per property preset · changes apply
                instantly to new proposals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              title="Keyboard shortcuts ( ? )"
              className="hidden sm:flex items-center gap-1 px-2.5 py-2 bg-white border border-bordergray rounded-lg text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor transition-all"
            >
              <Keyboard size={12} />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-bordergray cursor-pointer rounded-lg text-[12px] font-semibold text-textcolor hover:bg-bg-soft hover:border-text-subtle transition-all"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <button
              type="button"
              onClick={handleManualSave}
              className={`flex items-center gap-1.5 px-4 py-2 cursor-pointer rounded-lg text-[12px] font-semibold transition-all shadow-md ${
                savedFlash
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-linear-to-br from-select-blue to-primary text-white hover:shadow-select-blue/30 hover:scale-[1.02]"
              } ${hasChanges && !savedFlash ? "animate-pulse ring-2 ring-select-blue/20" : ""}`}
            >
              {savedFlash ? <Check size={13} /> : <Save size={13} />}
              {savedFlash ? "Saved" : "Save Changes"}
              {!savedFlash && (
                <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[9px] font-semibold bg-white/15 px-1.5 py-0.5 rounded ml-1">
                  <Command size={9} /> S
                </kbd>
              )}
            </button>
          </div>
        </div>

        {/* Bento stats banner */}
        <div className="px-6 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          <BentoStat
            icon={<Layers size={13} />}
            label="Presets"
            value={globalStats.presets}
            tint="blue"
          />
          <BentoStat
            icon={<Hash size={13} />}
            label="Total Scope Items"
            value={globalStats.items}
            tint="purple"
          />
          <BentoStat
            icon={<Package size={13} />}
            label="Material Specs"
            value={globalStats.materials}
            tint="orange"
          />
          <BentoStat
            icon={<TrendingUp size={13} />}
            label="Avg Quote Value"
            value={formatAmount(globalStats.avgQuote)}
            tint="emerald"
          />
        </div>
      </div>

      <div className="px-6 py-5 flex-1 min-h-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_340px] gap-5 items-stretch h-full">
          {/* ── Left: Preset rail ───────────────────────────────────────── */}
          <aside className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] flex flex-col overflow-y-auto scroll-hidden-bar">
            <div className="p-4 border-b border-bordergray shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Layers size={13} className="text-select-blue" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-textcolor">
                    Presets
                  </h3>
                </div>
                <span className="text-[10px] font-semibold text-text-muted bg-bg-soft px-1.5 py-0.5 rounded-md">
                  {presetKeys.length}
                </span>
              </div>
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle"
                />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search presets"
                  className="w-full bg-bg-soft border border-transparent rounded-lg pl-7 pr-2 py-1.5 text-[11px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30"
                />
              </div>
            </div>

            <div className="p-2 max-h-[55vh] overflow-y-auto scroll-hidden-bar">
              {filteredKeys.length === 0 ? (
                <p className="text-[11px] text-text-subtle text-center py-4">
                  No matches
                </p>
              ) : (
                filteredKeys.map((k) => {
                  const p = master[k];
                  const allCfgItems = (p.configurations || []).flatMap(
                    (c) => c.scopeItems || [],
                  );
                  const t = computeTotals(allCfgItems);
                  const firstCfg = p.configurations?.[0];
                  const isActive = k === activeKey;
                  const cat = getCategory(p.label || k);
                  const c = COLOR_MAP[cat.color];
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setActiveKey(k)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 mb-1 transition-all border ${
                        isActive
                          ? "bg-active-bg border-select-blue/40 shadow-[0_1px_3px_rgba(30,58,138,0.08)]"
                          : "bg-transparent border-transparent hover:bg-bg-soft"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`}
                          />
                          <span
                            className={`text-[12px] font-bold truncate ${isActive ? "text-select-blue" : "text-textcolor"}`}
                          >
                            {k}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-text-muted bg-white/70 px-1.5 py-0.5 rounded-md border border-bordergray">
                          {(p.configurations || []).filter((c) => !c.hidden).length} type
                          {(p.configurations || []).filter((c) => !c.hidden).length === 1 ? "" : "s"}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-text-muted truncate ml-4">
                        {p.label}
                      </p>
                      <div className="flex items-center justify-between gap-2 mt-1.5 ml-4">
                        <p
                          className={`text-[10.5px] font-bold tabular-nums ${isActive ? "text-select-blue" : "text-textcolor"}`}
                        >
                          {formatAmount(t.grandTotal)}
                        </p>
                        {firstCfg?.sizeRange && (
                          <span className="text-[9.5px] text-text-subtle truncate">
                            {firstCfg.sizeRange}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-bordergray">
              {showAddPreset ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPresetKey}
                    onChange={(e) => setNewPresetKey(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddPreset();
                      if (e.key === "Escape") {
                        setShowAddPreset(false);
                        setNewPresetKey("");
                      }
                    }}
                    placeholder="e.g. Studio"
                    className="w-full bg-white border border-bordergray rounded-lg text-[12px] px-2.5 py-2 focus:outline-none focus:border-select-blue"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddPreset}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-select-blue text-white text-[11px] font-semibold hover:bg-primary"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddPreset(false);
                        setNewPresetKey("");
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-bordergray text-[11px] text-text-muted hover:bg-bg-soft"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[10px] text-text-subtle">
                    Tip: short keys like "1BHK", "Studio", "Penthouse".
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAddPreset(true)}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-bordergray text-[11.5px] font-semibold text-text-muted hover:border-select-blue hover:text-select-blue hover:bg-active-bg/40 transition-all"
                >
                  <Plus size={13} /> New Preset
                </button>
              )}
            </div>
          </aside>

          {/* ── Middle: Editor ──────────────────────────────────────────── */}
          <main className="space-y-5 min-w-0 overflow-y-auto pb-28 scroll-hidden-bar">
            {/* Preset hero card */}
            <section className="relative bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-y-auto overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-br from-select-blue/8 via-active-bg/40 to-transparent pointer-events-none" />
              <div className="relative px-5 py-4 border-b border-bordergray flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {renaming ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <Tag size={11} className="text-select-blue shrink-0" />
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenamePreset();
                          if (e.key === "Escape") {
                            setRenaming(false);
                            setRenameValue("");
                          }
                        }}
                        autoFocus
                        placeholder="e.g. 2BHK Premium"
                        className="bg-white border border-select-blue/40 rounded-md px-2 py-1 text-[12px] font-bold uppercase tracking-widest text-select-blue focus:outline-none focus:ring-2 focus:ring-select-blue/20 w-44"
                      />
                      <button
                        type="button"
                        onClick={handleRenamePreset}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-select-blue text-white text-[11px] font-semibold hover:bg-primary"
                      >
                        <Check size={11} /> Save
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRenaming(false);
                          setRenameValue("");
                        }}
                        className="flex items-center gap-1 px-2 py-1 rounded-md border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft"
                      >
                        <X size={11} /> Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase text-select-blue bg-white/80 backdrop-blur px-2 py-1 rounded-md shrink-0 border border-select-blue/20">
                        <Tag size={10} /> {activeKey}
                      </span>
                      <span className="text-[12px] text-text-muted truncate">
                        {active.label}
                      </span>
                    </>
                  )}
                </div>
                {!renaming && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={startRename}
                      title="Rename this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor"
                    >
                      <Pencil size={12} /> Rename
                    </button>
                    <button
                      type="button"
                      onClick={handleDuplicatePreset}
                      title="Duplicate this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-bordergray bg-white text-[11px] font-semibold text-text-muted hover:bg-bg-soft hover:text-textcolor"
                    >
                      <Copy size={12} /> Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={handleDeletePreset}
                      title="Delete this preset"
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-white text-[11px] font-semibold text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="relative p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  icon={<Tag size={11} />}
                  label="Label"
                  hint="Automatically generated from preset key and property type"
                >
                  <input
                    type="text"
                    value={active.label}
                    readOnly
                    className={`${inputBase} bg-bg-soft border-bordergray cursor-not-allowed text-text-muted`}
                    title="Automatically generated from preset key and property type"
                  />
                </Field>
                <Field
                  icon={<Ruler size={11} />}
                  label="Size Range"
                  hint="Per property type · used to compute ₹/sq ft"
                >
                  <input
                    type="text"
                    value={activeConfig?.sizeRange || ""}
                    onChange={(e) =>
                      setConfigField((cfg) => ({
                        ...cfg,
                        sizeRange: e.target.value,
                      }))
                    }
                    placeholder="e.g. 800–1100 sq ft"
                    className={inputBase}
                  />
                </Field>
              </div>

              {/* ── Property Type Configuration Tabs ─────────────────── */}
              <div className="relative px-5 pb-4">
                <Field
                  icon={<Home size={11} />}
                  label="Property Types"
                  hint="Each type has its own scope, pricing & inclusions"
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(active.configurations || []).map((cfg, idx) => {
                      if (cfg.hidden) return null;
                      const isSelected = activeConfig && activeConfig.propertyType === cfg.propertyType;
                      return (
                        <button
                          key={cfg.propertyType}
                          type="button"
                          onClick={() => setActiveConfigIdx(idx)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-semibold transition-all ${
                            isSelected
                              ? "bg-select-blue text-white border-select-blue shadow-sm"
                              : "bg-white text-text-muted border-bordergray hover:border-select-blue/40 hover:text-select-blue"
                          }`}
                        >
                          {isSelected && (
                            <Check size={10} strokeWidth={3} />
                          )}
                          {cfg.propertyType}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        const activePresetPropertyTypes = (active.configurations || [])
                          .filter((c) => !c.hidden)
                          .map((c) => c.propertyType);
                        setModalSelectedTypes(activePresetPropertyTypes);
                        setShowAddTypeModal(true);
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-dashed border-bordergray text-[11px] font-semibold text-text-muted hover:border-select-blue hover:text-select-blue transition-all"
                    >
                      <Plus size={11} /> Add Type
                    </button>
                  </div>
                </Field>
                {activeConfig && (active.configurations || []).length > 1 && (
                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        askConfirm({
                          title: `Remove "${activeConfig.propertyType}"?`,
                          message:
                            "This property type configuration and its scope will be removed from this preset.",
                          confirmLabel: "Remove",
                          danger: true,
                          onConfirm: () => {
                            setMaster((prev) => {
                              const preset = prev[activeKey];
                              const configs = (
                                preset.configurations || []
                              ).filter((_, i) => i !== activeConfigIdx);
                              return {
                                ...prev,
                                [activeKey]: {
                                  ...preset,
                                  configurations: configs,
                                },
                              };
                            });
                            setActiveConfigIdx(0);
                            showToast(
                              `Removed "${activeConfig.propertyType}"`,
                              "info",
                            );
                          },
                        });
                      }}
                      className="flex items-center gap-1 text-[10px] font-semibold text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={10} /> Remove Type
                    </button>
                  </div>
                )}
              </div>

              {costPerSqft != null && (
                <div className="relative mx-5 mb-5 -mt-1 flex items-center gap-2 text-[11px] text-text-muted bg-bg-soft border border-bordergray rounded-lg px-3 py-2">
                  <Sparkles size={12} className="text-select-blue" />
                  <span>
                    Approximate cost per sq ft:{" "}
                    <span className="font-bold text-textcolor tabular-nums">
                      ₹{costPerSqft.toLocaleString("en-IN")}
                    </span>{" "}
                    based on {avgSqft} sq ft and current scope.
                  </span>
                </div>
              )}
            </section>

            {/* Scope editor */}
            <section className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
                    <Package size={13} />
                  </div>
                  <div>
                    <h2 className="text-[13px] font-bold text-textcolor">
                      Scope of Work
                    </h2>
                    <p className="text-[10.5px] text-text-muted">
                      {scopeItems.length} area
                      {scopeItems.length === 1 ? "" : "s"} ·{" "}
                      {activeConfig?.propertyType || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-bg-soft border border-bordergray rounded-lg px-2 py-1">
                    <ArrowUpDown size={11} className="text-text-subtle" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-[11px] font-semibold text-text-muted bg-transparent focus:outline-none cursor-pointer"
                    >
                      <option value="order">Manual order</option>
                      <option value="amount-desc">Cost: high → low</option>
                      <option value="amount-asc">Cost: low → high</option>
                      <option value="area">Area name (A–Z)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewOpen(true)}
                    disabled={scopeItems.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[11px] font-semibold text-textcolor hover:bg-bg-soft hover:border-text-subtle transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={openAddScope}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[11px] font-semibold hover:shadow-md hover:shadow-select-blue/20 shadow-sm transition-all"
                  >
                    <Plus size={12} /> Add Scope
                  </button>
                </div>
              </div>

              {/* Quick-add area chips */}
              <div className="px-5 py-3 border-b border-bordergray bg-bg-soft/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    <Wand2 size={10} /> Quick add
                  </span>
                  {QUICK_AREAS.map((q) => {
                    const cat = getCategory(q.name);
                    const c = COLOR_MAP[cat.color];
                    const Icon = q.icon;
                    return (
                      <button
                        key={q.name}
                        type="button"
                        onClick={() => addScopeRow(q)}
                        title={q.hint}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-white border ${c.border} ${c.text} text-[10.5px] font-semibold hover:scale-[1.03] hover:shadow-sm transition-all`}
                      >
                        <Icon size={10} />
                        {q.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 space-y-5">
                {groupedScope.map((group) => {
                  const gcat = getCategory(group.room);
                  const gc = COLOR_MAP[gcat.color];
                  return (
                    <div key={group.room}>
                      {/* Room group header */}
                      <div className="flex items-center justify-between mb-2 px-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-2.5 w-2.5 rounded-full shrink-0 ${gc.dot}`}
                          />
                          <h4 className="text-[12px] font-bold text-textcolor uppercase tracking-wide truncate">
                            {group.room}
                          </h4>
                          <span className="text-[10px] font-semibold text-text-muted bg-bg-soft px-1.5 py-0.5 rounded-md border border-bordergray">
                            {group.rows.length}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-textcolor tabular-nums shrink-0">
                          {formatAmount(group.total)}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {group.rows.map(({ item, idx }) => {
                          const isOpen = !!expanded[idx];
                          const matCount = (item.materials || []).length;
                          const cat = getCategory(item.area);
                          const c = COLOR_MAP[cat.color];
                          const Icon = cat.icon;
                          const amount = Number(item.amount) || 0;
                          const pct =
                            totals.subtotal > 0
                              ? Math.round((amount / totals.subtotal) * 100)
                              : 0;
                          const barWidth =
                            maxScope > 0 ? (amount / maxScope) * 100 : 0;
                          return (
                            <div
                              key={idx}
                              className="rounded-xl border border-bordergray bg-white hover:border-select-blue/40 hover:shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition-all group"
                            >
                              <div className="p-3 grid grid-cols-[20px_28px_1fr_1.4fr_92px_140px_28px] gap-2 items-center">
                                <button
                                  type="button"
                                  className="h-6 w-5 flex items-center justify-center text-text-subtle opacity-0 group-hover:opacity-100 cursor-grab"
                                  title="Drag to reorder (coming soon)"
                                >
                                  <GripVertical size={12} />
                                </button>
                                <span
                                  className={`h-7 w-7 flex items-center justify-center rounded-lg ${c.bg} ${c.text}`}
                                >
                                  <Icon size={13} />
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openEditScope(idx)}
                                  title="Click to edit this scope"
                                  className="text-[12px] font-semibold text-textcolor px-1 py-2 truncate text-left hover:text-select-blue hover:underline"
                                >
                                  {item.area || (
                                    <span className="text-text-subtle font-normal italic no-underline">
                                      No room
                                    </span>
                                  )}
                                </button>
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) =>
                                    updateScope(
                                      idx,
                                      "description",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Description"
                                  className={inputBase}
                                />
                                <div
                                  className="relative"
                                  title="Default duration in days — seeds the project schedule"
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.days ?? ""}
                                    onChange={(e) =>
                                      updateScope(idx, "days", e.target.value)
                                    }
                                    placeholder="Days"
                                    className={`${inputBase} pr-8 text-center tabular-nums`}
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-text-subtle pointer-events-none">
                                    d
                                  </span>
                                </div>
                                <AmountInput
                                  value={item.amount}
                                  onChange={(v) =>
                                    updateScope(idx, "amount", v)
                                  }
                                  pct={pct}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeScopeRow(idx)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove row"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>

                              <div className="px-3 pb-2">
                                <div className="h-1 w-full bg-bg-soft rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${c.bar} transition-all`}
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                              </div>

                              <div className="border-t border-bordergray bg-bg-soft/40">
                                <button
                                  type="button"
                                  onClick={() => toggleExpanded(idx)}
                                  className="w-full flex items-center justify-between px-4 py-2 text-[11px] font-semibold text-text-muted hover:text-select-blue"
                                >
                                  <span className="flex items-center gap-1.5">
                                    {isOpen ? (
                                      <ChevronDown size={12} />
                                    ) : (
                                      <ChevronRight size={12} />
                                    )}
                                    Materials & Specifications
                                    {matCount > 0 && (
                                      <span className="ml-1 text-[10px] font-bold text-select-blue bg-white px-1.5 py-0.5 rounded-md border border-bordergray">
                                        {matCount}
                                      </span>
                                    )}
                                  </span>
                                  {!isOpen && matCount > 0 && (
                                    <span className="text-[10px] text-text-subtle truncate max-w-[60%]">
                                      {item.materials
                                        .map((m) => m.name)
                                        .filter(Boolean)
                                        .join(", ")}
                                    </span>
                                  )}
                                  {isOpen && (
                                    <span className="text-[10px] text-text-subtle">
                                      Hide
                                    </span>
                                  )}
                                </button>

                                {isOpen && (
                                  <div className="px-4 pb-3 space-y-1.5">
                                    {(item.materials || []).map((m, mIdx) => (
                                      <div
                                        key={mIdx}
                                        className="grid grid-cols-[130px_1fr_24px] gap-2 items-center"
                                      >
                                        <input
                                          type="text"
                                          value={m.name}
                                          onChange={(e) =>
                                            updateMaterial(
                                              idx,
                                              mIdx,
                                              "name",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Plywood"
                                          className={`${inputBase} py-1.5 text-[11px]`}
                                        />
                                        <input
                                          type="text"
                                          value={m.spec}
                                          onChange={(e) =>
                                            updateMaterial(
                                              idx,
                                              mIdx,
                                              "spec",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="BWP 19mm"
                                          className={`${inputBase} py-1.5 text-[11px]`}
                                        />
                                        <button
                                          type="button"
                                          onClick={() =>
                                            removeMaterial(idx, mIdx)
                                          }
                                          className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50"
                                          title="Remove material"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    ))}
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <button
                                        type="button"
                                        onClick={() => addMaterial(idx)}
                                        className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
                                      >
                                        <Plus size={11} /> Add Material
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {scopeItems.length === 0 && (
                  <div className="text-center py-10 px-6 rounded-xl border border-dashed border-bordergray bg-linear-to-br from-bg-soft/60 to-active-bg/30">
                    <div className="h-12 w-12 rounded-2xl bg-white border border-bordergray flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Package size={18} className="text-select-blue" />
                    </div>
                    <p className="text-[13px] font-bold text-textcolor">
                      No scope items yet
                    </p>
                    <p className="text-[11px] text-text-muted mt-1 max-w-xs mx-auto">
                      Use the quick-add chips above to add common rooms, or
                      start blank.
                    </p>
                    <button
                      type="button"
                      onClick={openAddScope}
                      className="mt-4 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[11.5px] font-semibold shadow-md shadow-select-blue/20 hover:shadow-lg transition-all"
                    >
                      <Plus size={13} /> Add Blank Scope
                    </button>
                  </div>
                )}
              </div>
            </section>
          </main>

          {/* ── Right: Stats + Inclusions / Exclusions ──────────────────── */}
          <aside className="space-y-5 min-w-0 overflow-y-auto pb-28">
            <section className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
              <div className="px-4 py-3 border-b border-bordergray flex items-center gap-2">
                <BarChart3 size={13} className="text-select-blue" />
                <h3 className="text-[12px] font-bold text-textcolor">
                  Cost Breakdown
                </h3>
              </div>
              <div className="p-4 space-y-3 overflow-y-auto">
                {scopeItems.length === 0 ? (
                  <p className="text-[11px] text-text-subtle text-center py-2">
                    Add scope items to see distribution
                  </p>
                ) : (
                  scopeItems
                    .map((item, idx) => {
                      const amount = Number(item.amount) || 0;
                      const pct =
                        totals.subtotal > 0
                          ? Math.round((amount / totals.subtotal) * 100)
                          : 0;
                      const cat = getCategory(item.area);
                      const c = COLOR_MAP[cat.color];
                      return { item, idx, amount, pct, c };
                    })
                    .sort((a, b) => b.amount - a.amount)
                    .slice(0, 6)
                    .map(({ item, idx, amount, pct, c }) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                            <span className="text-[11px] text-textcolor truncate font-medium">
                              {item.area || "Untitled"}
                            </span>
                          </span>
                          <span className="text-[10.5px] font-bold text-text-muted tabular-nums">
                            {pct}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-bg-soft rounded-full overflow-hidden">
                            <div
                              className={`h-full ${c.bar}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-text-subtle tabular-nums w-14 text-right">
                            {formatAmount(amount)}
                          </span>
                        </div>
                      </div>
                    ))
                )}
              </div>
              {scopeItems.length > 6 && (
                <div className="px-4 pb-3 -mt-1">
                  <p className="text-[10px] text-text-subtle text-center">
                    + {scopeItems.length - 6} more area
                    {scopeItems.length - 6 === 1 ? "" : "s"}
                  </p>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>

      {/* ── Sticky totals bar ──────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-20 pointer-events-none">
        <div className="px-6 pb-4 flex justify-center">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-bordergray shadow-[0_8px_30px_rgba(15,23,42,0.12)] rounded-2xl px-5 py-3 flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
                <Wallet size={14} />
              </span>
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-wider text-text-subtle">
                  {activeKey} · Quote Summary
                </p>
                <p className="text-[10.5px] text-text-muted">
                  {scopeItems.length} items · {activeConfig?.propertyType || ""}{" "}
                  · {totals.subtotal > 0 ? "live" : "empty"}
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-bordergray hidden sm:block" />
            <FooterStat
              label="Subtotal"
              value={formatAmount(totals.subtotal)}
            />
            <FooterStat
              label={`GST ${GST_RATE}%`}
              value={formatAmount(totals.gst)}
              accent="text-orange-500"
            />
            <div className="flex items-center gap-2 bg-linear-to-br from-select-blue to-primary text-white px-4 py-2 rounded-xl shadow-md shadow-select-blue/20">
              <IndianRupee size={13} />
              <div>
                <p className="text-[8.5px] font-bold uppercase tracking-widest opacity-80">
                  Grand Total
                </p>
                <p className="text-[14px] font-bold tabular-nums leading-tight">
                  {formatAmount(totals.grandTotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <Toast key={toast.id} toast={toast} onClose={() => setToast(null)} />
      )}

      {/* ── Confirm modal ──────────────────────────────────────────────── */}
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

      {/* ── Keyboard shortcuts modal ──────────────────────────────────── */}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}

      {/* ── Add Scope — multi-entry ScopeManagerModal ───────────────── */}
      {scopeFormOpen && (
        <ScopeManagerModal
          onAddAll={handleScopeManagerAddAll}
          onClose={() => setScopeFormOpen(false)}
        />
      )}

      {/* ── Edit existing scope row — single-entry ItemFormModal ─────── */}
      {editingScopeIdx != null && !scopeFormOpen && (
        <ItemFormModal
          initial={scopeRowToForm(activeConfig.scopeItems[editingScopeIdx])}
          onSave={handleScopeFormSave}
          onClose={() => setEditingScopeIdx(null)}
          title="Edit Scope"
          submitLabel="Save Changes"
          roomCategoryMode
          showCategory={false}
          showTags={false}
        />
      )}

      {previewOpen && (
        <Modal
          title={`${activeKey} — ${activeConfig?.propertyType || ""}`}
          subtitle="Scope of work, grouped by room"
          onClose={() => setPreviewOpen(false)}
          maxWidth="max-w-[680px]"
          footer={
            <div className="flex items-center justify-end gap-6 text-[13px]">
              <span className="text-text-muted">
                Subtotal:{" "}
                <span className="font-semibold text-textcolor tabular-nums">
                  {formatAmount(totals.subtotal)}
                </span>
              </span>
              <span className="text-text-muted">
                GST {GST_RATE}%:{" "}
                <span className="font-semibold text-textcolor tabular-nums">
                  {formatAmount(totals.gst)}
                </span>
              </span>
              <span className="text-[15px] font-bold text-primary tabular-nums">
                {formatAmount(totals.grandTotal)}
              </span>
            </div>
          }
        >
          <div className="space-y-5">
            {groupedScope.map((group) => {
              const gcat = getCategory(group.room);
              const gc = COLOR_MAP[gcat.color];
              return (
                <div key={group.room}>
                  <div className="flex items-center justify-between border-b border-bordergray pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${gc.dot}`} />
                      <h3 className="text-[13px] font-bold text-textcolor uppercase tracking-wide">
                        {group.room}
                      </h3>
                    </div>
                    <span className="text-[12px] font-bold text-textcolor tabular-nums">
                      {formatAmount(group.total)}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {group.rows.map(({ item, idx }) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          {item.description && (
                            <p className="text-[12.5px] text-textcolor">
                              {item.description}
                            </p>
                          )}
                          {(item.materials || []).length > 0 && (
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {item.materials
                                .map(
                                  (m) =>
                                    `${m.name}${m.spec ? ` (${m.spec})` : ""}`,
                                )
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                          {item.days !== "" && item.days != null && (
                            <p className="text-[10.5px] text-text-subtle mt-0.5">
                              {item.days} working day
                              {Number(item.days) === 1 ? "" : "s"}
                            </p>
                          )}
                        </div>
                        <span className="text-[12.5px] font-semibold text-textcolor tabular-nums shrink-0">
                          {formatAmount(Number(item.amount) || 0)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {showAddTypeModal && (
        <Modal
          title={`Configure Property Types for ${activeKey}`}
          subtitle="Map property types to this preset. Unchecked types preserve their configuration data internally."
          onClose={() => setShowAddTypeModal(false)}
          footer={
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddTypeModal(false)}
                className="px-4 py-2 border border-bordergray rounded-lg text-xs font-semibold text-text-muted hover:bg-bg-soft"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyTypes}
                className="px-4 py-2 bg-select-blue text-white rounded-lg text-xs font-semibold hover:bg-primary shadow-md shadow-select-blue/20"
              >
                Apply
              </button>
            </div>
          }
          maxWidth="max-w-[480px]"
        >
          <div className="space-y-4">
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-widest text-select-blue mb-2 block">
                Select Property Types
              </label>

              <div className="border border-bordergray rounded-lg overflow-hidden flex flex-col max-h-[280px]">
                {/* Inline Textbox */}
                <div className="p-2 border-b border-bordergray flex gap-1.5 shrink-0 bg-bg-soft">
                  <input
                    type="text"
                    id="new-modal-type"
                    placeholder="Add custom type..."
                    className="flex-1 bg-white border border-bordergray rounded-md px-2 py-1 text-[11px] text-textcolor focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const val = e.target.value.trim();
                        if (!val) return;

                        const exists = PROPERTY_TYPES.some(t => t.trim().toLowerCase() === val.toLowerCase());
                        if (exists) {
                          showToast("Property type already exists", "info");
                          return;
                        }

                        import("../../../helperConfigData/helperData").then(({ addGlobalPropertyType }) => {
                          addGlobalPropertyType(val);
                          setModalSelectedTypes((prev) => [...prev, val]);
                          e.target.value = "";
                        });
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("new-modal-type");
                      const val = input?.value.trim();
                      if (!val) return;

                      const exists = PROPERTY_TYPES.some(t => t.trim().toLowerCase() === val.toLowerCase());
                      if (exists) {
                        showToast("Property type already exists", "info");
                        return;
                      }

                      import("../../../helperConfigData/helperData").then(({ addGlobalPropertyType }) => {
                        addGlobalPropertyType(val);
                        setModalSelectedTypes((prev) => [...prev, val]);
                        if (input) input.value = "";
                      });
                    }}
                    className="px-3 py-1 rounded bg-select-blue text-white text-[11px] font-semibold hover:bg-primary"
                  >
                    Add
                  </button>
                </div>

                {/* Scrollable list */}
                <div className="overflow-y-auto flex-1 p-2 space-y-1 scroll-hidden-bar max-h-[220px]">
                  {PROPERTY_TYPES.map((type) => {
                    const isChecked = modalSelectedTypes.includes(type);
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between px-2 py-1.5 rounded hover:bg-bg-soft group transition-all"
                      >
                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                setModalSelectedTypes((prev) => prev.filter((t) => t !== type));
                              } else {
                                setModalSelectedTypes((prev) => [...prev, type]);
                              }
                            }}
                            className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                              isChecked ? "bg-select-blue border-select-blue text-white" : "border-bordergray bg-white"
                            }`}
                          >
                            {isChecked && <Check size={10} strokeWidth={4} />}
                          </button>
                          <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight pt-0.5 select-none">
                            {type}
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={() => {
                            const res = removeGlobalPropertyType(type);
                            if (res.success) {
                              showToast(`Deleted "${type}" globally`, "success");
                              setModalSelectedTypes((prev) => prev.filter((t) => t !== type));
                            } else {
                              showToast(res.error, "error");
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title="Remove globally"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ───────────────────────────────────────────────────────────────────────────

// Number input that hides "0" so users don't have to delete it before typing,
// and shows the cost-share % suffix when meaningful.
const AmountInput = ({ value, onChange, pct }) => {
  const [focused, setFocused] = useState(false);
  const display = focused
    ? value === 0 || value === "0"
      ? ""
      : value
    : value === 0 || value === "0" || value === ""
      ? ""
      : value;
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle text-[11px]">
        ₹
      </span>
      <input
        type="number"
        value={display}
        onFocus={(e) => {
          setFocused(true);
          e.target.select();
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(e.target.value === "" ? 0 : e.target.value)}
        placeholder="0"
        className={`${inputBase} pl-6 pr-10 text-right tabular-nums font-semibold`}
      />
      {pct > 0 && !focused && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-text-subtle tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  );
};

const Field = ({ icon, label, hint, children }) => (
  <div>
    <label className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">
      <span className="flex items-center gap-1">
        <span className="text-select-blue">{icon}</span>
        {label}
      </span>
      {hint && (
        <span className="text-[9.5px] font-normal text-text-subtle normal-case tracking-normal flex items-center gap-1">
          <Info size={9} /> {hint}
        </span>
      )}
    </label>
    {children}
  </div>
);

const BentoStat = ({ icon, label, value, tint }) => {
  const tints = {
    blue: "from-blue-50 to-white text-blue-600 border-blue-100",
    purple: "from-purple-50 to-white text-purple-600 border-purple-100",
    orange: "from-orange-50 to-white text-orange-600 border-orange-100",
    emerald: "from-emerald-50 to-white text-emerald-600 border-emerald-100",
  };
  return (
    <div
      className={`relative bg-linear-to-br ${tints[tint]} border rounded-xl p-3 overflow-hidden`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="opacity-80">{icon}</span>
        <span className="text-[9.5px] font-bold uppercase tracking-wider opacity-70">
          {label}
        </span>
      </div>
      <p className="text-[18px] font-bold text-textcolor tabular-nums leading-tight">
        {value}
      </p>
    </div>
  );
};

const FooterStat = ({ label, value, accent = "text-textcolor" }) => (
  <div className="flex flex-col">
    <span className="text-[9px] font-bold uppercase tracking-widest text-text-subtle">
      {label}
    </span>
    <span className={`text-[13px] font-bold tabular-nums ${accent}`}>
      {value}
    </span>
  </div>
);

// ───────────────────────────────────────────────────────────────────────────

const Toast = ({ toast, onClose }) => {
  const variants = {
    success: { bg: "bg-emerald-500", icon: <CheckCircle2 size={14} /> },
    error: { bg: "bg-red-500", icon: <AlertTriangle size={14} /> },
    info: { bg: "bg-select-blue", icon: <Info size={14} /> },
  };
  const v = variants[toast.type] || variants.info;
  return (
    <div className="fixed top-6 right-6 z-50 animate-[slideIn_0.2s_ease-out]">
      <div
        className={`${v.bg} text-white rounded-xl shadow-xl px-4 py-3 flex items-center gap-2.5 min-w-[260px] max-w-md`}
      >
        <span className="shrink-0">{v.icon}</span>
        <p className="text-[12px] font-medium flex-1">{toast.message}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-white/80 hover:text-white shrink-0"
          title="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

const ConfirmDialog = ({
  title,
  message,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-[fadeIn_0.15s_ease-out]"
    onClick={onCancel}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-5 flex items-start gap-3">
        <span
          className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
            danger
              ? "bg-red-50 text-red-500"
              : "bg-select-blue/10 text-select-blue"
          }`}
        >
          {danger ? <AlertTriangle size={18} /> : <Info size={18} />}
        </span>
        <div>
          <h3 className="text-[14px] font-bold text-textcolor">{title}</h3>
          <p className="text-[12px] text-text-muted mt-1 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
      <div className="px-5 py-3 bg-bg-soft border-t border-bordergray flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:bg-white hover:text-textcolor"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white shadow-sm ${
            danger
              ? "bg-red-500 hover:bg-red-600"
              : "bg-select-blue hover:bg-primary"
          }`}
        >
          {confirmLabel || "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const ShortcutsModal = ({ onClose }) => (
  <div
    className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard size={14} className="text-select-blue" />
          <h3 className="text-[13px] font-bold text-textcolor">
            Keyboard Shortcuts
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-text-subtle hover:text-textcolor"
        >
          <X size={14} />
        </button>
      </div>
      <div className="p-5 space-y-2.5">
        <Shortcut keys={["⌘", "S"]} label="Save changes" />
        <Shortcut keys={["?"]} label="Toggle this menu" />
        <Shortcut keys={["Esc"]} label="Close dialogs" />
        <Shortcut keys={["Enter"]} label="Confirm in input fields" />
      </div>
    </div>
  </div>
);

const Shortcut = ({ keys, label }) => (
  <div className="flex items-center justify-between">
    <span className="text-[12px] text-textcolor">{label}</span>
    <span className="flex items-center gap-1">
      {keys.map((k) => (
        <kbd
          key={k}
          className="text-[10px] font-bold bg-bg-soft border border-bordergray rounded px-1.5 py-0.5 text-textcolor"
        >
          {k}
        </kbd>
      ))}
    </span>
  </div>
);

export default ProposalMaster;
