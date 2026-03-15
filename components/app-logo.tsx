import Image from "next/image";
import { APP_NAME } from "@/lib/constants";

/**
 * App logo + name. Used in the header, sidebar, login page, and checkout.
 *
 * To replace the logo: swap out /public/logo.svg with your own file.
 * To change the name: edit APP_NAME in lib/constants.ts.
 */
export function AppLogo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Image
        src="/logo.svg"
        alt=""
        width={20}
        height={20}
        className="h-5 w-5"
      />
      <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
