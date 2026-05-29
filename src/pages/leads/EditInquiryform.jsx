import { useEffect, useMemo, useState } from "react";
import { GrLocation } from "react-icons/gr";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import InputField from "../../components/InputField";
import Modal from "../../components/Modal";

const editInquirySchema = yup.object().shape({
  fullName: yup.string().required("Full Name is required"),
  phoneNumber: yup
    .string()
    .required("Phone Number is required")
    .transform((v) => v?.replace(/\s/g, ""))
    .matches(/^\d{10}$/, "Must be a 10-digit number"),
  email: yup
    .string()
    .required("Email Address is required")
    .trim()
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
  referralPersonName: yup.string().when("inquirySource", {
    is: "Referral",
    then: (s) => s.required("Referral Person Name is required"),
    otherwise: (s) => s.notRequired(),
  }),
  referralPersonEmail: yup.string().when("inquirySource", {
    is: "Referral",
    then: (s) =>
      s
        .required("Referral Person Email is required")
        .trim()
        .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address"),
    otherwise: (s) => s.notRequired(),
  }),
  quotePreset: yup.string().required("Property Preset is required"),
  propertyType: yup.string().required("Property Type is required"),
  location: yup.string().required("Location is required"),
});
import {
  getPreset,
  getPresetKeys,
  computeTotals,
  generateInvestmentBands,
  getMultiplierFor,
  getPropertyTypesForPreset,
  getConfigForType,
} from "../../data/QuotePresets";

const DEFAULT_PRESET = "2BHK";

// Pull preset-defined defaults so a single dropdown change drives
// propertyType + sizeRange — these mirror the fields managed in
// Settings → Proposal Master.
const buildPresetState = (key) => {
  const cfg = getConfigForType(key);
  return {
    quotePreset: key,
    quoteSizeRange: cfg?.sizeRange || "",
    propertyType: cfg?.propertyType || "",
  };
};

const INITIAL_FORM_STATE = {
  fullName: "",
  phoneNumber: "",
  email: "",
  inquirySource: "",
  referralPersonName: "",
  referralPersonEmail: "",
  investmentRange: "",
  processionDate: "",
  location: "",
  inquiryStatus: "",
  architecturalNotes: "",
  quotePreset: "",
  quoteSizeRange: "",
  propertyType: "",
};

const inquirySources = [
  "Referral",
  "Walk-in",
  "Social Media",
  "Website",
  "Cold Call",
  "Other",
];

const CLIENT_INFO_FIELDS = [
  {
    name: "fullName",
    label: "Full Name",
    type: "text",
    placeholder: "Enter full name",
  },
  {
    name: "phoneNumber",
    label: "Phone Number",
    type: "tel",
    placeholder: "10-digit number",
  },
  {
    name: "email",
    label: "Email Address",
    type: "email",
    placeholder: "example@domain.com",
  },
  {
    name: "inquirySource",
    label: "Inquiry Source",
    type: "select",
    options: inquirySources,
  },
];

const PROJECT_DETAIL_FIELDS = [
  { name: "processionDate", label: "Possession Date", type: "date" },
  {
    name: "location",
    label: "City / Location",
    type: "text",
    placeholder: "e.g. Chennai, Tamil Nadu",
    icon: GrLocation,
  },
];

const SectionHeader = ({ children, hint }) => (
  <div className="mb-4">
    <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-select-blue">
      <span className="w-0.5 h-3.5 bg-select-blue rounded-full shrink-0" />
      {children}
    </h2>
    {hint && <p className="text-[11px] text-text-subtle mt-1 ml-3.5">{hint}</p>}
  </div>
);

const formatLakhs = (rupees) => `₹${(rupees / 100000).toFixed(1)}L`;

function EditInquiryform({ initialData, onClose, onAddLead }) {
  const presetKeys = useMemo(() => getPresetKeys(), []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editInquirySchema),
    defaultValues: INITIAL_FORM_STATE,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quotePreset = watch("quotePreset");
  const propertyType = watch("propertyType");
  const investmentRange = watch("investmentRange");
  const inquirySource = watch("inquirySource");

  useEffect(() => {
    if (!initialData) return;

    // Stored format is "DD.MM.YYYY"; the date input wants "YYYY-MM-DD".
    let processionDate = "";
    if (initialData.possessionDate) {
      const parts = initialData.possessionDate.split(".");
      processionDate =
        parts.length === 3
          ? `${parts[2]}-${parts[1]}-${parts[0]}`
          : initialData.possessionDate;
    }

    const presetKey = presetKeys.includes(initialData.quotePreset)
      ? initialData.quotePreset
      : presetKeys.includes(DEFAULT_PRESET)
        ? DEFAULT_PRESET
        : presetKeys[0];
    const presetDefaults = buildPresetState(presetKey);

    // If the saved propertyType isn't in the preset's allowed list (e.g.
    // the preset was edited later), fall back to the preset's default so
    // the dropdown shows a valid selection.
    const allowed = getPropertyTypesForPreset(presetKey);
    const resolvedPropertyType =
      initialData.propertyType && allowed.includes(initialData.propertyType)
        ? initialData.propertyType
        : presetDefaults.propertyType;

    const liveCfg = getConfigForType(presetKey, resolvedPropertyType);
    const resolvedSizeRange =
      liveCfg?.sizeRange ||
      initialData.quoteSizeRange ||
      presetDefaults.quoteSizeRange ||
      "";

    reset({
      fullName: initialData.clientName || "",
      phoneNumber: initialData.phone || "",
      email: initialData.email || "",
      inquirySource: initialData.inquirySource || "",
      referralPersonName: initialData.referralPersonName || "",
      referralPersonEmail: initialData.referralPersonEmail || "",
      investmentRange: initialData.investment || "",
      processionDate,
      location: initialData.location || "",
      inquiryStatus: initialData.status || "",
      architecturalNotes: initialData.architecturalNotes || "",
      quotePreset: presetKey,
      quoteSizeRange: resolvedSizeRange,
      propertyType: resolvedPropertyType,
    });
  }, [initialData, presetKeys, reset]);

  const activePreset = useMemo(() => getPreset(quotePreset), [quotePreset]);

  const presetTotals = useMemo(() => {
    const cfg = getConfigForType(quotePreset, propertyType);
    return cfg ? computeTotals(cfg.scopeItems || []) : null;
  }, [quotePreset, propertyType]);

  // Property-type multiplier scales the preset's baseline (penthouse may
  // be 1.2×, studio 0.85×, etc.). Falls back to 1.0 when not configured.
  const typeMultiplier = useMemo(
    () => getMultiplierFor(activePreset, propertyType),
    [activePreset, propertyType],
  );

  const effectiveBaseline = (presetTotals?.grandTotal || 0) * typeMultiplier;

  // Investment-range bands derived from the effective baseline. If the
  // saved value isn't in the generated bands (e.g. an older record),
  // prepend it so the select still renders it as the current choice.
  const investmentBands = useMemo(() => {
    const bands = generateInvestmentBands(effectiveBaseline);
    if (investmentRange && !bands.includes(investmentRange)) {
      return [investmentRange, ...bands];
    }
    return bands;
  }, [effectiveBaseline, investmentRange]);

  useEffect(() => {
    if (quotePreset && propertyType) {
      const cfg = getConfigForType(quotePreset, propertyType);
      if (cfg) {
        setValue("quoteSizeRange", cfg.sizeRange || "");
      }
    }
  }, [quotePreset, propertyType, setValue]);

  const handlePresetChange = (e) => {
    const key = e.target.value;
    const presetState = buildPresetState(key);
    setValue("quotePreset", presetState.quotePreset, { shouldValidate: true });
    setValue("quoteSizeRange", presetState.quoteSizeRange);
    setValue("propertyType", presetState.propertyType, {
      shouldValidate: true,
    });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Older consumers (LeadEdit.jsx, table column "scope") still read
      // `projectScope` — derive it from the property type.
      await onAddLead?.({
        ...data,
        projectScope: data.propertyType,
      });
      onClose?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (cfg) => (
    <InputField
      key={cfg.name}
      name={cfg.name}
      label={cfg.label}
      type={cfg.type}
      register={register(cfg.name)}
      error={errors[cfg.name]?.message}
      placeholder={cfg.placeholder}
      options={cfg.options}
      icon={cfg.icon}
    />
  );

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
        form="edit-inquiry-form"
        disabled={isSubmitting}
        className="min-w-[140px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </div>
  );

  return (
    <Modal
      title="Edit Inquiry"
      subtitle="Update client and property details"
      onClose={isSubmitting ? undefined : onClose}
      footer={footer}
    >
      <form id="edit-inquiry-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── Client Information ─────────────────────────────────────── */}
        <div className="mb-6">
          <SectionHeader>Client Information</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            {CLIENT_INFO_FIELDS.slice(0, 2).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {CLIENT_INFO_FIELDS.slice(2, 4).map(field)}
          </div>

          {/* Referral-specific fields — shown only when inquirySource is 'Referral' */}
          {inquirySource === "Referral" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <InputField
                name="referralPersonName"
                label="Referral Person Name"
                type="text"
                register={register("referralPersonName")}
                error={errors.referralPersonName?.message}
                placeholder="Name of the referring person"
              />
              <InputField
                name="referralPersonEmail"
                label="Referral Person Email"
                type="email"
                register={register("referralPersonEmail")}
                error={errors.referralPersonEmail?.message}
                placeholder="referrer@domain.com"
              />
            </div>
          )}
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Property Configuration (proposal-master driven) ────────── */}
        <div className="mb-6">
          <SectionHeader hint="The preset defines which property types it can be used for — pick one here.">
            Property Configuration
          </SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="quotePreset"
              label="Property Preset"
              type="select"
              register={register("quotePreset")}
              onChange={handlePresetChange}
              options={presetKeys}
              error={errors.quotePreset?.message}
            />
            <InputField
              name="propertyType"
              label="Property Type"
              type="select"
              register={register("propertyType")}
              options={getPropertyTypesForPreset(quotePreset)}
              error={errors.propertyType?.message}
            />
          </div>

          {activePreset && (
            <div className="mt-3 rounded-lg border border-bordergray bg-bg-soft px-3 py-2.5 ml-3.5">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                    Size Range
                  </span>
                  <strong className="text-text">
                    {getConfigForType(quotePreset, propertyType)?.sizeRange ||
                      "—"}
                  </strong>
                </span>
                {presetTotals && (
                  <span className="flex items-center gap-1.5">
                    <span className="text-text-subtle uppercase tracking-wider text-[10px] font-semibold">
                      Baseline
                    </span>
                    <strong className="text-text">
                      {formatLakhs(effectiveBaseline)}
                    </strong>
                    <span className="text-text-subtle">incl. GST</span>
                    {typeMultiplier !== 1 && (
                      <span className="text-[10px] font-bold text-select-blue bg-active-bg px-1.5 py-0.5 rounded-md ml-0.5">
                        ×{typeMultiplier.toFixed(2)} {propertyType}
                      </span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-[10.5px] text-text-subtle mt-1.5">
                Edit these values in <strong> → Proposal Master</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Project Details (schedule + commercials + location) ────── */}
        <div className="mb-6">
          <SectionHeader>Project Details</SectionHeader>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="investmentRange"
              label="Investment Range"
              type="select"
              register={register("investmentRange")}
              options={investmentBands}
              placeholder={
                investmentBands.length
                  ? "Choose a range"
                  : "Pick a preset first"
              }
              error={errors.investmentRange?.message}
            />
            {PROJECT_DETAIL_FIELDS.slice(0, 1).map(field)}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {PROJECT_DETAIL_FIELDS.slice(1).map(field)}
          </div>
        </div>

        <div className="border-t border-border mb-6" />

        {/* ── Notes ──────────────────────────────────────────────────── */}
        <div className="mb-2">
          <SectionHeader hint="Status is changed from the lead detail page — Mark Qualified, Send Proposal, Mark Won, etc.">
            Notes
          </SectionHeader>

          <InputField
            type="textarea"
            name="architecturalNotes"
            label="Architectural Notes"
            register={register("architecturalNotes")}
            error={errors.architecturalNotes?.message}
            placeholder="Mention design preferences, mood, or constraints…"
            rows={4}
          />
        </div>
      </form>
    </Modal>
  );
}

export default EditInquiryform;
