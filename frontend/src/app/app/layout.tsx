import type { ReactNode } from "react";
import Navbar from "@/components/layout/navbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="app-container">
        {children}
      </div>
    </>
  );
}
