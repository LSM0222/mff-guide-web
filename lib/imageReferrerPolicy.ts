export function needsNoReferrerPolicy(src: string) {
  const trimmed = src.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed, "https://mff.local");
    if (url.origin === "https://mff.local") return false;

    const host = url.hostname.toLowerCase();
    return host === "pstatic.net" || host.endsWith(".pstatic.net");
  } catch {
    return false;
  }
}
