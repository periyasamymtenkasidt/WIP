import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import QuotePreview from "../components/QuotePreview";

// Render the given quote snapshot into a hidden offscreen container, capture
// it as a PNG via html2canvas, and trigger a browser download. Used by the
// Documents card so a user can grab the rendered quote as an image.
export async function downloadQuoteAsImage(quote, fileName) {
  if (!quote) return;
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.padding = "32px";
  container.style.background = "var(--color-surface)";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<QuotePreview quote={quote} />);

  // Give React a tick to commit + fonts a tick to settle.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await new Promise((resolve) => setTimeout(resolve, 50));

  try {
    const canvas = await html2canvas(container, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName?.replace(/\.pdf$/i, ".png") || `${quote.quoteId}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } finally {
    root.unmount();
    container.remove();
  }
}
