import { useEffect } from "react";
import { HiMiniXMark } from "react-icons/hi2";

/**
 * Props:
 *   title       — modal heading
 *   subtitle    — subheading below title
 *   onClose     — called on X click, backdrop click, or Escape key
 *   children    — scrollable body content
 *   footer      — ReactNode pinned to the bottom (buttons go here)
 *   maxWidth    — Tailwind max-w class, default "max-w-[660px]"
 */
const Modal = ({ title, subtitle, onClose, children, footer, maxWidth = "max-w-[660px]", maxHeight = "max-h-[90vh]" }) => {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-gray-300/40 backdrop-blur-[2px] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`bg-white rounded-[16px] font-manrope shadow-2xl w-full ${maxWidth} mx-auto flex flex-col ${maxHeight}`}
      >
        {/* Header — pinned */}
        <div className="shrink-0  bg-overallbg flex justify-between items-start pt-6 px-8 pb-5  rounded-t-xl">
          <div>
            {title && (
              <h1 className="text-xl font-bold text-primary tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-red-600 transition-colors mt-0.5 shrink-0"
          >
            <HiMiniXMark size={22} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
          {children}
        </div>

        {/* Footer — pinned */}
        {footer && (
          <div className="shrink-0 px-8 py-5  bg-overallbg rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
