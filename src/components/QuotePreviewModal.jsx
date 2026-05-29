import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import Modal from "./Modal";
import QuotePreview from "./QuotePreview";
import { downloadQuoteAsImage } from "../utils/downloadQuoteImage";

// View-only modal: shows the rendered quote preview with a Download (PNG)
// action only. Used by the "Quote" header button and the Documents card —
// neither of those should let the user edit or resend.
const QuotePreviewModal = ({ quote, fileName, onClose }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadQuoteAsImage(quote, fileName);
    } finally {
      setDownloading(false);
    }
  };

  const footer = (
    <div className="flex justify-end items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        disabled={downloading}
        className="px-5 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg-soft transition-all disabled:opacity-50"
      >
        Close
      </button>
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading || !quote}
        className="min-w-[160px] flex items-center justify-center gap-2 px-7 py-2.5 rounded-lg bg-select-blue text-white text-sm font-medium hover:bg-primary shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {downloading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Preparing…
          </>
        ) : (
          <>
            <Download size={14} /> Download
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      title={`Quote ${quote?.quoteId || ""}`.trim()}
      subtitle={
        quote?.sentAt
          ? `Sent on ${new Date(quote.sentAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}`
          : "Quote preview"
      }
      onClose={downloading ? undefined : onClose}
      footer={footer}
      maxWidth="max-w-[760px]"
    >
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        {quote ? (
          <QuotePreview quote={quote} />
        ) : (
          <p className="text-center text-text-muted text-sm py-10">
            No quote available to preview.
          </p>
        )}
      </div>
    </Modal>
  );
};

export default QuotePreviewModal;
