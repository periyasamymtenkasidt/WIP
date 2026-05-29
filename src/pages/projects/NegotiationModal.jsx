import { useState } from "react";
import { FiTrendingUp } from "react-icons/fi";

const NegotiationModal = ({ onClose, onConfirm }) => {
  const [note, setNote] = useState("");
  const [expectedClose, setExpectedClose] = useState("");

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-[16px] font-manrope shadow-2xl w-full max-w-[460px] mx-auto p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <FiTrendingUp size={22} />
          </div>
          <div>
            <h2 className="text-[18px] font-bold text-darkgray">
              Move to Negotiation
            </h2>
            <p className="text-[12px] text-text-muted mt-0.5">
              Capture what's stuck and when you expect to close. All optional.
            </p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-[12px] font-semibold text-text mb-2">
            Blocker / Negotiation Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="e.g. Client wants 10% off, asking for revised timeline…"
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-text placeholder:text-text-subtle focus:outline-none focus:border-select-blue resize-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-[12px] font-semibold text-text mb-2">
            Expected Close Date
          </label>
          <input
            type="date"
            value={expectedClose}
            onChange={(e) => setExpectedClose(e.target.value)}
            className="w-full rounded-lg border border-border px-3 py-2 text-[13px] text-text focus:outline-none focus:border-select-blue"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-muted hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ note, expectedClose })}
            className="px-5 py-2.5 rounded-lg bg-amber-500 text-white text-[13px] font-semibold hover:bg-amber-600 flex items-center gap-2"
          >
            <FiTrendingUp size={14} /> Move to Negotiation
          </button>
        </div>
      </div>
    </div>
  );
};

export default NegotiationModal;
