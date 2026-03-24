import { APP_NAME } from "@/lib/constants";

/**
 * App logo + name. Used in the header, sidebar, login page, and checkout.
 *
 * To replace: swap the LogoMark SVG below with your own, or use next/image.
 * To change the name: edit APP_NAME in lib/constants.ts.
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark />
      <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}

/**
 * Placeholder logo mark — accent-colored rounded square with a lightning bolt.
 * Uses CSS custom properties so it adapts to the configured accent color.
 */
function LogoMark() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      <rect width="24" height="24" rx="6" fill="var(--accent, #5b4cff)" />
      <path
        d="M13.5 4.5L8 13.5H12L10.5 19.5L16 10.5H12L13.5 4.5Z"
        fill="var(--accent-foreground, #fff)"
      />
    </svg>
  );
}
