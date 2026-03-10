"use client";

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

const UTM_STORAGE_KEY = "sghaus_utm";

export function captureUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const url = new URL(window.location.href);
  const params: UtmParams = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const) {
    const val = url.searchParams.get(key);
    if (val) params[key] = val;
  }
  if (Object.keys(params).length > 0) {
    try { sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(params)); } catch {}
  }
  return getUtmParams();
}

export function getUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
