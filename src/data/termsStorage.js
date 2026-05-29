// Centralised read/write for the global Terms & Conditions data.
//
// Storage shape (v2):
//   { inclusions: [ { text: string, isDefault: boolean }, … ],
//     exclusions: [ { text: string, isDefault: boolean }, … ] }
//
// Legacy shape (v1 — plain string arrays) is auto-migrated on first read.

const STORAGE_KEY = "globalTerms";

/** Migrate a legacy string[] to the new { text, isDefault }[] format. */
const migrateList = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr.map((entry) => {
    if (typeof entry === "string") {
      return { text: entry, isDefault: true };
    }
    // Already an object — normalise fields
    return {
      text: entry.text || "",
      isDefault: typeof entry.isDefault === "boolean" ? entry.isDefault : true,
    };
  });
};

/** Read the global terms from localStorage. Auto-migrates v1 → v2. */
export const getGlobalTerms = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          inclusions: migrateList(parsed.inclusions),
          exclusions: migrateList(parsed.exclusions),
        };
      }
    }
  } catch {
    // fall through
  }
  return { inclusions: [], exclusions: [] };
};

/** Persist global terms. */
export const saveGlobalTerms = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

/** Convenience: return only items where isDefault === true, as plain strings. */
export const getDefaultTermStrings = () => {
  const terms = getGlobalTerms();
  return {
    inclusions: terms.inclusions
      .filter((t) => t.isDefault)
      .map((t) => t.text),
    exclusions: terms.exclusions
      .filter((t) => t.isDefault)
      .map((t) => t.text),
  };
};

/** Convenience: return only non-default items, as plain strings. */
export const getNonDefaultTermStrings = () => {
  const terms = getGlobalTerms();
  return {
    inclusions: terms.inclusions
      .filter((t) => !t.isDefault)
      .map((t) => t.text),
    exclusions: terms.exclusions
      .filter((t) => !t.isDefault)
      .map((t) => t.text),
  };
};
