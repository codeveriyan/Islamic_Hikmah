import contentRelease from "@/content-version.json";

const CDN_BASE_URL = (process.env.EXPO_PUBLIC_CONTENT_CDN_URL || "https://pub-e0bcf45a0e6149df9dcd54d294ae1f25.r2.dev").replace(/\/$/, "");

/**
 * Generates CDN URL for static assets hosted on Cloudflare R2
 */
export function getCdnAssetUrl(path: string): string {
  const cleanPath = path.replace(/^\//, "");
  return `${CDN_BASE_URL}/${contentRelease.version}/${cleanPath}`;
}
