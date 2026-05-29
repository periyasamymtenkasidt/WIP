import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Trash2,
  X,
  Check,
  Package,
  Pipette,
  Sparkles,
  Ruler,
  Calculator,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "./InputField";
import CategorySelect from "./CategorySelect";
import { getScheduleConfig, getRoomDefaultDays } from "../data/scheduleConfig";
import { roomColor } from "../data/categoryColors";

const itemFormSchema = yup.object().shape({
  description: yup
    .string()
    .required("Item name is required")
    .trim()
    .min(1, "Item name is required"),
  spec: yup.string().trim(),
  hsn: yup.string().trim(),
  rate: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Rate cannot be negative")
    .typeError("Rate must be a number"),
  length: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Length cannot be negative")
    .typeError("Length must be a number"),
  breadth: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Depth cannot be negative")
    .typeError("Depth must be a number"),
  height: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Height cannot be negative")
    .typeError("Height must be a number"),
  qty: yup
    .number()
    .transform((v, orig) => (orig === "" ? 0 : v))
    .min(0, "Qty cannot be negative")
    .typeError("Qty must be a number"),
});
import {
  listLibrary,
  blankLibraryItem,
  computeLibraryItemArea,
  computeLibraryItemQty,
  computeLibraryItemAmount,
} from "../data/itemLibrary";
import { UNITS, HSN_SUGGESTIONS, GST_OPTIONS } from "../data/boqUnits";

const inputBase =
  "bg-white border border-bordergray text-[12px] text-textcolor rounded-lg px-3 py-2 w-full focus:outline-none focus:border-select-blue focus:ring-2 focus:ring-select-blue/15 transition-all placeholder:text-text-subtle";

// Shared item-entry form. Used by Settings → Item Master and by the BOQ
// editor's "Add Line Item" flow so item entry is consistent everywhere.
//
// Always uses a flat shape:
//   { description, spec, category, hsn, unit, length, breadth, height,
//     qty, rate, gstPercent, materials, tags }
// Callers convert to/from their native shape (e.g. BOQ items wrap dimensions
// into a nested object) at the boundaries.
const ItemFormModal = ({
  initial,
  onSave,
  onClose,
  title,
  submitLabel,
  showCategory = true,
  showTags = true,
  // When true, the name field becomes a controlled Schedule room/category
  // dropdown (used by Proposal Master → Add Scope).
  roomCategoryMode = false,
}) => {
  const defaults = {
    ...blankLibraryItem(),
    ...initial,
  };

  // react-hook-form manages the top-level validated fields
  const {
    register,
    handleSubmit: rhfHandleSubmit,
    setValue: rhfSetValue,
    watch,
    reset: rhfReset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(itemFormSchema),
    defaultValues: {
      description: defaults.description || "",
      spec: defaults.spec || "",
      hsn: defaults.hsn || "",
      rate: defaults.rate || 0,
      length: defaults.length || 0,
      breadth: defaults.breadth || 0,
      height: defaults.height || 0,
      qty: defaults.qty || 0,
    },
  });

  // Remaining fields managed via useState (dimensions with custom display
  // logic, dynamic arrays for materials/tags, selects that feed computed values)
  const [form, setForm] = useState({
    ...defaults,
    materials: initial?.materials ? [...initial.materials] : [],
    tags: initial?.tags ? [...initial.tags] : [],
  });
  const [pickerOpen, setPickerOpen] = useState(false);


  const update = (changes) => setForm((p) => ({ ...p, ...changes }));
  const addMaterial = () =>
    update({ materials: [...form.materials, { name: "", spec: "" }] });
  const updateMaterial = (idx, key, v) =>
    update({
      materials: form.materials.map((m, i) =>
        i === idx ? { ...m, [key]: v } : m,
      ),
    });
  const removeMaterial = (idx) =>
    update({ materials: form.materials.filter((_, i) => i !== idx) });

  // Copy fields from a saved library item into the current form. Keeps the
  // current id so an in-progress edit stays attached to its record.
  // In room-category mode the name field is the Room/Category, so it takes the
  // library item's category (room); the item's own name flows into the spec.
  const fillFromLibrary = (lib) => {
    rhfReset({
      description: roomCategoryMode
        ? lib.category || ""
        : lib.description || "",
      spec: roomCategoryMode
        ? [lib.description, lib.spec].filter(Boolean).join(" — ")
        : lib.spec || "",
      hsn: lib.hsn || "",
      rate: lib.rate || 0,
      length: lib.length || 0,
      breadth: lib.breadth || 0,
      height: lib.height || 0,
      qty: lib.qty || 0,
    });
    setForm((p) => ({
      ...blankLibraryItem(),
      ...lib,
      id: p.id,
      masterId: lib.id,
      materials: lib.materials ? lib.materials.map((m) => ({ ...m })) : [],
      tags: lib.tags ? [...lib.tags] : [],
    }));
    setPickerOpen(false);
  };

  const handleFormSubmit = (validatedData) => {
    // Merge react-hook-form validated data with useState-managed data
    onSave({
      ...form,
      description: validatedData.description,
      spec: validatedData.spec || "",
      hsn: validatedData.hsn || "",
      rate: Number(validatedData.rate) || 0,
      gstPercent: Number(form.gstPercent) || 18,
      length: Number(validatedData.length) || 0,
      breadth: Number(validatedData.breadth) || 0,
      height: Number(validatedData.height) || 0,
      qty: Number(validatedData.qty) || 0,
    });
  };

  const isEditing = !!initial?.id;
  const unitLabel = UNITS.find((u) => u.code === form.unit)?.label || form.unit;
  // Use the watched rhf fields + other form fields for computation
  const watchedFields = watch();
  const computeForm = { ...form, ...watchedFields };
  const derivedArea = computeLibraryItemArea(computeForm);
  const derivedQty = computeLibraryItemQty(computeForm);
  const derivedAmount = computeLibraryItemAmount(computeForm);
  const dimsHint =
    form.unit === "sqft" || form.unit === "sqm"
      ? "Area = L × D · Qty overrides for wastage"
      : form.unit === "rmt" || form.unit === "mm"
        ? "Area = L · Qty overrides if different"
        : "Enter Qty directly";

  const resolvedTitle =
    title || (isEditing ? "Edit Item" : "Add Item");
  const resolvedSubmit =
    submitLabel || (isEditing ? "Save Changes" : "Add Item");

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
              <Sparkles size={14} />
            </span>
            <h3 className="text-[14px] font-bold text-textcolor">
              {resolvedTitle}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-select-blue/30 bg-active-bg/40 text-select-blue text-[11px] font-semibold hover:bg-active-bg transition-all"
              title="Start from an existing library item"
            >
              <Pipette size={12} /> Pick from Library
            </button>
            <button type="button" onClick={onClose} className="text-text-subtle hover:text-textcolor">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <Label>{roomCategoryMode ? "Room / Category *" : "Item Name *"}</Label>
            {roomCategoryMode ? (
              <>
                <CategorySelect
                  value={watch("description")}
                  onChange={(v) => {
                    rhfSetValue("description", v, { shouldValidate: true });
                    // Auto-fill the duration from the room's configured default.
                    const d = getRoomDefaultDays(v);
                    if (d !== "") update({ days: d });
                  }}
                  className={`${inputBase} cursor-pointer`}
                />
                {errors.description?.message && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {errors.description.message}
                  </p>
                )}
              </>
            ) : (
              <InputField
                name="description"
                register={register("description")}
                placeholder="e.g. False ceiling area"
                error={errors.description?.message}
              />
            )}
          </div>

          {roomCategoryMode && (
            <div>
              <Label>Duration (working days)</Label>
              <input
                type="number"
                min={0}
                value={form.days ?? ""}
                onChange={(e) => update({ days: e.target.value })}
                placeholder="e.g. 20"
                className={inputBase}
              />
            </div>
          )}

          <div>
            <Label>Detailed Specification</Label>
            <InputField
              type="textarea"
              name="spec"
              register={register("spec")}
              rows={3}
              placeholder="e.g. Supply, transport and Installation of Gypsum ceiling. 12.5 mm thk Gyproc board with Gypliner channel sections at every 450mm with fixing brackets, angles and channels connectors also with premium emulsion paint finish."
              error={errors.spec?.message}
            />
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-${showCategory ? 4 : 3} gap-3`}>
            {showCategory && (
              <div>
                <Label>Room / Category</Label>
                <CategorySelect
                  value={form.category}
                  onChange={(v) => update({ category: v })}
                  className={`${inputBase} cursor-pointer`}
                />
              </div>
            )}
            <div>
              <Label>HSN Code</Label>
              <InputField
                name="hsn"
                register={register("hsn")}
                placeholder="9403"
                error={errors.hsn?.message}
              />
              <datalist id="hsn-suggestions-shared">
                {HSN_SUGGESTIONS.map((h) => (
                  <option key={h.code} value={h.code}>{h.desc}</option>
                ))}
              </datalist>
            </div>
            <div>
              <Label>Unit</Label>
              <select
                value={form.unit}
                onChange={(e) => update({ unit: e.target.value })}
                className={`${inputBase} cursor-pointer`}
              >
                {UNITS.map((u) => (
                  <option key={u.code} value={u.code}>{u.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>GST %</Label>
              <select
                value={form.gstPercent}
                onChange={(e) => update({ gstPercent: Number(e.target.value) })}
                className={`${inputBase} cursor-pointer`}
              >
                {GST_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}%</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dimensions + area + qty + rate row — matches BOQ line layout */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0 flex items-center gap-1">
                <Ruler size={11} /> Dimensions, Area, Qty & Rate
              </Label>
              <span className="text-[9.5px] text-text-subtle">{dimsHint}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <NumField
                label="Length"
                value={watchedFields.length}
                onChange={(v) => {
                  rhfSetValue("length", v, { shouldValidate: true });
                  if (form.unit === "ls" && v > 0) {
                    update({ unit: "sqft" });
                  }
                }}
                error={errors.length?.message}
              />
              <NumField
                label="Depth"
                value={watchedFields.breadth}
                onChange={(v) => {
                  rhfSetValue("breadth", v, { shouldValidate: true });
                  if (form.unit === "ls" && v > 0) {
                    update({ unit: "sqft" });
                  }
                }}
                error={errors.breadth?.message}
              />
              <NumField label="Height" value={watchedFields.height} onChange={(v) => rhfSetValue("height", v, { shouldValidate: true })} error={errors.height?.message} />
              <ReadOnlyField label="Area" value={derivedArea} unitLabel={unitLabel} />
              <NumField label="Qty" value={watchedFields.qty} onChange={(v) => rhfSetValue("qty", v, { shouldValidate: true })} tabular bold placeholder={derivedArea > 0 ? String(derivedArea) : "0"} error={errors.qty?.message} />
              <NumField label={`Rate (₹/${unitLabel})`} value={watchedFields.rate} onChange={(v) => rhfSetValue("rate", v, { shouldValidate: true })} tabular prefix="₹" error={errors.rate?.message} />
            </div>
          </div>

          {/* Computed strip */}
          <div className="flex items-center justify-between gap-3 bg-bg-soft border border-bordergray rounded-lg px-3 py-2">
            <span className="flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-text-muted">
              <Calculator size={11} /> Computed
            </span>
            <div className="flex items-center gap-4 text-[11.5px]">
              <span className="text-text-muted">
                Area:{" "}
                <span className="font-bold text-textcolor tabular-nums">
                  {derivedArea.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>{" "}
                {unitLabel}
              </span>
              <span className="text-text-muted">
                Qty:{" "}
                <span className="font-bold text-textcolor tabular-nums">
                  {derivedQty.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>{" "}
                {unitLabel}
              </span>
              <span className="text-text-muted">
                Amount:{" "}
                <span className="font-bold text-textcolor tabular-nums">
                  ₹{derivedAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </span>
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="mb-0">Materials & Specifications</Label>
              <button
                type="button"
                onClick={addMaterial}
                className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
              >
                <Plus size={11} /> Add Material
              </button>
            </div>
            <div className="space-y-1.5">
              {form.materials.length === 0 && (
                <p className="text-[10.5px] text-text-subtle border border-dashed border-bordergray rounded-lg py-3 text-center">
                  No materials yet — add brand & spec to lock in quality
                </p>
              )}
              {form.materials.map((m, idx) => (
                <div key={idx} className="grid grid-cols-[140px_1fr_28px] gap-2 items-center">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => updateMaterial(idx, "name", e.target.value)}
                    placeholder="Plywood"
                    className={`${inputBase} font-medium text-[11.5px] py-1.5`}
                  />
                  <input
                    type="text"
                    value={m.spec}
                    onChange={(e) => updateMaterial(idx, "spec", e.target.value)}
                    placeholder="BWP 19mm Greenply"
                    className={`${inputBase} text-[11.5px] py-1.5`}
                  />
                  <button
                    type="button"
                    onClick={() => removeMaterial(idx)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {showTags && (
            <div>
              <Label>Tags (comma separated)</Label>
              <input
                type="text"
                value={(form.tags || []).join(", ")}
                onChange={(e) =>
                  update({
                    tags: e.target.value
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="wardrobe, bedroom, premium"
                className={inputBase}
              />
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-bordergray bg-bg-soft flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-bordergray bg-white text-[12px] font-semibold text-text-muted hover:text-textcolor"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={rhfHandleSubmit(handleFormSubmit)}
            className="px-4 py-1.5 rounded-lg bg-linear-to-br from-select-blue to-primary text-white text-[12px] font-semibold shadow-md hover:scale-[1.02] transition-all flex items-center gap-1.5"
          >
            <Check size={12} /> {resolvedSubmit}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <LibraryPicker
          excludeId={form.id}
          onClose={() => setPickerOpen(false)}
          onPick={fillFromLibrary}
        />
      )}
    </div>
  );
};

// Number input that hides "0" so users can type without first deleting the
// placeholder. Used in the Dimensions / Area / Qty / Rate row.
const NumField = ({ label, value, onChange, tabular, bold, prefix, placeholder = "0", error }) => {
  const [focused, setFocused] = useState(false);
  const display =
    value === 0 || value === "0" || value === "" || value == null
      ? focused
        ? ""
        : ""
      : value;
  return (
    <div>
      <Label className="mb-1">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle text-[11px]">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={display}
          onFocus={(e) => {
            setFocused(true);
            e.target.select();
          }}
          onBlur={() => setFocused(false)}
          onChange={(e) =>
            onChange(e.target.value === "" ? 0 : Number(e.target.value))
          }
          placeholder={placeholder}
          className={`${inputBase} ${prefix ? "pl-6" : ""} ${tabular ? "tabular-nums text-right" : ""} ${bold ? "font-bold" : ""} ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
    </div>
  );
};

// Read-only number cell for derived values like Area (L × W).
const ReadOnlyField = ({ label, value, unitLabel }) => (
  <div>
    <Label className="mb-1">{label}</Label>
    <div
      className={`${inputBase} bg-bg-soft text-textcolor font-semibold tabular-nums text-right cursor-default select-none flex items-center justify-end gap-1`}
      title={unitLabel ? `${value} ${unitLabel}` : undefined}
    >
      {value > 0
        ? value.toLocaleString("en-IN", { maximumFractionDigits: 2 })
        : <span className="text-text-subtle font-normal">—</span>}
    </div>
  </div>
);

// Picker overlay — pick a saved Item Master entry to clone its fields into
// the editor form. Same component is reused inside ItemFormModal regardless
// of who opens it (Item Master / BOQ editor / etc.).
const LibraryPicker = ({ excludeId, onClose, onPick }) => {
  const [items] = useState(() => listLibrary());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const roomNames = useMemo(
    () => getScheduleConfig().rooms.map((r) => r.name),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((it) => it.id !== excludeId)
      .filter((it) => {
        if (category !== "all" && it.category !== category) return false;
        if (!q) return true;
        return (
          (it.description || "").toLowerCase().includes(q) ||
          (it.hsn || "").toLowerCase().includes(q) ||
          (it.tags || []).some((t) => t.toLowerCase().includes(q))
        );
      });
  }, [items, query, category, excludeId]);

  return (
    <div
      className="fixed inset-0 z-60 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-bordergray flex items-center justify-between bg-linear-to-r from-select-blue/5 to-white">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-lg bg-select-blue/10 text-select-blue flex items-center justify-center">
              <Pipette size={14} />
            </span>
            <div>
              <h3 className="text-[13px] font-bold text-textcolor">
                Pick from Library
              </h3>
              <p className="text-[10.5px] text-text-muted">
                Choose an item to copy its fields into the form
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-text-subtle hover:text-textcolor">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-bordergray space-y-2">
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search description, HSN, tag"
              className="bg-bg-soft border border-transparent rounded-lg pl-7 pr-3 py-1.5 text-[11.5px] placeholder:text-text-subtle focus:outline-none focus:bg-white focus:border-select-blue/30 w-full"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {["all", ...roomNames].map((value) => {
              const isAll = value === "all";
              const count = isAll
                ? items.filter((it) => it.id !== excludeId).length
                : items.filter(
                    (it) => it.id !== excludeId && it.category === value,
                  ).length;
              const cm = roomColor(value);
              const active = category === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCategory(value)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10.5px] font-semibold transition-all border ${
                    active
                      ? isAll
                        ? "bg-active-bg text-select-blue border-select-blue/40"
                        : `${cm.bg} ${cm.text} ${cm.border}`
                      : "bg-transparent text-text-muted hover:bg-bg-soft border-transparent"
                  }`}
                >
                  {isAll ? (
                    <Package size={10} />
                  ) : (
                    <span className={`h-2 w-2 rounded-full ${cm.dot}`} />
                  )}
                  {isAll ? "All" : value}
                  <span className="opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[11.5px] text-text-subtle py-8">
              No items match
            </p>
          ) : (
            filtered.map((it) => {
              const c = roomColor(it.category);
              const unitLabel =
                UNITS.find((u) => u.code === it.unit)?.label || it.unit;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => onPick(it)}
                  className="w-full text-left rounded-lg border border-bordergray bg-white hover:border-select-blue hover:bg-active-bg/30 px-3 py-2 transition-all flex items-center gap-3"
                >
                  <span className={`h-2 w-2 rounded-full shrink-0 ${c.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11.5px] font-semibold text-textcolor truncate">
                      {it.description}
                    </p>
                    <p className="text-[10px] text-text-muted">
                      {unitLabel} · ₹{Number(it.rate || 0).toLocaleString("en-IN")} · GST {it.gstPercent}%
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const Label = ({ children, className = "" }) => (
  <label className={`block text-[10.5px] font-semibold uppercase tracking-wider text-text-muted mb-1.5 ${className}`}>
    {children}
  </label>
);

export default ItemFormModal;
