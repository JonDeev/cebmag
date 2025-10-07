"use client";
import { useState } from "react";
import Topbar from "@/components/layout/Topbar";
import Sidebar from "@/components/layout/Sidebar";
import Subheader from "@/components/layout/Subheader";
import FooterNotice from "@/components/layout/FooterNotice";

export default function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(true); // inicia colapsado como en tu captura 1

  return (
    
    <div className="min-h-screen flex flex-col">
      <Topbar onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-1">
        <Sidebar collapsed={collapsed} />
        <main className="flex-1">
          <Subheader title={title} />
          <div className="max-w-7xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      <FooterNotice />
    </div>
  );
}
