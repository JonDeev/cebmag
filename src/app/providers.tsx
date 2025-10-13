"use client";

import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        containerClassName="!z-[9999]"
        toastOptions={{
          style: {
            background: "var(--panel)",
            color: "var(--text)",
            border: "1px solid var(--subtle)",
          },
          success: {
            iconTheme: { primary: "var(--brand)", secondary: "#fff" },
          },
          loading: {
            iconTheme: { primary: "var(--brand)", secondary: "#fff" },
          },
        }}
      />
    </>
  );
}
