import { useState } from "react";
import { getScheduleConfig } from "../data/scheduleConfig";

// Strict room/category picker backed by the canonical Master → Schedule list.
// Categories are managed only in Master → Schedule — this is read-only here.
// Any current off-list value is preserved as an option so existing data isn't lost.
const CategorySelect = ({ value, onChange, className, placeholder = "Select room…" }) => {
  const [names] = useState(() => getScheduleConfig().rooms.map((r) => r.name));

  // Keep the current value selectable even if it's not in the master list.
  const options = value && !names.includes(value) ? [value, ...names] : names;

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      {!value && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
};

export default CategorySelect;
