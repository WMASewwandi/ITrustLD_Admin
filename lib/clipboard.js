export function normalizeCopyText(value) {
  const text = value == null ? "" : String(value).trim();
  if (!text || text === "—" || text === "-") return "";
  return text;
}

function copyWithTextarea(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  // Keep in-viewport: some mobile/WebView browsers reject off-screen copy targets.
  textarea.style.cssText =
    "position:fixed;top:0;left:0;width:1px;height:1px;padding:0;margin:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(textarea);

  const selection = document.getSelection?.();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  textarea.focus({ preventScroll: true });
  textarea.select();
  textarea.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
    if (selection) {
      selection.removeAllRanges();
      if (previousRange) selection.addRange(previousRange);
    }
  }

  if (!copied) {
    throw new Error("Copy command was rejected.");
  }
}

function canUseAsyncClipboard() {
  return Boolean(
    typeof window !== "undefined" &&
      window.isSecureContext &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === "function"
  );
}

/**
 * Prefer the synchronous execCommand path first.
 * On many production hosts (HTTP / non-secure context / iframe), async
 * clipboard.writeText fails after await and the user-gesture is already gone,
 * so a later fallback also fails. Sync copy inside the click handler is reliable.
 */
export function copyTextToClipboard(value) {
  const text = normalizeCopyText(value);
  if (!text) {
    return Promise.reject(new Error("Nothing to copy."));
  }

  if (!canUseAsyncClipboard()) {
    copyWithTextarea(text);
    return Promise.resolve(text);
  }

  try {
    copyWithTextarea(text);
    return Promise.resolve(text);
  } catch {
    return navigator.clipboard.writeText(text).then(() => text);
  }
}
