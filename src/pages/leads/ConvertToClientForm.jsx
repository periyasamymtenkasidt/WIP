import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Modal from "../../components/Modal";
import InputField from "../../components/InputField";
import {
  getPresetKeys,
  getPreset,
  getConfigForType,
  getMultiplierFor,
  getPropertyTypesForPreset,
  computeTotals,
} from "../../data/QuotePresets";

const convertToClientSchema = yup.object().shape({
  clientName: yup.string().required("Client Name is required"),
  clientPhone: yup
    .string()
    .required("Phone Number is required")
    .transform((v) => v?.replace(/\s/g, ""))
    .matches(/^\d{10}$/, "Must be a 10-digit number"),
  clientEmail: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  addressLine1: yup.string().required("Door no, building & street is required"),
  city: yup.string().required("City is required"),
  state: yup.string().required("State is required"),
  pincode: yup
    .string()
    .required("PIN Code is required")
    .matches(/^\d{6}$/, "Must be a 6-digit PIN code"),
  quotePreset: yup.string().required("Property Preset is required"),
  propertyType: yup.string().required("Property Type is required"),
  projectValue: yup
    .string()
    .required("Project value is required")
    .test(
      "positive",
      "Enter a valid project value (numbers only, e.g. 7500000)",
      (val) => {
        const num = parseFloat((val || "").replace(/[^\d.]/g, ""));
        return !isNaN(num) && num > 0;
      },
    ),
});
import { PAYMENT_MILESTONES } from "../../data/MilestoneConfig";
import { formatAmount } from "../../utils/formatAmount";

// Parse a lead's investment range (e.g. "₹60L-70L", "₹50L – ₹1Cr", "₹1-1.2Cr")
// and return the midpoint as a number, used to auto-suggest the confirmed
// project value at conversion time.
const parseInvestmentMidpoint = (str) => {
  if (!str) return 0;
  const clean = str.replace(/[₹\s]/g, "");
  const parts = clean.split(/[-–]/);
  const parseOne = (s) => {
    const num = parseFloat(s.replace(/[^\d.]/g, ""));
    if (isNaN(num)) return 0;
    if (/cr/i.test(s)) return num * 10000000;
    if (/l/i.test(s)) return num * 100000;
    return num;
  };
  // If only the trailing part has a unit ("60-70L"), apply it to both
  if (parts.length === 2) {
    const tailUnit = /cr/i.test(parts[1]) ? 1e7 : /l/i.test(parts[1]) ? 1e5 : 1;
    const headHasUnit = /cr|l/i.test(parts[0]);
    const a = headHasUnit ? parseOne(parts[0]) : parseOne(parts[0]) * tailUnit;
    const b = parseOne(parts[1]);
    return Math.round((a + b) / 2);
  }
  return Math.round(parseOne(parts[0]));
};

// Resolve property type + city across two lead shapes:
//  - static TableData: { location: "Luxury Villa", locationSecondary: "Beverly Hills, CA" }
//  - new lead form:    { propertyType: "Penthouse", location: "Chennai" }
const resolveLeadAddress = (lead) => {
  const parts = lead.location?.includes(",")
    ? lead.location.split(",")
    : [lead.location || "", lead.locationSecondary || ""];
  const primary = parts[0]?.trim() || "";
  const secondary = parts.slice(1).join(",").trim() || "";

  if (lead.propertyType) {
    return {
      propertyType: lead.propertyType,
      city: primary || "",
    };
  }
  return {
    propertyType: primary || "",
    city: secondary || "",
  };
};

const findPresetForPropertyType = (propType) => {
  if (!propType) return "2BHK";
  const keys = getPresetKeys();
  for (const key of keys) {
    const preset = getPreset(key);
    if (preset?.propertyTypes?.includes(propType)) {
      return key;
    }
  }
  return "2BHK";
};

const SectionHeader = ({ children }) => (
  <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue mb-4">
    <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
    {children}
  </h2>
);

function ConvertToClientForm({ lead, onClose, onConvert }) {
  const navigate = useNavigate();
  const presetKeys = getPresetKeys();
  const { propertyType: resolvedPropertyType, city } = resolveLeadAddress(lead);
  const suggestedValue = parseInvestmentMidpoint(lead.investment);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(convertToClientSchema),
    defaultValues: {
      clientName: lead.clientName || "",
      clientPhone: lead.phone || "",
      clientEmail: lead.email || "",
      quotePreset: lead.quotePreset || findPresetForPropertyType(lead.propertyType || resolvedPropertyType) || "2BHK",
      propertyType: lead.propertyType || resolvedPropertyType || "Apartment",
      location: resolvedPropertyType,
      locationSecondary: city,
      addressLine1: "",
      addressLine2: "",
      city: city,
      state: "",
      pincode: "",
      landmark: "",
      projectValue: "",
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quotePreset = watch("quotePreset");
  const propertyType = watch("propertyType");
  const projectValueStr = watch("projectValue");
  const numericValue =
    parseFloat((projectValueStr || "").replace(/[^\d.]/g, "")) || 0;

  const getPresetSubTotalAndGrandTotal = (presetKey, propType) => {
    if (!presetKey || !propType) return { subtotal: 0, grandTotal: 0 };
    const activePreset = getPreset(presetKey);
    const cfg = getConfigForType(presetKey, propType);
    if (!cfg) return { subtotal: 0, grandTotal: 0 };
    const totals = computeTotals(cfg.scopeItems || []);
    const multiplier = getMultiplierFor(activePreset, propType);
    return {
      subtotal: Math.round((totals?.subtotal || 0) * multiplier),
      grandTotal: Math.round((totals?.grandTotal || 0) * multiplier),
    };
  };

  const activePresetTotals = useMemo(() => {
    return getPresetSubTotalAndGrandTotal(quotePreset, propertyType);
  }, [quotePreset, propertyType]);

  useEffect(() => {
    const val = activePresetTotals.subtotal;
    setValue("projectValue", val > 0 ? String(val) : "", { shouldValidate: true });
  }, [activePresetTotals, setValue]);

  const isDefaultVal = numericValue === activePresetTotals.subtotal;
  const totalDue = isDefaultVal
    ? activePresetTotals.grandTotal
    : numericValue + Math.round((numericValue * 18) / 100);

  const onSubmit = async (data) => {
    const parsedNumericValue =
      parseFloat((data.projectValue || "").replace(/[^\d.]/g, "")) || 0;
    setIsSubmitting(true);
    try {
      await onConvert?.({
        ...data,
        location: data.propertyType,
      }, parsedNumericValue);
      onClose?.();
      navigate("/clients");
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end items-center gap-4">
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="convert-client-form"
        disabled={isSubmitting}
        className="min-w-[160px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Converting…
          </>
        ) : (
          "Convert to Client"
        )}
      </button>
    </div>
  );

  return (
    <Modal
      title="Convert to Client"
      subtitle="Auto-filled from the qualified lead — review and confirm the project value"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form
        id="convert-client-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="clientName"
              label="Client Name"
              type="text"
              register={register("clientName")}
              error={errors.clientName?.message}
              placeholder="Full name"
            />
            <InputField
              name="clientPhone"
              label="Phone Number"
              type="tel"
              register={register("clientPhone")}
              error={errors.clientPhone?.message}
              placeholder="10-digit number"
            />
          </div>
          <div className="mt-4">
            <InputField
              name="clientEmail"
              label="Email Address"
              type="email"
              register={register("clientEmail")}
              error={errors.clientEmail?.message}
              placeholder="example@domain.com"
            />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Property Type</SectionHeader>
          <div className="rounded-xl border border-border bg-bg-soft px-4 py-3 flex items-center justify-between">
            <p className="text-[14px] font-semibold text-text">
              {quotePreset && propertyType ? `${quotePreset} / ${propertyType}` : (quotePreset || propertyType || "—")}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">
              Selected Property Type
            </span>
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div className="mb-6">
          <SectionHeader>Site Address</SectionHeader>
          <p className="text-[11px] text-text-muted mb-3 -mt-2">
            Full address is required for site visits, 3D drawings, and material
            delivery.
          </p>
          <div className="grid grid-cols-1 gap-4">
            <InputField
              name="addressLine1"
              label="Address Line 1 (Door no, Building, Street)"
              type="text"
              register={register("addressLine1")}
              error={errors.addressLine1?.message}
              placeholder="e.g. Flat 3B, Marina Heights, 14th Cross Road"
            />
            <InputField
              name="addressLine2"
              label="Address Line 2 (Area, Landmark) — optional"
              type="text"
              register={register("addressLine2")}
              placeholder="e.g. Indiranagar, near Metro Station"
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <InputField
              name="city"
              label="City"
              type="text"
              register={register("city")}
              error={errors.city?.message}
              placeholder="e.g. Chennai"
            />
            <InputField
              name="state"
              label="State"
              type="text"
              register={register("state")}
              error={errors.state?.message}
              placeholder="e.g. Tamil Nadu"
            />
            <InputField
              name="pincode"
              label="PIN Code"
              type="text"
              register={register("pincode")}
              error={errors.pincode?.message}
              placeholder="6-digit PIN"
            />
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        <div>
          <SectionHeader>Project Value &amp; Payment Milestones</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              name="projectValue"
              label="Confirmed Project Value (₹ in numbers)"
              type="text"
              register={register("projectValue")}
              error={errors.projectValue?.message}
              placeholder="e.g. 7500000"
            />
            <div className="flex flex-col">
              <label className="text-[10px] font-bold uppercase tracking-widest text-text-subtle mb-1 block">
                Total Due (₹, including GST)
              </label>
              <input
                type="text"
                value={formatAmount(totalDue)}
                readOnly
                disabled
                className="bg-bg-soft border border-border text-[12px] text-text-muted rounded-lg px-3 py-2 w-full cursor-not-allowed h-[38px] font-semibold"
              />
            </div>
          </div>
          {lead.investment && (
            <p className="mt-2 text-[11px] text-text-muted">
              Lead budget range:&nbsp;
              <span className="font-semibold text-text">{lead.investment}</span>
              {suggestedValue > 0 && (
                <>
                  &nbsp;· Suggested midpoint:&nbsp;
                  <span className="font-semibold text-select-blue">
                    {formatAmount(suggestedValue)}
                  </span>
                </>
              )}
            </p>
          )}

          {numericValue > 0 && (
            <div className="mt-5 rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_48px_110px_80px_110px] bg-bg-soft px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-text-muted">
                <span>Milestone</span>
                <span className="text-center">%</span>
                <span className="text-right">Base</span>
                <span className="text-right">GST 18%</span>
                <span className="text-right">Total Due</span>
              </div>

              {PAYMENT_MILESTONES.map((m, idx) => {
                const base = Math.round((numericValue * m.pct) / 100);
                const gstAmt = Math.round((base * m.gst) / 100);
                const total = base + gstAmt;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-[1fr_48px_110px_80px_110px] px-4 py-3 items-center text-[13px] ${idx < PAYMENT_MILESTONES.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-active-bg text-select-blue text-[10px] font-bold flex items-center justify-center shrink-0">
                        {m.id}
                      </span>
                      <span className="font-medium text-text">{m.name}</span>
                    </div>
                    <span className="text-center font-bold text-select-blue">
                      {m.pct}%
                    </span>
                    <span className="text-right text-text-muted">
                      {formatAmount(base)}
                    </span>
                    <span className="text-right text-orange-500 font-medium">
                      +{formatAmount(gstAmt)}
                    </span>
                    <span className="text-right font-bold text-text">
                      {formatAmount(total)}
                    </span>
                  </div>
                );
              })}

              {/* Totals row */}
              {(() => {
                const totalBase = PAYMENT_MILESTONES.reduce(
                  (s, m) => s + Math.round((numericValue * m.pct) / 100),
                  0,
                );
                const totalGst = totalDue - totalBase;
                return (
                  <div className="grid grid-cols-[1fr_48px_110px_80px_110px] px-4 py-3 bg-bg-soft border-t border-border text-[13px] font-bold">
                    <span className="text-text">Total</span>
                    <span className="text-center text-select-blue">100%</span>
                    <span className="text-right text-text-muted">
                      {formatAmount(totalBase)}
                    </span>
                    <span className="text-right text-orange-500">
                      +{formatAmount(totalGst)}
                    </span>
                    <span className="text-right text-text">
                      {formatAmount(totalDue)}
                    </span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}

export default ConvertToClientForm;
