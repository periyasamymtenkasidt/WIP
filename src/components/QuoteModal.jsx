import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Loader2,
  Plus,
  Trash2,
  Printer,
  Send,
  Pipette,
  Save,
  ListPlus,
  ChevronDown,
  RotateCcw,
  Check,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "./Modal";
import InputField from "./InputField";
import {
  getDefaultTermStrings,
  getNonDefaultTermStrings,
} from "../data/termsStorage";

const quoteRecipientSchema = yup.object().shape({
  recipientName: yup.string().required("Recipient name required"),
  recipientEmail: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
});
import QuotePreview from "./QuotePreview";
import {
  getPresetKeys,
  computeTotals,
  generateQuoteId,
  saveQuote,
  getConfigForType,
  getPropertyTypesForPreset,
} from "../data/QuotePresets";
import { computeLibraryItemAmount, computeLibraryItemQty } from "../data/itemLibrary";
import { formatAmount } from "../utils/formatAmount";
import ItemFormModal from "./ItemFormModal";
import LibraryPickerModal from "./LibraryPickerModal";

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-3">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

// ── Custom Premium Checkbox ─────────────────────────────────────────────────
const CustomCheckbox = ({
  checked,
  onChange,
  accent = "green",
  size = "normal",
}) => {
  const isGreen = accent === "green";
  const sizeClasses = size === "small" ? "h-3.5 w-3.5" : "h-4 w-4";
  const checkSize = size === "small" ? 9 : 11;
  const strokeW = size === "small" ? 3.5 : 3;

  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div
        className={`shrink-0 rounded flex items-center justify-center border transition-all duration-200 cursor-pointer ${sizeClasses} ${
          checked
            ? isGreen
              ? "bg-emerald-600 border-emerald-600 hover:bg-emerald-700/90 text-white shadow-sm"
              : "bg-red-500/80 hover:bg-red-500 border-red-500/50 text-white shadow-sm"
            : "bg-white border-slate-300 text-transparent hover:border-slate-400"
        }`}
      >
        <Check size={checkSize} strokeWidth={strokeW} className="shrink-0" />
      </div>
    </div>
  );
};

// ── Multi-select Searchable Dropdown ────────────────────────────────────────
// Reusable dropdown with inline search + checkbox selection for picking terms.
// Renders outside the modal via React Portal with real-time screen positioning.
const MultiSelectDropdown = ({
  label,
  items,
  selected,
  onToggle,
  accent = "green",
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      const clickedTrigger = ref.current && ref.current.contains(e.target);
      const clickedDropdown =
        dropdownRef.current && dropdownRef.current.contains(e.target);
      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Update position coordinates on resize or modal scroll
  useEffect(() => {
    if (open) {
      updateCoords();
      window.addEventListener("resize", updateCoords);
      window.addEventListener("scroll", updateCoords, true);
    }
    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [open]);

  // Auto-focus the input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = items.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  const borderColor =
    accent === "green" ? "border-emerald-400" : "border-red-400";
  const labelColor = accent === "green" ? "text-emerald-700" : "text-red-600";

  if (items.length === 0) return null;

  const placeholder =
    selected.length > 0
      ? `${selected.length} item${selected.length > 1 ? "s" : ""} selected`
      : "Select items…";

  return (
    <div ref={ref} className="relative">
      <label
        className={`text-[10px] font-bold uppercase tracking-widest ${labelColor} mb-1 block`}
      >
        {label}
      </label>
      {/* Inline search trigger — click or type to open and filter */}
      <div
        ref={triggerRef}
        className={`w-full flex items-center bg-white border ${
          open ? borderColor : "border-bordergray"
        } rounded-lg px-3 py-2 transition-all hover:border-select-blue/40 cursor-text`}
        onClick={() => {
          if (!open) setOpen(true);
          inputRef.current?.focus();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[11px] text-textcolor focus:outline-none placeholder:text-text-muted min-w-0"
        />
        <ChevronDown
          size={13}
          className={`text-text-subtle shrink-0 transition-transform cursor-pointer ${
            open ? "rotate-180" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((p) => !p);
            setSearch("");
          }}
        />
      </div>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: `${coords.top + 4}px`,
              left: `${coords.left}px`,
              width: `${coords.width}px`,
              zIndex: 9999,
            }}
            className="bg-white border border-bordergray rounded-lg shadow-lg max-h-[220px] flex flex-col animate-[fadeIn_0.15s_ease-out]"
          >
            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scroll-hidden-bar">
              {filtered.length === 0 ? (
                <p className="text-[11px] text-text-subtle italic text-center py-3">
                  No matching items.
                </p>
              ) : (
                <>
                  {/* Select / Deselect all filtered */}
                  <label className="flex items-center gap-2 cursor-pointer px-1 py-1 rounded hover:bg-bg-soft group">
                    <CustomCheckbox
                      accent={accent}
                      checked={
                        filtered.length > 0 &&
                        filtered.every((i) => selected.includes(i))
                      }
                      onChange={() => {
                        const allChecked = filtered.every((i) =>
                          selected.includes(i),
                        );
                        filtered.forEach((item) => {
                          const isSelected = selected.includes(item);
                          if (allChecked && isSelected) onToggle(item);
                          if (!allChecked && !isSelected) onToggle(item);
                        });
                        // Auto-close dropdown after toggling "All"
                        setOpen(false);
                        setSearch("");
                      }}
                    />
                    <span className="text-[10px] font-semibold text-text-muted group-hover:text-textcolor transition-colors">
                      All
                    </span>
                  </label>
                  {filtered.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 cursor-pointer px-1 py-1 rounded hover:bg-bg-soft group"
                    >
                      <CustomCheckbox
                        accent={accent}
                        checked={selected.includes(item)}
                        onChange={() => onToggle(item)}
                      />
                      <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight pt-0.5">
                        {item}
                      </span>
                    </label>
                  ))}
                </>
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

// ── Add Conditions Modal ────────────────────────────────────────────────────
// Shows non-default terms via separate multi-select searchable dropdowns.
// Selected items dynamically appear in the corresponding list below.
// Reusable empty state navigation helper
const EmptyStateMessage = ({ text, highlightText = "Master Module", onNavigate }) => {
  const parts = text.split(highlightText);
  return (
    <div className="rounded-xl border border-dashed border-bordergray bg-bg-soft px-4 py-6 text-center">
      <p className="text-[12px] text-text-subtle font-medium leading-relaxed">
        {parts[0]}
        <span
          onClick={onNavigate}
          className="hover:opacity-85 transition-opacity"
          style={{
            cursor: "pointer",
            color: "var(--primary-color, var(--color-primary, #1a2b4d))",
            textDecoration: "underline",
            fontWeight: "600",
          }}
        >
          {highlightText}
        </span>
        {parts[1]}
      </p>
    </div>
  );
};

// ── Add Conditions Modal ────────────────────────────────────────────────────
// Shows non-default terms via separate multi-select searchable dropdowns.
// Selected items dynamically appear in the corresponding list below.
const AddConditionsModal = ({
  currentInclusions,
  currentExclusions,
  onApply,
  onClose,
}) => {
  const navigate = useNavigate();
  const nonDefaults = getNonDefaultTermStrings();
  // Filter out items already present in the proposal form
  const availableInclusions = (nonDefaults.inclusions || []).filter(
    (t) => !currentInclusions.includes(t),
  );
  const availableExclusions = (nonDefaults.exclusions || []).filter(
    (t) => !currentExclusions.includes(t),
  );

  const [pickedInclusions, setPickedInclusions] = useState([]);
  const [pickedExclusions, setPickedExclusions] = useState([]);

  const togglePick = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleNavigateToMaster = () => {
    onClose();
    navigate("/master");
  };

  const hasInclusions = availableInclusions.length > 0;
  const hasExclusions = availableExclusions.length > 0;

  return (
    <Modal
      title="Add Conditions"
      subtitle="Select additional terms to include in this proposal."
      onClose={onClose}
      maxWidth="max-w-[560px]"
      maxHeight="max-h-[100vh]"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={
              pickedInclusions.length === 0 && pickedExclusions.length === 0
            }
            onClick={() => onApply(pickedInclusions, pickedExclusions)}
            className="px-5 py-2 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply ({pickedInclusions.length + pickedExclusions.length})
          </button>
        </div>
      }
    >
      {!hasInclusions && !hasExclusions ? (
        <div className="py-4">
          <EmptyStateMessage
            text="No Terms & Conditions available. Please navigate to the Master Module to configure Included and Not Included Terms."
            onNavigate={handleNavigateToMaster}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Separate multi-select searchable dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            <div>
              {!hasInclusions ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">
                    Included Items
                  </label>
                  <EmptyStateMessage
                    text="No Included Terms & Conditions available. Please navigate to the Master Module to add Included Terms."
                    onNavigate={handleNavigateToMaster}
                  />
                </div>
              ) : (
                <MultiSelectDropdown
                  label="Included Items"
                  items={availableInclusions}
                  selected={pickedInclusions}
                  onToggle={(item) =>
                    togglePick(pickedInclusions, setPickedInclusions, item)
                  }
                  accent="green"
                />
              )}
            </div>
            <div>
              {!hasExclusions ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-red-600 block">
                    Not Included Items
                  </label>
                  <EmptyStateMessage
                    text="No Not Included Terms & Conditions available. Please navigate to the Master Module to add Not Included Terms."
                    onNavigate={handleNavigateToMaster}
                  />
                </div>
              ) : (
                <MultiSelectDropdown
                  label="Not Included Items"
                  items={availableExclusions}
                  selected={pickedExclusions}
                  onToggle={(item) =>
                    togglePick(pickedExclusions, setPickedExclusions, item)
                  }
                  accent="red"
                />
              )}
            </div>
          </div>

          {/* Selected items preview */}
          {(pickedInclusions.length > 0 || pickedExclusions.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-bordergray/50">
              <div>
                {pickedInclusions.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold text-emerald-700 tracking-widest mb-2">
                      Selected Inclusions
                    </h3>
                    <div className="space-y-1.5">
                      {pickedInclusions.map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2 cursor-pointer group"
                        >
                          <CustomCheckbox
                            accent="green"
                            checked={true}
                            onChange={() =>
                              togglePick(
                                pickedInclusions,
                                setPickedInclusions,
                                item,
                              )
                            }
                          />
                          <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                {pickedExclusions.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-bold text-red-600 tracking-widest mb-2">
                      Selected Exclusions
                    </h3>
                    <div className="space-y-1.5">
                      {pickedExclusions.map((item, idx) => (
                        <label
                          key={idx}
                          className="flex items-start gap-2 cursor-pointer group"
                        >
                          <CustomCheckbox
                            accent="red"
                            checked={true}
                            onChange={() =>
                              togglePick(
                                pickedExclusions,
                                setPickedExclusions,
                                item,
                              )
                            }
                          />
                          <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                            {item}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const buildInitialFormData = ({
  presetKey,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
}) => {
  const presetKeys = getPresetKeys();
  const defaultTerms = getDefaultTermStrings();

  // If initialQuote is present, we still load the latest inquiry/master data,
  // but preserve identity fields like quoteId and createdAt.
  const activePresetKey =
    presetKey ||
    (presetData?.presetKey && presetKeys.includes(presetData.presetKey)
      ? presetData.presetKey
      : initialQuote?.presetKey || presetKeys[0] || "2BHK");
  const activePropertyType =
    presetData?.propertyType ||
    initialQuote?.propertyType ||
    defaultPropertyType ||
    "";

  const cfg = getConfigForType(activePresetKey, activePropertyType) || {};

  const quoteId = initialQuote?.quoteId || generateQuoteId();
  const createdAt = initialQuote?.createdAt || new Date().toISOString();

  // Load scope items from initialQuote or presetData if available, otherwise from latest master config
  const rawScopeItems =
    initialQuote?.scopeItems ||
    presetData?.scopeItems ||
    cfg.scopeItems ||
    [];

  const scopeItems = rawScopeItems.map((s) => ({
    ...s,
    length: s.length || 0,
    breadth: s.breadth || 0,
    height: s.height || 0,
    unit: s.unit || "",
    rate: s.rate || 0,
    qty: s.qty || 0,
    materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
  }));

  // Load inclusions/exclusions from initialQuote or presetData if available, otherwise from latest master terms
  const inclusions =
    initialQuote?.inclusions ||
    presetData?.inclusions ||
    [...(defaultTerms.inclusions || [])];

  const exclusions =
    initialQuote?.exclusions ||
    presetData?.exclusions ||
    [...(defaultTerms.exclusions || [])];

  return {
    quoteId,
    createdAt,
    recipientName: recipient?.name || initialQuote?.recipientName || "",
    recipientEmail: recipient?.email || initialQuote?.recipientEmail || "",
    recipientPhone: recipient?.phone || initialQuote?.recipientPhone || "",
    propertyType: activePropertyType,
    sizeRange:
      presetData?.sizeRange || cfg.sizeRange || initialQuote?.sizeRange || "",
    validityDays: presetData?.validityDays || initialQuote?.validityDays || 30,
    scopeItems,
    inclusions,
    exclusions,
    notes: presetData?.notes || initialQuote?.notes || "",
  };
};

// Pick the best preset to display in the dropdown given an already-loaded
// quote — first try the preset stored on the inquiry, then the quote, then the first available.
const inferPresetKey = (initialQuote, presetData) => {
  const keys = getPresetKeys();
  if (presetData?.presetKey && keys.includes(presetData.presetKey))
    return presetData.presetKey;
  if (initialQuote?.presetKey && keys.includes(initialQuote.presetKey))
    return initialQuote.presetKey;
  return keys.includes("2BHK") ? "2BHK" : keys[0];
};

// `mode` controls labelling only — "proposal" tweaks copy + button so this
// modal can be reused for the "Send Proposal" / "Resend Proposal" flow on a
// lead. Default "quote" keeps the standalone Quick Quote behaviour.
const QuoteModal = ({
  parentId,
  parentType,
  recipient,
  defaultPropertyType,
  initialQuote,
  presetData,
  mode = "quote",
  onClose,
  onSent,
}) => {
  const isProposal = mode === "proposal";
  const isResend = !!initialQuote;

  const [version, setVersion] = useState(0);
  useEffect(() => {
    const handleUpdate = () => setVersion((v) => v + 1);
    window.addEventListener("proposalMasterChanged", handleUpdate);
    window.addEventListener("propertyTypesChanged", handleUpdate);
    return () => {
      window.removeEventListener("proposalMasterChanged", handleUpdate);
      window.removeEventListener("propertyTypesChanged", handleUpdate);
    };
  }, []);
  const [presetKey, setPresetKey] = useState(() =>
    inferPresetKey(initialQuote, presetData),
  );
  const [formData, setFormData] = useState(() =>
    buildInitialFormData({
      presetKey: inferPresetKey(initialQuote, presetData),
      recipient,
      defaultPropertyType,
      initialQuote,
      presetData,
    }),
  );

  // Dynamic terms from the global Terms & Conditions master.
  // Only default items are auto-displayed; non-defaults are added via modal.
  const [termOptions, setTermOptions] = useState(() => {
    const defaults = getDefaultTermStrings();
    return {
      inclusions: Array.from(
        new Set([
          ...(defaults.inclusions || []),
          ...(formData.inclusions || []),
        ]),
      ),
      exclusions: Array.from(
        new Set([
          ...(defaults.exclusions || []),
          ...(formData.exclusions || []),
        ]),
      ),
    };
  });

  // Modal state for "Add Conditions" (non-default items picker)
  const [addConditionsOpen, setAddConditionsOpen] = useState(false);

  // react-hook-form for recipient validation
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors },
    setValue: rhfSetValue,
  } = useForm({
    resolver: yupResolver(quoteRecipientSchema),
    defaultValues: {
      recipientName: formData.recipientName,
      recipientEmail: formData.recipientEmail,
    },
  });

  const [isSending, setIsSending] = useState(false);
  // Controls the shared Item Form modal opened by "Add Row" / "Add Scope".
  const [scopeFormOpen, setScopeFormOpen] = useState(false);
  // Controls the library picker modal for "Pick from Library" flow.
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);

  const totals = useMemo(
    () => computeTotals(formData.scopeItems),
    [formData.scopeItems],
  );

  const handlePresetChange = (e) => {
    const key = e.target.value;
    setPresetKey(key);
    const cfg = getConfigForType(key);
    if (!cfg) return;
    const defaults = getDefaultTermStrings();
    setFormData((prev) => ({
      ...prev,
      propertyType: cfg.propertyType,
      sizeRange: cfg.sizeRange,
      scopeItems: (cfg.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: [...(defaults.inclusions || [])],
      exclusions: [...(defaults.exclusions || [])],
    }));
    setTermOptions({
      inclusions: [...(defaults.inclusions || [])],
      exclusions: [...(defaults.exclusions || [])],
    });
  };

  const handlePropertyTypeChange = (e) => {
    const newType = e.target.value;
    const cfg = getConfigForType(presetKey, newType);
    if (!cfg) {
      updateField("propertyType", newType);
      return;
    }
    const defaults2 = getDefaultTermStrings();
    setFormData((prev) => ({
      ...prev,
      propertyType: cfg.propertyType,
      sizeRange: cfg.sizeRange,
      scopeItems: (cfg.scopeItems || []).map((s) => ({
        ...s,
        materials: s.materials ? s.materials.map((m) => ({ ...m })) : [],
      })),
      inclusions: [...(defaults2.inclusions || [])],
      exclusions: [...(defaults2.exclusions || [])],
    }));
    setTermOptions({
      inclusions: [...(defaults2.inclusions || [])],
      exclusions: [...(defaults2.exclusions || [])],
    });
  };

  const updateField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    // Sync with react-hook-form for validated fields
    if (name === "recipientName" || name === "recipientEmail") {
      rhfSetValue(name, value, { shouldValidate: true });
    }
  };

  const toggleInclusion = (item) => {
    setFormData((prev) => ({
      ...prev,
      inclusions: prev.inclusions.includes(item)
        ? prev.inclusions.filter((i) => i !== item)
        : [...prev.inclusions, item],
    }));
  };

  const toggleExclusion = (item) => {
    setFormData((prev) => ({
      ...prev,
      exclusions: prev.exclusions.includes(item)
        ? prev.exclusions.filter((e) => e !== item)
        : [...prev.exclusions, item],
    }));
  };

  const updateScope = (idx, key, value) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) => {
        if (i !== idx) return s;
        const updated = { ...s, [key]: value };
        // Auto-compute qty and amount when length, breadth, rate, or qty changes
        if (key === "length" || key === "breadth") {
          const l = Number(key === "length" ? value : updated.length) || 0;
          const d = Number(key === "breadth" ? value : updated.breadth) || 0;
          if (l > 0 && d > 0) {
            updated.qty = l * d;
          } else if (l > 0) {
            updated.qty = l;
          } else if (d > 0) {
            updated.qty = d;
          } else {
            updated.qty = 0;
          }
          const r = Number(updated.rate) || 0;
          if (updated.qty > 0 && r > 0) {
            updated.amount = updated.qty * r;
          }
        } else if (key === "qty" || key === "rate") {
          const q = Number(key === "qty" ? value : updated.qty) || 0;
          const r = Number(key === "rate" ? value : updated.rate) || 0;
          if (q > 0 && r > 0) {
            updated.amount = q * r;
          }
        }
        // When amount is changed directly, just store it as a manual override
        return updated;
      }),
    }));
  };

  // Save handler for the shared Item Form modal. Maps the form's flat shape
  // onto the quote's scope-row shape (area / description / amount / materials).
  const handleScopeFormSave = (form) => {
    const newRow = {
      area: form.description || "",
      description: form.spec || "",
      amount: computeLibraryItemAmount(form),
      length: form.length || 0,
      breadth: form.breadth || 0,
      height: form.height || 0,
      unit: form.unit || "",
      rate: form.rate || 0,
      qty: computeLibraryItemQty(form),
      materials: form.materials ? form.materials.map((m) => ({ ...m })) : [],
    };
    setFormData((p) => ({
      ...p,
      scopeItems: [newRow, ...p.scopeItems],
    }));
    setScopeFormOpen(false);
  };

  // Handler for direct library picker — maps library item to scope row shape.
  const handleLibraryPick = (lib) => {
    const newRow = {
      area: lib.description || "",
      description: lib.spec || "",
      amount: computeLibraryItemAmount(lib),
      length: lib.length || 0,
      breadth: lib.breadth || 0,
      height: lib.height || 0,
      unit: lib.unit || "",
      rate: lib.rate || 0,
      qty: computeLibraryItemQty(lib),
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
    };
    setFormData((p) => ({
      ...p,
      scopeItems: [newRow, ...p.scopeItems],
    }));
    setLibraryPickerOpen(false);
  };

  const removeScopeRow = (idx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.filter((_, i) => i !== idx),
    }));
  };

  const updateMaterial = (scopeIdx, matIdx, key, value) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
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

  const removeMaterial = (scopeIdx, matIdx) => {
    setFormData((p) => ({
      ...p,
      scopeItems: p.scopeItems.map((s, i) =>
        i === scopeIdx
          ? {
              ...s,
              materials: (s.materials || []).filter((_, j) => j !== matIdx),
            }
          : s,
      ),
    }));
  };

  const buildQuote = (overrides = {}) => ({
    quoteId: formData.quoteId,
    parentId,
    parentType,
    presetKey,
    recipientName: formData.recipientName,
    recipientEmail: formData.recipientEmail,
    recipientPhone: formData.recipientPhone,
    propertyType: formData.propertyType,
    sizeRange: formData.sizeRange,
    validityDays: Number(formData.validityDays) || 30,
    scopeItems: formData.scopeItems,
    inclusions: formData.inclusions,
    exclusions: formData.exclusions,
    notes: formData.notes,
    createdAt: formData.createdAt,
    subtotal: totals.subtotal,
    gst: totals.gst,
    grandTotal: totals.grandTotal,
    status: "draft",
    ...overrides,
  });

  const handleSaveDraft = () => {
    if (!parentId) return;
    saveQuote(parentId, buildQuote());
    onClose?.();
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = async (validatedData) => {
    // Also check scope items (not managed by react-hook-form)
    if (!formData.scopeItems?.length) {
      return;
    }
    // Sync validated recipient data back to formData
    formData.recipientName = validatedData.recipientName;
    formData.recipientEmail = validatedData.recipientEmail;

    setIsSending(true);
    await new Promise((r) => setTimeout(r, 600));
    const sentAt = new Date().toISOString();
    const subjectPrefix = isProposal
      ? isResend
        ? "Revised proposal"
        : "Proposal"
      : "Quote";
    const subject = `${subjectPrefix} ${formData.quoteId} for your project — ${parentId}`;
    const body = `Hi ${formData.recipientName},\n\nPlease find attached our ${subjectPrefix.toLowerCase()} ${formData.quoteId} for your ${formData.propertyType} (${formData.sizeRange}). The grand total is ${formatAmount(totals.grandTotal)} (incl. GST). This quote is valid for ${formData.validityDays} days.\n\nLooking forward to your feedback.\n\n— Digital Atelier`;
    const quote = buildQuote({ status: "sent", sentAt, subject, body });
    saveQuote(parentId, quote);
    onSent?.({
      quoteId: quote.quoteId,
      to: formData.recipientEmail,
      subject,
      body,
      total: totals.grandTotal,
      quote,
      isResend,
    });
    setIsSending(false);
    onClose?.();
  };

  const previewQuote = buildQuote();

  const footer = (
    <div className="flex flex-wrap justify-between items-center gap-3 modal-no-print">
      <button
        type="button"
        onClick={onClose}
        disabled={isSending}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {/* Save Draft only makes sense in standalone Quote mode — proposal
            mode is a single-shot send. */}
        {!isProposal && (
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
          >
            <Save size={14} /> Save Draft
          </button>
        )}
        <button
          type="button"
          onClick={handlePrint}
          disabled={isSending}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text hover:bg-bg-soft transition-all disabled:opacity-50"
        >
          <Printer size={14} /> Print / Save PDF
        </button>
        <button
          type="button"
          onClick={rhfHandleSubmit(handleSend)}
          disabled={isSending}
          className="min-w-[180px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isSending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send size={14} />{" "}
              {isProposal
                ? isResend
                  ? "Resend Proposal"
                  : "Send Proposal"
                : "Send via Email"}
            </>
          )}
        </button>
      </div>
    </div>
  );

  const modalTitle = isProposal
    ? isResend
      ? "Resend Proposal"
      : "Send Proposal"
    : "Quick Quote";
  const modalSubtitle = isProposal
    ? isResend
      ? "Existing scope and pricing loaded. Edit, preview, and resend."
      : "Pick a preset, edit the scope, preview, then send via email."
    : "Pick a preset, edit the scope, then send or print.";

  return (
    <Modal
      title={modalTitle}
      subtitle={modalSubtitle}
      onClose={isSending ? undefined : onClose}
      footer={footer}
      maxWidth="max-w-[1100px]"
      maxHeight="max-h-[95vh]"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        {/* Form pane */}
        <div className="modal-no-print">
          {/* Preset is editable in standalone Quote mode but locked in
              Proposal mode (it was chosen during inquiry creation). */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Property Preset</SectionHeader>
              <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-bold text-text">
                    {presetKey.replace(/^(\d+)(BHK)$/i, "$1 BHK")}
                    {formData.propertyType ? ` / ${formData.propertyType}` : ""}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {formData.sizeRange ||
                      getConfigForType(presetKey, formData.propertyType)
                        ?.sizeRange ||
                      ""}
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  From inquiry
                </span>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <SectionHeader>Preset</SectionHeader>
              <InputField
                name="presetKey"
                label="Property Preset"
                type="select"
                value={presetKey}
                onChange={handlePresetChange}
                options={getPresetKeys()}
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Switching presets reloads scope items. Existing edits will be
                lost.
              </p>
            </div>
          )}

          <div className="border-t border-border my-5" />

          {/* Recipient — proposal mode shows just the email; the standalone
              Quote mode keeps the full name/phone/email block. */}
          {isProposal ? (
            <div className="mb-5">
              <SectionHeader>Recipient Email</SectionHeader>
              <InputField
                name="recipientEmail"
                label="Email"
                type="email"
                register={register("recipientEmail")}
                onChange={(e) => updateField("recipientEmail", e.target.value)}
                error={errors.recipientEmail?.message}
                placeholder="example@domain.com"
              />
              <p className="mt-2 text-[10px] text-text-muted">
                Sample quotation will be sent to this address.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <SectionHeader>Recipient</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="recipientName"
                    label="Name"
                    type="text"
                    register={register("recipientName")}
                    onChange={(e) =>
                      updateField("recipientName", e.target.value)
                    }
                    error={errors.recipientName?.message}
                    placeholder="Full name"
                  />
                  <InputField
                    name="recipientPhone"
                    label="Phone"
                    type="tel"
                    value={formData.recipientPhone}
                    onChange={(e) =>
                      updateField("recipientPhone", e.target.value)
                    }
                    placeholder="10-digit number"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="recipientEmail"
                    label="Email"
                    type="email"
                    register={register("recipientEmail")}
                    onChange={(e) =>
                      updateField("recipientEmail", e.target.value)
                    }
                    error={errors.recipientEmail?.message}
                    placeholder="example@domain.com"
                  />
                </div>
              </div>

              <div className="border-t border-border my-5" />

              <div className="mb-5">
                <SectionHeader>Property</SectionHeader>
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    name="propertyType"
                    label="Property Type"
                    type="select"
                    value={formData.propertyType}
                    onChange={handlePropertyTypeChange}
                    options={getPropertyTypesForPreset(presetKey)}
                  />
                  <InputField
                    name="sizeRange"
                    label="Size"
                    type="text"
                    value={formData.sizeRange}
                    onChange={(e) => updateField("sizeRange", e.target.value)}
                    placeholder="e.g. 800–1100 sq ft"
                  />
                </div>
                <div className="mt-3">
                  <InputField
                    name="validityDays"
                    label="Validity (days)"
                    type="number"
                    value={formData.validityDays}
                    onChange={(e) =>
                      updateField("validityDays", e.target.value)
                    }
                    placeholder="30"
                  />
                </div>
              </div>
            </>
          )}

          <div className="border-t border-border my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <SectionHeader>Scope of Work</SectionHeader>
              <button
                type="button"
                onClick={() => setLibraryPickerOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg transition-all -mt-3"
              >
                <Pipette size={12} /> Pick from Library
              </button>
            </div>
            {errors.scopeItems && (
              <p className="text-red-500 text-[10px] mb-2">
                {errors.scopeItems.message}
              </p>
            )}
            <div className="space-y-3">
              {formData.scopeItems.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-bg-soft p-2 space-y-2"
                >
                  <div className="grid grid-cols-[1fr_1.5fr_110px_28px] gap-2 items-start">
                    <input
                      type="text"
                      value={item.area}
                      onChange={(e) => updateScope(idx, "area", e.target.value)}
                      placeholder="Area"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                    />
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateScope(idx, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        updateScope(idx, "amount", e.target.value === "" ? 0 : Number(e.target.value))
                      }
                      placeholder="₹"
                      className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => removeScopeRow(idx)}
                      className="h-8 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove row"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Dimension strip — L / D / H / Area / Qty / Rate */}
                  <div className="grid grid-cols-6 gap-2 items-end">
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">L (ft)</span>
                      <input
                        type="number"
                        value={item.length || 0}
                        onChange={(e) => updateScope(idx, "length", Number(e.target.value) || 0)}
                        className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">D (ft)</span>
                      <input
                        type="number"
                        value={item.breadth || 0}
                        onChange={(e) => updateScope(idx, "breadth", Number(e.target.value) || 0)}
                        className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">H (ft)</span>
                      <input
                        type="number"
                        value={item.height || 0}
                        onChange={(e) => updateScope(idx, "height", Number(e.target.value) || 0)}
                        className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">Area</span>
                      <div className="bg-bg-soft border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full tabular-nums text-right cursor-default select-none">
                        {(() => {
                          const l = Number(item.length) || 0;
                          const d = Number(item.breadth) || 0;
                          if (l > 0 && d > 0) return (l * d).toFixed(2);
                          if (l > 0) return l.toFixed(2);
                          if (d > 0) return d.toFixed(2);
                          return "0";
                        })()}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">Qty</span>
                      <input
                        type="number"
                        value={item.qty || 0}
                        onChange={(e) => updateScope(idx, "qty", Number(e.target.value) || 0)}
                        className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-text-muted mb-0.5">Rate ₹</span>
                      <input
                        type="number"
                        value={item.rate || 0}
                        onChange={(e) => updateScope(idx, "rate", Number(e.target.value) || 0)}
                        className="bg-white border border-bordergray text-[11px] text-darkgray rounded-md px-2 py-2 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300 text-right"
                      />
                    </div>
                  </div>

                  {/* Material specs — read-only display from Proposal Master */}
                  {(item.materials || []).length > 0 && (
                    <div className="pl-3 border-l-2 border-select-blue/30 space-y-1.5">
                      {item.materials.map((m, mIdx) => (
                        <div
                          key={mIdx}
                          className="grid grid-cols-[100px_1fr_22px] gap-2 items-center"
                        >
                          <input
                            type="text"
                            value={m.name}
                            onChange={(e) =>
                              updateMaterial(idx, mIdx, "name", e.target.value)
                            }
                            placeholder="Plywood"
                            className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                          />
                          <input
                            type="text"
                            value={m.spec}
                            onChange={(e) =>
                              updateMaterial(idx, mIdx, "spec", e.target.value)
                            }
                            placeholder="BWP 19mm"
                            className="bg-white border border-bordergray text-[10px] text-darkgray rounded-md px-2 py-1.5 w-full focus:outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeMaterial(idx, mIdx)}
                            className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Remove material"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-end gap-4 text-[12px]">
              <span className="text-text-muted">
                Subtotal:{" "}
                <span className="font-bold text-text">
                  {formatAmount(totals.subtotal)}
                </span>
              </span>
              <span className="text-text-muted">
                GST:{" "}
                <span className="font-bold text-orange-500">
                  {formatAmount(totals.gst)}
                </span>
              </span>
              <span className="text-text-muted">
                Total:{" "}
                <span className="font-bold text-primary">
                  {formatAmount(totals.grandTotal)}
                </span>
              </span>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div className="mb-5">
            <div className="flex justify-between items-center mb-3">
              <SectionHeader>Terms & Conditions</SectionHeader>
              <div className="flex items-center gap-2 -mt-3">
                <button
                  type="button"
                  onClick={() => setAddConditionsOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
                >
                  <ListPlus size={13} /> Add Conditions
                </button>
                {isResend && (
                  <button
                    type="button"
                    onClick={() => {
                      const defaults = getDefaultTermStrings();
                      setFormData((prev) => ({
                        ...prev,
                        inclusions: [...(defaults.inclusions || [])],
                        exclusions: [...(defaults.exclusions || [])],
                      }));
                      setTermOptions({
                        inclusions: [...(defaults.inclusions || [])],
                        exclusions: [...(defaults.exclusions || [])],
                      });
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700"
                    title="Restore default Terms & Conditions from the master module"
                  >
                    <RotateCcw size={12} /> Reset to Default
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-emerald-700 tracking-widest">
                    Included
                  </h3>
                  {termOptions.inclusions.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <CustomCheckbox
                        size="small"
                        accent="green"
                        checked={
                          termOptions.inclusions.length > 0 &&
                          termOptions.inclusions.every((item) =>
                            formData.inclusions.includes(item),
                          )
                        }
                        onChange={() => {
                          const allSelected = termOptions.inclusions.every(
                            (item) => formData.inclusions.includes(item),
                          );
                          if (allSelected) {
                            setFormData((p) => ({ ...p, inclusions: [] }));
                          } else {
                            setFormData((p) => ({
                              ...p,
                              inclusions: [
                                ...new Set([
                                  ...p.inclusions,
                                  ...termOptions.inclusions,
                                ]),
                              ],
                            }));
                          }
                        }}
                      />
                      <span className="text-[10px] text-text-muted group-hover:text-textcolor font-semibold transition-colors">
                        Select All
                      </span>
                    </label>
                  )}
                </div>
                <div className="max-h-[160px] overflow-y-auto scroll-hidden-bar space-y-2">
                  {termOptions.inclusions.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 cursor-pointer group font-semibold text-[10px]"
                    >
                      <CustomCheckbox
                        accent="green"
                        checked={formData.inclusions.includes(item)}
                        onChange={() => toggleInclusion(item)}
                      />
                      <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                        {item}
                      </span>
                    </label>
                  ))}
                  {termOptions.inclusions.length === 0 && (
                    <p className="text-[10px] text-text-subtle italic">
                      No inclusions defined.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-red-500 tracking-widest">
                    Not Included
                  </h3>
                  {termOptions.exclusions.length > 0 && (
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <CustomCheckbox
                        size="small"
                        accent="red"
                        checked={
                          termOptions.exclusions.length > 0 &&
                          termOptions.exclusions.every((item) =>
                            formData.exclusions.includes(item),
                          )
                        }
                        onChange={() => {
                          const allSelected = termOptions.exclusions.every(
                            (item) => formData.exclusions.includes(item),
                          );
                          if (allSelected) {
                            setFormData((p) => ({ ...p, exclusions: [] }));
                          } else {
                            setFormData((p) => ({
                              ...p,
                              exclusions: [
                                ...new Set([
                                  ...p.exclusions,
                                  ...termOptions.exclusions,
                                ]),
                              ],
                            }));
                          }
                        }}
                      />
                      <span className="text-[10px] text-text-muted group-hover:text-textcolor font-semibold transition-colors">
                        Select All
                      </span>
                    </label>
                  )}
                </div>
                <div className="max-h-[160px] overflow-y-auto scroll-hidden-bar space-y-2">
                  {termOptions.exclusions.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 cursor-pointer group font-semibold text-[11px]"
                    >
                      <CustomCheckbox
                        accent="red"
                        checked={formData.exclusions.includes(item)}
                        onChange={() => toggleExclusion(item)}
                      />
                      <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight">
                        {item}
                      </span>
                    </label>
                  ))}
                  {termOptions.exclusions.length === 0 && (
                    <p className="text-[10px] text-text-subtle italic">
                      No exclusions defined.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border my-5" />

          <div>
            <SectionHeader>Notes / Terms</SectionHeader>
            <InputField
              name="notes"
              label=""
              type="textarea"
              rows={3}
              value={formData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              placeholder="Optional notes for the client (payment terms, timelines, etc.)"
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="lg:sticky lg:top-0 lg:self-start">
          <p className="text-[10px] uppercase tracking-widest text-text-subtle font-bold mb-2 modal-no-print">
            Live Preview
          </p>
          <div className="quote-print-area rounded-xl border border-border bg-white p-6 shadow-sm">
            <QuotePreview quote={previewQuote} />
          </div>
        </div>
      </div>

      {/* Shared Item Form modal for Add Row — mirrors Item Master & BOQ flows */}
      {/* {scopeFormOpen && (
        <ItemFormModal
          initial={{}}
          onSave={handleScopeFormSave}
          onClose={() => setScopeFormOpen(false)}
          title="Add Scope"
          submitLabel="Add Scope"
          showCategory={true}
          showTags={true}
        />
      )} */}

      {/* Library Picker — direct pick from saved items */}
      {libraryPickerOpen && (
        <LibraryPickerModal
          onClose={() => setLibraryPickerOpen(false)}
          onPick={handleLibraryPick}
        />
      )}

      {/* Add Conditions modal — shows non-default items from master */}
      {addConditionsOpen && (
        <AddConditionsModal
          currentInclusions={termOptions.inclusions}
          currentExclusions={termOptions.exclusions}
          selectedInclusions={formData.inclusions}
          selectedExclusions={formData.exclusions}
          onApply={(newInclusions, newExclusions) => {
            // Append selected non-default items to termOptions & formData
            setTermOptions((prev) => ({
              inclusions: Array.from(
                new Set([...newInclusions, ...prev.inclusions]),
              ),
              exclusions: Array.from(
                new Set([...newExclusions, ...prev.exclusions]),
              ),
            }));
            setFormData((prev) => ({
              ...prev,
              inclusions: Array.from(
                new Set([...prev.inclusions, ...newInclusions]),
              ),
              exclusions: Array.from(
                new Set([...prev.exclusions, ...newExclusions]),
              ),
            }));
            setAddConditionsOpen(false);
          }}
          onClose={() => setAddConditionsOpen(false)}
        />
      )}
    </Modal>
  );
};

export default QuoteModal;
