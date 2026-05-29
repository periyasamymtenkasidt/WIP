// Item Master / Rate Library. A catalog of reusable BOQ line items.
// Stored under `item_library` in localStorage; ships with a curated set
// of common interior fit-out items so the library is useful from day one.

const STORAGE_KEY = "item_library";

const genId = () =>
  `lib_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

// ── Default catalog ────────────────────────────────────────────────────────
// Categories use the same color keys as BOQ sections so insertion preserves
// visual grouping. Rates are mid-market reference figures — firms typically
// fine-tune these per project.
export const DEFAULT_LIBRARY = [
  // Kitchen
  {
    description:
      "Modular kitchen base unit — MR plywood carcass with laminate, soft-close hardware",
    category: "orange",
    hsn: "9403",
    unit: "sqft",
    rate: 1850,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "BWR 19mm Greenply" },
      { name: "Hardware", spec: "Hettich soft-close" },
      { name: "Laminate", spec: "Century 1mm" },
    ],
    tags: ["kitchen", "base", "modular"],
  },
  {
    description: "Modular kitchen wall unit with shutters",
    category: "orange",
    hsn: "9403",
    unit: "sqft",
    rate: 1650,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "BWR 18mm" },
      { name: "Hardware", spec: "Hafele lift-up" },
    ],
    tags: ["kitchen", "wall", "modular"],
  },
  {
    description: "Granite counter top with edge polish",
    category: "orange",
    hsn: "6802",
    unit: "sqft",
    rate: 380,
    gstPercent: 18,
    materials: [{ name: "Granite", spec: "20mm thick, polished edge" }],
    tags: ["kitchen", "counter", "granite"],
  },
  {
    description: "Kitchen tall unit (pantry / tall pull-out)",
    category: "orange",
    hsn: "9403",
    unit: "sqft",
    rate: 2100,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "BWP 19mm" },
      { name: "Hardware", spec: "Hettich tall unit kit" },
    ],
    tags: ["kitchen", "tall", "pantry"],
  },

  // Living / Dining
  {
    description: "Gypsum board false ceiling with cove lighting groove",
    category: "blue",
    hsn: "9405",
    unit: "sqft",
    rate: 95,
    gstPercent: 18,
    materials: [
      { name: "Gypsum", spec: "Saint-Gobain 12mm" },
      { name: "Framework", spec: "GI channel" },
    ],
    tags: ["ceiling", "gypsum", "living"],
  },
  {
    description: "TV unit — floor mounted with storage drawers and back panel",
    category: "blue",
    hsn: "9403",
    unit: "ls",
    rate: 45000,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm" },
      { name: "Laminate", spec: "Greenply 1mm matte" },
    ],
    tags: ["tv unit", "living"],
  },
  {
    description: "Crockery unit with glass shutters and internal lighting",
    category: "blue",
    hsn: "9403",
    unit: "sqft",
    rate: 1400,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm" },
      { name: "Glass", spec: "Saint-Gobain 5mm clear" },
      { name: "Lighting", spec: "LED strip" },
    ],
    tags: ["crockery", "dining"],
  },
  {
    description: "Accent wall paneling — laminate or PVD finish",
    category: "blue",
    hsn: "4412",
    unit: "sqft",
    rate: 480,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 12mm base" },
      { name: "Finish", spec: "Decorative laminate / PVD" },
    ],
    tags: ["accent", "wall", "panel"],
  },
  {
    description: "Cove / profile lighting — LED strip with diffuser",
    category: "blue",
    hsn: "9405",
    unit: "rmt",
    rate: 320,
    gstPercent: 18,
    materials: [{ name: "Lighting", spec: "Philips / Wipro LED strip 24V" }],
    tags: ["lighting", "cove", "led"],
  },

  // Bedroom
  {
    description: "Wardrobe shutter — laminate finish, soft-close hinges",
    category: "purple",
    hsn: "9403",
    unit: "sqft",
    rate: 1250,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm carcass" },
      { name: "Shutter", spec: "MR 18mm with 1mm laminate" },
      { name: "Hardware", spec: "Hettich soft-close hinges" },
    ],
    tags: ["wardrobe", "bedroom"],
  },
  {
    description: "Wardrobe — premium with veneer / membrane finish",
    category: "purple",
    hsn: "9403",
    unit: "sqft",
    rate: 1750,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "BWP 19mm" },
      { name: "Finish", spec: "Natural veneer / PU coat" },
      { name: "Hardware", spec: "Hafele soft-close" },
    ],
    tags: ["wardrobe", "premium", "bedroom"],
  },
  {
    description: "Bed back panel with cushioned upholstery",
    category: "purple",
    hsn: "9403",
    unit: "sqft",
    rate: 650,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm base" },
      { name: "Foam", spec: "32 density PU" },
      { name: "Fabric", spec: "Premium upholstery" },
    ],
    tags: ["bed", "back panel", "bedroom"],
  },
  {
    description: "Built-in study unit with overhead storage",
    category: "purple",
    hsn: "9403",
    unit: "sqft",
    rate: 1100,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm" },
      { name: "Laminate", spec: "Century 1mm" },
    ],
    tags: ["study", "bedroom"],
  },

  // Bathroom
  {
    description: "Bathroom vanity — marine ply with mirror cabinet",
    category: "teal",
    hsn: "9403",
    unit: "ls",
    rate: 18000,
    gstPercent: 18,
    materials: [
      { name: "Vanity", spec: "Marine ply + laminate" },
      { name: "Mirror", spec: "Saint-Gobain 5mm with LED" },
    ],
    tags: ["vanity", "bath"],
  },
  {
    description: "Shower glass partition (8mm toughened)",
    category: "teal",
    hsn: "7610",
    unit: "sqft",
    rate: 580,
    gstPercent: 18,
    materials: [{ name: "Glass", spec: "Saint-Gobain 8mm toughened" }],
    tags: ["shower", "partition", "bath"],
  },

  // Foyer / Passage
  {
    description: "Shoe rack with bench top",
    category: "amber",
    hsn: "9403",
    unit: "sqft",
    rate: 950,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm" },
      { name: "Laminate", spec: "1mm matte" },
    ],
    tags: ["shoe rack", "foyer"],
  },
  {
    description: "Foyer console table with mirror",
    category: "amber",
    hsn: "9403",
    unit: "ls",
    rate: 22000,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "MR 18mm" },
      { name: "Mirror", spec: "Saint-Gobain antique 6mm" },
    ],
    tags: ["console", "foyer"],
  },

  // Office / Study
  {
    description: "Built-in desk with cable management",
    category: "indigo",
    hsn: "9403",
    unit: "sqft",
    rate: 1200,
    gstPercent: 18,
    materials: [
      { name: "Plywood", spec: "BWR 18mm" },
      { name: "Laminate", spec: "Century 1mm" },
    ],
    tags: ["desk", "office"],
  },
  {
    description: "Bookshelf — open + closed compartments",
    category: "indigo",
    hsn: "9403",
    unit: "sqft",
    rate: 1050,
    gstPercent: 18,
    materials: [{ name: "Plywood", spec: "MR 18mm with laminate" }],
    tags: ["bookshelf", "office"],
  },

  // Utility / Services
  {
    description: "Storage cabinet — utility area",
    category: "slate",
    hsn: "9403",
    unit: "sqft",
    rate: 850,
    gstPercent: 18,
    materials: [{ name: "Plywood", spec: "BWR 18mm" }],
    tags: ["storage", "utility"],
  },

  // General services
  {
    description: "Site supervision & project management",
    category: "gray",
    hsn: "9954",
    unit: "ls",
    rate: 50000,
    gstPercent: 18,
    materials: [],
    tags: ["service", "pm"],
  },
  {
    description: "Material transportation & site delivery",
    category: "gray",
    hsn: "9954",
    unit: "ls",
    rate: 15000,
    gstPercent: 18,
    materials: [],
    tags: ["service", "logistics"],
  },
  {
    description: "Design & 3D visualization services",
    category: "gray",
    hsn: "9983",
    unit: "ls",
    rate: 35000,
    gstPercent: 18,
    materials: [],
    tags: ["service", "design"],
  },
].map((it) => ({
  ...it,
  id: genId(),
  usage: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}));

// ── Category migration ─────────────────────────────────────────────────────
// `category` used to be a colour key; it's now a room/category NAME (from
// Master → Schedule). Map the old colour keys to room names on read so saved
// libraries self-heal. Names that are already room names pass through.
const LEGACY_CATEGORY_MAP = {
  orange: "Kitchen",
  blue: "Living Room",
  purple: "Master Bedroom",
  teal: "Bathrooms",
  amber: "Foyer",
  indigo: "Study",
  slate: "Utility",
  gray: "",
};

const normalizeCategory = (cat) =>
  cat in LEGACY_CATEGORY_MAP ? LEGACY_CATEGORY_MAP[cat] : cat || "";

const normalizeItem = (it) => ({
  ...it,
  category: normalizeCategory(it.category),
});

// ── Read / Write ──────────────────────────────────────────────────────────
export const listLibrary = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(normalizeItem);
    }
  } catch {
    // fall through
  }
  // First read — seed defaults so the library isn't empty.
  const seeded = DEFAULT_LIBRARY.map(normalizeItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
};

export const saveLibrary = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

export const addLibraryItem = (item) => {
  const items = listLibrary();
  const next = {
    ...item,
    id: item.id || genId(),
    usage: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [next, ...items];
  saveLibrary(updated);
  return next;
};

export const updateLibraryItem = (id, changes) => {
  const items = listLibrary();
  const updated = items.map((it) =>
    it.id === id
      ? { ...it, ...changes, updatedAt: new Date().toISOString() }
      : it,
  );
  saveLibrary(updated);
};

export const deleteLibraryItem = (id) => {
  const items = listLibrary().filter((it) => it.id !== id);
  saveLibrary(items);
};

export const incrementUsage = (id) => {
  const items = listLibrary();
  const updated = items.map((it) =>
    it.id === id ? { ...it, usage: (it.usage || 0) + 1 } : it,
  );
  saveLibrary(updated);
};

export const resetLibrary = () => {
  localStorage.removeItem(STORAGE_KEY);
  return listLibrary();
};

// Convert a library record into a BOQ line-item shape so the editor can
// drop it straight into a section without rewiring fields. The `masterId`
// keeps a back-reference to the catalog item so the BOQ row can show a
// "Linked to Library" badge and offer compact rendering. Template
// dimensions (L/W/H/qty) flow through so the BOQ row starts pre-filled.
export const libraryToItem = (lib) => {
  const L = Number(lib.length) || 0;
  const B = Number(lib.breadth) || 0;
  const H = Number(lib.height) || 0;
  return {
    masterId: lib.id,
    description: lib.description || "",
    spec: lib.spec || "",
    hsn: lib.hsn || "",
    qty: Number(lib.qty) || 1,
    unit: lib.unit || "nos",
    rate: Number(lib.rate) || 0,
    gstPercent: Number(lib.gstPercent) || 18,
    discount: { type: "percent", value: 0 },
    dimensions: {
      enabled: L > 0 || B > 0 || H > 0,
      length: L,
      breadth: B,
      height: H,
      nos: 1,
    },
    materials: lib.materials ? JSON.parse(JSON.stringify(lib.materials)) : [],
  };
};

export const blankLibraryItem = () => ({
  description: "",
  spec: "",
  category: "",
  hsn: "",
  unit: "sqft",
  length: 0,
  breadth: 0,
  height: 0,
  qty: 0,
  rate: 0,
  gstPercent: 18,
  materials: [],
  tags: [],
});

// Area = L × W for area units, just L for length units. Used as a display
// helper in the form (read-only) and as a fallback when the user hasn't
// entered a separate Qty.
const AREA_UNITS = new Set(["sqft", "sqm"]);
const LENGTH_UNITS = new Set(["rmt", "mm"]);

export const computeLibraryItemArea = (item) => {
  const L = Number(item.length) || 0;
  const B = Number(item.breadth) || 0;
  if (AREA_UNITS.has(item.unit) && L > 0 && B > 0) return L * B;
  if (LENGTH_UNITS.has(item.unit) && L > 0) return L;
  return 0;
};

// Effective qty for amount calculation. User-entered qty takes priority so
// it can capture wastage / counts that differ from the raw L×W area
// (e.g. 224 sqft area but 246.4 sqft ordered with 10% wastage). Falls back
// to area when qty isn't entered.
export const computeLibraryItemQty = (item) => {
  const userQty = Number(item.qty) || 0;
  if (userQty > 0) return userQty;
  return computeLibraryItemArea(item);
};

export const computeLibraryItemAmount = (item) =>
  computeLibraryItemQty(item) * (Number(item.rate) || 0);
