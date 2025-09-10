// src/app/app/layout.tsx
import type { ReactNode } from "react";
import Navbar from "@/components/create-activity-form";
import CreateActivityForm from "@/components/create-activity-form";


export default async function AppLayout({ children }: { children: ReactNode }) {
 

  return (
    <>

      <CreateActivityForm />
    </>
  );
}
