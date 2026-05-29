import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { addGlobalPropertyType } from "../helperConfigData/helperData";

const PropertyTypeDropdown = ({
  label,
  value, // comma-separated string
  onChange, // callback when selected items change
  options = [], // base options (e.g., getPropertyTypesForPreset(quotePreset))
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [newType, setNewType] = useState("");
  const [localOptions, setLocalOptions] = useState([]);

  const ref = useRef(null);
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  // Sync with options prop
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  // Parse current selected list from value prop
  const selectedList = useMemo(() => {
    if (!value) return [];
    return value.split(",").map((s) => s.trim()).filter(Boolean);
  }, [value]);

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
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Update position coordinates on scroll/resize
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

  const handleToggle = (item) => {
    let nextList;
    if (selectedList.includes(item)) {
      nextList = selectedList.filter((t) => t !== item);
    } else {
      nextList = [...selectedList, item];
    }
    onChange(nextList.join(", "));
  };

  const handleAddNewType = () => {
    const trimmed = newType.trim();
    if (!trimmed) return;

    // Case-insensitive check in localOptions
    const isDuplicate = localOptions.some(
      (t) => t.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      alert("Property type already exists!");
      return;
    }

    // Add globally (saves to localStorage, etc.)
    addGlobalPropertyType(trimmed);

    // Update local options so it displays in list
    setLocalOptions((prev) => [...prev, trimmed]);

    // Automatically check it
    const nextList = [...selectedList, trimmed];
    onChange(nextList.join(", "));

    setNewType("");
  };

  const placeholder = selectedList.length > 0
    ? selectedList.join(", ")
    : "Select Property Types...";

  return (
    <div ref={ref} className="relative flex flex-col w-full">
      {label && <label className="mb-1 text-[11px] font-semibold text-darkgray">{label}</label>}

      <div
        ref={triggerRef}
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-light-gray border ${
          open ? "border-gray-300 ring-1 ring-gray-300" : "border-bordergray"
        } ${error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""} rounded-md px-3 py-2 transition-all hover:border-gray-300 cursor-pointer min-h-[38px]`}
      >
        <span className={`text-[11px] ${selectedList.length > 0 ? "text-darkgray" : "text-gray-400"} truncate pr-4`}>
          {placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </div>

      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}

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
            className="bg-white border border-bordergray rounded-md shadow-lg max-h-[220px] flex flex-col animate-[fadeIn_0.15s_ease-out]"
          >
            {/* Inline Textbox */}
            <div className="p-2 border-b border-bordergray flex gap-1.5 shrink-0 bg-bg-soft">
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Add custom type..."
                className="flex-1 bg-white border border-bordergray rounded-md px-2 py-1 text-[11px] text-textcolor focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNewType();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNewType}
                className="px-2.5 py-1 rounded bg-select-blue text-white text-[11px] font-semibold hover:bg-primary transition-all shrink-0"
              >
                Add
              </button>
            </div>

            {/* Scrollable list */}
            <div className="overflow-y-auto flex-1 p-2 space-y-1 scroll-hidden-bar">
              {localOptions.length === 0 ? (
                <p className="text-[11px] text-text-subtle italic text-center py-3">
                  No property types available.
                </p>
              ) : (
                localOptions.map((item, idx) => {
                  const isChecked = selectedList.includes(item);
                  return (
                    <label
                      key={idx}
                      className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded hover:bg-bg-soft group transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => handleToggle(item)}
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-all ${
                          isChecked ? "bg-select-blue border-select-blue text-white" : "border-bordergray bg-white"
                        }`}
                      >
                        {isChecked && <Check size={10} strokeWidth={4} />}
                      </button>
                      <span className="text-[11px] text-text-muted group-hover:text-textcolor transition-colors leading-tight pt-0.5 select-none">
                        {item}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default PropertyTypeDropdown;
