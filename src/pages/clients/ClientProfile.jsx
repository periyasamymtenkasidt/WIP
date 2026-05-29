import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMessageCircle,
  FiFileText,
} from "react-icons/fi";
import { ClientTableData } from "../../data/ClientTableData";
import EditClientForm from "./EditClientForm";
import QuoteModal from "../../components/QuoteModal";
import Client from "../../assets/images/Client_avatar.png";
import { getLatestQuoteForParent } from "../../data/QuotePresets";

const formatAmount = (amount) => {
  if (!amount || amount <= 0) return "—";
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
};

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(() => {
    const saved = localStorage.getItem("newClientsData");
    let newClients = [];
    if (saved) {
      try {
        newClients = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse new clients data", e);
      }
    }

    const deleted = localStorage.getItem("deletedClients");
    const deletedClients = deleted ? JSON.parse(deleted) : [];
    if (deletedClients.includes(id)) {
      return null;
    }

    const foundNew = newClients.find((c) => c.clientID === id);
    if (foundNew) {
      return foundNew;
    }

    return ClientTableData.find((c) => c.clientID === id) || null;
  });

  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [milestones, setMilestones] = useState(() => {
    try {
      const saved = localStorage.getItem(`clientMilestones_${id}`);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeTab, setActiveTab] = useState(() =>
    localStorage.getItem(`clientMilestones_${id}`)
      ? "milestones"
      : "appointments",
  );

  const handleDelete = () => {
    const deleted = localStorage.getItem("deletedClients");
    let deletedClients = deleted ? JSON.parse(deleted) : [];
    if (!deletedClients.includes(id)) {
      deletedClients.push(id);
      localStorage.setItem("deletedClients", JSON.stringify(deletedClients));
    }
    setShowDeleteConfirm(false);
    navigate("/clients");
  };

  const handleEditSave = (updatedData) => {
    const saved = localStorage.getItem("newClientsData");
    let newClients = saved ? JSON.parse(saved) : [];

    const existingIndex = newClients.findIndex((c) => c.clientID === id);
    if (existingIndex >= 0) {
      newClients[existingIndex] = {
        ...newClients[existingIndex],
        ...updatedData,
      };
      localStorage.setItem("newClientsData", JSON.stringify(newClients));
      setClient({ ...newClients[existingIndex] });
    } else {
      const updatedClient = { ...client, ...updatedData };
      newClients.push(updatedClient);
      localStorage.setItem("newClientsData", JSON.stringify(newClients));
      setClient(updatedClient);
    }
  };

  const handleMarkPaid = (milestoneId) => {
    if (!milestones) return;
    const today = new Date();
    const paidDate = `${String(today.getDate()).padStart(2, "0")}.${String(today.getMonth() + 1).padStart(2, "0")}.${today.getFullYear()}`;
    const updated = milestones.map((m) =>
      m.id === milestoneId ? { ...m, status: "paid", paidDate } : m,
    );
    setMilestones(updated);
    localStorage.setItem(`clientMilestones_${id}`, JSON.stringify(updated));

    if (updated.every((m) => m.status === "paid")) {
      const savedClients = localStorage.getItem("newClientsData");
      let newClients = savedClients ? JSON.parse(savedClients) : [];
      const idx = newClients.findIndex((c) => c.clientID === id);
      if (idx >= 0) {
        newClients[idx] = { ...newClients[idx], paymentStatus: "completed" };
      } else {
        newClients.push({ ...client, paymentStatus: "completed" });
      }
      localStorage.setItem("newClientsData", JSON.stringify(newClients));
      setClient((prev) => ({ ...prev, paymentStatus: "completed" }));
    }
  };

  if (!client) {
    return (
      <div className="flex justify-center items-center h-full bg-overallbg text-text-muted text-sm font-medium">
        Loading...
      </div>
    );
  }

  const getStatusStyle = (status) => {
    const s = status?.toLowerCase();
    if (s === "pending") return "bg-[#FFF4E5] text-pending border-[#FFEDD5]";
    if (s === "completed")
      return "bg-[#E6F4EA] text-[#16A34A] border-[#DCFCE7]";
    if (s === "failed" || s === "cancelled")
      return "bg-[#FEE2E2] text-[#DC2626] border-[#FECACA]";
    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  const isConverted = !!client.sourceLeadId;
  const paidCount = milestones?.filter((m) => m.status === "paid").length ?? 0;
  const pendingCount = milestones ? milestones.length - paidCount : 0;
  const grandTotal =
    milestones?.reduce((s, m) => s + (m.total ?? m.base ?? 0), 0) ?? 0;
  const collected =
    milestones
      ?.filter((m) => m.status === "paid")
      .reduce((s, m) => s + (m.total ?? m.base ?? 0), 0) ?? 0;
  const remaining = grandTotal - collected;

  // Mock appointments matching the screenshot
  const appointments = [
    {
      date: "12",
      month: "JAN",
      title: "Site Visit – Luxury Villa",
      time: "10:00 – 12:00",
      status: "Done",
      statusColor: "bg-[#E6F4EA] text-[#16A34A] border border-[#16A34A]",
      price: "₹5,000",
      type: "Consultation",
    },
    {
      date: "28",
      month: "JAN",
      title: "Documentation Review",
      time: "14:00 – 15:30",
      status: "Done",
      statusColor: "bg-[#E6F4EA] text-[#16A34A] border border-[#16A34A]",
      price: "₹8,500",
      type: "Legal",
    },
    {
      date: "14",
      month: "FEB",
      title: "Property Valuation",
      time: "11:00 – 12:30",
      status: "Booked",
      statusColor: "bg-[#E0F2FE] text-[#0284C7] border border-[#0284C7]",
      price: "₹12,000",
      type: "Valuation",
    },
    {
      date: "22",
      month: "FEB",
      title: "Token Payment Discussion",
      time: "15:00 – 16:00",
      status: "Cancelled",
      statusColor: "bg-[#FFE4E6] text-[#E11D48] border border-[#E11D48]",
      price: "-",
      type: "-",
    },
    {
      date: "10",
      month: "MAR",
      title: "Final Agreement Signing",
      time: "10:00 – 11:30",
      status: "Pending",
      statusColor: "bg-[#FEF3C7] text-pending border border-pending",
      price: "₹2.5Cr",
      type: "Deal Close",
    },
  ];

  return (
    <div className="bg-overallbg p-6 font-sans overflow-y-scroll h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-border hover:bg-gray-50 hover:border-select-blue/30 text-gray-500 hover:text-select-blue transition-all shadow-sm cursor-pointer"
            title="Go back"
          >
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-[26px] font-bold text-darkgray leading-tight">
              Client Profile
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">
              <span
                className="cursor-pointer hover:text-[dark-blue]"
                onClick={() => navigate("/clients")}
              >
                Clients
              </span>{" "}
              — {client.clientName}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-dark-blue text-white cursor-pointer rounded-xl text-sm font-semibold hover:bg-blue-950 shadow-sm transition-all"
          >
            <FiFileText size={16} /> Final Quote{" "}
          </button>
          <button
            onClick={() => setIsEditFormOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-border cursor-pointer rounded-xl text-sm font-semibold text-darkgray hover:bg-gray-50 shadow-sm transition-all"
          >
            <FiEdit2 size={16} /> Edit Client
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-200 cursor-pointer rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 shadow-sm transition-all"
          >
            <FiTrash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
        {/* Left Column (Sidebar) */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 min-w-0">
          {/* Profile Card */}
          <div className="bg-white rounded-[20px] p-8 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col items-center text-center">
            <div className="relative mb-5">
              <img
                src={Client}
                alt=""
                className="w-28 h-28 rounded-full border-[3px] border-white shadow-md object-cover"
              />
              <div className="absolute bottom-2 right-2 w-4 h-4 bg-emarold border-[3px] border-white rounded-full" />
            </div>

            <h3 className="text-[22px] font-bold text-[dark-blue] mb-1">
              {client.clientName}
            </h3>
            <p className="text-[12px] font-medium text-gray-400 mb-2">
              {client.clientID}
            </p>

            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusStyle(client.paymentStatus)}`}
            >
              {client.paymentStatus}
            </span>

            {isConverted && (
              <button
                onClick={() => navigate(`/leads/${client.sourceLeadId}`)}
                className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                Converted from Lead #{client.sourceLeadId}
                <FiArrowRight size={11} />
              </button>
            )}

            {client.joinDate && (
              <p className="mt-2 text-[11px] text-text-muted">
                Client since {client.joinDate}
              </p>
            )}

            <div className="w-full border-t border-border mt-5 pt-5 flex flex-col gap-2.5">
              <button className="w-full py-2.5 bg-dark-blue text-white rounded-[12px] text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-blue-950 transition-all shadow-sm">
                <FiPhone size={15} /> Schedule Call
              </button>
              <div className="flex gap-2.5">
                <button className="flex-1 py-2.5 bg-palewhite hover:bg-bg-soft text-grey rounded-[12px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-border">
                  <FiMessageCircle size={14} /> WhatsApp
                </button>
                <button className="flex-1 py-2.5 bg-palewhite hover:bg-bg-soft text-grey rounded-[12px] text-[12px] font-bold flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-border">
                  <FiMail size={14} /> Email
                </button>
              </div>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-4">
              Client Details
            </p>
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Phone Number",
                  value: `+91 ${client.clientPhone}`,
                  color: "text-darkgray",
                },
                {
                  label: "Email",
                  value: client.clientEmail,
                  color: "text-sky-blue truncate",
                },
                {
                  label: "Property Type",
                  value: client.location,
                  color: "text-darkgray",
                },
                {
                  label: "Location",
                  value: client.locationSecondary,
                  color: "text-darkgray",
                },
                {
                  label: isConverted ? "Project Value (ex. GST)" : "Budget",
                  value: client.budget,
                  color: "text-darkgray",
                },
                ...(isConverted && grandTotal
                  ? [
                      {
                        label: "Total Payable (incl. GST)",
                        value: formatAmount(grandTotal),
                        color: "text-select-blue font-extrabold",
                      },
                    ]
                  : []),
                ...(client.joinDate
                  ? [
                      {
                        label: "Client Since",
                        value: client.joinDate,
                        color: "text-darkgray",
                      },
                    ]
                  : []),
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="flex justify-between items-center p-3 border border-bg-soft bg-palewhite rounded-[12px]"
                >
                  <p className="text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                    {label}
                  </p>
                  <p
                    className={`font-bold text-[13px] text-right max-w-[55%] ${color}`}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Main Content) */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6 min-w-0">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {milestones ? (
              <>
                {/* Milestone stat: Total stages */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-sky-blue mb-1">
                      {milestones.length}
                    </h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      Total
                      <br />
                      Stages
                    </p>
                    <p className="text-[11px] text-text-muted mt-1">
                      {formatAmount(grandTotal)}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {[6, 4, 8, 10].map((h, i) => (
                      <div
                        key={i}
                        className={`w-2.5 rounded-sm bg-sky-blue`}
                        style={{ height: `${h * 4}px`, opacity: 0.4 + i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
                {/* Milestone stat: Paid */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-emarold mb-1">
                      {paidCount}
                    </h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      Stages
                      <br />
                      Paid
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      {formatAmount(collected)}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {[4, 7, 10, 5].map((h, i) => (
                      <div
                        key={i}
                        className="w-2.5 rounded-sm bg-emarold"
                        style={{
                          height: `${h * 4}px`,
                          opacity: 0.4 + i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </div>
                {/* Milestone stat: Pending */}
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-orange mb-1">
                      {pendingCount}
                    </h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      Stages
                      <br />
                      Pending
                    </p>
                    <p className="text-[11px] text-orange-500 font-semibold mt-1">
                      {formatAmount(remaining)}
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    {[8, 4, 6, 10].map((h, i) => (
                      <div
                        key={i}
                        className="w-2.5 rounded-sm bg-orange"
                        style={{ height: `${h * 4}px`, opacity: 0.4 + i * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-sky-blue mb-1">5</h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      All
                      <br />
                      Bookings
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    <div className="w-2.5 h-6 bg-sky-blue rounded-sm opacity-60" />
                    <div className="w-2.5 h-4 bg-sky-blue rounded-sm opacity-40" />
                    <div className="w-2.5 h-8 bg-sky-blue rounded-sm opacity-80" />
                    <div className="w-2.5 h-10 bg-sky-blue rounded-sm" />
                  </div>
                </div>
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-emarold mb-1">2</h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      Completed
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    <div className="w-2.5 h-4 bg-emarold rounded-sm opacity-40" />
                    <div className="w-2.5 h-7 bg-emarold rounded-sm opacity-70" />
                    <div className="w-2.5 h-10 bg-emarold rounded-sm" />
                    <div className="w-2.5 h-5 bg-emarold rounded-sm opacity-50" />
                  </div>
                </div>
                <div className="bg-white rounded-[20px] p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex items-center justify-between">
                  <div>
                    <h3 className="text-4xl font-bold text-orange mb-1">1</h3>
                    <p className="text-gray-500 text-[13px] font-bold uppercase tracking-wider leading-tight">
                      Cancelled
                    </p>
                  </div>
                  <div className="flex items-end gap-1.5 h-10">
                    <div className="w-2.5 h-8 bg-orange rounded-sm opacity-80" />
                    <div className="w-2.5 h-4 bg-orange rounded-sm opacity-40" />
                    <div className="w-2.5 h-6 bg-orange rounded-sm opacity-60" />
                    <div className="w-2.5 h-10 bg-orange rounded-sm" />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Tabs Area */}
          <div className="bg-white rounded-[20px] shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] flex flex-col flex-1">
            {/* Tab Bar */}
            <div className="flex items-center px-8 pt-4 border-b border-gray-100 gap-6">
              {["appointments", "milestones", "invoices"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 px-2 text-[15px] font-bold capitalize transition-colors cursor-pointer border-b-[3px] ${
                    activeTab === tab
                      ? "border-[dark-blue] text-[dark-blue]"
                      : "border-transparent text-gray-400 hover:text-[dark-blue]"
                  }`}
                >
                  {tab === "milestones"
                    ? "Payment Milestones"
                    : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Appointments Tab */}
            {activeTab === "appointments" && (
              <div className="p-8">
                <div className="mb-6 flex">
                  <button className="bg-white text-[13px] font-bold text-midgray px-4 py-2 rounded-xl border border-border flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                    All Time ({appointments.length})
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-col gap-4">
                  {appointments.map((apt, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between group bg-white border border-bg-soft rounded-[16px] p-4 hover:border-blue-100 hover:bg-palewhite transition-all shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
                    >
                      <div className="flex items-center gap-5">
                        <div className="text-center w-14 h-14 bg-white rounded-xl flex flex-col justify-center items-center border border-border shadow-sm">
                          <div className="text-[17px] font-bold text-darkgray leading-tight">
                            {apt.date}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                            {apt.month}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold text-darkgray text-[15px] mb-1 group-hover:text-[dark-blue] transition-colors">
                            {apt.title}
                          </h4>
                          <p className="text-[13px] font-medium text-gray-500">
                            {apt.time}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div
                          className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${apt.statusColor.replace("border border-[#16A34A]", "").replace("border border-[#0284C7]", "").replace("border border-[#E11D48]", "").replace("border border-pending", "")}`}
                        >
                          {apt.status === "Done" && (
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                          {apt.status}
                        </div>
                        <div className="text-right w-24">
                          <div className="font-bold text-darkgray text-[15px] mb-0.5">
                            {apt.price}
                          </div>
                          <div className="text-[12px] font-medium text-gray-400">
                            {apt.type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === "milestones" && (
              <div className="p-8">
                {!milestones ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-bg-soft flex items-center justify-center mb-4">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22V12M12 12V2M12 12H2M12 12H22" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-bold text-text mb-1">
                      No payment milestones yet
                    </p>
                    <p className="text-[13px] text-text-muted">
                      Convert a Won lead to auto-generate the 5-stage payment
                      schedule for this client.
                    </p>
                  </div>
                ) : (
                  (() => {
                    const paidCount = milestones.filter(
                      (m) => m.status === "paid",
                    ).length;
                    const paidTotal = milestones
                      .filter((m) => m.status === "paid")
                      .reduce(
                        (s, m) => s + (m.total ?? m.base ?? m.amount ?? 0),
                        0,
                      );
                    const grandTotal = milestones.reduce(
                      (s, m) => s + (m.total ?? m.base ?? m.amount ?? 0),
                      0,
                    );
                    const progressPct =
                      grandTotal > 0
                        ? Math.round((paidTotal / grandTotal) * 100)
                        : 0;

                    return (
                      <>
                        {/* Summary */}
                        <div className="mb-6 p-5 rounded-[16px] bg-bg-soft border border-border">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
                                Total Payable (incl. GST)
                              </p>
                              <p className="text-[22px] font-bold text-[dark-blue]">
                                {formatAmount(grandTotal)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[11px] font-bold uppercase tracking-widest text-text-muted mb-0.5">
                                Collected
                              </p>
                              <p className="text-[22px] font-bold text-emerald-600">
                                {formatAmount(paidTotal)}
                              </p>
                            </div>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <p className="text-[11px] text-text-muted mt-2">
                            {paidCount} of {milestones.length} milestones paid ·{" "}
                            {progressPct}% collected
                          </p>
                        </div>

                        {/* Milestone List */}
                        <div className="flex flex-col gap-3">
                          {milestones.map((m, idx) => {
                            const isPaid = m.status === "paid";
                            const base = m.base ?? m.amount ?? 0;
                            const gstAmt = m.gstAmt ?? Math.round(base * 0.18);
                            const total = m.total ?? base + gstAmt;
                            return (
                              <div
                                key={m.id}
                                className={`flex items-center justify-between p-4 rounded-[16px] border transition-all ${
                                  isPaid
                                    ? "bg-emerald-50 border-emerald-100"
                                    : "bg-white border-border hover:border-blue-100 hover:bg-palewhite"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[12px] font-bold border-2 ${
                                      isPaid
                                        ? "bg-emerald-500 border-emerald-500 text-white"
                                        : "bg-white border-border text-text-muted"
                                    }`}
                                  >
                                    {isPaid ? (
                                      <FiCheck size={14} strokeWidth={3} />
                                    ) : (
                                      idx + 1
                                    )}
                                  </div>
                                  <div>
                                    <p
                                      className={`text-[14px] font-bold ${isPaid ? "text-emerald-700" : "text-darkgray"}`}
                                    >
                                      {m.name}
                                    </p>
                                    {isPaid && m.paidDate ? (
                                      <p className="text-[11px] text-emerald-600 font-medium">
                                        Paid on {m.paidDate}
                                      </p>
                                    ) : (
                                      <p className="text-[11px] text-text-muted font-medium">
                                        {formatAmount(base)} + GST{" "}
                                        {formatAmount(gstAmt)}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-5">
                                  <div className="text-right">
                                    <p
                                      className={`text-[15px] font-bold ${isPaid ? "text-emerald-700" : "text-darkgray"}`}
                                    >
                                      {formatAmount(total)}
                                    </p>
                                    <p className="text-[11px] text-text-muted">
                                      {m.pct}% + 18% GST
                                    </p>
                                  </div>
                                  {isPaid ? (
                                    <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                      Paid
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleMarkPaid(m.id)}
                                      className="px-4 py-2 rounded-xl  text-white text-[12px] font-bold  bg-blue-950 transition-colors shadow-sm"
                                    >Mark as Paid</button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()
                )}
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === "invoices" && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-8">
                <div className="w-14 h-14 rounded-full bg-bg-soft flex items-center justify-center mb-4">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                  </svg>
                </div>
                <p className="text-[14px] font-bold text-text mb-1">
                  Invoices coming soon
                </p>
                <p className="text-[13px] text-text-muted">
                  Invoice generation will be available in the next release.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {isEditFormOpen && (
        <EditClientForm
          initialData={client}
          onClose={() => setIsEditFormOpen(false)}
          onSave={handleEditSave}
          hasMilestones={!!milestones}
        />
      )}

      {/* Quick Quote Modal */}
      {showQuoteModal && (
        <QuoteModal
          parentId={client.sourceLeadId || client.clientID}
          parentType={client.sourceLeadId ? "lead" : "client"}
          recipient={{
            name: client.clientName,
            email: client.clientEmail,
            phone: client.clientPhone,
          }}
          initialQuote={getLatestQuoteForParent(
            client.sourceLeadId || client.clientID,
          )}
          defaultPropertyType={client.location}
          onClose={() => setShowQuoteModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-[16px] font-manrope shadow-2xl w-full max-w-[400px] mx-auto p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <FiTrash2 size={24} />
            </div>
            <h2 className="text-[19px] font-bold text-darkgray mb-2">
              Delete Client
            </h2>
            <p className="text-text-muted text-[14px] mb-6">
              Are you sure you want to delete this client? This action cannot be
              undone.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-[8px] bg-white border border-border text-text-muted text-[13px] font-bold hover:bg-gray-50 transition-all flex-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-[8px] bg-red-500 text-white text-[13px] font-bold hover:bg-red-600 shadow-sm transition-all flex-1 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
