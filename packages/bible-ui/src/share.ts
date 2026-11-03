/**
 * Sharing a view: the system share sheet where there is one, otherwise the link
 * goes to the clipboard. Every app keeps its whole state in the URL, so the link is enough.
 */

export type ShareResult = "shared" | "copied" | "failed";

const copy = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Some browsers and embedded views refuse the clipboard API, but allow the older command.
    const field = document.createElement("textarea");
    field.value = text;
    document.body.append(field);
    field.select();
    const done = document.execCommand("copy");
    field.remove();
    return done;
  }
};

export const shareView = async (title: string, url = location.href): Promise<ShareResult> => {
  if (typeof navigator.share === "function" && matchMedia("(hover: none)").matches) {
    try {
      await navigator.share({ title, url });
      return "shared";
    } catch (error) {
      // Closing the sheet isn't a failure, and leaves nothing to report.
      if (error instanceof DOMException && error.name === "AbortError") return "shared";
    }
  }
  return (await copy(url)) ? "copied" : "failed";
};
