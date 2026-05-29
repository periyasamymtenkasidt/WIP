import { MdOutlineDashboard, MdOutlineSettings, MdOutlineReceiptLong } from "react-icons/md";
import { HiOutlineUsers } from "react-icons/hi";
import { PiSuitcaseSimpleBold, PiBriefcaseDuotone,PiUsersThreeBold  } from "react-icons/pi";
import { MdOutlineAnalytics } from "react-icons/md";
import { FaRegFileLines, FaRegHandshake } from "react-icons/fa6";
import { TbDeviceDesktopAnalytics } from "react-icons/tb";
import { MdOutlineContactSupport } from "react-icons/md";
import { PiSignOut } from "react-icons/pi";
import { LuLayers } from "react-icons/lu";
import { TableData } from "../data/TableData";


export const Menus = [
    { name: "Dashboard", icon: MdOutlineDashboard, path: "/dashboard" },
    { name: "Leads", icon: HiOutlineUsers, path: "/leads" },
    { name: "Projects", icon: PiBriefcaseDuotone, path: "/projects" },
    {name:"Client", icon:PiUsersThreeBold,path:"/clients"},
    {name:"Deals", icon:FaRegHandshake,path:"/deals"},
    { name: "BOQ", icon: MdOutlineReceiptLong, path: "/boq" },
    {name:"Master",icon:LuLayers,path:"/master"},
    { name: "Accounts", icon: PiSuitcaseSimpleBold, path: "/accounts" },
    { name: "Pipeline", icon:  TbDeviceDesktopAnalytics, path: "/pipeline" },
    { name: "Analytics", icon: MdOutlineAnalytics, path: "/analytics" },
    { name: "Reports", icon: FaRegFileLines, path: "/reports" },
   

];

export const SupportMenu = [
    { name: "Settings", icon: MdOutlineSettings, path: "/settings" },
    { name: "Support", icon: MdOutlineContactSupport, path: "/support" },
    { name: "Sign Out", icon: PiSignOut, path: "/signout" },
];


// Property types — shared between lead capture (dropdown) and conversion (read-only mapping)
const getInitialPropertyTypes = () => {
  try {
    const stored = localStorage.getItem("PROPERTY_TYPES");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return [
    "Luxury Villa",
    "Apartment",
    "Penthouse",
    "Independent House",
    "Duplex",
    "Studio Apartment",
    "Farm House",
    "Beach House",
  ];
};

export const PROPERTY_TYPES = getInitialPropertyTypes();

export const isPropertyTypeInUse = (type) => {
  const normType = type.trim().toLowerCase();

  // 1. Check Leads (localStorage)
  try {
    const rawLeads = localStorage.getItem("newLeadsData");
    if (rawLeads) {
      const leads = JSON.parse(rawLeads);
      for (const lead of leads) {
        if (lead.propertyType) {
          const parts = lead.propertyType.split(",").map(p => p.trim().toLowerCase());
          if (parts.includes(normType)) return true;
        }
        if (!lead.propertyType && lead.location && lead.location.trim().toLowerCase() === normType) {
          return true;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 2. Check Mock Leads (TableData)
  try {
    for (const lead of TableData) {
      if (lead.propertyType) {
        const parts = lead.propertyType.split(",").map(p => p.trim().toLowerCase());
        if (parts.includes(normType)) return true;
      }
      if (!lead.propertyType && lead.location && lead.location.trim().toLowerCase() === normType) {
        return true;
      }
    }
  } catch (e) {
    console.error(e);
  }

  // 3. Check Clients (localStorage)
  try {
    const rawClients = localStorage.getItem("newClientsData");
    if (rawClients) {
      const clients = JSON.parse(rawClients);
      for (const client of clients) {
        if (client.propertyType) {
          const parts = client.propertyType.split(",").map(p => p.trim().toLowerCase());
          if (parts.includes(normType)) return true;
        }
        if (!client.propertyType && client.location && client.location.trim().toLowerCase() === normType) {
          return true;
        }
      }
    }
  } catch (e) {
    console.error(e);
  }

  return false;
};

export const addGlobalPropertyType = (type) => {
  const trimmed = type.trim();
  if (!trimmed) return false;
  const exists = PROPERTY_TYPES.some(t => t.trim().toLowerCase() === trimmed.toLowerCase());
  if (!exists) {
    PROPERTY_TYPES.push(trimmed);
    localStorage.setItem("PROPERTY_TYPES", JSON.stringify(PROPERTY_TYPES));
    window.dispatchEvent(new Event("propertyTypesChanged"));
    return true;
  }
  return false;
};

export const removeGlobalPropertyType = (type) => {
  if (isPropertyTypeInUse(type)) {
    return { success: false, error: "This property type is in use by one or more leads or clients and cannot be deleted." };
  }
  const trimmed = type.trim();
  const index = PROPERTY_TYPES.findIndex(t => t.trim().toLowerCase() === trimmed.toLowerCase());
  if (index > -1) {
    PROPERTY_TYPES.splice(index, 1);
    localStorage.setItem("PROPERTY_TYPES", JSON.stringify(PROPERTY_TYPES));

    // Also clean up from Proposal Master presets
    try {
      const rawMaster = localStorage.getItem("quoteMaster");
      if (rawMaster) {
        const master = JSON.parse(rawMaster);
        let updated = false;
        for (const key of Object.keys(master)) {
          const preset = master[key];
          if (preset && Array.isArray(preset.configurations)) {
            const beforeLen = preset.configurations.length;
            preset.configurations = preset.configurations.filter(
              (c) => c.propertyType.trim().toLowerCase() !== trimmed.toLowerCase()
            );
            if (preset.configurations.length !== beforeLen) {
              updated = true;
            }
          }
        }
        if (updated) {
          localStorage.setItem("quoteMaster", JSON.stringify(master));
        }
      }
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(new Event("propertyTypesChanged"));
    return { success: true };
  }
  return { success: false, error: "Property type not found." };
};


