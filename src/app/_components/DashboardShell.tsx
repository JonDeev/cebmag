"use client";
import { useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import Subheader from "@/components/layout/Subheader";
import FooterNotice from "@/components/layout/FooterNotice";

export default function DashboardShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-col min-h-screen">
      <Topbar onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex flex-1 min-w-0">
        <Sidebar collapsed={collapsed} />

        <main className="flex-1 min-w-0">
          <Subheader title={title} />
          <div className="px-6 py-6 mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      <FooterNotice />
    </div>
  );
}