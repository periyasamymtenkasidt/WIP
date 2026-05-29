import React, { useState, useEffect } from "react";
import { Plus, Trash2, Check, X, CheckCircle2, XCircle, Save, FileCheck, Star } from "lucide-react";
import { getGlobalTerms, saveGlobalTerms } from "../../../data/termsStorage";

const ListEditor = ({
  title,
  icon,
  initialItems,
  onSave,
  placeholder,
  accent,
}) => {
  // items: Array<{ text: string, isDefault: boolean }>
  const [items, setItems] = useState(initialItems || []);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setItems(initialItems || []);
    setIsDirty(false);
  }, [initialItems]);

  const bullet =
    accent === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : "bg-red-100 text-red-600";
  const headerTint =
    accent === "emerald"
      ? "from-emerald-50/60 to-white"
      : "from-red-50/60 to-white";

  const validItems = items.filter((i) => i.text.trim() !== "");
  const initialValidItems = (initialItems || []).filter(
    (i) => i.text.trim() !== ""
  );
  const showSave =
    isDirty &&
    JSON.stringify(validItems) !== JSON.stringify(initialValidItems);

  const handleUpdate = (idx, value) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], text: value };
    setItems(newItems);
    setIsDirty(true);
  };

  const handleToggleDefault = (idx) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], isDefault: !newItems[idx].isDefault };
    setItems(newItems);
    setIsDirty(true);
  };



  const handleAdd = () => {
    if (items.some((item) => item.text.trim() === "")) return;
    setItems([{ text: "", isDefault: false }, ...items]);
  };

  const handleRemove = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    setIsDirty(true);
  };

  const handleToggleAllDefault = () => {
    // If all valid items are already default, clear all defaults;
    // otherwise mark every item as default.
    const valid = items.filter((i) => i.text.trim() !== "");
    const allDefault = valid.length > 0 && valid.every((i) => i.isDefault);
    setItems(items.map((i) => ({ ...i, isDefault: !allDefault })));
    setIsDirty(true);
  };

  const handleSaveClick = () => {
    setItems(validItems);
    onSave(validItems);
    setIsDirty(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-bordergray shadow-[0_1px_3px_rgba(15,23,42,0.04)] overflow-hidden">
      <div
        className={`px-4 py-3 border-b border-bordergray bg-linear-to-r ${headerTint} flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-[12px] font-bold text-textcolor">{title}</h3>
          <span className="text-[10px] font-semibold text-text-muted bg-white/70 px-1.5 py-0.5 rounded-md border border-bordergray">
            {validItems.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {showSave && (
            <button
              type="button"
              onClick={handleSaveClick}
              className="flex items-center gap-1 text-[11px] font-semibold bg-linear-to-br from-select-blue to-primary text-white bg-emerald-50 px-2 py-1 rounded-md transition-colors"
            >
              <Save size={12} /> Save
            </button>
          )}
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 text-[11px] font-semibold text-select-blue hover:text-primary"
          >
            <Plus size={12} /> Add
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto overscroll-contain scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Select All + Add to Default row */}
        {items.length > 0 && (
          <div className="sticky -top-3 bg-white z-10 flex items-center justify-end pb-2 mb-1 border-b border-bordergray/50 -mx-3 px-3 -mt-3">
            <button
              type="button"
              onClick={handleToggleAllDefault}
              className={`flex items-center gap-1 text-[10px] font-semibold transition-colors ${
                items.filter((i) => i.text.trim() !== "").length > 0 &&
                items.filter((i) => i.text.trim() !== "").every((i) => i.isDefault)
                  ? "text-amber-500 hover:text-amber-600"
                  : "text-amber-600 hover:text-amber-700"
              }`}
            >
              <Star
                size={11}
                fill={
                  items.filter((i) => i.text.trim() !== "").length > 0 &&
                  items.filter((i) => i.text.trim() !== "").every((i) => i.isDefault)
                    ? "currentColor"
                    : "none"
                }
              />{" "}
              Select All as Default
            </button>
          </div>
        )}
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-2 group">
            <span
              className={`mt-2 h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${bullet}`}
            >
              {accent === "emerald" ? (
                <Check size={9} strokeWidth={3} />
              ) : (
                <X size={9} strokeWidth={3} />
              )}
            </span>
            <input
              type="text"
              value={item.text}
              onChange={(e) => handleUpdate(idx, e.target.value)}
              placeholder={placeholder}
              className="bg-bg-soft border border-transparent text-[11.5px] text-textcolor rounded-lg px-2.5 py-1.5 w-full focus:outline-none focus:bg-white focus:border-select-blue/40 placeholder:text-text-subtle"
            />
            {/* Default toggle */}
            <button
              type="button"
              onClick={() => handleToggleDefault(idx)}
              className={`h-7 w-7 flex items-center justify-center rounded-md shrink-0 transition-colors ${
                item.isDefault
                  ? "text-amber-500 bg-amber-50"
                  : "text-text-subtle hover:text-amber-500 hover:bg-amber-50 opacity-0 group-hover:opacity-100"
              }`}
              title={item.isDefault ? "Remove from default" : "Set as default"}
            >
              <Star size={12} fill={item.isDefault ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              onClick={() => handleRemove(idx)}
              className="h-7 w-6 flex items-center justify-center rounded-md text-text-subtle hover:text-red-500 hover:bg-red-50 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
              title="Remove item"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <button
            type="button"
            onClick={handleAdd}
            className="w-full text-[11px] text-text-subtle border border-dashed border-bordergray rounded-lg py-3 hover:border-select-blue hover:text-select-blue transition-colors"
          >
            + Add your first entry
          </button>
        )}
      </div>
    </div>
  );
};

const TermsAndConditions = () => {
  const [savedData, setSavedData] = useState(() => getGlobalTerms());
  const [localData, setLocalData] = useState(savedData);

  const handleListSave = (key, newItems) => {
    const newData = { ...savedData, [key]: newItems };
    setSavedData(newData);
    setLocalData(newData);
    saveGlobalTerms(newData);
  };

  return (
    <div className="bg-overallbg font-sans h-full overflow-y-auto pb-28">
      <div className="sticky top-0 z-30 bg-overallbg/80 backdrop-blur-xl border-b border-bordergray/70">
        <div className="px-6 py-4 flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
             <div className="relative h-11 w-11 rounded-xl bg-linear-to-br from-select-blue to-primary text-white flex items-center justify-center shadow-lg shadow-select-blue/20">
              <FileCheck size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold text-textcolor leading-tight">
                  Terms & Conditions
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Global
                </span>
              </div>
              <p className="text-[12px] text-text-muted mt-0.5">
                Manage global inclusions and exclusions for all quotes
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          <ListEditor
            title="Included"
            icon={<CheckCircle2 size={13} className="text-emerald-600" />}
            accent="emerald"
            initialItems={localData.inclusions || []}
            onSave={(newItems) => handleListSave("inclusions", newItems)}
            placeholder="e.g. 3D visualizations of all rooms"
          />
          <ListEditor
            title="Not Included"
            icon={<XCircle size={13} className="text-red-500" />}
            accent="red"
            initialItems={localData.exclusions || []}
            onSave={(newItems) => handleListSave("exclusions", newItems)}
            placeholder="e.g. Civil work — demolition, plumbing"
          />
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
