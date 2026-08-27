"use client";

/**
 * Admin zoom is already prevented by:
 * - viewport maximumScale: 1 in app/layout.jsx
 * - 16px form fields on mobile in globals.css
 *
 * Do not toggle the viewport meta here. Adding/removing maximum-scale
 * full-reloads some production mobile browsers and looks like a loop.
 */
export default function MobileViewportFix() {
  return null;
}
