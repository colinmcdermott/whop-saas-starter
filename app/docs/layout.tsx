import Link from "next/link";
import { source } from "@/lib/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";
import { APP_NAME } from "@/lib/constants";
import type { ReactNode } from "react";
import "./docs.css";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider>
      <DocsLayout
        tree={source.pageTree}
        nav={{
          title: APP_NAME,
          url: "/",
        }}
        links={[
          { text: "Pricing", url: "/pricing" },
          { text: "Dashboard", url: "/dashboard" },
        ]}
      >
        {children}
      </DocsLayout>
    </RootProvider>
  );
}
