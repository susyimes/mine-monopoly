export type AssetIssueKind = "remote-asset" | "route-fallback" | "font-fallback";

export interface AssetIssue {
  kind: AssetIssueKind;
  severity: "info" | "warning";
  page: string;
  text: string;
  url?: string;
  at: string;
}

export interface BrowserConsoleLike {
  type: string;
  text: string;
  location?: { url?: string } | unknown;
}

export interface PageErrorLike {
  message: string;
  stack?: string;
}

const remoteAssetPattern =
  /(?:fatpaper|monopoly-static)-1304992673\.cos\.ap-guangzhou\.myqcloud\.com|\/monopoly\/(?:models|roles|musics|chance_card_icons|backgrounds)\//i;

export function classifyConsoleAssetIssue(page: string, event: BrowserConsoleLike): AssetIssue | undefined {
  const url = readLocationUrl(event.location);
  const text = event.text ?? "";
  const at = new Date().toISOString();

  if (isRouteFallback404(text, url)) {
    return { kind: "route-fallback", severity: "info", page, text, url, at };
  }

  if (/Fallback font will be used/i.test(text) || /ContentFont\.woff2/i.test(text)) {
    return { kind: "font-fallback", severity: "info", page, text, url, at };
  }

  if (isRemoteAssetText(text) || isRemoteAssetUrl(url) || (isRemoteAssetFailure(text) && isRemoteAssetUrl(url))) {
    return { kind: "remote-asset", severity: "warning", page, text, url, at };
  }

  return undefined;
}

export function classifyPageErrorAssetIssue(page: string, event: PageErrorLike): AssetIssue | undefined {
  const text = [event.message, event.stack].filter(Boolean).join("\n");
  if (!isRemoteAssetText(text)) return undefined;
  return {
    kind: "remote-asset",
    severity: "warning",
    page,
    text: event.message,
    url: findRemoteAssetUrl(text),
    at: new Date().toISOString()
  };
}

function isRouteFallback404(text: string, url?: string) {
  return /404|File not found/i.test(text) && Boolean(url && /\/room-router\?automation=1/i.test(url));
}

function isRemoteAssetText(text: string) {
  return remoteAssetPattern.test(text);
}

function isRemoteAssetUrl(url?: string) {
  return Boolean(url && remoteAssetPattern.test(url));
}

function findRemoteAssetUrl(text: string): string | undefined {
  return text.match(/https?:\/\/[^\s'"<>]+/i)?.[0];
}

function isRemoteAssetFailure(text: string) {
  return /CORS policy|net::ERR_FAILED|ERR_EMPTY_RESPONSE|Bad Gateway/i.test(text);
}

function readLocationUrl(location: unknown): string | undefined {
  if (!location || typeof location !== "object") return undefined;
  const url = (location as { url?: unknown }).url;
  return typeof url === "string" && url ? url : undefined;
}
